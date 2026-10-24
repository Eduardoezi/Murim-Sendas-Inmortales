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
import { AuctionListing, WorldBossState, LiveDuelState, Cultivator } from './src/types/game';
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

import { rollDestiny, createSyntacticCharacter } from './server/game/creation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json());

// Forzar init de la DB al arrancar
getDb();

// Jefe mundial: carga desde DB, o siembra con el estado inicial
let worldBoss: WorldBossState = loadWorldState(
  'world_boss',
  JSON.parse(JSON.stringify(INITIAL_WORLD_BOSS))
);

// Subastas: carga desde DB; si está vacía, siembra inicial
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
}

const clients = new Map<WebSocket, ConnectedClient>();
const activeDuels = new Map<string, LiveDuelState>();

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(type: string, payload: any, filter?: (c: ConnectedClient) => boolean) {
  const message = JSON.stringify({ type, payload });
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!filter || filter(client)) {
        ws.send(message);
      }
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

// Barrido de subastas expiradas cada 30 s
setInterval(() => {
  const removed = expireAuctions(Date.now());
  if (removed.length > 0) {
    auctionListings = auctionListings.filter((a) => !removed.includes(a.id));
    broadcast('auction_update', auctionListings);
    logEvent('auctions_expired', { payload: { ids: removed } });
  }
}, 30_000);

wss.on('connection', (ws: WebSocket) => {
  ws.send(
    JSON.stringify({
      type: 'init_state',
      payload: {
        worldBoss,
        auctionListings,
        sects: SECTS_LIST,
      },
    })
  );

  ws.on('message', (data: string) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { type, payload } = parsed;

      switch (type) {
        case 'player_auth': {
          const existingPlayer = loadPlayer(payload.id);
          
          if (existingPlayer) {
            const sectName = payload.sectName || existingPlayer.sectId || 'Vagabundo del Jianghu';
            clients.set(ws, {
              ws, id: existingPlayer.id, name: existingPlayer.name, realm: existingPlayer.realm,
              sectId: existingPlayer.sectId, sectName, classType: existingPlayer.classType,
            });
            ws.send(JSON.stringify({ type: 'player_sync', payload: existingPlayer }));
          } else if (payload.fullPlayerData) {
            savePlayer(payload.fullPlayerData);
            clients.set(ws, {
              ws, id: payload.fullPlayerData.id, name: payload.fullPlayerData.name, realm: payload.fullPlayerData.realm,
              sectId: payload.fullPlayerData.sectId, sectName: payload.sectName || 'Vagabundo del Jianghu', classType: payload.fullPlayerData.classType,
            });
            ws.send(JSON.stringify({ type: 'player_sync', payload: payload.fullPlayerData }));
          }
          broadcastOnlinePlayers();
          break;
        }

        case 'player_update': {
          const client = clients.get(ws);
          if (payload && payload.id) {
            savePlayer(payload);
            if (client) {
              client.realm = payload.realm;
              client.name = payload.name;
              client.sectId = payload.sectId;
              client.classType = payload.classType;
              if (payload.sectName) client.sectName = payload.sectName;
            }
            broadcastOnlinePlayers();
          }
          break;
        }

        case 'player_action': {
          const client = clients.get(ws);
          if (!client) return;

          const player = loadPlayer(client.id);
          if (!player) return;

          let result: { success: boolean; message: string; updatedPlayer: Cultivator } | null = null;

          switch (payload.action) {
            case 'study_scroll':
              result = processStudyScroll(player, payload.scrollId);
              break; 
            case 'meditate':
              result = processMeditate(player);
              break;
            case 'allocate_attribute':
              result = processAllocateAttributePoint(player, payload.attrKey);
              break;
            case 'unlock_meridian':
              result = processUnlockMeridian(player, payload.meridianId);
              break;
            case 'attempt_breakthrough':
              result = processBreakthrough(player);
              break;
            case 'equip_gear':
              result = processEquipGear(player, payload.itemId);
              break;
            case 'consume_pill':
              result = processConsumePill(player, payload.itemId);
              break;

            case 'accept_mission': {
              const client = clients.get(ws);
              if (!client) return;

              const player = loadPlayer(client.id);
              if (!player) return;

              const mission = payload.mission;
              
              // Validación básica
              if ((player.subRealm || 1) < mission.requiredRealmLevel) {
                ws.send(JSON.stringify({ type: 'action_result', payload: { success: false, message: 'Tu nivel de reino es insuficiente para esta misión.' } }));
                return;
              }

              if (!player.activeMissions) player.activeMissions = [];
              if (!player.reputation) player.reputation = {};

              const newMission = {
                ...mission,
                startedAt: Date.now(),
                status: 'in_progress'
              };

              player.activeMissions.push(newMission);
              savePlayer(player);

              ws.send(JSON.stringify({ type: 'action_result', payload: { success: true, message: `Misión aceptada: ${mission.title}` } }));
              ws.send(JSON.stringify({ type: 'player_sync', payload: player }));
              break;
            }

            case 'claim_mission': {
              const client = clients.get(ws);
              if (!client) return;

              const player = loadPlayer(client.id);
              if (!player || !player.activeMissions) return;

              const missionIndex = player.activeMissions.findIndex(m => m.id === payload.missionId);
              if (missionIndex === -1) return;

              const mission = player.activeMissions[missionIndex];
              const now = Date.now();
              const endTime = mission.startedAt + (mission.durationMinutes * 60 * 1000);

              if (now < endTime) {
                ws.send(JSON.stringify({ type: 'action_result', payload: { success: false, message: 'La misión aún no ha terminado. El tiempo no perdona.' } }));
                return;
              }

              // Recompensas
              player.spiritStones += mission.rewardStones;
              if (!player.reputation) player.reputation = {};
              player.reputation[mission.factionId] = (player.reputation[mission.factionId] || 0) + mission.rewardReputation;

              // Eliminar misión
              player.activeMissions.splice(missionIndex, 1);

              savePlayer(player);

              ws.send(JSON.stringify({ type: 'action_result', payload: { success: true, message: `¡Misión completada! Has obtenido ${mission.rewardStones} Piedras y +${mission.rewardReputation} de Reputación.` } }));
              ws.send(JSON.stringify({ type: 'player_sync', payload: player }));
              break;
            }
            default:
              result = { success: false, message: `Acción desconocida: ${payload.action}`, updatedPlayer: player };
          }

          if (result) {
            ws.send(JSON.stringify({ type: 'action_result', payload: result }));
            ws.send(JSON.stringify({ type: 'player_sync', payload: result.updatedPlayer }));
          }
          break;
        }

        case 'chat_message': {
          const client = clients.get(ws);
          if (client) {
            broadcast('chat_broadcast', {
              id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              senderId: client.id,
              senderName: client.name,
              sectName: client.sectName,
              realm: client.realm,
              channel: payload.channel || 'global',
              text: payload.text,
              timestamp: Date.now(),
            });
          }
          break;
        }

        case 'world_boss_attack': {
          const client = clients.get(ws);
          if (!client || worldBoss.activeStatus !== 'alive') return;

          const dmg = Math.max(50, Math.floor(payload.damage || 100));
          worldBoss.currentHp = Math.max(0, worldBoss.currentHp - dmg);

          let participant = worldBoss.participants.find(p => p.id === client.id);
          if (participant) {
            participant.damageDealt += dmg;
          } else {
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

          logEvent('boss_damage', {
            actorId: client.id,
            payload: { bossId: worldBoss.id, damage: dmg, hpAfter: worldBoss.currentHp },
          });

          if (worldBoss.currentHp <= 0) {
            worldBoss.activeStatus = 'defeated';
            saveWorldState('world_boss', worldBoss);
            logEvent('boss_defeated', {
              actorId: client.id,
              payload: { bossId: worldBoss.id, killerId: client.id },
            });
            broadcast('chat_broadcast', {
              id: `sys_${Date.now()}`,
              senderId: 'system',
              senderName: 'Cielo Celestial',
              sectName: 'Murim',
              realm: 'Ley Cósmica',
              channel: 'global',
              text: `¡El cultivador ${client.name} ha asestado el golpe de gracia a ${worldBoss.name}! Las recompensas celestiales se han distribuido.`,
              timestamp: Date.now(),
            });
          }

          broadcast('boss_update', worldBoss);
          break;
        }

        case 'auction_bid': {
          const client = clients.get(ws);
          if (!client) return;

          const auction = auctionListings.find(a => a.id === payload.auctionId);
          if (!auction) return;

          const bidAmount = Number(payload.amount);
          if (bidAmount > auction.currentBid) {
            auction.currentBid = bidAmount;
            auction.highestBidderId = client.id;
            auction.highestBidderName = client.name;
            upsertAuction(auction);
            logEvent('auction_bid', {
              actorId: client.id,
              payload: { auctionId: auction.id, amount: bidAmount },
            });
            broadcast('auction_update', auctionListings);
          }
          break;
        }

        case 'auction_buyout': {
          const client = clients.get(ws);
          if (!client) return;

          const auctionIndex = auctionListings.findIndex(a => a.id === payload.auctionId);
          if (auctionIndex !== -1) {
            const boughtItem = auctionListings[auctionIndex];
            auctionListings.splice(auctionIndex, 1);
            deleteAuction(boughtItem.id);
            logEvent('auction_buyout', {
              actorId: client.id,
              payload: { auctionId: boughtItem.id, price: boughtItem.buyoutPrice, currency: boughtItem.currencyType },
            });

            ws.send(
              JSON.stringify({
                type: 'auction_item_received',
                payload: {
                  item: boughtItem.item,
                  price: boughtItem.buyoutPrice,
                  currencyType: boughtItem.currencyType || 'stones',
                },
              })
            );

            broadcast('auction_update', auctionListings);
            broadcast('chat_broadcast', {
              id: `auc_${Date.now()}`,
              senderId: 'auction_house',
              senderName: 'Pabellón de Subastas',
              sectName: 'Mercado Central',
              realm: 'Tesoros',
              channel: 'global',
              text: `¡${client.name} ha adquirido [${boughtItem.item.name}] por compra directa!`,
              timestamp: Date.now(),
            });
          }
          break;
        }

        case 'auction_create_listing': {
          const client = clients.get(ws);
          if (!client || !payload.item) return;

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
          logEvent('auction_created', {
            actorId: client.id,
            payload: { auctionId: newListing.id, itemName: newListing.item.name },
          });
          broadcast('auction_update', auctionListings);
          break;
        }

        case 'duel_invite': {
          const client = clients.get(ws);
          if (!client) return;

          for (const [targetWs, targetClient] of clients.entries()) {
            if (targetClient.id === payload.targetPlayerId && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(
                JSON.stringify({
                  type: 'duel_challenged',
                  payload: {
                    challengerId: client.id,
                    challengerName: client.name,
                    challengerRealm: client.realm,
                    challengerClass: client.classType,
                  },
                })
              );
              break;
            }
          }
          break;
        }

        case 'duel_accept': {
          const client = clients.get(ws);
          if (!client) return;

          const duelId = `duel_${Date.now()}`;
          const challengerId = payload.challengerId;

          let challengerWs: WebSocket | null = null;
          let challengerClient: ConnectedClient | null = null;
          for (const [tw, tc] of clients.entries()) {
            if (tc.id === challengerId) {
              challengerWs = tw;
              challengerClient = tc;
              break;
            }
          }

          if (challengerWs && challengerClient) {
            const newDuel: LiveDuelState = {
              id: duelId,
              p1: {
                id: challengerClient.id,
                name: challengerClient.name,
                hp: payload.challengerHp || 300,
                maxHp: payload.challengerHp || 300,
                qi: 150,
                maxQi: 150,
                classType: challengerClient.classType as any,
                realm: challengerClient.realm as any,
                shield: 0,
                elementAffinity: 'Fuego',
              },
              p2: {
                id: client.id,
                name: client.name,
                hp: payload.accepterHp || 300,
                maxHp: payload.accepterHp || 300,
                qi: 150,
                maxQi: 150,
                classType: client.classType as any,
                realm: client.realm as any,
                shield: 0,
                elementAffinity: 'Agua',
              },
              currentTurn: challengerClient.id,
              turnNumber: 1,
              combatLog: [
                {
                  text: `¡Comienza el duelo de artes marciales entre ${challengerClient.name} y ${client.name}!`,
                  type: 'system',
                },
              ],
              status: 'in_progress',
            };

            activeDuels.set(duelId, newDuel);

            const startPayload = { type: 'duel_start', payload: newDuel };
            challengerWs.send(JSON.stringify(startPayload));
            ws.send(JSON.stringify(startPayload));
          }
          break;
        }

        case 'duel_action': {
          const client = clients.get(ws);
          if (!client) return;

          const duel = activeDuels.get(payload.duelId);
          if (!duel || duel.status !== 'in_progress' || duel.currentTurn !== client.id) return;

          const isP1 = duel.p1.id === client.id;
          const attacker = isP1 ? duel.p1 : duel.p2;
          const defender = isP1 ? duel.p2 : duel.p1;

          let damage = 0;
          let actionText = '';

          if (payload.actionType === 'basic') {
            damage = Math.floor(35 + Math.random() * 20);
            actionText = `${attacker.name} ejecuta una estocada de artes marciales causando ${damage} de daño.`;
          } else if (payload.actionType === 'technique') {
            damage = Math.floor(65 + Math.random() * 35);
            attacker.qi = Math.max(0, attacker.qi - 25);
            actionText = `${attacker.name} desata la técnica [${payload.techName || 'Palma Espiritual'}] impactando con ${damage} de daño elemental.`;
          } else if (payload.actionType === 'secret') {
            damage = Math.floor(110 + Math.random() * 45);
            attacker.qi = Math.max(0, attacker.qi - 50);
            actionText = `¡${attacker.name} canaliza su Técnica Secreta Prohibida! ¡Impacto colosal de ${damage} de daño!`;
          } else if (payload.actionType === 'defend') {
            attacker.shield += 50;
            attacker.qi = Math.min(attacker.maxQi, attacker.qi + 25);
            actionText = `${attacker.name} asienta su Dantian en postura defensiva, obteniendo +50 de Escudo de Qi y recuperando Qi.`;
          }

          if (damage > 0) {
            if (defender.shield > 0) {
              if (defender.shield >= damage) {
                defender.shield -= damage;
                actionText += ` (El escudo absorbió todo el impacto)`;
              } else {
                const remainingDmg = damage - defender.shield;
                defender.shield = 0;
                defender.hp = Math.max(0, defender.hp - remainingDmg);
                actionText += ` (Escudo quebrado, ${remainingDmg} infligido)`;
              }
            } else {
              defender.hp = Math.max(0, defender.hp - damage);
            }
          }

          duel.combatLog.push({ text: actionText, type: isP1 ? 'p1' : 'p2' });

          if (defender.hp <= 0) {
            duel.status = 'finished';
            duel.winnerId = attacker.id;
            duel.combatLog.push({
              text: `¡${attacker.name} ha vencido con honor a ${defender.name}!`,
              type: 'system',
            });
          } else {
            duel.currentTurn = defender.id;
            duel.turnNumber += 1;
          }

          for (const [pWs, pClient] of clients.entries()) {
            if (pClient.id === duel.p1.id || pClient.id === duel.p2.id) {
              if (pWs.readyState === WebSocket.OPEN) {
                pWs.send(JSON.stringify({ type: 'duel_update', payload: duel }));
              }
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcastOnlinePlayers();
  });
});

// ENDPOINTS HTTP
app.post('/api/player/roll', (req: Request, res: Response) => {
  try {
    const destinyRoll = rollDestiny();
    res.json({ success: true, roll: destinyRoll });
  } catch (err) {
    console.error('[api] Error rolling destiny:', err);
    res.status(500).json({ success: false, message: 'El destino está nublado.' });
  }
});

app.post('/api/player/create', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.id || !payload.name || !payload.classType || !payload.rollData) {
      return res.status(400).json({ success: false, message: 'Datos incompletos para forjar el sendero.' });
    }
    const newPlayer = createSyntacticCharacter(payload);
    res.json({ success: true, player: newPlayer });
  } catch (err) {
    console.error('[api] ERROR CREANDO PERSONAJE:', err);
    res.status(500).json({ success: false, message: 'El Dao rechazó tu creación: ' + (err as Error).message });
  }
});

app.get('/api/state', (_req: Request, res: Response) => {
  res.json({
    worldBoss,
    auctionListings,
    sects: SECTS_LIST,
    onlineCount: clients.size,
  });
});

app.get('/api/players', (_req: Request, res: Response) => {
  try {
    const list = listPlayers(15);
    res.json(list);
  } catch (err) {
    console.error('[api] Error fetching players list:', err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/api/player/:id', (req: Request, res: Response) => {
  try {
    const player = loadPlayer(req.params.id);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Cultivador no encontrado' });
    }
    res.json({ success: true, player });
  } catch (err) {
    console.error('[api] Error loading player:', err);
    res.status(500).json({ success: false, message: 'Error interno al cargar cultivador' });
  }
});

app.post('/api/player/sync', (req: Request, res: Response) => {
  try {
    const player = req.body;
    if (!player || !player.id) {
      return res.status(400).json({ success: false, message: 'Datos de cultivador inválidos' });
    }
    savePlayer(player);
    res.json({ success: true, player });
  } catch (err) {
    console.error('[api] Error saving player:', err);
    res.status(500).json({ success: false, message: 'Error al persistir cultivador' });
  }
});

app.delete('/api/player/:id', (req: Request, res: Response) => {
  try {
    const success = deletePlayer(req.params.id);
    res.json({ success });
  } catch (err) {
    console.error('[api] Error deleting player:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar cultivador' });
  }
});

// ---------- Cierre limpio ----------
function shutdown(signal: string) {
  console.log(`\n[shutdown] (${signal}) guardando estado...`);
  try {
    saveWorldState('world_boss', worldBoss);
  } catch (e) {
    console.error('[shutdown] error guardando boss:', e);
  }
  try {
    closeDb();
  } catch (e) {
    console.error('[shutdown] error cerrando DB:', e);
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// server.ts (Añadir al final, antes de setupServer)

import { generateDailyMissions } from './server/game/dynamicMissions';

// Endpoint para obtener las misiones diarias de una facción
app.get('/api/missions/:factionId', (req: Request, res: Response) => {
  try {
    const { factionId } = req.params;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const missions = generateDailyMissions(factionId, today);
    res.json({ success: true, missions });
  } catch (err) {
    console.error('[api] Error generating missions:', err);
    res.status(500).json({ success: false, message: 'El destino está nublado.' });
  }
});

// Endpoint para aceptar una misión y guardarla en el jugador
app.post('/api/missions/accept', (req: Request, res: Response) => {
  try {
    const { playerId, mission } = req.body;
    const player = loadPlayer(playerId);
    if (!player) return res.status(404).json({ success: false, message: 'Jugador no encontrado.' });

    // Inicializar arrays si no existen
    if (!player.activeMissions) player.activeMissions = [];
    if (!player.reputation) player.reputation = {};

    // Verificar si ya está activa
    const exists = player.activeMissions.find(m => m.id === mission.id);
    if (exists) return res.status(400).json({ success: false, message: 'Misión ya aceptada.' });

    const newMission = {
      ...mission,
      startedAt: Date.now(),
      status: 'in_progress'
    };

    player.activeMissions.push(newMission);
    savePlayer(player);
    
    res.json({ success: true, player });
  } catch (err) {
    console.error('[api] Error accepting mission:', err);
    res.status(500).json({ success: false, message: 'Error al aceptar la misión.' });
  }
});

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