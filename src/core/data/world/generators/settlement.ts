// src/core/data/world/generators/settlement.ts
import { mulberry32, stringToHash } from '../../../utils/prng';
import { BUILDING_TEMPLATES } from '../seeds/buildingTemplates';
import { generateBuilding, Building } from './buildingGenerator';
import { BiomeType, SettlementType } from '../types'; 

export interface Settlement {
  id: string;
  name: string;
  type: SettlementType;
  developmentLevel: number;
  biome: BiomeType;
  buildings: Building[];
}

export function generateSettlement(
  provinceSeed: string,
  type: SettlementType,
  wealthLevel: number,
  biome: BiomeType
): Settlement {
  // 1. Semilla determinista del asentamiento
  const settlementSeed = `${provinceSeed}_settlement_${type}`;
  const rng = mulberry32(stringToHash(settlementSeed));

  // 2. Determinar el nivel de desarrollo
  let developmentLevel = 1;
  if (type === 'Capital') developmentLevel = 4;
  else if (type === 'Ciudad') developmentLevel = Math.min(4, wealthLevel + 1);
  else if (type === 'Pueblo') developmentLevel = Math.min(3, wealthLevel);
  else if (type === 'Aldea') developmentLevel = 1;

  // 3. Obtener las plantillas de edificios para este tier
  const templates = BUILDING_TEMPLATES[developmentLevel] || BUILDING_TEMPLATES[1];

  // 4. Filtrar por bioma (ej. no Casa de Té en desierto)
  const validTemplates = templates.filter(t => 
    !t.allowedBiomes || t.allowedBiomes.includes(biome)
  );

  // 5. Generar los edificios
  const buildings: Building[] = validTemplates.map((template, index) => 
    generateBuilding(settlementSeed, template, developmentLevel, index)
  );

  // 6. Nombre del asentamiento (determinista)
  const cityNames = ['Ciudad de Jade', 'Valle Dorado', 'Puerto de Seda', 'Fortaleza de Piedra'];
  const settlementName = cityNames[Math.floor(rng() * cityNames.length)];

  return {
    id: settlementSeed,
    name: settlementName,
    type,
    developmentLevel,
    biome,
    buildings,
  };
}