export interface CharacterData {
  name: string;
  gender: string;
  lineage: string;
  origin: string;
  faction?: string;
  weapon?: string;
  physique: string;
  scar: string;
  oath: string;
}

export function generateBackstory(data: CharacterData): string {
  const { name, lineage, origin, faction, weapon, physique, scar, oath } = data;
  
  let originText = '';
  if (origin === 'Errante') originText = `viajaste solo por los caminos polvorientos del Jianghu armado únicamente con tu ${weapon || 'puño'}`;
  else if (origin === 'Discípulo') originText = `fuiste aceptado como discípulo externo en la ${faction || 'secta'}`;
  else if (origin === 'Hijo de Clan') originText = `naciste entre sedas y conspiraciones en el seno del ${faction || 'Clan Noble'}`;

  return `Naciste con el linaje de los ${lineage}. Desde el vientre, el cielo marcó tu destino: ${physique}. \n\nCuando apenas contabas con dieciséis inviernos, la desgracia golpeó tu vida: ${scar}. Fue en ese momento de oscuridad cuando juraste ante los cielos: ${oath}. \n\nPara cumplir tu juramento, ${originText}. Ahora, el Qi del mundo fluye a tu alrededor, y tu viaje hacia la inmortalidad apenas comienza.`;
}