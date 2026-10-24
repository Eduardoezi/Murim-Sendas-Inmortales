// src/data/localityGenerator.ts
import { MAP_REGIONS, WORLD_FACTIONS } from './worldData';

export type DistrictType = 'Distrito Comercial' | 'Barrio Alto' | 'Barrio Bajo' | 'Distrito Marcial' | 'Zona Negra';

export interface Building {
  id: string;
  name: string;
  type: 'Mercado' | 'Forja' | 'Taberna' | 'Burdel' | 'Casa de Té' | 'Restaurante' | 'Posada' | 'Tienda' | 'Pabellón Marcial' | 'Sede de Facción' | 'Mercado Negro';
  district: DistrictType;
  description: string;
  tier: number; // 1 a 4
  factionAffinity?: string;
}

export function generateCityBuildings(regionId: string): Building[] {
  const buildings: Building[] = [];
  const region = MAP_REGIONS.find(r => r.id === regionId);
  if (!region) return [];

  const cityTier = region.economy.wealthLevel === 'Pobre' ? 1 : region.economy.wealthLevel === 'Moderado' ? 2 : region.economy.wealthLevel === 'Próspero' ? 3 : 4;

  // --- DISTRITO COMERCIAL ---
  buildings.push({
    id: `b_${regionId}_market`,
    name: cityTier >= 3 ? 'Gran Bazar de las Mil Maravillas' : 'Mercado Local',
    type: 'Mercado',
    district: 'Distrito Comercial',
    description: 'Un hervidero de comerciantes. Aquí se mueve la economía básica.',
    tier: cityTier
  });

  buildings.push({
    id: `b_${regionId}_forge`,
    name: cityTier >= 4 ? 'Forja Celestial del Dragón' : cityTier >= 2 ? 'Forja del Herrero' : 'Yunque Oxidado',
    type: 'Forja',
    district: 'Distrito Comercial',
    description: 'Un lugar caluroso donde el metal y el Qi se entrelazan.',
    tier: cityTier
  });

  buildings.push({
    id: `b_${regionId}_clothier`,
    name: cityTier >= 3 ? 'Tienda de Telas de Seda Espiritual' : 'Comercio de Telas Comunes',
    type: 'Tienda',
    district: 'Distrito Comercial',
    description: 'Ropa para el cultivo y la vida diaria.',
    tier: cityTier
  });

  // --- BARRIO ALTO ---
  if (cityTier >= 3) {
    buildings.push({
      id: `b_${regionId}_luxury_restaurant`,
      name: 'Restaurante La Grulla Inmortal',
      type: 'Restaurante',
      district: 'Barrio Alto',
      description: 'Banquetes con carne de bestias espirituales que otorgan Qi.',
      tier: 4
    });
    buildings.push({
      id: `b_${regionId}_tea`,
      name: 'Casa de Té de los Ocho Trigramas',
      type: 'Casa de Té',
      district: 'Barrio Alto',
      description: 'Té refinado para elevar la conciencia y escuchar política.',
      tier: 3
    });
  }

  // --- BARRIO BAJO ---
  buildings.push({
    id: `b_${regionId}_tavern`,
    name: cityTier >= 3 ? 'Taberna del Perro de Jade' : 'El Caldero Roto',
    type: 'Taberna',
    district: 'Barrio Bajo',
    description: 'Rumores, alcohol barato y mercenarios buscando trabajo.',
    tier: cityTier
  });

  buildings.push({
    id: `b_${regionId}_brothel`,
    name: cityTier >= 4 ? 'Pabellón de los Diez Mil Sueños' : 'Casa de Citas del Callejón',
    type: 'Burdel',
    district: 'Barrio Bajo',
    description: 'Un lugar para el placer, el descanso y el intercambio de secretos.',
    tier: cityTier
  });

  // --- ZONA NEGRA / ALCANTARILLAS ---
  buildings.push({
    id: `b_${regionId}_black_market`,
    name: 'Mercado Negro de las Sombras',
    type: 'Mercado Negro',
    district: 'Zona Negra',
    description: 'Si necesitas algo sin hacer preguntas, este es el lugar.',
    tier: cityTier
  });

  // --- DISTRITO MARCIAL (FACCIONES LOCALES) ---
  const localFactions = WORLD_FACTIONS.filter(f => f.location === regionId);
  localFactions.forEach(faction => {
    buildings.push({
      id: `b_${regionId}_${faction.id}`,
      name: `Sede: ${faction.name}`,
      type: 'Sede de Facción',
      district: 'Distrito Marcial',
      description: `Centro de operaciones de ${faction.name}. Líder: ${faction.leader}.`,
      tier: 5, // Las sedes de facciones son de alto nivel
      factionAffinity: faction.id
    });
  });

  // Si es la capital, añadir el Ejército Imperial
  if (regionId === 'prov_hebei') {
    buildings.push({
      id: `b_${regionId}_imperial_guard`,
      name: 'Cuartel de la Guardia Imperial',
      type: 'Sede de Facción',
      district: 'Distrito Marcial',
      description: 'Los Espectros Imperiales y la Guardia del Dragón protegen el trono.',
      tier: 5,
      factionAffinity: 'fac_corte'
    });
  }

  return buildings;
}