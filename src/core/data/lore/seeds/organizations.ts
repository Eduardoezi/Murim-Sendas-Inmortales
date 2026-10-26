import { Faction } from '../types';

export const MAIN_ORGANIZATIONS: Faction[] = [
  {
    id: 'org_black_water_bandits', name: 'Bandidos del Agua Negra', type: 'Organización',
    alignment: 'Heterodoxa', element: 'Agua', powerLevel: 6, territory: 'prov_hunan',
    description: 'Asaltantes de barcos fluviales. Sobornan a los funcionarios locales para operar.'
  },
  {
    id: 'org_blood_daggers', name: 'Hermandad de las Dagas Sangrientas', type: 'Organización',
    alignment: 'Demoníaca', element: 'Viento', powerLevel: 9, territory: 'prov_xinjiang',
    description: 'Gremio de asesinos de élite. Solo aceptan contratos sobre cultivadores de alto rango.'
  },
  {
    id: 'org_crimson_lantern', name: 'Pabellón de la Linterna Carmesí', type: 'Organización',
    alignment: 'Neutral', element: 'Fuego', powerLevel: 5, territory: 'prov_jiangsu',
    description: 'Un famoso burdel que sirve como tapadera para el espionaje y el tráfico de información.'
  },
  {
    id: 'org_flesh_market', name: 'Mercado de Carne de la Frontera', type: 'Organización',
    alignment: 'Demoníaca', element: 'Tierra', powerLevel: 6, territory: 'prov_yunnan',
    description: 'Esclavistas que capturan cultivadores débiles para venderlos en los cultos demoníacos.'
  },
  {
    id: 'org_ghost_network', name: 'Red de la Sombra Fantasmal', type: 'Organización',
    alignment: 'Neutral', element: 'Madera', powerLevel: 8, territory: 'prov_hebei',
    description: 'Una red de espías que vende secretos al mejor postor, incluso entre sectas ortodoxas.'
  },
  // ... (Añade más aquí)
];