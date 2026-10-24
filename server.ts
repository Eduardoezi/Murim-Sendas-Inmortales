import express, { Request, Response } from 'express';
import { loadPlayer, savePlayer, listPlayers, deletePlayer, processStudyScroll } from './server/game/player';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_AUCTION_ITEMS,
  INITIAL_WORLD_BOSS,
  SECTS_LIST,
  MERIT_AUCTION_ITEMS,
} from './src/data/gameData';
import { AuctionListing, WorldBossState, LiveDuelState, Cultivator, Item } from './src/types/game';
import { getDb, closeDb } from './server/db';
import {
  loadWorldState,
  saveWorldState,
  loadAuctions,
  upsertAuction,
  deleteAuction,
  expireAuctions,
  logEvent,
} from './server/game/state';

import {
  processMeditate,
  processAllocateAttributePoint,
  processUnlockMeridian,
  processBreakthrough,
  processEquipGear,
  processConsumePill,
} from './server/game/cultivation';

import { createSyntacticCharacter } from './server/game/creation';
import { registerUser, loginUser, verifyToken, getUserById } from './server/auth';
import { z } from 'zod';

function rollDestiny() {
  const fortunes = [
    { fate: 'Fortuna del Dragón', affinity: 'Ortodoxo', blessing: 'El cielo te favorece en la senda del arte marcial.' },
    { fate: 'Rastro del Fénix', affinity: 'Heterodoxo', blessing: 'Tu espíritu arde con un fuego que pocos comprenden.' },
    { fate: 'Sello del Vacío', affinity: 'Demoniaco', blessing: 'Tu destino está marcado por una voluntad imposible de doblegar.' },
    { fate: 'Luna de Jade', affinity: 'Ortodoxo', blessing: 'La claridad de la mente te guía por cada decisión.' },
    { fate: 'Viento de la Última Brisa', affinity: 'Heterodoxo', blessing: 'La libertad te acompaña en cada paso de la montaña.' },
  ];

  const roll = fortunes[Math.floor(Math.random() * fortunes.length)];
  return {
    ...roll,
    seed: Date.now(),
    quality: ['Pobre', 'Común', 'Raro', 'Épico', 'Legendario'][Math.floor(Math.random() * 5)],
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json());

getDb();

// ---------- Estado del mundo ----------
let worldBoss: WorldBossState = loadWorldState(
  'world_boss',
  JSON.parse(JSON.stringify(INITIAL_WORLD_BOSS))
);

let auctionListings: AuctionListing[] = loadAuctions();
if (auctionListings.length === 0) {
  const seededStandard: AuctionListing[] = INITIAL_AUCTION_ITEMS.map((item, idx) => ({
    id: `auction_${idx + 1}`,
    sellerId: `daoist_${idx + 10}`,
    sellerName: ['Maestro Xuan', 'Hermana Qing', 'Espada del Loto', 'Anciano Gu', 'Viajero Errante'][idx % 5],
    sellerClass: ['warrior', 'scholar', 'rogue', 'archer', 'lancer'][idx % 5] as any,
    item,
    currentBid: Math.floor(item.value * 0.7),
    buyoutPrice: item.value,
    expiresAt: Date.now() + 1000 * 60 * (15 + idx * 10),
    currencyType: 'stones' as const,
  }));
  const seededMerit: AuctionListing[] = MERIT_AUCTION_ITEMS.map((item, idx) => ({
    id: `merit_auction_${idx + 1}`,
    sellerId: `sect_elder_pavilion`,
    sellerName: 'Cámara de Tesoros de la Secta',
    sellerClass: 'scholar',
    item,
    currentBid: Math.floor(item.value * 0.8),
    buyoutPrice: item.value,
    expiresAt: Date.now() + 1000 * 60 * (45 + idx * 15),
    currencyType: 'merits' as const,
  }));
  auctionListings = [...seededStandard, ...seededMerit];
  for (const a of auctionListings) upsertAuction(a);
  console.log(`[seed] ${auctionListings.length} subastas iniciales insertadas`);
}

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  name: string;
  realm: string;
  sectId: string;
  sectName: string;
  classType: string;
  userId: number;
}

const clients = new Map<WebSocket, ConnectedClient>();
const activeDuels = new Map<string, LiveDuelState>();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(type: string, payload: any, filter?: (c: ConnectedClient) => boolean) {
  const message = JSON.stringify({ type, payload });
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!filter || filter(client)) ws.send(message);
    }
  }
}

function sendToPlayer(playerId: string, type: string, payload: any) {
  for (const [ws, client] of clients.entries()) {
    if (client.id === playerId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }
}

function broadcastOnlinePlayers() {
  const playersList = Array.from(clients.values()).map(c => ({
    id: c.id,
    name: c.name,
    realm: c.realm,
    sectId: c.sectId,
    sectName: c.sectName,
    classType: c.classType,
  }));
  broadcast('players_update', playersList);
}

// ---------- Tick del jefe mundial ----------
let bossPersistCounter = 0;

function tickWorldBoss() {
  if (worldBoss.activeStatus !== 'alive') return;
  worldBoss.timeRemainingSec = Math.max(0, worldBoss.timeRemainingSec - 1);
  if (worldBoss.timeRemainingSec <= 0) {
    worldBoss.activeStatus = 'escaped';
    saveWorldState('world_boss', worldBoss);
    logEvent('boss_escaped', { payload: { bossId: worldBoss.id } });
    broadcast('boss_update', worldBoss);
    return;
  }
  if (++bossPersistCounter >= 30) {
    bossPersistCounter = 0;
    saveWorldState('world_boss', worldBoss);
  }
}
setInterval(tickWorldBoss, 1000);

setInterval(() => {
  const removed = expireAuctions(Date.now());
  if (removed.length > 0) {
    auctionListings = auctionListings.filter((a) => !removed.includes(a.id));
    broadcast('auction_update', auctionListings);
    logEvent('auctions_expired', { payload: { ids: removed } });
  }
}, 30_000);

// ---------- Esquemas de validación ----------
const PlayerActionSchema = z.object({
  action: z.string(),
  attrKey: z.string().optional(),
  meridianId: z.string().optional(),
  itemId: z.string().optional(),
  scrollId: z.string().optional(),
  recipeId: z.string().optional(),
  currentTemp: z.number().optional(),
  mission: z.any().optional(),
  missionId: z.string().optional(),
  amount: z.number().optional(),
});

const ChatMessageSchema = z.object({
  text: z.string().min(1).max(500),
  channel: z.enum(['global', 'sect']).optional(),
});

const AuthSchema = z.object({
  token: z.string(),
  playerId: z.string(),
});

// ---------- WebSocket ----------
wss.on('connection', (ws: WebSocket) => {
  let authed = false;

  ws.send(JSON.stringify({
    type: 'init_state',
    payload: { worldBoss, auctionListings, sects: SECTS_LIST },
  }));

  const authTimeout = setTimeout(() => {
    if (!authed) {
      ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Timeout de autenticación.' } }));
      ws.close();
    }
  }, 10_000);

  ws.on('message', (data: string) => {
    let parsed: any;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      return ws.send(JSON.stringify({ type: 'error', payload: { message: 'JSON inválido.' } }));
    }
    const { type, payload } = parsed;

    // ---------- Autenticación ----------
    if (type === 'auth') {
      const check = AuthSchema.safeParse(payload);
      if (!check.success) {
        ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Payload de auth inválido.' } }));
        return ws.close();
      }

      const decoded = verifyToken(check.data.token);
      if (!decoded) {
        ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Token inválido o expirado.' } }));
        return ws.close();
      }

      const player = loadPlayer(check.data.playerId);
      if (!player || player.userId !== decoded.userId) {
        ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Personaje no pertenece a este usuario.' } }));
        return ws.close();
      }

      const currentSect = SECTS_LIST.find(s => s.id === player.sectId);
      clients.set(ws, {
        ws,
        id: player.id,
        name: player.name,
        realm: player.realm,
        sectId: player.sectId,
        sectName: currentSect?.name || 'Vagabundo del Jianghu',
        classType: player.classType,
        userId: decoded.userId,
      });
      authed = true;
      clearTimeout(authTimeout);
      ws.send(JSON.stringify({ type: 'auth_ok', payload: { playerId: player.id } }));
      ws.send(JSON.stringify({ type: 'player_sync', payload: player }));
      broadcastOnlinePlayers();
      return;
    }

    if (!authed) {
      ws.send(JSON.stringify({ type: 'auth_error', payload: { message: 'Debes autenticarte primero.' } }));
      return ws.close();
    }

    const client = clients.get(ws)!;

    switch (type) {
      case 'player_action': {
        const parsedAction = PlayerActionSchema.safeParse(payload);
        if (!parsedAction.success) {
          return ws.send(JSON.stringify({ type: 'action_result', payload: { success: false, message: 'Payload inválido.' } }));
        }
        const action = parsedAction.data;
        const player = loadPlayer(client.id);
        if (!player) return;

        let result: { success: boolean; message: string; updatedPlayer: Cultivator } | null = null;

        switch (action.action) {
          case 'study_scroll':
            result = processStudyScroll(player, action.scrollId!);
            break;
          case 'meditate':
            result = processMeditate(player);
            break;
          case 'allocate_attribute':
            result = processAllocateAttributePoint(player, action.attrKey as any);
            break;
          case 'unlock_meridian':
            result = processUnlockMeridian(player, action.meridianId!);
            break;
          case 'attempt_breakthrough':
            result = processBreakthrough(player);
            break;
          case 'equip_gear':
            result = processEquipGear(player, action.itemId!);
            break;
          case 'consume_pill':
            result = processConsumePill(player, action.itemId!);
            break;

          case 'craft_pill': {
            const recipeId = action.recipeId!;
            const currentTemp = action.currentTemp ?? 50;
            const tempDelta = Math.abs(currentTemp - 50);
            const successRate = Math.max(20, 100 - tempDelta * 1.5);

            if (Math.random() * 100 <= successRate) {
              const craftedPill: Item = {
                id: `pill_crafted_${Date.now()}`,
                name: recipeId === 'recipe_breakthrough' ? 'Píldora Rompe-Cielos' : 'Píldora Purificadora de Qi Refinada',
                category: 'pill',
                rarity: recipeId === 'recipe_breakthrough' ? 'Raro' : 'Común',
                description: 'Elaborada artesanalmente en el Gran Caldero.',
                cultivationBoost: 250,
                value: 120,
              };
              player.inventory.push(craftedPill);
              player.spiritStones += 20;
              player.stats.pillsCrafted = (player.stats.pillsCrafted || 0) + 1;
              savePlayer(player);
              result = { success: true, message: `¡Fuego de caldero perfecto! Has obtenido [${craftedPill.name}].`, updatedPlayer: player };
            } else {
              result = { success: false, message: 'La llama espiritual fluctuó demasiado. Los ingredientes se redujeron a cenizas medicinales.', updatedPlayer: player };
            }
            break;
          }

          case 'accept_mission': {
            const mission = action.mission;
            if (!mission) {
              result = { success: false, message: 'Misión inválida.', updatedPlayer: player };
              break;
            }
            if ((player.subRealm || 1) < mission.requiredRealmLevel) {
              result = { success: false, message: 'Reino insuficiente.', updatedPlayer: player };
              break;
            }
            if (!player.activeMissions) player.activeMissions = [];
            if (!player.reputation) player.reputation = {};
            if (player.activeMissions.find(m => m.id === mission.id)) {
              result = { success: false, message: 'Misión ya aceptada.', updatedPlayer: player };
              break;
            }
            player.activeMissions.push({
              ...mission,
              startedAt: Date.now(),
              status: 'in_progress',
            });
            savePlayer(player);
            result = { success: true, message: `Misión aceptada: ${mission.title}`, updatedPlayer: player };
            break;
          }

          case 'claim_mission': {
            if (!player.activeMissions) {
              result = { success: false, message: 'Sin misiones.', updatedPlayer: player };
              break;
            }
            const idx = player.activeMissions.findIndex(m => m.id === action.missionId);
            if (idx === -1) {
              result = { success: false, message: 'Misión no encontrada.', updatedPlayer: player };
              break;
            }
            const mission = player.activeMissions[idx];
            const now = Date.now();
            const endTime = mission.startedAt + (mission.durationMinutes * 60 * 1000);
            if (now < endTime) {
              result = { success: false, message: 'La misión aún no ha terminado.', updatedPlayer: player };
              break;
            }
            player.spiritStones += mission.rewardStones;
            if (!player.reputation) player.reputation = {};
            player.reputation[mission.factionId] = (player.reputation[mission.factionId] || 0) + mission.rewardReputation;
            player.activeMissions.splice(idx, 1);
            savePlayer(player);
            result = { success: true, message: `Misión completada: +${mission.rewardStones} Piedras, +${mission.rewardReputation} Reputación.`, updatedPlayer: player };
            break;
          }

          default:
            result = { success: false, message: `Acción desconocida: ${action.action}`, updatedPlayer: player };
        }

        if (result) {
          ws.send(JSON.stringify({ type: 'action_result', payload: result }));
          ws.send(JSON.stringify({ type: 'player_sync', payload: result.updatedPlayer }));
        }
        break;
      }

      case 'chat_message': {
        const parsedChat = ChatMessageSchema.safeParse(payload);
        if (!parsedChat.success) return;
        broadcast('chat_broadcast', {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          senderId: client.id,
          senderName: client.name,
          sectName: client.sectName,
          realm: client.realm,
          channel: parsedChat.data.channel || 'global',
          text: parsedChat.data.text,
          timestamp: Date.now(),
        });
        break;
      }

      case 'world_boss_attack': {
        if (worldBoss.activeStatus !== 'alive') return;
        const player = loadPlayer(client.id);
        if (!player) return;

        const dmg = Math.max(50, Math.floor(
          player.baseAttack * 2.5 +
          player.spiritPower * 1.8 +
          Math.random() * 50
        ));
        worldBoss.currentHp = Math.max(0, worldBoss.currentHp - dmg);

        let participant = worldBoss.participants.find(p => p.id === client.id);
        if (participant) participant.damageDealt += dmg;
        else {
          participant = {
            id: client.id,
            name: client.name,
            className: client.classType as any,
            damageDealt: dmg,
            sectName: client.sectName,
          };
          worldBoss.participants.push(participant);
        }
        worldBoss.participants.sort((a, b) => b.damageDealt - a.damageDealt);

        player.stats.bossDamageDealt = (player.stats.bossDamageDealt || 0) + dmg;
        savePlayer(player);
        sendToPlayer(client.id, 'player_sync', player);

        logEvent('boss_damage', { actorId: client.id, payload: { bossId: worldBoss.id, damage: dmg, hpAfter: worldBoss.currentHp } });

        if (worldBoss.currentHp <= 0) {
          worldBoss.activeStatus = 'defeated';
          saveWorldState('world_boss', worldBoss);
          logEvent('boss_defeated', { actorId: client.id, payload: { bossId: worldBoss.id, killerId: client.id } });
          broadcast('chat_broadcast', {
            id: `sys_${Date.now()}`,
            senderId: 'system',
            senderName: 'Cielo Celestial',
            sectName: 'Murim',
            realm: 'Ley Cósmica',
            channel: 'global',
            text: `¡El cultivador ${client.name} ha asestado el golpe de gracia a ${worldBoss.name}!`,
            timestamp: Date.now(),
          });
        }
        broadcast('boss_update', worldBoss);
        break;
      }

      case 'auction_bid': {
        const auction = auctionListings.find(a => a.id === payload.auctionId);
        if (!auction) return;
        const player = loadPlayer(client.id);
        if (!player) return;
        const bidAmount = Number(payload.amount);
        const isMerit = auction.currencyType === 'merits';
        const funds = isMerit ? player.sectMerits : player.spiritStones;
        if (bidAmount <= auction.currentBid || bidAmount > funds) return;
        auction.currentBid = bidAmount;
        auction.highestBidderId = client.id;
        auction.highestBidderName = client.name;
        upsertAuction(auction);
        logEvent('auction_bid', { actorId: client.id, payload: { auctionId: auction.id, amount: bidAmount } });
        broadcast('auction_update', auctionListings);
        break;
      }

      case 'auction_buyout': {
        const auctionIndex = auctionListings.findIndex(a => a.id === payload.auctionId);
        if (auctionIndex === -1) return;
        const bought = auctionListings[auctionIndex];
        const player = loadPlayer(client.id);
        if (!player) return;
        const isMerit = bought.currencyType === 'merits';
        const price = bought.buyoutPrice;
        if (isMerit && player.sectMerits < price) return;
        if (!isMerit && player.spiritStones < price) return;

        if (isMerit) player.sectMerits -= price;
        else player.spiritStones -= price;
        player.inventory.push(bought.item);
        player.stats.auctionsWon = (player.stats.auctionsWon || 0) + 1;
        savePlayer(player);

        auctionListings.splice(auctionIndex, 1);
        deleteAuction(bought.id);

        logEvent('auction_buyout', { actorId: client.id, payload: { auctionId: bought.id, price, currency: bought.currencyType } });
        ws.send(JSON.stringify({
          type: 'auction_item_received',
          payload: { item: bought.item, price, currencyType: bought.currencyType || 'stones' },
        }));
        ws.send(JSON.stringify({ type: 'player_sync', payload: player }));
        broadcast('auction_update', auctionListings);
        broadcast('chat_broadcast', {
          id: `auc_${Date.now()}`,
          senderId: 'auction_house',
          senderName: 'Pabellón de Subastas',
          sectName: 'Mercado Central',
          realm: 'Tesoros',
          channel: 'global',
          text: `¡${client.name} ha adquirido [${bought.item.name}] por compra directa!`,
          timestamp: Date.now(),
        });
        break;
      }

      case 'auction_create_listing': {
        if (!payload.item) return;
        const player = loadPlayer(client.id);
        if (!player) return;
        const invIdx = player.inventory.findIndex(i => i.id === payload.item.id);
        if (invIdx === -1) return;
        player.inventory.splice(invIdx, 1);
        savePlayer(player);

        const newListing: AuctionListing = {
          id: `auction_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sellerId: client.id,
          sellerName: client.name,
          sellerClass: client.classType as any,
          item: payload.item,
          currentBid: Math.floor(payload.startingBid || payload.item.value * 0.7),
          buyoutPrice: Math.floor(payload.buyoutPrice || payload.item.value),
          expiresAt: Date.now() + 1000 * 60 * 30,
          currencyType: payload.currencyType || 'stones',
        };
        auctionListings.unshift(newListing);
        upsertAuction(newListing);
        logEvent('auction_created', { actorId: client.id, payload: { auctionId: newListing.id, itemName: newListing.item.name } });
        broadcast('auction_update', auctionListings);
        ws.send(JSON.stringify({ type: 'player_sync', payload: player }));
        break;
      }

      case 'duel_invite': {
        for (const [targetWs, targetClient] of clients.entries()) {
          if (targetClient.id === payload.targetPlayerId && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: 'duel_challenged',
              payload: {
                challengerId: client.id,
                challengerName: client.name,
                challengerRealm: client.realm,
                challengerClass: client.classType,
              },
            }));
            break;
          }
        }
        break;
      }

      case 'duel_accept': {
        const duelId = `duel_${Date.now()}`;
        const challengerId = payload.challengerId;
        let challengerWs: WebSocket | null = null;
        let challengerClient: ConnectedClient | null = null;
        for (const [tw, tc] of clients.entries()) {
          if (tc.id === challengerId) { challengerWs = tw; challengerClient = tc; break; }
        }
        if (!challengerWs || !challengerClient) return;

        const p1Data = loadPlayer(challengerClient.id);
        const p2Data = loadPlayer(client.id);
        if (!p1Data || !p2Data) return;

        const newDuel: LiveDuelState = {
          id: duelId,
          p1: {
            id: challengerClient.id,
            name: challengerClient.name,
            hp: p1Data.hp,
            maxHp: p1Data.maxHp,
            qi: p1Data.qi,
            maxQi: p1Data.maxQi,
            classType: challengerClient.classType as any,
            realm: challengerClient.realm as any,
            shield: 0,
            elementAffinity: 'Fuego',
          },
          p2: {
            id: client.id,
            name: client.name,
            hp: p2Data.hp,
            maxHp: p2Data.maxHp,
            qi: p2Data.qi,
            maxQi: p2Data.maxQi,
            classType: client.classType as any,
            realm: client.realm as any,
            shield: 0,
            elementAffinity: 'Agua',
          },
          currentTurn: challengerClient.id,
          turnNumber: 1,
          combatLog: [{ text: `¡Comienza el duelo entre ${challengerClient.name} y ${client.name}!`, type: 'system' }],
          status: 'in_progress',
        };
        activeDuels.set(duelId, newDuel);
        const startPayload = { type: 'duel_start', payload: newDuel };
        challengerWs.send(JSON.stringify(startPayload));
        ws.send(JSON.stringify(startPayload));
        break;
      }

      case 'duel_action': {
        const duel = activeDuels.get(payload.duelId);
        if (!duel || duel.status !== 'in_progress' || duel.currentTurn !== client.id) return;

        const isP1 = duel.p1.id === client.id;
        const attacker = isP1 ? duel.p1 : duel.p2;
        const defender = isP1 ? duel.p2 : duel.p1;

        let damage = 0;
        let actionText = '';

        if (payload.actionType === 'basic') {
          damage = Math.floor(35 + Math.random() * 20);
          actionText = `${attacker.name} ejecuta una estocada causando ${damage} de daño.`;
        } else if (payload.actionType === 'technique') {
          if (attacker.qi < 25) return;
          damage = Math.floor(65 + Math.random() * 35);
          attacker.qi = Math.max(0, attacker.qi - 25);
          actionText = `${attacker.name} desata [${payload.techName || 'Palma Espiritual'}] con ${damage} de daño.`;
        } else if (payload.actionType === 'secret') {
          if (attacker.qi < 50) return;
          damage = Math.floor(110 + Math.random() * 45);
          attacker.qi = Math.max(0, attacker.qi - 50);
          actionText = `¡${attacker.name} canaliza su Técnica Secreta! ¡${damage} de daño!`;
        } else if (payload.actionType === 'defend') {
          attacker.shield += 50;
          attacker.qi = Math.min(attacker.maxQi, attacker.qi + 25);
          actionText = `${attacker.name} adopta postura defensiva (+50 Escudo, +25 Qi).`;
        }

        if (damage > 0) {
          if (defender.shield > 0) {
            if (defender.shield >= damage) {
              defender.shield -= damage;
              actionText += ` (El escudo absorbió todo)`;
            } else {
              const rem = damage - defender.shield;
              defender.shield = 0;
              defender.hp = Math.max(0, defender.hp - rem);
              actionText += ` (Escudo quebrado, ${rem} infligido)`;
            }
          } else {
            defender.hp = Math.max(0, defender.hp - damage);
          }
        }

        duel.combatLog.push({ text: actionText, type: isP1 ? 'p1' : 'p2' });

        if (defender.hp <= 0) {
          duel.status = 'finished';
          duel.winnerId = attacker.id;
          duel.combatLog.push({ text: `¡${attacker.name} ha vencido a ${defender.name}!`, type: 'system' });

          const p1 = loadPlayer(duel.p1.id);
          const p2 = loadPlayer(duel.p2.id);
          if (p1 && p2) {
            if (duel.winnerId === p1.id) {
              p1.sectMerits += 80;
              p1.stats.duelsWon = (p1.stats.duelsWon || 0) + 1;
              p2.stats.duelsLost = (p2.stats.duelsLost || 0) + 1;
            } else {
              p2.sectMerits += 80;
              p2.stats.duelsWon = (p2.stats.duelsWon || 0) + 1;
              p1.stats.duelsLost = (p1.stats.duelsLost || 0) + 1;
            }
            savePlayer(p1);
            savePlayer(p2);
            sendToPlayer(p1.id, 'player_sync', p1);
            sendToPlayer(p2.id, 'player_sync', p2);
          }
        } else {
          duel.currentTurn = defender.id;
          duel.turnNumber += 1;
        }

        for (const [pWs, pClient] of clients.entries()) {
          if ((pClient.id === duel.p1.id || pClient.id === duel.p2.id) && pWs.readyState === WebSocket.OPEN) {
            pWs.send(JSON.stringify({ type: 'duel_update', payload: duel }));
          }
        }
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', payload: { message: `Tipo desconocido: ${type}` } }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcastOnlinePlayers();
  });
});

// ---------- Endpoints HTTP ----------

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Email y contraseña (>=6) requeridos.' });
    }
    const result = await registerUser(email, password);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error('[api] register:', err);
    res.status(500).json({ success: false, message: 'Error al registrar.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
    const result = await loginUser(email, password);
    if (!result.success) return res.status(401).json(result);
    res.json(result);
  } catch (err) {
    console.error('[api] login:', err);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión.' });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Sin token.' });
    const decoded = verifyToken(auth.slice(7));
    if (!decoded) return res.status(401).json({ success: false, message: 'Token inválido.' });
    const user = getUserById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('[api] me:', err);
    res.status(500).json({ success: false, message: 'Error.' });
  }
});

app.post('/api/player/roll', (_req: Request, res: Response) => {
  try {
    const destinyRoll = rollDestiny();
    res.json({ success: true, roll: destinyRoll });
  } catch (err) {
    console.error('[api] roll:', err);
    res.status(500).json({ success: false, message: 'El destino está nublado.' });
  }
});

app.post('/api/player/create', (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Sin token.' });
    const decoded = verifyToken(auth.slice(7));
    if (!decoded) return res.status(401).json({ success: false, message: 'Token inválido.' });

    const payload = req.body;
    // Ya no exigimos payload.rollData, solo lo básico
    if (!payload.id || !payload.name || !payload.classType) {
      return res.status(400).json({ success: false, message: 'Datos incompletos.' });
    }

    // Pasamos el userId al creador
    const newPlayer = createSyntacticCharacter({ ...payload, userId: decoded.userId });
    res.json({ success: true, player: newPlayer });
  } catch (err) {
    console.error('[api] create:', err);
    res.status(500).json({ success: false, message: 'El Dao rechazó tu creación: ' + (err as Error).message });
  }
});

app.get('/api/state', (_req: Request, res: Response) => {
  res.json({ worldBoss, auctionListings, sects: SECTS_LIST, onlineCount: clients.size });
});

app.get('/api/players', (_req: Request, res: Response) => {
  try { res.json(listPlayers(15)); }
  catch (err) { console.error('[api] players:', err); res.status(500).json({ error: 'Failed to fetch players' }); }
});

app.get('/api/player/:id', (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Sin token.' });
    const decoded = verifyToken(auth.slice(7));
    if (!decoded) return res.status(401).json({ success: false, message: 'Token inválido.' });

    const player = loadPlayer(req.params.id);
    if (!player) return res.status(404).json({ success: false, message: 'Cultivador no encontrado' });
    if (player.userId !== decoded.userId) return res.status(403).json({ success: false, message: 'No es tu personaje.' });

    res.json({ success: true, player });
  } catch (err) {
    console.error('[api] player:', err);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
});

app.post('/api/player/sync', (_req: Request, res: Response) => {
  res.status(410).json({ success: false, message: 'Sync cliente->servidor deshabilitado. El servidor es la autoridad.' });
});

app.delete('/api/player/:id', (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false });
    const decoded = verifyToken(auth.slice(7));
    if (!decoded) return res.status(401).json({ success: false });

    const player = loadPlayer(req.params.id);
    if (!player || player.userId !== decoded.userId) return res.status(403).json({ success: false });

    const success = deletePlayer(req.params.id);
    res.json({ success });
  } catch (err) {
    console.error('[api] delete:', err);
    res.status(500).json({ success: false });
  }
});

import { generateDailyMissions } from './server/game/dynamicMissions';

app.get('/api/missions/:factionId', (req: Request, res: Response) => {
  try {
    const { factionId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const missions = generateDailyMissions(factionId, today);
    res.json({ success: true, missions });
  } catch (err) {
    console.error('[api] missions:', err);
    res.status(500).json({ success: false, message: 'El destino está nublado.' });
  }
});

app.post('/api/missions/accept', (req: Request, res: Response) => {
  try {
    const { playerId, mission } = req.body;
    const player = loadPlayer(playerId);
    if (!player) return res.status(404).json({ success: false, message: 'Jugador no encontrado.' });

    if (!player.activeMissions) player.activeMissions = [];
    if (!player.reputation) player.reputation = {};

    const exists = player.activeMissions.find(m => m.id === mission.id);
    if (exists) return res.status(400).json({ success: false, message: 'Misión ya aceptada.' });

    player.activeMissions.push({
      ...mission,
      startedAt: Date.now(),
      status: 'in_progress'
    });
    savePlayer(player);
    res.json({ success: true, player });
  } catch (err) {
    console.error('[api] missions/accept:', err);
    res.status(500).json({ success: false, message: 'Error al aceptar la misión.' });
  }
});

// ---------- Cierre limpio ----------
function shutdown(signal: string) {
  console.log(`\n[shutdown] (${signal}) guardando estado...`);
  try { saveWorldState('world_boss', worldBoss); } catch (e) { console.error('[shutdown] boss:', e); }
  try { closeDb(); } catch (e) { console.error('[shutdown] db:', e); }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function setupServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Murim server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();