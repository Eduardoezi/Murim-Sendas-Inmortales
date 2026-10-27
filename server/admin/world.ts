// server/admin/world.ts
// ─────────────────────────────────────────────────────────────────────────────
// ESPEJO SERVER-SIDE del generador determinista del cliente (mulberry32 +
// semillas, NUNCA Math.random). El servidor es autoritativo: persiste los POIs
// en SQLite y calcula la vista previa de cada chunk para /admin/world.
// ─────────────────────────────────────────────────────────────────────────────
import db from '../db/database';

export const CHUNK_SIZE = 16;               // simétrico a ChunkManager.ts
export const MAP_SIZE = 1000;               // WORLD_SEED.gridSize
export const WORLD_ROOT_HASH = 'MURIM_2027_IMPERIAL_CENTRAL';

// ── PRNG canónico (mismo algoritmo que src/core/utils/prng.ts) ──────────────
export function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stringToHash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

// ── Provincias (id + nombre + bioma) ────────────────────────────────────────
interface ProvinceLite { id: string; name: string; biome: string; cx: number; cy: number }

const PROVINCES: ProvinceLite[] = [
  { id: 'prov_hebei',      name: 'Hebei, Llano del Norte',        biome: 'Llanura',   cx: 712, cy: 352 },
  { id: 'prov_shanxi',     name: 'Shanxi, Meseta del Polvo',      biome: 'Meseta',    cx: 668, cy: 388 },
  { id: 'prov_shandong',   name: 'Shandong, Costa Sagrada',       biome: 'Litoral',   cx: 780, cy: 398 },
  { id: 'prov_henan',      name: 'Henan, Corazón Imperial',       biome: 'Llanura',   cx: 682, cy: 448 },
  { id: 'prov_shaanxi',    name: 'Shaanxi, Valle del Sur',        biome: 'Valle',     cx: 592, cy: 452 },
  { id: 'prov_gansu',      name: 'Gansu, Pasillo del Desierto',   biome: 'Desierto',  cx: 430, cy: 392 },
  { id: 'prov_qinghai',    name: 'Qinghai, Techo del Mundo',      biome: 'Meseta',    cx: 330, cy: 432 },
  { id: 'prov_xizang',     name: 'Xizang, Trono de Hielo',        biome: 'Montaña',   cx: 190, cy: 472 },
  { id: 'prov_xinjiang',   name: 'Xinjiang, Arenas del Oeste',    biome: 'Desierto',  cx: 210, cy: 300 },
  { id: 'prov_ningxia',    name: 'Ningxia, Postigo Dorado',       biome: 'Desierto',  cx: 540, cy: 372 },
  { id: 'prov_jilin',      name: 'Jilin, Bosque del Tigre',       biome: 'Bosque',    cx: 872, cy: 212 },
  { id: 'prov_heilongjiang', name: 'Heilongjiang, Frontera Fría', biome: 'Taiga',     cx: 832, cy: 132 },
  { id: 'prov_liaoning',   name: 'Liaoning, Puerta de Manchuria', biome: 'Costa',     cx: 832, cy: 292 },
  { id: 'prov_jiangsu',    name: 'Jiangsu, Jardines del Canal',   biome: 'Delta',     cx: 782, cy: 492 },
  { id: 'prov_anhui',      name: 'Anhui, Colinas del Té',         biome: 'Colina',    cx: 732, cy: 512 },
  { id: 'prov_zhejiang',   name: 'Zhejiang, Orilla del Lago',     biome: 'Delta',     cx: 792, cy: 552 },
  { id: 'prov_jiangxi',    name: 'Jiangxi, Tierras de Arcilla',   biome: 'Bosque',    cx: 702, cy: 582 },
  { id: 'prov_hubei',      name: 'Hubei, Encrucijada',            biome: 'Llanura',   cx: 652, cy: 522 },
  { id: 'prov_hunan',      name: 'Hunan, Ríos del Sur',           biome: 'Río',       cx: 642, cy: 612 },
  { id: 'prov_sichuan',    name: 'Sichuan, Cuenca de Niebla',     biome: 'Cuenca',    cx: 512, cy: 542 },
  { id: 'prov_chongqing',  name: 'Chongqing, Puerto Flotante',    biome: 'Río',       cx: 572, cy: 552 },
  { id: 'prov_guizhou',    name: 'Guizhou, Bruma Kárstica',       biome: 'Kárstico',  cx: 552, cy: 632 },
  { id: 'prov_yunnan',     name: 'Yunnan, Selva Eterna',          biome: 'Selva',     cx: 482, cy: 692 },
  { id: 'prov_guangxi',    name: 'Guangxi, Picos Carstificados',  biome: 'Kárstico',  cx: 622, cy: 702 },
  { id: 'prov_guangdong',  name: 'Guangdong, Perla del Sur',      biome: 'Delta',     cx: 702, cy: 702 },
  { id: 'prov_fujian',     name: 'Fujian, Costa de Té',           biome: 'Costa',     cx: 762, cy: 632 },
];

export function provinceAt(x: number, y: number): ProvinceLite {
  let best = PROVINCES[0];
  let bestD = Infinity;
  for (const p of PROVINCES) {
    const d = (p.cx - x) ** 2 + (p.cy - y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

// ── Terreno determinista por tile (ruido de valor con hash propio) ──────────
export type ServerTileType = 'hierba' | 'agua' | 'arena' | 'nieve' | 'montana' | 'pantano';

function noise2(x: number, y: number, seedNum: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const corner = (a: number, b: number): number => mulberry32(stringToHash(`n_${a}_${b}_${Math.round(seedNum * 1000)}`))();
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = corner(ix, iy), n10 = corner(ix + 1, iy);
  const n01 = corner(ix, iy + 1), n11 = corner(ix + 1, iy + 1);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

export interface ServerTile { x: number; y: number; type: ServerTileType; density: number }

/** Río determinista estilo "serpiente" sobre todo el mapa (como geoChina). */
function riverCenterY(x: number): number {
  return 480 + Math.sin(x / 55) * 42 + Math.cos(x / 23) * 14;
}

export function tileAt(mapX: number, mapY: number, biome: string): ServerTile {
  const prov = provinceAt(mapX, mapY);
  const seedNum = stringToHash(`${WORLD_ROOT_HASH}_${prov.id}`) / 1000;
  const elev = noise2(mapX / 90, mapY / 90, seedNum);
  const moist = noise2(mapX / 60 + 40, mapY / 60 + 40, seedNum + 7);
  const riverDist = Math.abs(mapY - riverCenterY(mapX));

  let type: ServerTileType = 'hierba';
  if (riverDist < 10) type = 'agua';
  else if (biome === 'Desierto') type = elev > 0.62 ? 'montana' : 'arena';
  else if (biome === 'Montaña' || biome === 'Taiga') type = elev > 0.55 ? 'nieve' : elev > 0.35 ? 'montana' : 'hierba';
  else if (biome === 'Kárstico' || biome === 'Selva' || biome === 'Cuenca') type = moist > 0.68 ? 'pantano' : 'hierba';
  else if (biome === 'Meseta') type = elev > 0.6 ? 'montana' : 'hierba';
  else type = moist > 0.75 ? 'pantano' : elev > 0.72 ? 'montana' : 'hierba';

  const density = type === 'hierba' ? Math.round(noise2(mapX / 12, mapY / 12, seedNum + 3) * 100) / 100 : 0;
  return { x: mapX, y: mapY, type, density };
}

// ── Catálogo de bestias para fauna de chunk (lee overrides de admin_beasts) ─
export interface BeastTemplate { id: string; name: string; tier: string; dangerLevel: number; habitat: string; keyMaterial: string; isAquatic: number }

/** Fauna base del lore (seed) combinada con los ajustes "en caliente" de la BD. */
export function getBeastCatalog(): BeastTemplate[] {
  const base: Array<Omit<BeastTemplate, never>> = [
    { id: 'fauna_shadow_wolf', name: 'Lobo de las Sombras', tier: 'Mutante', dangerLevel: 3, habitat: 'prov_xinjiang', keyMaterial: 'Colmillo de Sombra', isAquatic: 0 },
    { id: 'fauna_jade_serpent', name: 'Serpiente de Jade de los Pantanos', tier: 'Desolada', dangerLevel: 5, habitat: 'prov_guangxi', keyMaterial: 'Veneno de Jade Puro', isAquatic: 0 },
    { id: 'fauna_thunder_eagle', name: 'Águila del Trueno Celestial', tier: 'Ancestral', dangerLevel: 8, habitat: 'prov_shaanxi', keyMaterial: 'Pluma de Trueno', isAquatic: 0 },
    { id: 'beast_ice_wolf', name: 'Lobo de Escarcha', tier: 'Mutante', dangerLevel: 3, habitat: 'prov_jilin', keyMaterial: 'Colmillo Gélido', isAquatic: 0 },
    { id: 'beast_blood_panther', name: 'Pantera de Sangre', tier: 'Mutante', dangerLevel: 4, habitat: 'prov_guangxi', keyMaterial: 'Garra Sangrienta', isAquatic: 0 },
    { id: 'beast_iron_boar', name: 'Jabalí de Hierro Negro', tier: 'Mutante', dangerLevel: 4, habitat: 'prov_henan', keyMaterial: 'Piel de Hierro', isAquatic: 0 },
    { id: 'beast_white_tiger', name: 'Tigre Blanco de la Montaña Oeste', tier: 'Desolada', dangerLevel: 6, habitat: 'prov_shaanxi', keyMaterial: 'Hueso de Tigre Blanco', isAquatic: 0 },
    { id: 'beast_flame_lion', name: 'León de Llama Carmesí', tier: 'Desolada', dangerLevel: 7, habitat: 'prov_xinjiang', keyMaterial: 'Melena de Fuego', isAquatic: 0 },
    { id: 'beast_earth_bear', name: 'Oso del Núcleo de Tierra', tier: 'Desolada', dangerLevel: 6, habitat: 'prov_gansu', keyMaterial: 'Núcleo de Tierra Puro', isAquatic: 0 },
    { id: 'beast_cloud_leopard', name: 'Leopardo de las Nubes', tier: 'Ancestral', dangerLevel: 8, habitat: 'prov_yunnan', keyMaterial: 'Piel de las Nubes', isAquatic: 0 },
    { id: 'beast_swamp_python', name: 'Pitón del Pantano Tóxico', tier: 'Mutante', dangerLevel: 4, habitat: 'prov_guizhou', keyMaterial: 'Vesícula de Veneno', isAquatic: 0 },
    { id: 'beast_poison_frog', name: 'Rana de Tres Ojos', tier: 'Mutante', dangerLevel: 3, habitat: 'prov_yunnan', keyMaterial: 'Saco de Toxina', isAquatic: 0 },
    { id: 'beast_jade_crocodile', name: 'Cocodrilo de Escamas de Jade', tier: 'Desolada', dangerLevel: 6, habitat: 'prov_guangxi', keyMaterial: 'Escama de Jade Duro', isAquatic: 1 },
    { id: 'beast_basilisk_king', name: 'Rey Basilisco de la Cueva', tier: 'Ancestral', dangerLevel: 9, habitat: 'prov_sichuan', keyMaterial: 'Ojo Petrificador', isAquatic: 0 },
    { id: 'beast_abyss_serpent', name: 'Serpiente del Abismo', tier: 'Primordial', dangerLevel: 10, habitat: 'prov_guangxi', keyMaterial: 'Colmillo del Abismo', isAquatic: 1 },
    { id: 'beast_blood_crow', name: 'Cuervo de Sangre', tier: 'Mutante', dangerLevel: 3, habitat: 'prov_hebei', keyMaterial: 'Pluma Oscura', isAquatic: 0 },
    { id: 'beast_spirit_fox', name: 'Zorro de Dos Colas', tier: 'Desolada', dangerLevel: 5, habitat: 'prov_shandong', keyMaterial: 'Cola Ilusoria', isAquatic: 0 },
    { id: 'beast_nine_tailed_fox', name: 'Zorro Celestial de Nueve Colas', tier: 'Primordial', dangerLevel: 10, habitat: 'prov_henan', keyMaterial: 'Perla de la Ilusión', isAquatic: 0 },
    { id: 'beast_qilin', name: 'Qilin de la Paz', tier: 'Primordial', dangerLevel: 10, habitat: 'prov_qinghai', keyMaterial: 'Cuerno de Qilin', isAquatic: 0 },
    { id: 'beast_pixiu', name: 'Pixiu Devorador de Riquezas', tier: 'Ancestral', dangerLevel: 8, habitat: 'prov_jiangsu', keyMaterial: 'Escama de Oro', isAquatic: 0 },
    { id: 'beast_blood_carp', name: 'Carpa de Escamas Rojas', tier: 'Mutante', dangerLevel: 2, habitat: 'prov_hubei', keyMaterial: 'Escama Brillante', isAquatic: 1 },
    { id: 'beast_water_ape', name: 'Mono de Agua de Río', tier: 'Desolada', dangerLevel: 5, habitat: 'prov_sichuan', keyMaterial: 'Tendón Elástico', isAquatic: 1 },
    { id: 'beast_black_tortoise', name: 'Tortuga Negra del Norte', tier: 'Primordial', dangerLevel: 10, habitat: 'prov_heilongjiang', keyMaterial: 'Caparazón de Xuanwu', isAquatic: 1 },
    { id: 'beast_flood_dragon', name: 'Dragón de Inundación', tier: 'Ancestral', dangerLevel: 9, habitat: 'prov_jiangxi', keyMaterial: 'Perla de Dragón', isAquatic: 1 },
    { id: 'beast_venom_scorpion', name: 'Escorpión de Cola de Cristal', tier: 'Desolada', dangerLevel: 6, habitat: 'prov_gansu', keyMaterial: 'Aguijón de Cristal', isAquatic: 0 },
    { id: 'beast_golden_crow', name: 'Cuervo Dorado de los Tres Pies', tier: 'Primordial', dangerLevel: 10, habitat: 'prov_xizang', keyMaterial: 'Pluma del Sol', isAquatic: 0 },
    { id: 'beast_vermilion_bird', name: 'Ave Bermellón del Sur', tier: 'Primordial', dangerLevel: 10, habitat: 'prov_guangdong', keyMaterial: 'Sangre de Fénix', isAquatic: 0 },
    { id: 'beast_corpse_hound', name: 'Sabueso Cadavérico', tier: 'Desolada', dangerLevel: 6, habitat: 'prov_yunnan', keyMaterial: 'Hueso Maldito', isAquatic: 0 },
    { id: 'beast_asura_beast', name: 'Bestia Asura de Cuernos Rojos', tier: 'Ancestral', dangerLevel: 9, habitat: 'prov_guangxi', keyMaterial: 'Cuerno de Asura', isAquatic: 0 },
    { id: 'beast_chaos_chimera', name: 'Quimera del Caos', tier: 'Primordial', dangerLevel: 10, habitat: 'prov_xinjiang', keyMaterial: 'Corazón del Caos', isAquatic: 0 },
  ];

  // Overrides "en caliente" del panel Bestiario (dangerLevel, hábitat, etc.)
  try {
    const rows = db.prepare('SELECT id, name, tier, danger_level, habitat, key_material, is_aquatic FROM admin_beasts').all() as
      Array<{ id: string; name: string; tier: string; danger_level: number; habitat: string; key_material: string; is_aquatic: number }>;
    const byId = new Map(base.map((b) => [b.id, b]));
    for (const r of rows) {
      byId.set(r.id, {
        id: r.id, name: r.name, tier: r.tier, dangerLevel: r.danger_level,
        habitat: r.habitat, keyMaterial: r.key_material, isAquatic: r.is_aquatic,
      });
    }
    return [...byId.values()];
  } catch {
    return base; // tabla aún no migrada → catálogo puro de seeds
  }
}

// ── Generación de fauna por chunk (misma fórmula que faunaGenerator.ts) ─────
export interface ChunkFauna { id: string; name: string; x: number; y: number; tier: string }

export function generateChunkFauna(provinceId: string, chunkX: number, chunkY: number, force = 0): ChunkFauna[] {
  const beasts: ChunkFauna[] = [];
  const catalog = getBeastCatalog();
  const chunkSeed = stringToHash(`fauna_${provinceId}_${chunkX}_${chunkY}_f${force}`);
  const rng = mulberry32(chunkSeed);

  if (rng() > 0.3 && force === 0) return beasts; // 30% probabilidad natural

  const localFauna = catalog.filter((b) => b.habitat === provinceId);
  if (localFauna.length === 0) return beasts;

  const numBeasts = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < numBeasts; i++) {
    const tpl = localFauna[Math.floor(rng() * localFauna.length)];
    const x = chunkX * CHUNK_SIZE + Math.floor(rng() * CHUNK_SIZE);
    const y = chunkY * CHUNK_SIZE + Math.floor(rng() * CHUNK_SIZE);
    beasts.push({ id: `${tpl.id}@${chunkX},${chunkY},${i}`, name: tpl.name, x, y, tier: tpl.tier });
  }
  return beasts;
}

// ── POIs: sembrado determinista + persistencia en SQLite ────────────────────
export interface PoiSeedRow { id: string; name: string; kind: 'capital' | 'sect' | 'landmark' | 'settlement'; x: number; y: number; provinceId: string; loreNote: string }

const SECT_POIS: Array<{ id: string; name: string; x: number; y: number; provinceId: string; loreNote: string }> = [
  { id: 'poi_shaolin',   name: 'Monasterio Shaolin', x: 686, y: 444, provinceId: 'prov_henan',    loreNote: 'El templo del bastón: cuna del puño externo.' },
  { id: 'poi_wudang',    name: 'Secta Wudang',       x: 650, y: 520, provinceId: 'prov_hubei',    loreNote: 'Taiji y espada interna: el equilibrio Yin.' },
  { id: 'poi_emei',      name: 'Secta Emei',         x: 505, y: 560, provinceId: 'prov_sichuan',  loreNote: 'Monjas espada en la niebla del sur.' },
  { id: 'poi_huashan',   name: 'Secta Hua Shan',     x: 600, y: 448, provinceId: 'prov_shaanxi',  loreNote: 'La espada más afilada del imperio.' },
  { id: 'poi_qingcheng', name: 'Secta Qingcheng',    x: 500, y: 535, provinceId: 'prov_sichuan',  loreNote: 'Cuna taoísta: espadas de aire puro.' },
  { id: 'poi_changbai',  name: 'Escuela Changbai',   x: 862, y: 218, provinceId: 'prov_jilin',    loreNote: 'Hijos del volcán: palmas de fuego sobre nieve.' },
];

const LANDMARK_POIS: Array<{ id: string; name: string; x: number; y: number; provinceId: string; loreNote: string }> = [
  { id: 'poi_lake_menggu', name: 'Lago Menggu (Dongting)', x: 655, y: 545, provinceId: 'prov_hunan',     loreNote: 'Neblina y barcos piratas: paso al sur profundo.' },
  { id: 'poi_lake_cielo',  name: 'Lago del Cielo',         x: 866, y: 210, provinceId: 'prov_jilin',     loreNote: 'Agua de cielo: hierba de mil años.' },
  { id: 'poi_gate_yumen',  name: 'Pasada de Yumen',        x: 415, y: 380, provinceId: 'prov_gansu',     loreNote: 'Última puerta del imperio hacia el desierto.' },
  { id: 'poi_poyang',      name: 'Lago Poyang',            x: 712, y: 578, provinceId: 'prov_jiangxi',   loreNote: 'Mar interior del Jiangnan en la crecida.' },
];

/** Siembra (idempotente) de capitales + sectas + hitos + satélites en world_pois. */
export function ensurePoisSeeded(): number {
  const existing = (db.prepare('SELECT COUNT(*) AS n FROM world_pois').get() as { n: number }).n;
  if (existing > 0) return existing;

  const ins = db.prepare(`
    INSERT OR IGNORE INTO world_pois (id, name, kind, x, y, province_id, lore_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);

  let count = 0;
  for (const p of PROVINCES) {
    ins.run(`${p.id}_capital`, `Capital de ${p.name.split(',')[0]}`, 'capital', p.cx, p.cy, p.id, `Asiento administrativo de ${p.name}.`);
    count++;
  }
  for (const s of SECT_POIS) { ins.run(s.id, s.name, 'sect', s.x, s.y, s.provinceId, s.loreNote); count++; }
  for (const l of LANDMARK_POIS) { ins.run(l.id, l.name, 'landmark', l.x, l.y, l.provinceId, l.loreNote); count++; }

  // Satélites menores deterministas (misma idea que generateSatellites del cliente)
  const rng = mulberry32(stringToHash(`${WORLD_ROOT_HASH}_satellites`));
  const SUFFIXES = ['Superior', 'del Postero', 'de la Grulla', 'del Carretero', 'Oculto', 'de Piedra'];
  for (const p of PROVINCES) {
    const n = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 10 + rng() * 15;
      const x = Math.round(Math.min(MAP_SIZE - 1, Math.max(0, p.cx + Math.cos(angle) * dist)));
      const y = Math.round(Math.min(MAP_SIZE - 1, Math.max(0, p.cy + Math.sin(angle) * dist)));
      const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
      ins.run(`set_${p.id}_${i}`, `Aldea ${suffix}`, 'settlement', x, y, p.id, `Puesto satélite de ${p.name.split(',')[0]}.`);
      count++;
    }
  }
  db.prepare('INSERT OR REPLACE INTO admin_config (key, value) VALUES (?, ?)').run('pois_seeded_at', new Date().toISOString());
  return count;
}

export function listPois(): PoiSeedRow[] {
  return db.prepare(`
    SELECT id, name, kind, x, y, province_id AS provinceId, lore_note AS loreNote
    FROM world_pois ORDER BY kind, name`).all() as PoiSeedRow[];
}

// ── Contadores de regeneración de chunks (para métricas del dashboard) ──────
export function bumpChunkRegen(): number {
  const cur = getChunkRegenCount();
  db.prepare('INSERT INTO admin_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
    .run('chunk_regen_count', String(cur + 1), String(cur + 1));
  return cur + 1;
}

export function getChunkRegenCount(): number {
  try {
    const row = db.prepare("SELECT value FROM admin_config WHERE key = 'chunk_regen_count'").get() as { value: string } | undefined;
    return row ? Number(row.value) : 0;
  } catch { return 0; }
}
