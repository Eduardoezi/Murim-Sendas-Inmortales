import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Cultivator,
  CharacterClass,
  AuctionListing,
  WorldBossState,
  SectInfo,
  Item,
  LiveDuelState,
  CustomSecretTechnique,
  SectMission,
  Disciple,
  SectRank,
} from '../types/game';
import {
  INITIAL_MERIDIANS,
  SECTS_LIST,
  INITIAL_SECT_MISSIONS,
  INITIAL_WORLD_BOSS,
  MERIT_MILESTONES,
  LIBRARY_SCROLLS,
} from '../data/gameData';
import { MAP_REGIONS, WORLD_BEASTS } from '../data/worldData';
import { murimAudio } from '../utils/audio';

const calculateSectRank = (merits: number): SectRank => {
  if (merits >= 8000) return 'Líder Supremo / Patriarca';
  if (merits >= 3500) return 'Gran Maestro';
  if (merits >= 1500) return 'Anciano de Pabellón';
  if (merits >= 600) return 'Discípulo Élite';
  if (merits >= 200) return 'Discípulo Interno';
  return 'Discípulo Externo';
};

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  sectName: string;
  realm: string;
  channel: 'global' | 'sect';
  text: string;
  timestamp: number;
}

interface OnlinePlayer {
  id: string;
  name: string;
  realm: string;
  sectId: string;
  sectName: string;
  classType: string;
}

interface GameContextType {
  cultivator: Cultivator | null;
  onlinePlayers: OnlinePlayer[];
  auctionListings: AuctionListing[];
  worldBoss: WorldBossState;
  sects: SectInfo[];
  chatMessages: ChatMessage[];
  activeDuel: LiveDuelState | null;
  pendingDuelInvite: { challengerId: string; challengerName: string; challengerRealm: string } | null;
  missions: SectMission[];
  isConnected: boolean;
  token: string | null;
  playerId: string | null;
  authError: string | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createCharacter: (name: string, classType: CharacterClass, sectId: string) => void;
  createSyntacticCharacter: (payload: any) => Promise<void>;
  loadSavedCharacter: (character: Cultivator) => void;
  resetCharacter: () => void;
  meditate: () => void;
  unlockMeridian: (meridianId: string) => boolean;
  attemptBreakthrough: () => { success: boolean; message: string };
  craftPill: (recipeId: string, currentTemp: number) => { success: boolean; message: string };
  consumePill: (itemId: string) => void;
  equipGear: (item: Item) => void;
  craftSecretTechnique: (technique: CustomSecretTechnique) => void;
  acceptMission: (mission: any) => void;
  claimMission: (missionId: string) => void;
  recruitDisciple: () => void;
  assignDiscipleTask: (discipleId: string, task: Disciple['assignedTask']) => void;
  claimDiscipleTribute: (discipleId: string) => void;
  joinSect: (sectId: string) => void;
  contributeSect: (amount: number) => void;
  placeBid: (auctionId: string, amount: number) => void;
  buyoutAuction: (auctionId: string) => void;
  createAuctionListing: (item: Item, startBid: number, buyout: number, currencyType?: 'stones' | 'merits') => void;
  claimMilestone: (milestoneId: string) => void;
  attackWorldBoss: () => void;
  sendChatMessage: (text: string, channel?: 'global' | 'sect') => void;
  challengePlayer: (playerId: string) => void;
  acceptDuel: () => void;
  declineDuel: () => void;
  performDuelAction: (actionType: 'basic' | 'technique' | 'secret' | 'defend', techName?: string) => void;
  closeDuelSummary: () => void;
  toggleAudio: () => boolean;
  isAudioMuted: boolean;
  allocateAttributePoint: (attribute: keyof Cultivator['attributes']) => void;
  studyLibraryScroll: (scrollId: string) => { success: boolean; message: string };
  dismantleTechnique: (scrollId: string) => { success: boolean; insight: string };
  claimSectStipend: () => { success: boolean; message: string };
  requestPatriarchGuidance: () => { success: boolean; message: string };
  receiveMedicinalTreatment: (treatmentType: 'herb_bath' | 'acupuncture' | 'restore_soul') => { success: boolean; message: string };
  harvestSectGarden: () => { success: boolean; message: string; herb?: Item };
  buySectStoreItem: (item: Item, meritCost: number) => { success: boolean; message: string };
  travelToNode: (nodeId: string) => { success: boolean; message: string };
  exploreNodeEvent: (nodeId: string) => { roll: number; eventText: string; rewardText: string; loot?: Item };
  huntBeastEncounter: (beastId: string) => { victory: boolean; log: string; dropItem?: Item };
  buyItem: (item: Item, price: number) => void;
  sellItem: (itemId: string, price: number) => void;
  collectDungeonLoot: (stones: number, item: Item | undefined, qiCost: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'murim_cultivator_profile_v1';
const TOKEN_KEY = 'murim_token';
const PLAYER_ID_KEY = 'murim_player_id';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [playerId, setPlayerId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(PLAYER_ID_KEY);
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [cultivator, setCultivator] = useState<Cultivator | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedPlayerId = localStorage.getItem(PLAYER_ID_KEY);
    if (!savedToken || !savedPlayerId) return null;
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.attributes) {
          parsed.attributes = {
            fuerza: 18, destreza: 18, constitucion: 16, inteligencia: 18,
            percepcion: 16, astucia: 14, voluntad: 16, suerte: 12, carisma: 14, sabiduria: 16,
          };
        }
        if (parsed.karma === undefined) parsed.karma = 50;
        if (parsed.fama === undefined) parsed.fama = 50;
        if (parsed.freeAttributePoints === undefined) parsed.freeAttributePoints = 10;
        if (parsed.freeSkillPoints === undefined) parsed.freeSkillPoints = 5;
        if (!parsed.dantianScale) parsed.dantianScale = 'Gota';
        if (!parsed.spiritSense) parsed.spiritSense = 40;
        if (!parsed.currency) {
          parsed.currency = { gold: 15, silver: 400, copper: 2500, stonesLow: parsed.spiritStones || 250, stonesMid: 12, stonesHigh: 0, stonesSupreme: 0 };
        }
        if (!parsed.currentLocationNodeId || !parsed.currentLocationNodeId.startsWith('prov_')) parsed.currentLocationNodeId = 'prov_shaanxi';
        if (!parsed.libraryScrolls || parsed.libraryScrolls.length === 0) {
          parsed.libraryScrolls = JSON.parse(JSON.stringify(LIBRARY_SCROLLS));
        }
        if (!parsed.inventoryMaxSlots) parsed.inventoryMaxSlots = 30;
        if (!parsed.stats) parsed.stats = { duelsWon: 0, duelsLost: 0, bossDamageDealt: 0, pillsCrafted: 0, meridiansOpened: 0, auctionsWon: 0, disciplesRecruited: 1, scrollsMastered: 0, nodesDiscovered: 3 };
        if (!parsed.activeMissions) parsed.activeMissions = [];
        if (!parsed.reputation) parsed.reputation = {};
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [auctionListings, setAuctionListings] = useState<AuctionListing[]>([]);
  const [worldBoss, setWorldBoss] = useState<WorldBossState>(INITIAL_WORLD_BOSS);
  const [sects, setSects] = useState<SectInfo[]>(SECTS_LIST);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeDuel, setActiveDuel] = useState<LiveDuelState | null>(null);
  const [pendingDuelInvite, setPendingDuelInvite] = useState<{ challengerId: string; challengerName: string; challengerRealm: string } | null>(null);
  const [missions, setMissions] = useState<SectMission[]>(INITIAL_SECT_MISSIONS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (cultivator) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cultivator));
    }
  }, [cultivator]);

  // ---------- WebSocket autenticado ----------
  useEffect(() => {
    if (!token || !playerId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let cancelled = false;
    let ws: WebSocket;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'auth', payload: { token, playerId } }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          switch (type) {
            case 'init_state':
              if (payload.worldBoss) setWorldBoss(payload.worldBoss);
              if (payload.auctionListings) setAuctionListings(payload.auctionListings);
              if (payload.sects) setSects(payload.sects);
              break;
            case 'auth_ok':
              setAuthError(null);
              break;
            case 'auth_error':
              setAuthError(payload.message || 'Error de autenticación.');
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(PLAYER_ID_KEY);
              setToken(null);
              setPlayerId(null);
              setCultivator(null);
              ws.close();
              break;
            case 'players_update':
              setOnlinePlayers(payload);
              break;
            case 'boss_update':
              setWorldBoss(payload);
              break;
            case 'auction_update':
              setAuctionListings(payload);
              break;
            case 'auction_item_received':
              murimAudio.playGavelTap();
              break;
            case 'chat_broadcast':
              setChatMessages(prev => [...prev.slice(-40), payload]);
              break;
            case 'player_sync':
              setCultivator({
                ...payload,
                disciples: payload.disciples || [],
                inventory: payload.inventory || [],
                meridians: payload.meridians || [],
                knownTechniques: payload.knownTechniques || [],
                libraryScrolls: payload.libraryScrolls || [],
                activeMissions: payload.activeMissions || [],
                reputation: payload.reputation || {},
              });
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
              break;
            case 'action_result':
              console.log('[Servidor]', payload.success ? '✅' : '❌', payload.message);
              break;
            case 'duel_challenged':
              setPendingDuelInvite(payload);
              break;
            case 'duel_start':
              setActiveDuel(payload);
              setPendingDuelInvite(null);
              break;
            case 'duel_update':
              setActiveDuel(payload);
              break;
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!cancelled) {
          setTimeout(connect, 3000);
        }
      };
    }

    connect();
    return () => {
      cancelled = true;
      if (ws) ws.close();
    };
  }, [token, playerId]);

  // ---------- Auth ----------
  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.message || 'Error al iniciar sesión.');
        return false;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      return true;
    } catch (err) {
      setAuthError((err as Error).message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.message || 'Error al registrar.');
        return false;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      return true;
    } catch (err) {
      setAuthError((err as Error).message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PLAYER_ID_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setToken(null);
    setPlayerId(null);
    setCultivator(null);
    setAuthError(null);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // ---------- Personaje ----------
  const createSyntacticCharacter = async (payload: any) => {
    if (!token) {
      setAuthError('Debes iniciar sesión para crear un personaje.');
      return;
    }
    
    setAuthLoading(true); // <-- INICIAR CARGA
    setAuthError(null);
    
    try {
      const newId = `cultivator_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const bodyData = { id: newId, ...payload };

      const res = await fetch('/api/player/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (data.success && data.player) {
        setCultivator({
          ...data.player,
          disciples: data.player.disciples || [],
          inventory: data.player.inventory || [],
          meridians: data.player.meridians || [],
          knownTechniques: data.player.knownTechniques || [],
          libraryScrolls: data.player.libraryScrolls || [],
          activeMissions: data.player.activeMissions || [],
          reputation: data.player.reputation || {},
        });
        localStorage.setItem(PLAYER_ID_KEY, data.player.id);
        setPlayerId(data.player.id);
        murimAudio.playBreakthroughGong();
      } else {
        setAuthError(data.message || 'Error al crear personaje.');
      }
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false); // <-- DETENER CARGA
    }
  };

  const loadSavedCharacter = (savedCultivator: Cultivator) => {
    if (!token) {
      setAuthError('Debes iniciar sesión.');
      return;
    }
    setCultivator(savedCultivator);
    localStorage.setItem(PLAYER_ID_KEY, savedCultivator.id);
    setPlayerId(savedCultivator.id);
    // El servidor enviará player_sync al autenticar el WS.
  };

  const resetCharacter = () => {
    setCultivator(null);
    setPlayerId(null);
    localStorage.removeItem(PLAYER_ID_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const sendPlayerAction = (action: string, extra: Record<string, any> = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'player_action', payload: { action, ...extra } }));
      return true;
    }
    return false;
  };

  const meditate = () => {
    if (!cultivator) return;
    murimAudio.playQiChime();
    sendPlayerAction('meditate');
  };

  const unlockMeridian = (meridianId: string): boolean => {
    if (!cultivator) return false;
    const target = cultivator.meridians.find((m) => m.id === meridianId);
    if (!target || target.unlocked) return false;
    if (cultivator.qi < target.qiCost) return false;
    murimAudio.playBreakthroughGong();
    return sendPlayerAction('unlock_meridian', { meridianId });
  };

  const attemptBreakthrough = (): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no encontrado.' };
    if (cultivator.qi < cultivator.maxQi * 0.9) {
      return { success: false, message: 'Tu Dantian aún no está lo suficientemente repleto de Qi puro para forzar el avance.' };
    }
    murimAudio.playBreakthroughGong();
    const ok = sendPlayerAction('attempt_breakthrough');
    return ok ? { success: true, message: 'Invocando la Tribulación Celestial...' } : { success: false, message: 'Desconectado del servidor.' };
  };

  const consumePill = (itemId: string) => {
    if (!cultivator) return;
    const pill = cultivator.inventory.find((i) => i.id === itemId);
    if (!pill || pill.category !== 'pill') return;
    murimAudio.playQiChime();
    sendPlayerAction('consume_pill', { itemId });
  };

  const equipGear = (item: Item) => {
    if (!cultivator) return;
    sendPlayerAction('equip_gear', { itemId: item.id });
  };

  const allocateAttributePoint = (attrKey: keyof Cultivator['attributes']) => {
    if (!cultivator || cultivator.freeAttributePoints <= 0) return;
    murimAudio.playQiChime();
    sendPlayerAction('allocate_attribute', { attrKey });
  };

  const collectDungeonLoot = (stones: number, item: Item | undefined, qiCost: number) => {
    if (!cultivator) return;
    murimAudio.playCoinClink();
    setCultivator(prev => {
      if (!prev) return null;
      const newInventory = [...prev.inventory];
      if (item && newInventory.length < prev.inventoryMaxSlots) newInventory.push(item);
      const newStats = { ...prev.stats, bossDamageDealt: (prev.stats?.bossDamageDealt || 0) + 100 };
      return {
        ...prev,
        spiritStones: prev.spiritStones + stones,
        qi: Math.max(0, prev.qi - qiCost),
        inventory: newInventory,
        stats: newStats,
      };
    });
  };

  const acceptMission = (mission: any) => {
    sendPlayerAction('accept_mission', { mission });
  };

  const claimMission = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;
    murimAudio.playQiChime();
    setMissions(prev => prev.map(m => (m.id === missionId ? { ...m, claimed: true } : m)));
    sendPlayerAction('claim_mission', { missionId });
  };

  const studyLibraryScroll = (scrollId: string): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no encontrado.' };
    const scroll = cultivator.libraryScrolls.find(s => s.id === scrollId);
    if (!scroll || scroll.isMastered) return { success: false, message: 'Rollo no válido.' };
    const ok = sendPlayerAction('study_scroll', { scrollId });
    return ok ? { success: true, message: 'Iniciando estudio...' } : { success: false, message: 'Desconectado del servidor.' };
  };

  const craftPill = (recipeId: string, currentTemp: number) => {
    if (!cultivator) return { success: false, message: 'Cultivador no encontrado.' };
    murimAudio.playAlchemyStir();
    const ok = sendPlayerAction('craft_pill', { recipeId, currentTemp });
    return ok
      ? { success: true, message: 'El caldero ruge. El resultado depende de tu control de llama...' }
      : { success: false, message: 'Desconectado del servidor.' };
  };

  const craftSecretTechnique = (tech: CustomSecretTechnique) => {
    if (!cultivator) return;
    murimAudio.playBreakthroughGong();
    setCultivator(prev => prev ? { ...prev, secretTechnique: tech } : null);
  };

  const recruitDisciple = () => {
    if (!cultivator || cultivator.spiritStones < 100) return;
    const names = ['Li Chen', 'Meng Hao', 'Xiao Yan', 'Yun Che', 'Tang San', 'Ye Fan'];
    const newName = names[Math.floor(Math.random() * names.length)];
    const newDisciple: Disciple = {
      id: `disciple_${Date.now()}`,
      name: newName,
      realm: 'Condensación de Qi',
      aptitude: Math.random() > 0.6 ? 'Genio Celestial' : 'Notable',
      loyalty: 80,
      assignedTask: 'herb_gathering',
      taskProgress: 10,
      taskDurationSeconds: 60,
      tributeYield: { spiritStones: 50, merits: 20, materials: 'Hierba' },
    };
    setCultivator(prev => prev ? {
      ...prev,
      spiritStones: prev.spiritStones - 100,
      disciples: [...prev.disciples, newDisciple],
      stats: { ...prev.stats, disciplesRecruited: (prev.stats?.disciplesRecruited || 0) + 1 },
    } : null);
  };

  const assignDiscipleTask = (discipleId: string, task: Disciple['assignedTask']) =>
    setCultivator(prev => prev ? { ...prev, disciples: prev.disciples.map(d => d.id === discipleId ? { ...d, assignedTask: task, taskProgress: 0 } : d) } : null);

  const claimDiscipleTribute = (discipleId: string) => {
    if (!cultivator) return;
    const disciple = cultivator.disciples.find(d => d.id === discipleId);
    if (!disciple || disciple.taskProgress < 100) return;
    murimAudio.playQiChime();
    setCultivator(prev => prev ? {
      ...prev,
      spiritStones: prev.spiritStones + disciple.tributeYield.spiritStones,
      sectMerits: prev.sectMerits + disciple.tributeYield.merits,
      disciples: prev.disciples.map(d => d.id === discipleId ? { ...d, taskProgress: 0 } : d),
    } : null);
  };

  const joinSect = (sectId: string) =>
    setCultivator(prev => prev ? { ...prev, sectId, sectRank: 'Discípulo Externo', sectMerits: 0 } : null);

  const contributeSect = (amount: number) => {
    if (!cultivator || cultivator.spiritStones < amount) return;
    murimAudio.playCoinClink();
    setCultivator(prev => {
      if (!prev) return null;
      const newMerits = prev.sectMerits + Math.floor(amount * 0.8);
      const newRank = calculateSectRank(newMerits);
      if (newRank !== prev.sectRank) {
        setTimeout(() => {
          alert(`¡Felicidades! Has ascendido al rango de: ${newRank.toUpperCase()}`);
          murimAudio.playBreakthroughGong();
        }, 100);
      }
      return { ...prev, spiritStones: prev.spiritStones - amount, sectMerits: newMerits, sectRank: newRank };
    });
  };

  const buyItem = (item: Item, price: number) => {
    if (!cultivator) return;
    if (cultivator.spiritStones < price) { alert('No tienes suficientes Piedras Espirituales.'); return; }
    if (cultivator.inventory.length >= cultivator.inventoryMaxSlots) { alert('Tu inventario está lleno.'); return; }
    murimAudio.playCoinClink();
    setCultivator(prev => prev ? {
      ...prev,
      spiritStones: prev.spiritStones - price,
      inventory: [...prev.inventory, { ...item, id: `${item.id}_${Date.now()}` }],
    } : null);
  };

  const sellItem = (itemId: string, price: number) => {
    if (!cultivator) return;
    const itemToSell = cultivator.inventory.find(i => i.id === itemId);
    if (!itemToSell) return;
    murimAudio.playCoinClink();
    setCultivator(prev => prev ? {
      ...prev,
      spiritStones: prev.spiritStones + price,
      inventory: prev.inventory.filter(i => i.id !== itemId),
    } : null);
  };

  const placeBid = (auctionId: string, amount: number) => {
    if (!cultivator) return;
    const auction = auctionListings.find(a => a.id === auctionId);
    if (!auction) return;
    const isMerit = auction.currencyType === 'merits';
    if (isMerit && cultivator.sectMerits < amount) return;
    if (!isMerit && cultivator.spiritStones < amount) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'auction_bid', payload: { auctionId, amount } }));
    }
  };

  const buyoutAuction = (auctionId: string) => {
    if (!cultivator) return;
    const auction = auctionListings.find(a => a.id === auctionId);
    if (!auction) return;
    const isMerit = auction.currencyType === 'merits';
    if (isMerit ? cultivator.sectMerits < auction.buyoutPrice : cultivator.spiritStones < auction.buyoutPrice) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'auction_buyout', payload: { auctionId } }));
    }
  };

  const createAuctionListing = (item: Item, startBid: number, buyout: number, currencyType: 'stones' | 'merits' = 'stones') => {
    if (!cultivator) return;
    setCultivator(prev => prev ? { ...prev, inventory: prev.inventory.filter(i => i.id !== item.id) } : null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'auction_create_listing', payload: { item, startingBid: startBid, buyoutPrice: buyout, currencyType } }));
    }
  };

  const claimMilestone = (milestoneId: string) => {
    const milestone = MERIT_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone || !cultivator || cultivator.claimedAchievements?.includes(milestoneId)) return;
    murimAudio.playBreakthroughGong();
    setCultivator(prev => prev ? {
      ...prev,
      sectMerits: prev.sectMerits + milestone.meritReward,
      spiritStones: prev.spiritStones + milestone.stoneReward,
      claimedAchievements: [...(prev.claimedAchievements || []), milestoneId],
    } : null);
  };

  const attackWorldBoss = () => {
    if (!cultivator) return;
    murimAudio.playElementalBlast(cultivator.classType === 'warrior' ? 'Fuego' : 'Rayo');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'world_boss_attack', payload: {} }));
    }
  };

  const sendChatMessage = (text: string, channel: 'global' | 'sect' = 'global') => {
    if (!text.trim() || !cultivator) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat_message', payload: { text, channel } }));
    }
  };

  const challengePlayer = (targetPlayerId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'duel_invite', payload: { targetPlayerId } }));
    }
  };

  const acceptDuel = () => {
    if (!pendingDuelInvite || !cultivator) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'duel_accept', payload: { challengerId: pendingDuelInvite.challengerId } }));
    }
  };

  const declineDuel = () => setPendingDuelInvite(null);

  const performDuelAction = (actionType: 'basic' | 'technique' | 'secret' | 'defend', techName?: string) => {
    if (!activeDuel || !cultivator) return;
    if (actionType === 'basic') murimAudio.playSwordClash();
    else if (actionType === 'defend') murimAudio.playQiChime();
    else murimAudio.playElementalBlast();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'duel_action', payload: { duelId: activeDuel.id, actionType, techName } }));
    }
  };

  const closeDuelSummary = () => setActiveDuel(null);

  const toggleAudio = () => {
    const isMuted = murimAudio.toggleMute();
    setIsAudioMuted(isMuted);
    return isMuted;
  };

  const dismantleTechnique = (scrollId: string) => {
    if (!cultivator) return { success: false, insight: 'Cultivador no disponible.' };
    const scroll = cultivator.libraryScrolls.find(s => s.id === scrollId);
    if (!scroll) return { success: false, insight: 'Rollo no encontrado.' };
    if ((cultivator.attributes?.inteligencia || 15) < 18 && (cultivator.attributes?.sabiduria || 15) < 20) return { success: false, insight: 'Requiere INT ≥ 18 o SAB ≥ 20.' };
    if (cultivator.qi < 50) return { success: false, insight: 'Qi insuficiente (requiere 50 Qi).' };
    murimAudio.playQiChime();
    const insights = [
      `[Bundle Theory] Estructura de «${scroll.title}» descifrada. Debilidad revelada.`,
      `[Bundle Theory] Matriz kármica analizada.`,
      `[Bundle Theory] Nodos de ignición expuestos.`,
    ];
    const insightText = insights[Math.floor(Math.random() * insights.length)];
    setCultivator(prev => prev ? {
      ...prev,
      qi: Math.max(0, prev.qi - 50),
      libraryScrolls: prev.libraryScrolls.map(s => s.id === scrollId ? { ...s, studyProgress: Math.min(100, s.studyProgress + 40), isMastered: (s.studyProgress + 40) >= 100 } : s),
    } : null);
    return { success: true, insight: insightText };
  };

  const claimSectStipend = () => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    const rankPrizes: any = {
      'Discípulo Externo': { stones: 80, merits: 30 },
      'Discípulo Interno': { stones: 200, merits: 80, pillName: 'Píldora Purificadora de Qi' },
      'Discípulo Élite': { stones: 450, merits: 180, pillName: 'Píldora de Concentración Espiritual' },
      'Anciano de Pabellón': { stones: 1000, merits: 400, pillName: 'Píldora del Corazón' },
      'Gran Maestro': { stones: 2500, merits: 1000, pillName: 'Píldora del Corazón' },
      'Líder Supremo / Patriarca': { stones: 5000, merits: 2500, pillName: 'Píldora del Corazón' },
    };
    const prize = rankPrizes[cultivator.sectRank] || rankPrizes['Discípulo Externo'];
    murimAudio.playCoinClink();
    setCultivator(prev => {
      if (!prev) return null;
      const newItems = [...prev.inventory];
      if (prize.pillName) {
        newItems.push({ id: `stipend_pill_${Date.now()}`, name: prize.pillName, category: 'pill', rarity: 'Alma', description: 'Píldora mensual.', cultivationBoost: 200, value: 120 });
      }
      return {
        ...prev,
        spiritStones: prev.spiritStones + prize.stones,
        sectMerits: prev.sectMerits + prize.merits,
        currency: { ...prev.currency, stonesLow: (prev.currency?.stonesLow || 0) + prize.stones },
        inventory: newItems,
      };
    });
    return { success: true, message: `Has recibido el estipendio mensual: +${prize.stones} Piedras, +${prize.merits} Méritos.` };
  };

  const requestPatriarchGuidance = () => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    murimAudio.playBreakthroughGong();
    setCultivator(prev => prev ? {
      ...prev,
      qi: prev.maxQi,
      dantianPurity: Math.min(100, prev.dantianPurity + 15),
      freeAttributePoints: (prev.freeAttributePoints || 0) + 2,
    } : null);
    return { success: true, message: `El Patriarca te ha bendecido. Qi restablecido, +15% Pureza, +2 Puntos.` };
  };

  const receiveMedicinalTreatment = (treatmentType: 'herb_bath' | 'acupuncture' | 'restore_soul') => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    murimAudio.playQiChime();
    if (treatmentType === 'herb_bath') {
      setCultivator(prev => prev ? { ...prev, hp: prev.maxHp + 30, maxHp: prev.maxHp + 30, baseDefense: prev.baseDefense + 5 } : null);
      return { success: true, message: '¡Baño de Templado completado! +30 Salud, +5 Defensa.' };
    } else if (treatmentType === 'acupuncture') {
      setCultivator(prev => prev ? { ...prev, qi: prev.maxQi, dantianPurity: Math.min(100, prev.dantianPurity + 10), spiritPower: prev.spiritPower + 8 } : null);
      return { success: true, message: 'Tratamiento de Agujas finalizado: Qi al 100%, +10% Pureza, +8 Espíritu.' };
    } else {
      setCultivator(prev => prev ? { ...prev, hp: prev.maxHp, qi: prev.maxQi, karma: prev.karma + 10 } : null);
      return { success: true, message: 'Recomposición del Alma concluida.' };
    }
  };

  const harvestSectGarden = () => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    const herbs = [
      { name: 'Hierba de Sangre de Dragón', desc: 'Planta escarlata.', rarity: 'Tierra' as const },
      { name: 'Loto de Nieve', desc: 'Flor medicinal.', rarity: 'Alma' as const },
      { name: 'Ginseng de Nueve Nudos', desc: 'Tubérculo celestial.', rarity: 'Celestial' as const },
    ];
    const picked = herbs[Math.floor(Math.random() * herbs.length)];
    const newItem: Item = {
      id: `herb_garden_${Date.now()}`,
      name: picked.name,
      category: 'material',
      rarity: picked.rarity,
      description: picked.desc,
      value: picked.rarity === 'Celestial' ? 180 : picked.rarity === 'Alma' ? 80 : 35,
    };
    murimAudio.playQiChime();
    setCultivator(prev => prev ? { ...prev, inventory: [...prev.inventory, newItem] } : null);
    return { success: true, message: `Has cosechado «${picked.name}».`, herb: newItem };
  };

  const buySectStoreItem = (item: Item, meritCost: number) => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    if (cultivator.sectMerits < meritCost) return { success: false, message: `Méritos insuficientes.` };
    murimAudio.playCoinClink();
    setCultivator(prev => prev ? {
      ...prev,
      sectMerits: prev.sectMerits - meritCost,
      inventory: [...prev.inventory, { ...item, id: `bought_${Date.now()}` }],
    } : null);
    return { success: true, message: `¡Has adquirido «${item.name}»!` };
  };

  const travelToNode = (nodeId: string) => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    const region = MAP_REGIONS.find(r => r.id === nodeId);
    if (!region) return { success: false, message: 'Región desconocida.' };
    murimAudio.playQiChime();
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentLocationNodeId: nodeId,
        stats: {
          ...prev.stats,
          nodesDiscovered: Math.min(MAP_REGIONS.length, (prev.stats?.nodesDiscovered || 1) + 1),
        },
      };
    });
    return { success: true, message: `Has viajado a «${region.name}».` };
  };

  const exploreNodeEvent = (nodeId: string) => {
    if (!cultivator) return { roll: 0, eventText: 'Error', rewardText: '' };
    const totalRoll = Math.floor(Math.random() * 100) + 1 + Math.floor((cultivator.attributes?.suerte || 10) / 2);
    let eventText = '', rewardText = '', loot: Item | undefined;
    if (totalRoll <= 20) { eventText = 'Sin eventos.'; rewardText = 'Nula.'; }
    else if (totalRoll <= 40) {
      eventText = 'Giro cotidiano.'; rewardText = '+40 Cobre.';
      loot = { id: `loot_${Date.now()}`, name: 'Píldora de Qi', category: 'pill', rarity: 'Mortal', description: 'Píldora básica.', cultivationBoost: 80, value: 30 };
    } else if (totalRoll <= 60) {
      eventText = 'Hallazgo menor.'; rewardText = '+65 Piedras.';
      loot = { id: `loot_${Date.now()}`, name: 'Hierro Frío', category: 'material', rarity: 'Tierra', description: 'Mineral.', value: 90 };
    } else if (totalRoll <= 80) {
      eventText = 'Oportunidad.'; rewardText = '+180 Piedras.';
      loot = { id: `loot_${Date.now()}`, name: 'Píldora de Médula', category: 'pill', rarity: 'Alma', description: 'Píldora rara.', cultivationBoost: 300, value: 250 };
    } else if (totalRoll <= 95) {
      eventText = 'Coyuntura.'; rewardText = '+350 Piedras.';
      loot = { id: `loot_${Date.now()}`, name: 'Brújula Bagua', category: 'artifact', rarity: 'Alma', description: 'Brújula.', statBonus: { spirit: 35 }, value: 400 };
    } else {
      eventText = '¡Intervención del Dao!'; rewardText = '+800 Piedras.';
      loot = { id: `loot_${Date.now()}`, name: 'Sello Celestial', category: 'artifact', rarity: 'Celestial', description: 'Reliquia.', statBonus: { spirit: 80 }, value: 1200 };
    }
    murimAudio.playBreakthroughGong();
    setCultivator(prev => prev ? {
      ...prev,
      spiritStones: prev.spiritStones + (totalRoll > 95 ? 800 : totalRoll > 80 ? 350 : totalRoll > 60 ? 180 : totalRoll > 40 ? 65 : 20),
      sectMerits: prev.sectMerits + (totalRoll > 95 ? 50 : 15),
      inventory: loot ? [...prev.inventory, loot] : prev.inventory,
    } : null);
    return { roll: totalRoll, eventText, rewardText, loot };
  };

  const huntBeastEncounter = (beastId: string) => {
    if (!cultivator) return { victory: false, log: 'Cultivador no disponible.' };
    const beast = WORLD_BEASTS.find(b => b.id === beastId) || WORLD_BEASTS[0];
    if (!beast) return { victory: false, log: 'Bestia no encontrada.' };

    const victory = ((cultivator.baseAttack || 30) + (cultivator.spiritPower || 20)) >= ((beast.attack * 1.2) + (beast.hp * 0.1)) * 0.65 || Math.random() > 0.45;
    if (victory) {
      murimAudio.playSwordClash();
      const drop: Item = {
        id: `drop_${Date.now()}`,
        name: beast.keyMaterial,
        category: 'material',
        rarity: 'Alma',
        description: `Material extraído de ${beast.name}.`,
        value: beast.level * 50,
      };
      setCultivator(prev => prev ? {
        ...prev,
        spiritStones: prev.spiritStones + (beast.level * 10),
        sectMerits: prev.sectMerits + Math.floor(beast.level * 2),
        inventory: [...prev.inventory, drop],
        stats: { ...prev.stats, bossDamageDealt: (prev.stats?.bossDamageDealt || 0) + beast.hp },
      } : null);
      return { victory: true, log: `¡Victoria frente a «${beast.name}»! Recompensas: +${beast.level * 10} Piedras, material [${drop.name}].`, dropItem: drop };
    } else {
      murimAudio.playElementalBlast();
      setCultivator(prev => prev ? { ...prev, hp: Math.max(20, Math.floor(prev.hp * 0.6)) } : null);
      return { victory: false, log: `«${beast.name}» te infligió heridas severas. Perdiste el 40% de tu salud.` };
    }
  };

  return (
    <GameContext.Provider
      value={{
        cultivator,
        onlinePlayers,
        auctionListings,
        worldBoss,
        sects,
        chatMessages,
        activeDuel,
        pendingDuelInvite,
        missions,
        isConnected,
        token,
        playerId,
        authError,
        authLoading,
        login,
        register,
        logout,
        createCharacter: () => {},
        createSyntacticCharacter,
        loadSavedCharacter,
        collectDungeonLoot,
        resetCharacter,
        buyItem,
        sellItem,
        meditate,
        unlockMeridian,
        attemptBreakthrough,
        craftPill,
        consumePill,
        equipGear,
        craftSecretTechnique,
        acceptMission,
        claimMission,
        recruitDisciple,
        assignDiscipleTask,
        claimDiscipleTribute,
        joinSect,
        contributeSect,
        placeBid,
        buyoutAuction,
        createAuctionListing,
        claimMilestone,
        attackWorldBoss,
        sendChatMessage,
        challengePlayer,
        acceptDuel,
        declineDuel,
        performDuelAction,
        closeDuelSummary,
        toggleAudio,
        isAudioMuted,
        allocateAttributePoint,
        studyLibraryScroll,
        dismantleTechnique,
        claimSectStipend,
        requestPatriarchGuidance,
        receiveMedicinalTreatment,
        harvestSectGarden,
        buySectStoreItem,
        travelToNode,
        exploreNodeEvent,
        huntBeastEncounter,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};