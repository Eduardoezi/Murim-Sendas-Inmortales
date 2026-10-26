// src/core/data/world/seeds/buildingTemplates.ts
import { BiomeType } from '../seeds/biomes';

export interface BuildingTemplate {
  type: string;
  description: string;
  allowedBiomes?: BiomeType[]; // Opcional: restricciones
}

export const BUILDING_TEMPLATES: Record<number, BuildingTemplate[]> = {
  // Tier 1 (Aldea / Pobre)
  1: [
    { type: 'Mercado', description: 'Un mercado modesto con bienes locales.' },
    { type: 'Forja', description: 'Un lugar caluroso donde el metal y el Qi se entrelazan.' },
    { type: 'Taberna', description: 'Rumores, alcohol barato y mercenarios buscando trabajo.' },
  ],
  // Tier 2 (Pueblo / Moderado)
  2: [
    { type: 'Mercado', description: 'Comercio de seda, carbón y minerales.' },
    { type: 'Forja', description: 'Forja de acero de alta calidad.' },
    { type: 'Taberna', description: 'El punto de encuentro de los viajeros.' },
    { type: 'Alquimista', description: 'Venden píldoras y hierbas medicinales.' },
    { type: 'Posada', description: 'Un lugar para descansar y recuperar Qi.' },
  ],
  // Tier 3 (Ciudad / Próspero)
  3: [
    { type: 'Gran Bazar', description: 'Un hervidero de comerciantes. Aquí se mueve la economía.' },
    { type: 'Forja de Élite', description: 'Armas de grado Tierra y Alma.' },
    { type: 'Casa de Té', description: 'Té refinado para elevar la conciencia.', allowedBiomes: ['Bosque', 'Estepa', 'Costa'] },
    { type: 'Alquimista Mayor', description: 'Destilación de píldoras milagrosas.' },
    { type: 'Casa de Subastas', description: 'Comercia artefactos raros y píldoras celestiales.' },
    { type: 'Burdel', description: 'Información, placer y secretos del Jianghu.' },
  ],
  // Tier 4 (Capital / Opulento)
  4: [
    { type: 'Mercado Imperial', description: 'El epicentro comercial del imperio.' },
    { type: 'Forja Celestial', description: 'Solo los mejores maestros forjan aquí.' },
    { type: 'Pabellón de Medicina', description: 'Sanación de heridas de grado celestial.' },
    { type: 'Casa de Subastas Real', description: 'Reliquias únicas y tesoros de reyes.' },
    { type: 'Sede de Facción', description: 'El poder político y marcial de la región.' },
    { type: 'Coliseo de Duelos', description: 'Donde los cultivadores dirimen sus disputas.' },
    { type: 'Biblioteca Ancestral', description: 'Manuales de técnicas perdidas.' },
  ],
};