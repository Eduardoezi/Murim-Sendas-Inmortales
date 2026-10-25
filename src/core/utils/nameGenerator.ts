// Generador de nombres chinos (Apellido + Nombre)
const SURNAMES = ['Li', 'Wang', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao', 'Lin', 'Luo'];
const GIVEN_NAMES_MALE = ['Wei', 'Feng', 'Long', 'Jian', 'Ming', 'Hao', 'Chen', 'Xiang', 'Tian', 'Yu', 'Jun', 'Bo'];
const GIVEN_NAMES_FEMALE = ['Yan', 'Xue', 'Mei', 'Lin', 'Qing', 'Yue', 'Hua', 'Jing', 'Fang', 'Rou', 'Xin', 'Lian'];

export function generateRandomName(gender: 'male' | 'female' | 'random' = 'random'): string {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const pool = gender === 'male' ? GIVEN_NAMES_MALE : gender === 'female' ? GIVEN_NAMES_FEMALE : [...GIVEN_NAMES_MALE, ...GIVEN_NAMES_FEMALE];
  const given = pool[Math.floor(Math.random() * pool.length)];
  return `${surname} ${given}`;
}