// server/game/dynamicMissions.ts
import { FactionMission } from '../../src/data/worldData';

// Generador pseudoaleatorio basado en semilla (Fecha + Facción)
export function generateDailyMissions(factionId: string, dateStr: string): FactionMission[] {
  let seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + factionId.length;
  
  const random = () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const templates = [
    { type: 'Caza', title: 'Cacería de Bestias', target: 'prov_xinjiang', desc: 'Las bestias están atacando las caravanas. Elimínalas.', minLvl: 1, baseStones: 150, baseRep: 10, baseTime: 30 },
    { type: 'Recolección', title: 'Recolección de Hierbas', target: 'prov_yunnan', desc: 'Necesitamos suministros médicos urgentes de la selva.', minLvl: 1, baseStones: 120, baseRep: 8, baseTime: 20 },
    { type: 'Viaje', title: 'Escolta de Mercancías', target: 'prov_hebei', desc: 'Protege el cargamento de seda hasta la capital.', minLvl: 2, baseStones: 300, baseRep: 15, baseTime: 60 },
    { type: 'Cultivo', title: 'Purificación de Venas', target: 'prov_shaanxi', desc: 'Ayuda a limpiar una veta de Qi corrompida.', minLvl: 3, baseStones: 500, baseRep: 25, baseTime: 90 },
    { type: 'Caza', title: 'Eliminación de Espectros', target: 'prov_henan', desc: 'Fantasmas rondan el templo. Purifícalos.', minLvl: 4, baseStones: 800, baseRep: 40, baseTime: 120 }
  ];

  const numMissions = 3 + Math.floor(random() * 3); // 3 a 5 misiones
  const missions: FactionMission[] = [];

  for (let i = 0; i < numMissions; i++) {
    const template = templates[Math.floor(random() * templates.length)];
    const difficultyMult = 1 + Math.floor(random() * 3); // 1, 2 o 3 (Fácil, Medio, Difícil)
     
    // Nombres aleatorios
    const regions = ['prov_xinjiang', 'prov_sichuan', 'prov_hebei', 'prov_jiangsu', 'prov_yunnan', 'prov_henan'];
    const targetRegion = regions[Math.floor(random() * regions.length)];

    missions.push({
      id: `mis_${factionId}_${dateStr.replace(/-/g, '')}_${i}`,
      factionId,
      title: `${template.title} (${difficultyMult === 1 ? 'Fácil' : difficultyMult === 2 ? 'Medio' : 'Difícil'})`,
      description: `${template.desc} Recompensa otorgada por la facción.`,
      difficulty: difficultyMult === 1 ? 'Fácil' : difficultyMult === 2 ? 'Medio' : 'Difícil',
      rewardStones: template.baseStones * difficultyMult,
      rewardReputation: template.baseRep * difficultyMult,
      requiredRealmLevel: template.minLvl + difficultyMult - 1,
      // Datos extras para simular tiempo
      durationMinutes: template.baseTime * difficultyMult,
      targetRegionId: targetRegion
    });
  }

  return missions;
}