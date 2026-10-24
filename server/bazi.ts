// server/bazi.ts
export interface BaZiResult {
  elements: { metal: number; wood: number; water: number; fire: number; earth: number };
  primaryElement: 'Oro' | 'Madera' | 'Agua' | 'Fuego' | 'Tierra';
  affinity: 'Ortodoxo' | 'Heterodoxo' | 'Demoniaco';
}

export function calculateBaZi(year: number, month: number, day: number, hour: number): BaZiResult {
  // Lógica simplificada para el MVP. 
  // En el futuro, aquí va el cálculo real de los 4 pilares (Year, Month, Day, Hour).
  const seed = year + month * 100 + day * 10000 + hour * 1000000;
  
  // Usamos un hash básico para simular la determinación
  const hash = Math.abs(Math.sin(seed) * 10000);
  
  const elements = {
    metal: Math.floor(hash % 100),
    wood: Math.floor((hash * 2) % 100),
    water: Math.floor((hash * 3) % 100),
    fire: Math.floor((hash * 4) % 100),
    earth: Math.floor((hash * 5) % 100),
  };

  // El elemento más alto define la afinidad
  const maxElement = Object.keys(elements).reduce((a, b) => elements[a as keyof typeof elements] > elements[b as keyof typeof elements] ? a : b);
  
  let primaryElement: any = 'Tierra';
  let affinity: any = 'Ortodoxo';

  switch (maxElement) {
    case 'metal': primaryElement = 'Oro'; affinity = 'Ortodoxo'; break;
    case 'wood': primaryElement = 'Madera'; affinity = 'Ortodoxo'; break;
    case 'water': primaryElement = 'Agua'; affinity = 'Heterodoxo'; break;
    case 'fire': primaryElement = 'Fuego'; affinity = 'Demoniaco'; break;
    case 'earth': primaryElement = 'Tierra'; affinity = 'Ortodoxo'; break;
  }

  return { elements, primaryElement, affinity };
}