import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Cultivator,
  CharacterClass,
  AuctionListing,
  WorldBossState,
  SectInfo,
  Item,
  LiveDuelState,
  MartialTechnique,
  CustomSecretTechnique,
  SectMission,
  Disciple,
  SectRank,
} from '../types/game';
import {
  CHARACTER_CLASSES,
  INITIAL_MERIDIANS,
  SECTS_LIST,
  INITIAL_TECHNIQUES,
  INITIAL_SECT_MISSIONS,
  INITIAL_WORLD_BOSS,
  MERIT_MILESTONES,
  LIBRARY_SCROLLS,
  BESTIAS_COMPENDIO,
  SECT_STORE_ITEMS,
  WORLD_MAP_NODES,
} from '../data/gameData';
import { murimAudio } from '../utils/audio';

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
  createCharacter: (name: string, classType: CharacterClass, sectId: string) => void;
  loadSavedCharacter: (character: Cultivator) => void;
  resetCharacter: () => void;
  meditate: () => void;
  unlockMeridian: (meridianId: string) => boolean;
  attemptBreakthrough: () => { success: boolean; message: string };
  craftPill: (recipeId: string, currentTemp: number) => { success: boolean; message: string };
  consumePill: (itemId: string) => void;
  equipGear: (item: Item) => void;
  craftSecretTechnique: (technique: CustomSecretTechnique) => void;
  acceptMission: (missionId: string) => void;
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
  // Learning, Attributes & Progression
  allocateAttributePoint: (attribute: keyof Cultivator['attributes']) => void;
  studyLibraryScroll: (scrollId: string) => { success: boolean; message: string };
  dismantleTechnique: (scrollId: string) => { success: boolean; insight: string };
  // Sect Pavilions
  claimSectStipend: () => { success: boolean; message: string };
  requestPatriarchGuidance: () => { success: boolean; message: string };
  receiveMedicinalTreatment: (treatmentType: 'herb_bath' | 'acupuncture' | 'restore_soul') => { success: boolean; message: string };
  harvestSectGarden: () => { success: boolean; message: string; herb?: Item };
  buySectStoreItem: (item: Item, meritCost: number) => { success: boolean; message: string };
  // World Map & Jianghu Expeditions
  travelToNode: (nodeId: string) => { success: boolean; message: string };
  exploreNodeEvent: (nodeId: string) => { roll: number; eventText: string; rewardText: string; loot?: Item };
  huntBeastEncounter: (beastId: string) => { victory: boolean; log: string; dropItem?: Item };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'murim_cultivator_profile_v1';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cultivator, setCultivator] = useState<Cultivator | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.attributes) {
          parsed.attributes = {
            fuerza: 18,
            destreza: 18,
            constitucion: 16,
            inteligencia: 18,
            percepcion: 16,
            astucia: 14,
            voluntad: 16,
            suerte: 12,
            carisma: 14,
            sabiduria: 16,
          };
        }
        if (parsed.karma === undefined) parsed.karma = 50;
        if (parsed.fama === undefined) parsed.fama = 50;
        if (parsed.freeAttributePoints === undefined) parsed.freeAttributePoints = 10;
        if (parsed.freeSkillPoints === undefined) parsed.freeSkillPoints = 5;
        if (!parsed.dantianScale) parsed.dantianScale = 'Gota';
        if (!parsed.spiritSense) parsed.spiritSense = 40;
        if (!parsed.currency) {
          parsed.currency = {
            gold: 15,
            silver: 400,
            copper: 2500,
            stonesLow: parsed.spiritStones || 250,
            stonesMid: 12,
            stonesHigh: 0,
            stonesSupreme: 0,
          };
        }
        if (!parsed.currentLocationNodeId) parsed.currentLocationNodeId = 'node_kunlun_sect';
        if (!parsed.libraryScrolls || parsed.libraryScrolls.length === 0) {
          parsed.libraryScrolls = JSON.parse(JSON.stringify(LIBRARY_SCROLLS));
        }
        if (!parsed.inventoryMaxSlots) parsed.inventoryMaxSlots = 30;
        if (!parsed.stats) parsed.stats = { duelsWon: 0, duelsLost: 0, bossDamageDealt: 0, pillsCrafted: 0, meridiansOpened: 0, auctionsWon: 0, disciplesRecruited: 1, scrollsMastered: 0, nodesDiscovered: 3 };
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
  const [pendingDuelInvite, setPendingDuelInvite] = useState<{
    challengerId: string;
    challengerName: string;
    challengerRealm: string;
  } | null>(null);
  const [missions, setMissions] = useState<SectMission[]>(INITIAL_SECT_MISSIONS);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Save cultivator to localStorage whenever it changes
  useEffect(() => {
    if (cultivator) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cultivator));
    }
  }, [cultivator]);

  // WebSocket connection & handler
  useEffect(() => {
    let ws: WebSocket;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    function connect() {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (cultivator) {
          const currentSect = sects.find(s => s.id === cultivator.sectId);
          ws.send(
            JSON.stringify({
              type: 'player_auth',
              payload: {
                id: cultivator.id,
                name: cultivator.name,
                realm: cultivator.realm,
                sectId: cultivator.sectId,
                sectName: currentSect?.name || 'Vagabundo del Jianghu',
                classType: cultivator.classType,
              },
            })
          );
        }
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
              setCultivator(prev => {
                if (!prev) return null;
                const isMerit = payload.currencyType === 'merits';
                return {
                  ...prev,
                  spiritStones: isMerit ? prev.spiritStones : Math.max(0, prev.spiritStones - payload.price),
                  sectMerits: isMerit ? Math.max(0, prev.sectMerits - payload.price) : prev.sectMerits,
                  inventory: [payload.item, ...prev.inventory],
                  stats: {
                    ...prev.stats,
                    auctionsWon: (prev.stats?.auctionsWon || 0) + 1,
                  },
                };
              });
              break;
            case 'chat_broadcast':
              setChatMessages(prev => [...prev.slice(-40), payload]);
              break;

            case 'player_sync':
              // El servidor tiene la verdad absoluta. Sobrescribimos el estado.
              setCultivator(payload);
              // (Opcional) Guardar en localStorage solo como caché de visualización
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
              break;
            case 'action_result':
              // Aquí podrías disparar un Toast visual
              console.log('Servidor dice:', payload.message);
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
              if (payload.status === 'finished') {
                setCultivator(prev => {
                  if (!prev) return null;
                  if (payload.winnerId === prev.id) {
                    return {
                      ...prev,
                      sectMerits: prev.sectMerits + 80,
                      stats: {
                        ...prev.stats,
                        duelsWon: prev.stats.duelsWon + 1,
                      },
                    };
                  } else {
                    return {
                      ...prev,
                      stats: {
                        ...prev.stats,
                        duelsLost: prev.stats.duelsLost + 1,
                      },
                    };
                  }
                });
              }
              break;
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, [cultivator?.id]);

  // Periodic passive disciple progression and Qi recovery
  useEffect(() => {
    const interval = setInterval(() => {
      setCultivator(prev => {
        if (!prev) return null;

        // Passive Qi regeneration based on pure Dantian
        const regenRate = Math.max(1, Math.floor(prev.dantianPurity / 20));
        const newQi = Math.min(prev.maxQi, prev.qi + regenRate);

        // Advance disciple task progress
        const updatedDisciples = prev.disciples.map(d => {
          if (d.assignedTask !== 'none' && d.taskProgress < 100) {
            return { ...d, taskProgress: Math.min(100, d.taskProgress + 10) };
          }
          return d;
        });

        return {
          ...prev,
          qi: newQi,
          disciples: updatedDisciples,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const createCharacter = (name: string, classType: CharacterClass, sectId: string) => {
    const classData = CHARACTER_CLASSES[classType];
    const startingSect = SECTS_LIST.find(s => s.id === sectId) || SECTS_LIST[0];

    const starterItems: Item[] = [
      {
        id: 'starter_weapon',
        name: classType === 'warrior' ? 'Sable de Acero Frío' : classType === 'rogue' ? 'Daga del Viento Sombrío' : classType === 'scholar' ? 'Pincel de Caligrafía Mística' : classType === 'archer' ? 'Arco de Pluma del Cuervo' : 'Lanza de Cobre Antiguo',
        category: 'weapon',
        rarity: 'Común',
        description: 'Arma inicial forjada para nuevos discípulos del Dao.',
        statBonus: { attack: 15 },
        value: 30,
      },
      {
        id: 'starter_pill_1',
        name: 'Píldora Purificadora de Qi',
        category: 'pill',
        rarity: 'Común',
        description: 'Restaura 120 de Qi y purifica el Dantian.',
        cultivationBoost: 120,
        value: 50,
      },
      {
        id: 'herb_starter_1',
        name: 'Hierba de Sangre de Dragón',
        category: 'material',
        rarity: 'Común',
        description: 'Hierba medicinal que crece cerca de las venas de Qi.',
        value: 20,
      },
      {
        id: 'herb_starter_2',
        name: 'Agua de Manantial Espiritual',
        category: 'material',
        rarity: 'Común',
        description: 'Agua pura cargada con esencia mineral de la montaña.',
        value: 20,
      },
    ];

    const initialCultivator: Cultivator = {
      id: `cultivator_${Date.now()}`,
      name: name.trim() || 'Cultivador Sin Nombre',
      classType,
      title: 'Discípulo Novicio',
      realm: 'Condensación de Qi',
      subRealm: 1,
      dantianScale: 'Gota',
      qi: 80,
      maxQi: 200,
      hp: classData.bonusStats.hp,
      maxHp: classData.bonusStats.hp,
      baseAttack: classData.bonusStats.attack,
      baseDefense: classData.bonusStats.defense,
      spiritPower: classData.bonusStats.spirit,
      speed: classData.bonusStats.speed,
      spiritSense: 35,
      karma: 50,
      fama: 50,
      freeAttributePoints: 10,
      freeSkillPoints: 5,
      attributes: {
        fuerza: classType === 'warrior' ? 24 : 16,
        destreza: classType === 'rogue' || classType === 'archer' ? 24 : 16,
        constitucion: classType === 'warrior' || classType === 'lancer' ? 22 : 16,
        inteligencia: classType === 'scholar' ? 24 : 16,
        percepcion: 18,
        astucia: classType === 'rogue' ? 20 : 14,
        voluntad: 18,
        suerte: 15,
        carisma: 14,
        sabiduria: classType === 'scholar' ? 22 : 15,
      },
      currency: {
        gold: 15,
        silver: 400,
        copper: 2500,
        stonesLow: 250,
        stonesMid: 12,
        stonesHigh: 0,
        stonesSupreme: 0,
      },
      spiritStones: 250,
      sectMerits: 50,
      sectId: startingSect.id,
      sectRank: 'Discípulo Externo',
      dantianPurity: 35,
      meridians: JSON.parse(JSON.stringify(INITIAL_MERIDIANS)),
      inventoryMaxSlots: 30,
      inventory: starterItems,
      equippedGear: {
        weapon: starterItems[0],
      },
      knownTechniques: INITIAL_TECHNIQUES.slice(0, 3),
      libraryScrolls: JSON.parse(JSON.stringify(LIBRARY_SCROLLS)),
      currentLocationNodeId: startingSect.id === 'sect_tianjian' ? 'node_huashan_peak' : startingSect.id === 'sect_xuelian' ? 'node_kunlun_sect' : startingSect.id === 'sect_chilong' ? 'node_tang_domain' : 'node_shennongjia_swamp',
      disciples: [
        {
          id: 'disciple_1',
          name: 'Xiao Feng',
          realm: 'Condensación de Qi',
          aptitude: 'Notable',
          loyalty: 85,
          assignedTask: 'herb_gathering',
          taskProgress: 40,
          taskDurationSeconds: 60,
          tributeYield: { spiritStones: 45, merits: 15, materials: 'Hierba de Sangre de Dragón' },
        },
      ],
      completedQuests: [],
      claimedAchievements: [],
      stats: {
        duelsWon: 0,
        duelsLost: 0,
        bossDamageDealt: 0,
        pillsCrafted: 0,
        meridiansOpened: 0,
        auctionsWon: 0,
        disciplesRecruited: 1,
        scrollsMastered: 0,
        nodesDiscovered: 3,
      },
    };

    setCultivator(initialCultivator);
    murimAudio.playBreakthroughGong();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'player_auth',
          payload: {
            id: initialCultivator.id,
            name: initialCultivator.name,
            realm: initialCultivator.realm,
            sectId: initialCultivator.sectId,
            sectName: startingSect.name,
            classType: initialCultivator.classType,
          },
        })
      );
    }
  };

  const loadSavedCharacter = (savedCultivator: Cultivator) => {
    setCultivator(savedCultivator);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedCultivator));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const currentSect = sects.find(s => s.id === savedCultivator.sectId);
      wsRef.current.send(
        JSON.stringify({
          type: 'player_auth',
          payload: {
            id: savedCultivator.id,
            name: savedCultivator.name,
            realm: savedCultivator.realm,
            sectId: savedCultivator.sectId,
            sectName: currentSect?.name || 'Vagabundo del Jianghu',
            classType: savedCultivator.classType,
            fullPlayerData: savedCultivator,
          },
        })
      );
    }
  };

  const resetCharacter = () => {
    setCultivator(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const meditate = () => {
    if (!cultivator) return;
    murimAudio.playQiChime();

    setCultivator(prev => {
      if (!prev) return null;
      const qiGain = 25;
      const purityGain = prev.dantianPurity < 100 ? 1 : 0;
      return {
        ...prev,
        qi: Math.min(prev.maxQi, prev.qi + qiGain),
        dantianPurity: Math.min(100, prev.dantianPurity + purityGain),
      };
    });
  };

  const unlockMeridian = (meridianId: string) => {
    if (!cultivator) return false;
    const target = cultivator.meridians.find(m => m.id === meridianId);
    if (!target || target.unlocked) return false;

    if (cultivator.qi < target.qiCost) {
      return false;
    }

    murimAudio.playBreakthroughGong();

    setCultivator(prev => {
      if (!prev) return null;
      const updatedMeridians = prev.meridians.map(m => {
        if (m.id === meridianId) {
          return { ...m, unlocked: true };
        }
        return m;
      });

      let extraHp = 0;
      let extraAtk = 0;
      let extraDef = 0;
      let extraSpirit = 0;
      let extraSpeed = 0;

      if (target.bonusType === 'hp') extraHp = target.bonusValue;
      if (target.bonusType === 'attack') extraAtk = target.bonusValue;
      if (target.bonusType === 'defense') extraDef = target.bonusValue;
      if (target.bonusType === 'spirit') extraSpirit = target.bonusValue;
      if (target.bonusType === 'speed') extraSpeed = target.bonusValue;

      return {
        ...prev,
        qi: prev.qi - target.qiCost,
        hp: prev.hp + extraHp,
        maxHp: prev.maxHp + extraHp,
        baseAttack: prev.baseAttack + extraAtk,
        baseDefense: prev.baseDefense + extraDef,
        spiritPower: prev.spiritPower + extraSpirit,
        speed: prev.speed + extraSpeed,
        meridians: updatedMeridians,
        stats: {
          ...prev.stats,
          meridiansOpened: prev.stats.meridiansOpened + 1,
        },
      };
    });

    return true;
  };

  const attemptBreakthrough = () => {
    if (!cultivator) return { success: false, message: 'Cultivador no encontrado' };

    if (cultivator.qi < cultivator.maxQi * 0.9) {
      return {
        success: false,
        message: 'Tu Dantian aún no está lo suficientemente repleto de Qi puro para forzar el avance.',
      };
    }

    // Success probability depends on dantian purity
    const roll = Math.random() * 100;
    const successThreshold = cultivator.dantianPurity;

    if (roll <= successThreshold) {
      murimAudio.playBreakthroughGong();

      setCultivator(prev => {
        if (!prev) return null;
        let newSubRealm = prev.subRealm + 1;
        let newRealm = prev.realm;

        if (newSubRealm > 9) {
          newSubRealm = 1;
          if (prev.realm === 'Condensación de Qi') newRealm = 'Fundación Espiritual';
          else if (prev.realm === 'Fundación Espiritual') newRealm = 'Núcleo Dorado';
          else if (prev.realm === 'Núcleo Dorado') newRealm = 'Alma Naciente';
          else if (prev.realm === 'Alma Naciente') newRealm = 'Ascensión Inmortal';
        }

        return {
          ...prev,
          realm: newRealm,
          subRealm: newSubRealm,
          maxQi: prev.maxQi + 100,
          qi: prev.maxQi + 100,
          maxHp: prev.maxHp + 80,
          hp: prev.maxHp + 80,
          baseAttack: prev.baseAttack + 14,
          baseDefense: prev.baseDefense + 10,
          spiritPower: prev.spiritPower + 12,
        };
      });

      return {
        success: true,
        message: `¡Tribulación superada con éxito! Tu núcleo espiritual resuena con los Cielos.`,
      };
    } else {
      murimAudio.playElementalBlast('Fuego');
      setCultivator(prev => {
        if (!prev) return null;
        return {
          ...prev,
          qi: Math.floor(prev.qi * 0.4),
          hp: Math.max(10, Math.floor(prev.hp * 0.7)),
        };
      });
      return {
        success: false,
        message: '¡Reacción violenta de Qi en los meridianos! Has sufrido daño interno, pero tu voluntad persevera.',
      };
    }
  };

  const craftPill = (recipeId: string, currentTemp: number) => {
    if (!cultivator) return { success: false, message: 'Cultivador no encontrado' };

    murimAudio.playAlchemyStir();

    const tempDelta = Math.abs(currentTemp - 50);
    const successRate = Math.max(20, 100 - tempDelta * 1.5);
    const roll = Math.random() * 100;

    if (roll <= successRate) {
      const craftedPill: Item = {
        id: `pill_crafted_${Date.now()}`,
        name: recipeId === 'recipe_breakthrough' ? 'Píldora Rompe-Cielos' : 'Píldora Purificadora de Qi Refinada',
        category: 'pill',
        rarity: recipeId === 'recipe_breakthrough' ? 'Raro' : 'Común',
        description: 'Elaborada artesanalmente en el Gran Caldero de Ocho Trigramas con fuego espiritual balanceado.',
        cultivationBoost: 250,
        value: 120,
      };

      setCultivator(prev => {
        if (!prev) return null;
        return {
          ...prev,
          inventory: [craftedPill, ...prev.inventory],
          spiritStones: prev.spiritStones + 20,
          stats: {
            ...prev.stats,
            pillsCrafted: prev.stats.pillsCrafted + 1,
          },
        };
      });

      return { success: true, message: `¡Fuego de caldero perfecto! Has obtenido [${craftedPill.name}].` };
    } else {
      return { success: false, message: 'La llama espiritual fluctuó demasiado. Los ingredientes se redujeron a cenizas medicinales.' };
    }
  };

  const consumePill = (itemId: string) => {
    if (!cultivator) return;
    const pill = cultivator.inventory.find(i => i.id === itemId);
    if (!pill || pill.category !== 'pill') return;

    murimAudio.playQiChime();

    setCultivator(prev => {
      if (!prev) return null;
      const boost = pill.cultivationBoost || 100;
      const filteredInv = prev.inventory.filter(i => i.id !== itemId);
      return {
        ...prev,
        qi: Math.min(prev.maxQi, prev.qi + boost),
        hp: Math.min(prev.maxHp, prev.hp + Math.floor(boost * 0.5)),
        dantianPurity: Math.min(100, prev.dantianPurity + 5),
        inventory: filteredInv,
      };
    });
  };

  const equipGear = (item: Item) => {
    if (!cultivator) return;
    setCultivator(prev => {
      if (!prev) return null;
      const updatedGear = { ...prev.equippedGear };
      if (item.category === 'weapon') updatedGear.weapon = item;
      if (item.category === 'armor') updatedGear.armor = item;
      if (item.category === 'artifact') updatedGear.artifact = item;
      return { ...prev, equippedGear: updatedGear };
    });
  };

  const craftSecretTechnique = (tech: CustomSecretTechnique) => {
    if (!cultivator) return;
    murimAudio.playBreakthroughGong();
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        secretTechnique: tech,
      };
    });
  };

  const acceptMission = (missionId: string) => {
    setMissions(prev =>
      prev.map(m => (m.id === missionId ? { ...m, currentCount: m.currentCount + 1, completed: m.currentCount + 1 >= m.targetCount } : m))
    );
  };

  const claimMission = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    murimAudio.playQiChime();

    setMissions(prev =>
      prev.map(m => (m.id === missionId ? { ...m, claimed: true } : m))
    );

    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        spiritStones: prev.spiritStones + mission.rewardStones,
        sectMerits: prev.sectMerits + mission.rewardMerits,
        qi: Math.min(prev.maxQi, prev.qi + mission.rewardExp),
      };
    });
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
      tributeYield: {
        spiritStones: 50,
        merits: 20,
        materials: 'Hierba de Sangre de Dragón',
      },
    };

    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        spiritStones: prev.spiritStones - 100,
        disciples: [...prev.disciples, newDisciple],
        stats: {
          ...prev.stats,
          disciplesRecruited: (prev.stats?.disciplesRecruited || 0) + 1,
        },
      };
    });
  };

  const assignDiscipleTask = (discipleId: string, task: Disciple['assignedTask']) => {
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        disciples: prev.disciples.map(d =>
          d.id === discipleId ? { ...d, assignedTask: task, taskProgress: 0 } : d
        ),
      };
    });
  };

  const claimDiscipleTribute = (discipleId: string) => {
    if (!cultivator) return;
    const disciple = cultivator.disciples.find(d => d.id === discipleId);
    if (!disciple || disciple.taskProgress < 100) return;

    murimAudio.playQiChime();

    setCultivator(prev => {
      if (!prev) return null;
      const stones = disciple.tributeYield.spiritStones;
      const merits = disciple.tributeYield.merits;
      return {
        ...prev,
        spiritStones: prev.spiritStones + stones,
        sectMerits: prev.sectMerits + merits,
        disciples: prev.disciples.map(d =>
          d.id === discipleId ? { ...d, taskProgress: 0 } : d
        ),
      };
    });
  };

  const joinSect = (sectId: string) => {
    if (!cultivator) return;
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sectId,
        sectRank: 'Discípulo Externo',
        sectMerits: 0,
      };
    });
  };

  const contributeSect = (amount: number) => {
    if (!cultivator || cultivator.spiritStones < amount) return;
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        spiritStones: prev.spiritStones - amount,
        sectMerits: prev.sectMerits + Math.floor(amount * 0.8),
      };
    });
  };

  const placeBid = (auctionId: string, amount: number) => {
    if (!cultivator) return;
    const auction = auctionListings.find(a => a.id === auctionId);
    if (!auction) return;
    const isMerit = auction.currencyType === 'merits';
    if (isMerit && cultivator.sectMerits < amount) return;
    if (!isMerit && cultivator.spiritStones < amount) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'auction_bid',
          payload: { auctionId, amount },
        })
      );
    }
  };

  const buyoutAuction = (auctionId: string) => {
    if (!cultivator) return;
    const auction = auctionListings.find(a => a.id === auctionId);
    if (!auction) return;

    const isMerit = auction.currencyType === 'merits';
    if (isMerit) {
      if (cultivator.sectMerits < auction.buyoutPrice) return;
    } else {
      if (cultivator.spiritStones < auction.buyoutPrice) return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'auction_buyout',
          payload: { auctionId },
        })
      );
    }
  };

  const createAuctionListing = (
    item: Item,
    startBid: number,
    buyout: number,
    currencyType: 'stones' | 'merits' = 'stones'
  ) => {
    if (!cultivator) return;
    // Remove item from inventory
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inventory: prev.inventory.filter(i => i.id !== item.id),
      };
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'auction_create_listing',
          payload: { item, startingBid: startBid, buyoutPrice: buyout, currencyType },
        })
      );
    }
  };

  const claimMilestone = (milestoneId: string) => {
    const milestone = MERIT_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone || !cultivator) return;
    const alreadyClaimed = cultivator.claimedAchievements?.includes(milestoneId);
    if (alreadyClaimed) return;

    murimAudio.playBreakthroughGong();

    setCultivator(prev => {
      if (!prev) return null;
      const currentClaimed = prev.claimedAchievements || [];
      return {
        ...prev,
        sectMerits: prev.sectMerits + milestone.meritReward,
        spiritStones: prev.spiritStones + milestone.stoneReward,
        claimedAchievements: [...currentClaimed, milestoneId],
      };
    });
  };

  const attackWorldBoss = () => {
    if (!cultivator) return;
    murimAudio.playElementalBlast(cultivator.classType === 'warrior' ? 'Fuego' : 'Rayo');

    const totalDamage = Math.floor(
      cultivator.baseAttack * 2.5 + cultivator.spiritPower * 1.8 + Math.random() * 50
    );

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'world_boss_attack',
          payload: { damage: totalDamage },
        })
      );
    }

    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          bossDamageDealt: prev.stats.bossDamageDealt + totalDamage,
        },
      };
    });
  };

  const sendChatMessage = (text: string, channel: 'global' | 'sect' = 'global') => {
    if (!text.trim() || !cultivator) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          payload: { text, channel },
        })
      );
    }
  };

  const challengePlayer = (playerId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'duel_invite',
          payload: { targetPlayerId: playerId },
        })
      );
    }
  };

  const acceptDuel = () => {
    if (!pendingDuelInvite || !cultivator) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'duel_accept',
          payload: {
            challengerId: pendingDuelInvite.challengerId,
            accepterHp: cultivator.hp,
          },
        })
      );
    }
  };

  const declineDuel = () => {
    setPendingDuelInvite(null);
  };

  const performDuelAction = (
    actionType: 'basic' | 'technique' | 'secret' | 'defend',
    techName?: string
  ) => {
    if (!activeDuel || !cultivator) return;

    if (actionType === 'basic') murimAudio.playSwordClash();
    else if (actionType === 'defend') murimAudio.playQiChime();
    else murimAudio.playElementalBlast();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'duel_action',
          payload: {
            duelId: activeDuel.id,
            actionType,
            techName,
          },
        })
      );
    }
  };

  const closeDuelSummary = () => {
    setActiveDuel(null);
  };

  const toggleAudio = () => {
    const isMuted = murimAudio.toggleMute();
    setIsAudioMuted(isMuted);
    return isMuted;
  };

  // Learning, Attributes & Progression
  const allocateAttributePoint = (attrKey: keyof Cultivator['attributes']) => {
    if (!cultivator || cultivator.freeAttributePoints <= 0) return;
    murimAudio.playQiChime();
    setCultivator(prev => {
      if (!prev) return null;
      const currentAttrs = prev.attributes || {
        fuerza: 16, destreza: 16, constitucion: 16, inteligencia: 16,
        percepcion: 16, astucia: 14, voluntad: 16, suerte: 12, carisma: 14, sabiduria: 16
      };
      const newAttrs = { ...currentAttrs, [attrKey]: (currentAttrs[attrKey] || 10) + 1 };
      const levelMultiplier = prev.subRealm || 1;
      const newMaxHp = 50 + (newAttrs.constitucion * 12) + (levelMultiplier * 20);
      const newBaseAttack = Math.floor((newAttrs.fuerza * 2) + (newAttrs.destreza * 1.5));
      const newBaseDefense = Math.floor((newAttrs.constitucion * 2) + (newAttrs.voluntad * 0.5));
      const newSpiritSense = Math.floor((newAttrs.percepcion * 2) + (newAttrs.sabiduria * 1.5) + (newAttrs.voluntad * 0.5) + (levelMultiplier * 10));

      return {
        ...prev,
        freeAttributePoints: prev.freeAttributePoints - 1,
        attributes: newAttrs,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp + 12, newMaxHp),
        baseAttack: newBaseAttack,
        baseDefense: newBaseDefense,
        spiritSense: newSpiritSense,
      };
    });
  };

  const studyLibraryScroll = (scrollId: string): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no encontrado.' };
    
    // Validaciones básicas para la UI
    const scroll = cultivator.libraryScrolls.find(s => s.id === scrollId);
    if (!scroll || scroll.isMastered) return { success: false, message: 'Rollo no válido.' };

    // Enviamos al servidor y esperamos su respuesta (que llegará por WS)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'player_action',
          payload: { action: 'study_scroll', scrollId }
        })
      );
      return { success: true, message: 'Iniciando estudio...' };
    }
    
    return { success: false, message: 'Desconectado del servidor.' };
  };

  const dismantleTechnique = (scrollId: string): { success: boolean; insight: string } => {
    if (!cultivator) return { success: false, insight: 'Cultivador no disponible.' };
    const scroll = cultivator.libraryScrolls.find(s => s.id === scrollId);
    if (!scroll) return { success: false, insight: 'Rollo no encontrado.' };

    const playerInt = cultivator.attributes?.inteligencia || 15;
    const playerWis = cultivator.attributes?.sabiduria || 15;
    if (playerInt < 18 && playerWis < 20) {
      return { success: false, insight: 'Requiere Inteligencia ≥ 18 o Sabiduría ≥ 20 para aplicar la Teoría de Conjunto (Bundle Theory).' };
    }

    if (cultivator.qi < 50) {
      return { success: false, insight: 'Qi insuficiente (requiere 50 Qi para la deducción analítica).' };
    }

    murimAudio.playQiChime();
    const insights = [
      `[Bundle Theory] Estructura elemental de «${scroll.title}» descifrada: componente crítico de flujo en canal Du Mai. Debilidad revelada: Vulnerable a técnicas de Tierra/Agua. Bonificación de +40% de asimilación aplicada.`,
      `[Bundle Theory] Matriz kármica analizada: el golpe proyecta un vector de fuerza lineal predecible. Creación de contra-técnica habilitada (+15% de evasión frente a este estilo).`,
      `[Bundle Theory] Nodos de ignición de Qi expuestos: se identificó la pausa de recarga tras la ejecución. ¡Comprender esta falla acelera tu maestría!`,
    ];
    const insightText = insights[Math.floor(Math.random() * insights.length)];

    setCultivator(prev => {
      if (!prev) return null;
      const updatedScrolls = prev.libraryScrolls.map(s => {
        if (s.id === scrollId) {
          const newProg = Math.min(100, s.studyProgress + 40);
          return { ...s, studyProgress: newProg, isMastered: newProg >= 100 };
        }
        return s;
      });
      return {
        ...prev,
        qi: Math.max(0, prev.qi - 50),
        libraryScrolls: updatedScrolls,
      };
    });

    return { success: true, insight: insightText };
  };

  // Sect Pavilions
  const claimSectStipend = (): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };

    const rankPrizes: Record<SectRank, { stones: number; merits: number; pillName?: string }> = {
      'Discípulo Externo': { stones: 80, merits: 30 },
      'Discípulo Interno': { stones: 200, merits: 80, pillName: 'Píldora Purificadora de Qi' },
      'Discípulo Élite': { stones: 450, merits: 180, pillName: 'Píldora de Concentración Espiritual' },
      'Anciano de Pabellón': { stones: 1000, merits: 400, pillName: 'Píldora del Corazón de Dragón Dorado' },
      'Gran Maestro': { stones: 2500, merits: 1000, pillName: 'Píldora del Corazón de Dragón Dorado' },
      'Líder Supremo / Patriarca': { stones: 5000, merits: 2500, pillName: 'Píldora del Corazón de Dragón Dorado' },
    };

    const prize = rankPrizes[cultivator.sectRank] || rankPrizes['Discípulo Externo'];
    murimAudio.playCoinClink();

    setCultivator(prev => {
      if (!prev) return null;
      const newItems = [...prev.inventory];
      if (prize.pillName) {
        newItems.push({
          id: `stipend_pill_${Date.now()}`,
          name: prize.pillName,
          category: 'pill',
          rarity: 'Alma',
          description: 'Píldora asignada mensualmente por la tesorería de la secta.',
          cultivationBoost: 200,
          value: 120,
        });
      }
      return {
        ...prev,
        spiritStones: prev.spiritStones + prize.stones,
        sectMerits: prev.sectMerits + prize.merits,
        currency: {
          ...prev.currency,
          stonesLow: (prev.currency?.stonesLow || 0) + prize.stones,
        },
        inventory: newItems,
      };
    });

    return {
      success: true,
      message: `Has recibido el estipendio mensual de la Secta (${cultivator.sectRank}): +${prize.stones} Piedras de Espíritu, +${prize.merits} Puntos de Mérito${prize.pillName ? ` y 1x ${prize.pillName}` : ''}.`,
    };
  };

  const requestPatriarchGuidance = (): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    murimAudio.playBreakthroughGong();

    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        qi: prev.maxQi,
        dantianPurity: Math.min(100, prev.dantianPurity + 15),
        freeAttributePoints: (prev.freeAttributePoints || 0) + 2,
      };
    });

    return {
      success: true,
      message: `El Patriarca de la Secta te ha transmitido un destello del Dao Primordial: Tu Qi se ha restablecido por completo, la pureza del Dantian aumentó +15% y has obtenido 2 Puntos de Atributo Libres.`,
    };
  };

  const receiveMedicinalTreatment = (treatmentType: 'herb_bath' | 'acupuncture' | 'restore_soul'): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    murimAudio.playQiChime();

    if (treatmentType === 'herb_bath') {
      setCultivator(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hp: prev.maxHp + 30,
          maxHp: prev.maxHp + 30,
          baseDefense: prev.baseDefense + 5,
        };
      });
      return { success: true, message: '¡Baño de Templado con Esencia de Hierbas completado! Tu cuerpo físico se ha fortalecido: +30 Salud Máxima, +5 Defensa Física y vitalidad al 100%.' };
    } else if (treatmentType === 'acupuncture') {
      setCultivator(prev => {
        if (!prev) return null;
        return {
          ...prev,
          qi: prev.maxQi,
          dantianPurity: Math.min(100, prev.dantianPurity + 10),
          spiritPower: prev.spiritPower + 8,
        };
      });
      return { success: true, message: 'Tratamiento de Agujas de Plata finalizado: Meridianos desbloqueados, pureza del Dantian +10% y +8 Daño Espiritual.' };
    } else {
      setCultivator(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hp: prev.maxHp,
          qi: prev.maxQi,
          karma: prev.karma + 10,
        };
      });
      return { success: true, message: 'Recomposición del Alma concluida: La integridad del espíritu fue restaurada, curando desvíos de Qi kármicos.' };
    }
  };

  const harvestSectGarden = (): { success: boolean; message: string; herb?: Item } => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    const herbs = [
      { name: 'Hierba de Sangre de Dragón', desc: 'Planta de tallo escarlata nacida sobre venas de Qi de fuego.', rarity: 'Tierra' as const },
      { name: 'Loto de Nieve de Mil Años', desc: 'Flor medicinal que florece en la escarcha eterna, cura venenos.', rarity: 'Alma' as const },
      { name: 'Hierba de Siete Sombras', desc: 'Raíz aromática que estabiliza el caldero en alquimias de alto grado.', rarity: 'Tierra' as const },
      { name: 'Ginseng de Espíritu de Nueve Nudos', desc: 'Tubérculo celestial con aspecto humanoide que potencia la longevidad.', rarity: 'Celestial' as const },
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
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inventory: [...prev.inventory, newItem],
      };
    });

    return {
      success: true,
      message: `Has cosechado con éxito una muestra de «${picked.name}» (${picked.rarity}) en el Jardín Medicinal.`,
      herb: newItem,
    };
  };

  const buySectStoreItem = (item: Item, meritCost: number): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    if (cultivator.sectMerits < meritCost) {
      return { success: false, message: `Puntos de mérito insuficientes. Requieres ${meritCost} méritos (tienes ${cultivator.sectMerits}).` };
    }

    murimAudio.playCoinClink();
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sectMerits: prev.sectMerits - meritCost,
        inventory: [...prev.inventory, { ...item, id: `bought_${Date.now()}` }],
      };
    });

    return { success: true, message: `¡Has adquirido «${item.name}» a cambio de ${meritCost} Puntos de Mérito!` };
  };

  // World Map & Jianghu Expeditions
  const travelToNode = (nodeId: string): { success: boolean; message: string } => {
    if (!cultivator) return { success: false, message: 'Cultivador no disponible.' };
    const node = WORLD_MAP_NODES.find(n => n.id === nodeId);
    if (!node) return { success: false, message: 'Región desconocida.' };

    murimAudio.playQiChime();
    setCultivator(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentLocationNodeId: nodeId,
        stats: {
          ...prev.stats,
          nodesDiscovered: Math.min(WORLD_MAP_NODES.length, (prev.stats?.nodesDiscovered || 1) + 1),
        },
      };
    });

    return { success: true, message: `Has viajado a «${node.name}» (${node.province}). El entorno resuena con Qi de ${node.qiDensity}.` };
  };

  const exploreNodeEvent = (nodeId: string): { roll: number; eventText: string; rewardText: string; loot?: Item } => {
    if (!cultivator) return { roll: 0, eventText: 'Error', rewardText: '' };
    const luckBonus = Math.floor((cultivator.attributes?.suerte || 10) / 2);
    const fameBonus = Math.floor((cultivator.fama || 0) / 50);
    const d100 = Math.floor(Math.random() * 100) + 1;
    const totalRoll = d100 + luckBonus + fameBonus;

    let eventText = '';
    let rewardText = '';
    let loot: Item | undefined;

    if (totalRoll <= 20) {
      eventText = 'Sin eventos. El universo se mantiene neutro. Una suave brisa acaricia las hojas de pino, pero nada rompe el silencio del sendero.';
      rewardText = 'Nula. Meditas en tranquilidad sin ganancias materiales.';
    } else if (totalRoll <= 40) {
      eventText = 'Giro cotidiano: Encuentras a un mercader ambulante de té que te agradece por despejar la senda de alimañas.';
      rewardText = '+40 Monedas de Cobre y 1x Píldora de Qi Básica.';
      loot = {
        id: `event_loot_${Date.now()}`,
        name: 'Píldora Purificadora de Qi',
        category: 'pill',
        rarity: 'Mortal',
        description: 'Píldora común de viaje que alivia la fatiga corporal.',
        cultivationBoost: 80,
        value: 30,
      };
    } else if (totalRoll <= 60) {
      eventText = 'Hallazgo menor: Descubres una veta expuesta entre las rocas con piedras cargadas de energía espiritual.';
      rewardText = '+65 Piedras Espirituales y 1x Hierro Frío de Montaña.';
      loot = {
        id: `event_loot_${Date.now()}`,
        name: 'Hierro Frío de Montaña',
        category: 'material',
        rarity: 'Tierra',
        description: 'Mineral de densidad templada por la altitud, ideal para armas.',
        value: 90,
      };
    } else if (totalRoll <= 80) {
      eventText = 'Oportunidad inesperada: En una hendidura sellada por formaciones arcaicas, desentierras un cofre de jade dejado por un cultivador errante.';
      rewardText = '+180 Piedras Espirituales y 1x Píldora de Limpieza de Médula.';
      loot = {
        id: `event_loot_${Date.now()}`,
        name: 'Píldora de Limpieza de Médula',
        category: 'pill',
        rarity: 'Alma',
        description: 'Píldora rara que limpia impurezas del Dantian e incrementa la pureza un 15%.',
        cultivationBoost: 300,
        statBonus: { hp: 100, constitucion: 5 },
        value: 250,
      };
    } else if (totalRoll <= 95) {
      eventText = 'Coyuntura favorable: Coincides con un Anciano ermitaño contemplando el flujo del río. Impresionado por tu porte, te entrega un mapa de tumbas y un artefacto marcial.';
      rewardText = '+350 Piedras Espirituales y 1x Brújula del Bagua Sagrado.';
      loot = {
        id: `event_loot_${Date.now()}`,
        name: 'Brújula del Bagua Sagrado',
        category: 'artifact',
        rarity: 'Alma',
        description: 'Instrumento de orientación geomántica que otorga +25 Percepción y +35 Daño Espiritual.',
        statBonus: { spirit: 35, percepcion: 8 },
        value: 400,
      };
    } else {
      eventText = '¡Intervención del Destino y el Dao! Una fisura en el firmamento ilumina tu camino con luz dorada, revelando una reliquia legendaria oculta durante milenios.';
      rewardText = '+800 Piedras Espirituales, +50 Puntos de Mérito y 1x Sello Celestial de la Verdad Primordial.';
      loot = {
        id: `event_loot_${Date.now()}`,
        name: 'Sello Celestial de la Verdad Primordial',
        category: 'artifact',
        rarity: 'Celestial',
        description: 'Grabado con caracteres primordiales del Vacío. Duplica la velocidad de absorción de Qi.',
        statBonus: { spirit: 80, sabiduria: 12, hp: 300 },
        value: 1200,
      };
    }

    murimAudio.playBreakthroughGong();
    setCultivator(prev => {
      if (!prev) return null;
      const stonesGained = totalRoll > 95 ? 800 : totalRoll > 80 ? 350 : totalRoll > 60 ? 180 : totalRoll > 40 ? 65 : 20;
      const updatedInv = loot ? [...prev.inventory, loot] : prev.inventory;
      return {
        ...prev,
        spiritStones: prev.spiritStones + stonesGained,
        sectMerits: prev.sectMerits + (totalRoll > 95 ? 50 : 15),
        inventory: updatedInv,
      };
    });

    return { roll: totalRoll, eventText, rewardText, loot };
  };

  const huntBeastEncounter = (beastId: string): { victory: boolean; log: string; dropItem?: Item } => {
    if (!cultivator) return { victory: false, log: 'Cultivador no disponible.' };
    const beast = BESTIAS_COMPENDIO.find(b => b.id === beastId) || BESTIAS_COMPENDIO[0];

    const playerAtk = (cultivator.baseAttack || 30) + (cultivator.spiritPower || 20);
    const beastPower = (beast.attack * 1.2) + (beast.defense * 0.8);
    const powerRatio = playerAtk / Math.max(1, beastPower);

    const victory = powerRatio >= 0.65 || Math.random() > 0.45;

    if (victory) {
      murimAudio.playSwordClash();
      const drop = { ...beast.itemReward, id: `drop_${Date.now()}` };
      setCultivator(prev => {
        if (!prev) return null;
        return {
          ...prev,
          spiritStones: prev.spiritStones + beast.stonesReward,
          sectMerits: prev.sectMerits + Math.floor(beast.threatLevel * 20),
          inventory: [...prev.inventory, drop],
          stats: {
            ...prev.stats,
            bossDamageDealt: (prev.stats?.bossDamageDealt || 0) + beast.hp,
          },
        };
      });
      return {
        victory: true,
        log: `¡Victoria rotunda frente a «${beast.name}»! Neutralizaste su habilidad «${beast.innateSkill}». Recompensas: +${beast.stonesReward} Piedras de Espíritu, +${Math.floor(beast.threatLevel * 20)} Méritos y material sagrado: [${drop.name}].`,
        dropItem: drop,
      };
    } else {
      murimAudio.playElementalBlast();
      setCultivator(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hp: Math.max(20, Math.floor(prev.hp * 0.6)),
        };
      });
      return {
        victory: false,
        log: `«${beast.name}» desató «${beast.innateSkill}», infligiendo heridas severas. Lograste retirarte antes del golpe fatal, perdiendo el 40% de tu salud actual.`,
      };
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
        createCharacter,
        loadSavedCharacter,
        resetCharacter,
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
