import { getDb } from '../db';
import { Cultivator } from '../../src/types/game';

export interface PlayerSummary {
  id: string;
  name: string;
  classType: string;
  realm: string;
  subRealm: number;
  sectId: string;
  updatedAt: number;
}

export function loadPlayer(id: string): Cultivator | null {
  const row = getDb().prepare('SELECT * FROM players WHERE id = ?').get(id) as any;
  if (!row) return null;

  // 1. Si existe snapshot de perfil completo, lo hidratamos directamente
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
      };
    } catch (e) {
      console.error('[db] Error parsing profile_json for player', id, e);
    }
  }

  // 2. Reconstrucción segura desde columnas individuales en caso de perfil legado
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
  } as Cultivator;
}

export function savePlayer(player: Cultivator): void {
  const db = getDb();
  const now = Date.now();

  db.prepare(`
    INSERT INTO players (
      id, name, class_type, sect_id, sect_rank, realm, sub_realm, qi, max_qi, hp, max_hp,
      spirit_stones, sect_merits, dantian_purity, karma, fama, current_location_node_id,
      attributes_json, stats_json, meridians_json, known_techniques_json, equipped_gear_json, secret_technique_json,
      library_scrolls_json, inventory_json, disciples_json, currency_json, profile_json,
      created_at, updated_at, last_seen_at
    ) VALUES (
      @id, @name, @class_type, @sect_id, @sect_rank, @realm, @sub_realm, @qi, @max_qi, @hp, @max_hp,
      @spirit_stones, @sect_merits, @dantian_purity, @karma, @fama, @current_location_node_id,
      @attributes_json, @stats_json, @meridians_json, @known_techniques_json, @equipped_gear_json, @secret_technique_json,
      @library_scrolls_json, @inventory_json, @disciples_json, @currency_json, @profile_json,
      @created_at, @updated_at, @last_seen_at
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      class_type = excluded.class_type,
      sect_id = excluded.sect_id,
      sect_rank = excluded.sect_rank,
      realm = excluded.realm,
      sub_realm = excluded.sub_realm,
      qi = excluded.qi,
      max_qi = excluded.max_qi,
      hp = excluded.hp,
      max_hp = excluded.max_hp,
      spirit_stones = excluded.spirit_stones,
      sect_merits = excluded.sect_merits,
      dantian_purity = excluded.dantian_purity,
      karma = excluded.karma,
      fama = excluded.fama,
      current_location_node_id = excluded.current_location_node_id,
      attributes_json = excluded.attributes_json,
      stats_json = excluded.stats_json,
      meridians_json = excluded.meridians_json,
      known_techniques_json = excluded.known_techniques_json,
      equipped_gear_json = excluded.equipped_gear_json,
      secret_technique_json = excluded.secret_technique_json,
      library_scrolls_json = excluded.library_scrolls_json,
      inventory_json = excluded.inventory_json,
      disciples_json = excluded.disciples_json,
      currency_json = excluded.currency_json,
      profile_json = excluded.profile_json,
      updated_at = excluded.updated_at,
      last_seen_at = excluded.last_seen_at
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
    profile_json: JSON.stringify(player),
    created_at: now,
    updated_at: now,
    last_seen_at: now,
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
