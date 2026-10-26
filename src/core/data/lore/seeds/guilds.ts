import { Faction } from '../types';

export const MAIN_GUILDS: Faction[] = [
  // --- GREMIOS DE RECOLECCIÓN Y CAZA ---
  {
    id: 'guild_hunters', name: 'Gremio de Cazadores de Bestias', type: 'Gremio',
    alignment: 'Neutral', element: 'Tierra', powerLevel: 7, territory: 'prov_henan',
    description: 'Proveen núcleos de bestias y pieles a las sectas. Tienen un código estricto de no cazar crías.'
  },
  {
    id: 'guild_gatherers', name: 'Hermandad de Recolectores de Hierbas', type: 'Gremio',
    alignment: 'Ortodoxa', element: 'Madera', powerLevel: 6, territory: 'prov_sichuan',
    description: 'Conocen cada rincón de los bosques y montañas. Los alquimistas dependen de ellos.'
  },
  // --- GREMIOS DE PROTECCIÓN ---
  {
    id: 'guild_escorts', name: 'Compañía de Escoltas de la Ruta de la Seda', type: 'Gremio',
    alignment: 'Neutral', element: 'Metal', powerLevel: 8, territory: 'prov_gansu',
    description: 'Veteranos mercenarios que protegen caravanas a través de los desiertos y montañas mortales.'
  },
  // --- GREMIOS DE ARTESANOS ---
  {
    id: 'guild_forgers', name: 'Forja Unida de los Cien Martillos', type: 'Gremio',
    alignment: 'Neutral', element: 'Fuego', powerLevel: 8, territory: 'prov_shanxi',
    description: 'Forjadores de armas espirituales de grado Tierra y Alma. No venden a demoníacos.'
  },
  {
    id: 'guild_alchemists', name: 'Gremio de Alquimistas de la Montaña', type: 'Gremio',
    alignment: 'Neutral', element: 'Agua', powerLevel: 7, territory: 'prov_hubei',
    description: 'Regulan el mercado de píldoras del imperio. Protegen celosamente sus recetas.'
  },
  // --- GREMIOS COMERCIALES ---
  {
    id: 'guild_merchants', name: 'Cámara de Comercio Fluvial', type: 'Gremio',
    alignment: 'Neutral', element: 'Agua', powerLevel: 7, territory: 'prov_jiangsu',
    description: 'Controlan el tráfico marítimo de Jiangsu. Financian a los clanes nobles.'
  },
  // ... (Aquí puedes añadir gremios de pescadores, sastres, constructores, etc.)
];