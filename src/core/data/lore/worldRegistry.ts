// src/core/data/lore/worldRegistry.ts
import { generateFactions, generateFauna, generateFlora } from '../lore/generators/generators';
import { MAIN_SECTS } from '../../data/lore/seeds/sects';
import { MAIN_CLANS } from '../../data/lore/seeds/clans';
import { MAIN_CULTS } from '../../data/lore/seeds/cults';
import { MAIN_GUILDS } from '../../data/lore/seeds/guilds';
import { MAIN_ORGANIZATIONS } from '../../data/lore/seeds/organizations';
import { MAIN_FAUNA } from '../../data/lore/seeds/fauna';
import { MAIN_FLORA } from '../../data/lore/seeds/flora';
import { Faction } from './types';

// 1. Generamos facciones menores para poblar el mundo
// La cantidad total objetivo es: Sectas(115), Clanes(115), Cultos(155), Gremios(100), Orgs(100)
const GENERATED_SECTS = generateFactions('seed_sects', 'Secta', 100);
const GENERATED_CLANS = generateFactions('seed_clans', 'Clan', 100);
const GENERATED_CULTS = generateFactions('seed_cults', 'Culto', 100);
const GENERATED_GUILDS = generateFactions('seed_guilds', 'Gremio', 90);
const GENERATED_ORGS = generateFactions('seed_orgs', 'Organización', 95);

// 2. Generamos fauna y flora menor
const GENERATED_FAUNA = generateFauna('seed_fauna', 85); // + 15 manuales = 100
const GENERATED_FLORA = generateFlora('seed_flora', 86); // + 14 manuales = 100

// 3. Exportamos la base de datos final
export const WORLD_LORE = {
  factions: {
    sects: [...MAIN_SECTS, ...GENERATED_SECTS],
    clans: [...MAIN_CLANS, ...GENERATED_CLANS],
    cults: [...MAIN_CULTS, ...GENERATED_CULTS],
    guilds: [...MAIN_GUILDS, ...GENERATED_GUILDS],
    organizations: [...MAIN_ORGANIZATIONS, ...GENERATED_ORGS],
  },
  fauna: [...MAIN_FAUNA, ...GENERATED_FAUNA],
  flora: [...MAIN_FLORA, ...GENERATED_FLORA],
};

// Función de búsqueda para el juego (ej: buscar todas las facciones de una provincia)
export function getFactionsByTerritory(provinceId: string): Faction[] {
  const allFactions = Object.values(WORLD_LORE.factions).flat();
  return allFactions.filter(f => f.territory === provinceId);
}