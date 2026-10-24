import { getDb } from '../db';
import { Cultivator } from '../../src/types/game';

// Extendemos el tipo de Cultivator para asegurar que el servidor maneje lastSeenAt
type PlayerWithLastSeenAt = Cultivator & {
  lastSeenAt?: number;
};

export interface PlayerSummary {
  id: string;
  name: string;
  classType: string;
  realm: string;
  subRealm: number;
  sectId: string;
  updatedAt: number;
}

export interface OfflineProgressResult {
  updatedPlayer: PlayerWithLastSeenAt;
  offlineMinutes: number;
  qiGained: number;
  missionsCompleted: number;
}

/**
 * Calcula el progreso del jugador mientras estuvo desconectado.
 * Reglas:
 * - El Qi se regenera pasivamente basado en la pureza del Dantian.
 * - Tope máximo de 24 horas para evitar exploits.
 * - Las misiones asíncronas que terminaron se marcan como completadas.
 */
export function processOfflineProgress(player: PlayerWithLastSeenAt): OfflineProgressResult {
  const now = Date.now();
  // Si el jugador es nuevo o no tiene lastSeenAt, asumimos que acaba de entrar
  const lastSeen = player.lastSeenAt || now;
  const offlineMs = Math.max(0, now - lastSeen);

  // Tope máximo de 24 horas offline para evitar exploits de tiempo
  const cappedMs = Math.min(offlineMs, 24 * 60 * 60 * 1000);
  const offlineMinutes = Math.floor(cappedMs / 60000);

  // Si estuvo fuera menos de 1 minuto, no hacemos nada (ahorra escrituras en DB)
  if (offlineMinutes < 1) {
    return {
      updatedPlayer: { ...player, lastSeenAt: now },
      offlineMinutes: 0,
      qiGained: 0,
      missionsCompleted: 0,
    };
  }

  // Fórmula de Regeneración de Qi Offline:
  // Base: 1 Qi cada 2 segundos (30 Qi por minuto) modificado por la pureza del Dantian
  const qiPerMinute = Math.max(10, Math.floor((player.dantianPurity || 35) / 2));
  const potentialQiGain = qiPerMinute * offlineMinutes;

  // El Qi no puede exceder el máximo del Dantian
  const newQi = Math.min(player.maxQi, player.qi + potentialQiGain);
  const actualQiGained = newQi - player.qi;

  // Procesar misiones asíncronas que hayan terminado mientras estaba offline
  let missionsCompleted = 0;
  const updatedMissions = (player.activeMissions || []).map((m) => {
    if (m.status === 'in_progress') {
      const endTime = m.startedAt + m.durationMinutes * 60 * 1000;
      if (now >= endTime) {
        missionsCompleted++;
        return { ...m, status: 'completed' as const };
      }
    }
    return m;
  });

  return {
    updatedPlayer: {
      ...player,
      qi: newQi,
      activeMissions: updatedMissions,
      lastSeenAt: now,
    },
    offlineMinutes,
    qiGained: actualQiGained,
    missionsCompleted,
  };
}

/**
 * Carga al jugador desde SQLite.
 * Importante: Lee el last_seen_at de la DB para calcular el offline correctamente.
 */
export function loadPlayer(id: string): Cultivator | null {
  const row = getDb().prepare('SELECT * FROM players WHERE id = ?').get(id) as any;
  if (!row) return null;

  // Función auxiliar para convertir el timestamp de SQLite (segundos) a milisegundos
  const lastSeenAtMs = row.last_seen_at ? row.last_seen_at * 1000 : undefined;

  if (row.profile_json) {
    try {
      const full = JSON.parse(row.profile_json) as Cultivator;
      return {
        ...full,
        id: row.id,
        name: row.name,
        classType: row.class_type,
        sectId: row.sect_id,
        sectRank: row.sect_rank,
        realm: row.realm,
        subRealm: row.sub_realm,
        qi: row.qi,
        maxQi: row.max_qi,
        hp: row.hp,
        maxHp: row.max_hp,
        spiritStones: row.spirit_stones,
        sectMerits: row.sect_merits,
        dantianPurity: row.dantian_purity,
        karma: row.karma,
        fama: row.fama,
        currentLocationNodeId: row.current_location_node_id || full.currentLocationNodeId,
        activeMissions: row.active_missions_json ? JSON.parse(row.active_missions_json) : [],
        reputation: row.reputation_json ? JSON.parse(row.reputation_json) : {},
        // INYECTAMOS el lastSeenAt para que el flujo offline funcione
        lastSeenAt: lastSeenAtMs,
      } as PlayerWithLastSeenAt;
    } catch (e) {
      console.error('[db] Error parsing profile_json for player', id, e);
    }
  }

  return {
    id: row.id,
    name: row.name,
    classType: row.class_type,
    sectId: row.sect_id,
    sectRank: row.sect_rank,
    realm: row.realm,
    subRealm: row.sub_realm,
    qi: row.qi,
    maxQi: row.max_qi,
    hp: row.hp,
    maxHp: row.max_hp,
    spiritStones: row.spirit_stones,
    sectMerits: row.sect_merits,
    dantianPurity: row.dantian_purity,
    karma: row.karma,
    fama: row.fama,
    currentLocationNodeId: row.current_location_node_id,
    attributes: JSON.parse(row.attributes_json || '{}'),
    stats: JSON.parse(row.stats_json || '{}'),
    meridians: JSON.parse(row.meridians_json || '[]'),
    knownTechniques: JSON.parse(row.known_techniques_json || '[]'),
    equippedGear: JSON.parse(row.equipped_gear_json || '{}'),
    secretTechnique: row.secret_technique_json ? JSON.parse(row.secret_technique_json) : undefined,
    libraryScrolls: JSON.parse(row.library_scrolls_json || '[]'),
    inventory: JSON.parse(row.inventory_json || '[]'),
    disciples: JSON.parse(row.disciples_json || '[]'),
    currency: JSON.parse(row.currency_json || '{}'),
    activeMissions: row.active_missions_json ? JSON.parse(row.active_missions_json) : [],
    reputation: row.reputation_json ? JSON.parse(row.reputation_json) : {},
    title: 'Discípulo del Dao',
    inventoryMaxSlots: 30,
    completedQuests: [],
    claimedAchievements: [],
    freeAttributePoints: 10,
    freeSkillPoints: 5,
    dantianScale: row.dantian_scale || 'Gota',
    baseAttack: 10,
    baseDefense: 10,
    spiritPower: 10,
    speed: 10,
    spiritSense: 40,
    lastSeenAt: lastSeenAtMs,
  } as PlayerWithLastSeenAt;
}

/**
 * Guarda al jugador en SQLite.
 * Actualiza tanto el estado actual como el last_seen_at.
 */
export function savePlayer(player: Cultivator & { lastSeenAt?: number }): void {
  const db = getDb();
  const now = Date.now();
  const lastSeenAtSeconds = Math.floor((player.lastSeenAt || now) / 1000);

  db.prepare(`
    INSERT INTO players (
      id, name, class_type, sect_id, sect_rank, realm, sub_realm, qi, max_qi, hp, max_hp,
      spirit_stones, sect_merits, dantian_purity, karma, fama, current_location_node_id,
      attributes_json, stats_json, meridians_json, known_techniques_json, equipped_gear_json, secret_technique_json,
      library_scrolls_json, inventory_json, disciples_json, currency_json, profile_json,
      active_missions_json, reputation_json,
      created_at, updated_at, last_seen_at
    ) VALUES (
      @id, @name, @class_type, @sect_id, @sect_rank, @realm, @sub_realm, @qi, @max_qi, @hp, @max_hp,
      @spirit_stones, @sect_merits, @dantian_purity, @karma, @fama, @current_location_node_id,
      @attributes_json, @stats_json, @meridians_json, @known_techniques_json, @equipped_gear_json, @secret_technique_json,
      @library_scrolls_json, @inventory_json, @disciples_json, @currency_json, @profile_json,
      @active_missions_json, @reputation_json,
      @created_at, @updated_at, @last_seen_at
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, class_type = excluded.class_type, sect_id = excluded.sect_id, sect_rank = excluded.sect_rank,
      realm = excluded.realm, sub_realm = excluded.sub_realm, qi = excluded.qi, max_qi = excluded.max_qi,
      hp = excluded.hp, max_hp = excluded.max_hp, spirit_stones = excluded.spirit_stones, sect_merits = excluded.sect_merits,
      dantian_purity = excluded.dantian_purity, karma = excluded.karma, fama = excluded.fama,
      current_location_node_id = excluded.current_location_node_id,
      attributes_json = excluded.attributes_json, stats_json = excluded.stats_json, meridians_json = excluded.meridians_json,
      known_techniques_json = excluded.known_techniques_json, equipped_gear_json = excluded.equipped_gear_json,
      secret_technique_json = excluded.secret_technique_json, library_scrolls_json = excluded.library_scrolls_json,
      inventory_json = excluded.inventory_json, disciples_json = excluded.disciples_json, currency_json = excluded.currency_json,
      profile_json = excluded.profile_json, active_missions_json = excluded.active_missions_json, reputation_json = excluded.reputation_json,
      updated_at = excluded.updated_at, last_seen_at = excluded.last_seen_at
  `).run({
    id: player.id,
    name: player.name,
    class_type: player.classType,
    sect_id: player.sectId,
    sect_rank: player.sectRank,
    realm: player.realm,
    sub_realm: player.subRealm,
    qi: player.qi,
    max_qi: player.maxQi,
    hp: player.hp,
    max_hp: player.maxHp,
    spirit_stones: player.spiritStones,
    sect_merits: player.sectMerits,
    dantian_purity: player.dantianPurity,
    karma: player.karma,
    fama: player.fama,
    current_location_node_id: player.currentLocationNodeId,
    attributes_json: JSON.stringify(player.attributes || {}),
    stats_json: JSON.stringify(player.stats || {}),
    meridians_json: JSON.stringify(player.meridians || []),
    known_techniques_json: JSON.stringify(player.knownTechniques || []),
    equipped_gear_json: JSON.stringify(player.equippedGear || {}),
    secret_technique_json: player.secretTechnique ? JSON.stringify(player.secretTechnique) : null,
    library_scrolls_json: JSON.stringify(player.libraryScrolls || []),
    inventory_json: JSON.stringify(player.inventory || []),
    disciples_json: JSON.stringify(player.disciples || []),
    currency_json: JSON.stringify(player.currency || {}),
    // Guardamos el estado completo pero sin el lastSeenAt (para no duplicar datos)
    profile_json: JSON.stringify({ ...player, lastSeenAt: undefined }),
    active_missions_json: JSON.stringify(player.activeMissions || []),
    reputation_json: JSON.stringify(player.reputation || {}),
    created_at: now,
    updated_at: now,
    last_seen_at: lastSeenAtSeconds,
  });
}

export function listPlayers(limit = 10): PlayerSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT id, name, class_type as classType, realm, sub_realm as subRealm, sect_id as sectId, updated_at as updatedAt
       FROM players
       ORDER BY updated_at DESC
       LIMIT ?`
    )
    .all(limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    classType: r.classType,
    realm: r.realm,
    subRealm: r.subRealm,
    sectId: r.sectId,
    updatedAt: r.updatedAt,
  }));
}

export function deletePlayer(id: string): boolean {
  const result = getDb().prepare('DELETE FROM players WHERE id = ?').run(id);
  return result.changes > 0;
}

// Función autoritativa: El servidor decide si el estudio es válido
export function processStudyScroll(
  player: Cultivator,
  scrollId: string
): { success: boolean; message: string; updatedPlayer: Cultivator } {
  const scrollIndex = (player.libraryScrolls || []).findIndex((s) => s.id === scrollId);
  if (scrollIndex === -1) return { success: false, message: 'Rollo no encontrado.', updatedPlayer: player };

  const scroll = player.libraryScrolls[scrollIndex];
  if (scroll.isMastered) return { success: false, message: 'Este tratado ya ha sido asimilado.', updatedPlayer: player };

  if (player.qi < scroll.studyCostQi) {
    return { success: false, message: `Qi insuficiente. Requieres ${scroll.studyCostQi} Qi.`, updatedPlayer: player };
  }

  const newProgress = Math.min(100, scroll.studyProgress + 35);
  const becameMastered = newProgress >= 100;

  const updatedScrolls = [...player.libraryScrolls];
  updatedScrolls[scrollIndex] = { ...scroll, studyProgress: newProgress, isMastered: becameMastered };

  const updatedTechniques = [...(player.knownTechniques || [])];

  if (becameMastered && scroll.category === 'marcial') {
    const existingTech = updatedTechniques.find((t) =>
      t.name.toLowerCase().includes(scroll.title.toLowerCase().slice(0, 10))
    );
    if (!existingTech) {
      updatedTechniques.push({
        id: `tech_${scroll.code.toLowerCase()}`,
        name: scroll.title,
        chineseName: scroll.chineseTitle,
        element: 'Rayo',
        qiCost: Math.floor(scroll.studyCostQi / 2),
        cooldown: 2,
        powerMultiplier: 1.85,
        effect: 'damage',
        effectValue: 70,
        description: scroll.description,
        requiredRealm: scroll.requiredRealm,
        masteryLevel: 1,
        masteryExp: 0,
        grade: scroll.grade,
      });
    }
  }

  const updatedPlayer: Cultivator = {
    ...player,
    qi: Math.max(0, player.qi - scroll.studyCostQi),
    libraryScrolls: updatedScrolls,
    knownTechniques: updatedTechniques,
    stats: {
      ...player.stats,
      scrollsMastered: becameMastered ? (player.stats?.scrollsMastered || 0) + 1 : player.stats?.scrollsMastered || 0,
    },
  };

  savePlayer(updatedPlayer);

  if (becameMastered) {
    return { success: true, message: `¡Dominio Absoluto! Has asimilado «${scroll.title}».`, updatedPlayer };
  }
  return { success: true, message: `Has meditado sobre «${scroll.title}». Progreso: ${newProgress}%.`, updatedPlayer };
}