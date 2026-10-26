import { Faction } from '../types';

export const MAIN_CULTS: Faction[] = [
  {
    id: 'cult_heavenly_demon',
    name: 'Culto Divino del Demonio Celestial (天魔教)',
    type: 'Culto',
    alignment: 'Demoníaca',
    element: 'Fuego',
    description: 'La organización demoníaca más poderosa del mundo. Buscan la libertad absoluta y la supremacía del Arte del Demonio Celestial.',
    powerLevel: 10,
    territory: 'prov_xinjiang'
  },
  {
    id: 'cult_blood',
    name: 'Culto de la Sangre (血魔教)',
    type: 'Culto',
    alignment: 'Demoníaca',
    element: 'Agua',
    description: 'Practicantes de artes sanguinarias que absorben la vitalidad y el Qi de otros cultivadores para acelerar su poder.',
    powerLevel: 9,
    territory: 'prov_qinghai'
  },
  {
    id: 'cult_divine_wind',
    name: 'Culto del Viento Divino (神風教)',
    type: 'Culto',
    alignment: 'Demoníaca',
    element: 'Viento',
    description: 'Asesinos y espías que utilizan ráfagas de viento cortante y técnicas de sigilo sobrenatural para diezmar facciones enteras.',
    powerLevel: 8,
    territory: 'prov_gansu'
  },
  {
    id: 'cult_blood_spirit',
    name: 'Palacio de la Sangre y los Espíritus (血靈宮)',
    type: 'Culto',
    alignment: 'Demoníaca',
    element: 'Metal',
    description: 'Nigromantes que controlan cadáveres refinados como marionetas de combate y recolectan almas en batallas masivas.',
    powerLevel: 8,
    territory: 'prov_hubei'
  },
  {
    id: 'cult_divine_corpse',
    name: 'Culto del Cadáver Divino (神屍教)',
    type: 'Culto',
    alignment: 'Demoníaca',
    element: 'Tierra',
    description: 'Dedicados al refinamiento de cuerpos poderosos hasta convertirlos en "Cadáveres Dorados" inmortales.',
    powerLevel: 8,
    territory: 'prov_shanxi'
  }
];