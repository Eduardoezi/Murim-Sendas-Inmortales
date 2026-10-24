// src/data/proceduralGenerator.ts

// 1. Generador de Números Pseudoaleatorios basado en Semilla
export function seededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return function() {
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return hash / 4294967296;
  };
}

export type POIType = 'Ciudad' | 'Mazmorra' | 'Ruina' | 'Secta' | 'Recurso';

export interface PointOfInterest {
  id: string;
  name: string;
  type: POIType;
  description: string;
  levelRequired: number;
  coords: { x: number; y: number }; // Porcentaje (0-100) en el mapa local
}

// 2. Generador de Puntos de Interés (POIs)
export function generateProvincePOIs(
  provinceId: string, 
  wealthLevel: string, 
  threatLevel: number
): PointOfInterest[] {
  const random = seededRandom(`seed_${provinceId}`);
  const pois: PointOfInterest[] = [];

  // Cuántos POIs hay en esta provincia (entre 6 y 12)
  const numPOIs = 6 + Math.floor(random() * 7); 

  const names = {
    Ciudad: ['Ciudad Imperial', 'Puerto Comercial', 'Villa Amurallada', 'Ciudadela de Jade'],
    Mazmorra: ['Tumba del Dragón', 'Cavernas de la Sombra', 'Ruinas del Culto', 'Abismo Olvidado'],
    Ruina: ['Templo en Ruinas', 'Campo de Batalla Antiguo', 'Aldea Abandonada', 'Altar Destrozado'],
    Secta: ['Pico de la Espada', 'Valle de la Medicina', 'Monasterio Oculto', 'Templo del Trueno'],
    Recurso: ['Mina de Jade', 'Bosque de Hierbas', 'Veta de Cristal', 'Manantial de Qi']
  };

  for (let i = 0; i < numPOIs; i++) {
    const types: POIType[] = ['Ciudad', 'Mazmorra', 'Ruina', 'Secta', 'Recurso'];
    let type = types[Math.floor(random() * types.length)];
    
    // Reglas del mundo:
    // Si es rico, más ciudades. Si es pobre, más ruinas.
    if (wealthLevel === 'Opulento' && type === 'Ruina') type = 'Ciudad';
    if (wealthLevel === 'Pobre' && type === 'Ciudad') type = 'Ruina';
    
    // Si es muy peligroso, más mazmorras.
    if (threatLevel > 7 && type === 'Recurso') type = 'Mazmorra';

    const nameList = names[type as keyof typeof names] || ['Lugar Desconocido'];
    const baseName = nameList[Math.floor(random() * nameList.length)];

    // Calcular nivel de peligro local (basado en la provincia)
    const localLevel = Math.max(1, Math.floor(random() * threatLevel * 3) + 1);

    pois.push({
      id: `${provinceId}_poi_${i}`,
      name: `${baseName} de ${provinceId.replace('prov_', '').toUpperCase()}`,
      type,
      description: `Un lugar de tipo ${type} descubierto en la región. Nivel de amenaza local: ${localLevel}.`,
      levelRequired: localLevel,
      // Posición en el mapa local (dejamos un margen del 10% para que no se salgan)
      coords: { 
        x: 15 + (random() * 70), 
        y: 15 + (random() * 70) 
      }
    });
  }

  // Añadimos SIEMPRE la capital de la provincia
  pois.unshift({
    id: `${provinceId}_capital`,
    name: `Capital de ${provinceId.replace('prov_', '').toUpperCase()}`,
    type: 'Ciudad',
    description: 'El centro neurálgico de la provincia. Aquí se encuentran los distritos principales.',
    levelRequired: 1,
    coords: { x: 50, y: 50 }
  });

  return pois;
}