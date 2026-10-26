// src/core/data/world/types.ts

export type BiomeType = 'Bosque' | 'Montaña' | 'Desierto' | 'Pantano' | 'Nieve' | 'Costa' | 'Estepa';
export type QiDensity = 'Baja' | 'Media' | 'Alta' | 'Grado Cielo' | 'Grado Primordial';
export type SettlementType = 'Capital' | 'Ciudad' | 'Pueblo' | 'Aldea' | 'Fortaleza' | 'Monasterio';
export type POIType = 'Mazmorra' | 'Cueva' | 'Caverna' | 'Ruina' | 'Coto de Caza' | 'Mina' | 'Templo Antiguo';
export type RouteType = 'Camino Real' | 'Senda' | 'Ruta Comercial' | 'Paso de Montaña';

export interface ProvinceSeedData {
  id: string;
  name: string;
  region: 'Corazón Imperial' | 'Fronteras Oeste' | 'Dominio Norte' | 'Litoral Este' | 'Tierras Sur';
  biome: BiomeType;
  coords: { x: number; y: number };
  baseDifficulty: number;
  description: string;
}

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  weight: number;
  qiDensityModifier: number;
  movementCost: number;
  hazardLevel: number;
  availableFauna: string[];
  availableFlora: string[];
  description: string;
}

export interface Province {
  id: string;
  name: string;
  biome: BiomeType;
}

export interface Point {
  x: number;
  y: number;
}