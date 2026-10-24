import { Cultivator, Item, Meridian } from '../../src/types/game';
import { savePlayer } from './player';

interface ActionResult {
  success: boolean;
  message: string;
  updatedPlayer: Cultivator;
}

/**
 * MEDITAR: Gana Qi y pureza de Dantian.
 * Reglas:
 *  - Qi: +25 (clamp a maxQi).
 *  - Pureza: +1 (clamp 100).
 */
export function processMeditate(player: Cultivator): ActionResult {
  const qiGain = 25;
  const purityGain = player.dantianPurity < 100 ? 1 : 0;

  const newQi = Math.min(player.maxQi, player.qi + qiGain);
  const newPurity = Math.min(100, player.dantianPurity + purityGain);

  const updatedPlayer: Cultivator = {
    ...player,
    qi: newQi,
    dantianPurity: newPurity,
  };

  savePlayer(updatedPlayer);

  return {
    success: true,
    message: `Meditas en el Dao: +${qiGain} Qi${purityGain ? `, +${purityGain}% Pureza` : ''}.`,
    updatedPlayer,
  };
}

/**
 * ASIGNAR PUNTO DE ATRIBUTO.
 * Reglas:
 *  - Debe tener freeAttributePoints > 0.
 *  - Recalcula derivados (maxHp, baseAttack, baseDefense, spiritSense).
 */
export function processAllocateAttributePoint(
  player: Cultivator,
  attrKey: keyof Cultivator['attributes']
): ActionResult {
  if (player.freeAttributePoints <= 0) {
    return { success: false, message: 'No tienes puntos de atributo libres.', updatedPlayer: player };
  }

  const currentAttrs = player.attributes || {
    fuerza: 16, destreza: 16, constitucion: 16, inteligencia: 16,
    percepcion: 16, astucia: 14, voluntad: 16, suerte: 12, carisma: 14, sabiduria: 16,
  };

  const newAttrs = { ...currentAttrs, [attrKey]: (currentAttrs[attrKey] || 10) + 1 };
  const levelMultiplier = player.subRealm || 1;

  const newMaxHp = 50 + (newAttrs.constitucion * 12) + (levelMultiplier * 20);
  const newBaseAttack = Math.floor((newAttrs.fuerza * 2) + (newAttrs.destreza * 1.5));
  const newBaseDefense = Math.floor((newAttrs.constitucion * 2) + (newAttrs.voluntad * 0.5));
  const newSpiritSense = Math.floor(
    (newAttrs.percepcion * 2) + (newAttrs.sabiduria * 1.5) + (newAttrs.voluntad * 0.5) + (levelMultiplier * 10)
  );

  const updatedPlayer: Cultivator = {
    ...player,
    freeAttributePoints: player.freeAttributePoints - 1,
    attributes: newAttrs,
    maxHp: newMaxHp,
    hp: Math.min(player.hp + 12, newMaxHp),
    baseAttack: newBaseAttack,
    baseDefense: newBaseDefense,
    spiritSense: newSpiritSense,
  };

  savePlayer(updatedPlayer);

  return {
    success: true,
    message: `Has canalizado 1 punto hacia ${attrKey}.`,
    updatedPlayer,
  };
}

/**
 * DESBLOQUEAR MERIDIANO.
 * Reglas:
 *  - Debe existir y no estar desbloqueado.
 *  - Qi >= meridian.qiCost.
 */
export function processUnlockMeridian(player: Cultivator, meridianId: string): ActionResult {
  const target = (player.meridians || []).find((m) => m.id === meridianId);
  if (!target) {
    return { success: false, message: 'Meridiano no encontrado.', updatedPlayer: player };
  }
  if (target.unlocked) {
    return { success: false, message: 'Este meridiano ya está desbloqueado.', updatedPlayer: player };
  }
  if (player.qi < target.qiCost) {
    return {
      success: false,
      message: `Qi insuficiente. Requieres ${target.qiCost} Qi (tienes ${player.qi}).`,
      updatedPlayer: player,
    };
  }

  const updatedMeridians: Meridian[] = player.meridians.map((m) =>
    m.id === meridianId ? { ...m, unlocked: true } : m
  );

  let extraHp = 0;
  let extraAtk = 0;
  let extraDef = 0;
  let extraSpirit = 0;
  let extraSpeed = 0;

  if (target.bonusType === 'hp') extraHp = target.bonusValue;
  if (target.bonusType === 'attack') extraAtk = target.bonusValue;
  if (target.bonusType === 'defense') extraDef = target.bonusValue;
  if (target.bonusType === 'spirit') extraSpirit = target.bonusValue;
  if (target.bonusType === 'speed') extraSpeed = target.bonusValue;

  const updatedPlayer: Cultivator = {
    ...player,
    qi: player.qi - target.qiCost,
    hp: player.hp + extraHp,
    maxHp: player.maxHp + extraHp,
    baseAttack: player.baseAttack + extraAtk,
    baseDefense: player.baseDefense + extraDef,
    spiritPower: player.spiritPower + extraSpirit,
    speed: player.speed + extraSpeed,
    meridians: updatedMeridians,
    stats: {
      ...player.stats,
      meridiansOpened: (player.stats?.meridiansOpened || 0) + 1,
    },
  };

  savePlayer(updatedPlayer);

  return {
    success: true,
    message: `Has abierto el ${target.name}. ${target.bonus}`,
    updatedPlayer,
  };
}

/**
 * INTENTO DE AVANCE (TRIBULACIÓN).
 * Reglas:
 *  - Qi >= maxQi * 0.9.
 *  - Probabilidad = dantianPurity.
 *  - Si falla: Qi * 0.4, Hp * 0.7 (min 10).
 */
export function processBreakthrough(player: Cultivator): ActionResult {
  if (player.qi < player.maxQi * 0.9) {
    return {
      success: false,
      message: 'Tu Dantian aún no está lo suficientemente repleto de Qi puro para forzar el avance.',
      updatedPlayer: player,
    };
  }

  const roll = Math.random() * 100;
  const successThreshold = player.dantianPurity;

  if (roll <= successThreshold) {
    let newSubRealm = player.subRealm + 1;
    let newRealm = player.realm;

    if (newSubRealm > 9) {
      newSubRealm = 1;
      if (player.realm === 'Condensación de Qi') newRealm = 'Fundación Espiritual';
      else if (player.realm === 'Fundación Espiritual') newRealm = 'Núcleo Dorado';
      else if (player.realm === 'Núcleo Dorado') newRealm = 'Alma Naciente';
      else if (player.realm === 'Alma Naciente') newRealm = 'Ascensión Inmortal';
    }

    const updatedPlayer: Cultivator = {
      ...player,
      realm: newRealm,
      subRealm: newSubRealm,
      maxQi: player.maxQi + 100,
      qi: player.maxQi + 100,
      maxHp: player.maxHp + 80,
      hp: player.maxHp + 80,
      baseAttack: player.baseAttack + 14,
      baseDefense: player.baseDefense + 10,
      spiritPower: player.spiritPower + 12,
    };

    savePlayer(updatedPlayer);

    return {
      success: true,
      message: `¡Tribulación superada! Has alcanzado ${newRealm} · Capa ${newSubRealm}.`,
      updatedPlayer,
    };
  } else {
    const updatedPlayer: Cultivator = {
      ...player,
      qi: Math.floor(player.qi * 0.4),
      hp: Math.max(10, Math.floor(player.hp * 0.7)),
    };

    savePlayer(updatedPlayer);

    return {
      success: false,
      message: '¡Reacción violenta de Qi en los meridianos! Has sufrido daño interno, pero tu voluntad persevera.',
      updatedPlayer,
    };
  }
}

/**
 * EQUIPAR OBJETO (arma, armadura, artefacto).
 * Reglas:
 *  - Debe existir en inventario.
 *  - Categoría debe ser weapon/armor/artifact.
 */
export function processEquipGear(player: Cultivator, itemId: string): ActionResult {
  const item = player.inventory.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, message: 'Objeto no encontrado en tu inventario.', updatedPlayer: player };
  }

  const validCategories: Item['category'][] = ['weapon', 'armor', 'artifact'];
  if (!validCategories.includes(item.category)) {
    return { success: false, message: 'Este objeto no se puede equipar.', updatedPlayer: player };
  }

  const updatedGear = { ...player.equippedGear };
  if (item.category === 'weapon') updatedGear.weapon = item;
  if (item.category === 'armor') updatedGear.armor = item;
  if (item.category === 'artifact') updatedGear.artifact = item;

  const updatedPlayer: Cultivator = {
    ...player,
    equippedGear: updatedGear,
  };

  savePlayer(updatedPlayer);

  return {
    success: true,
    message: `Has equipado «${item.name}».`,
    updatedPlayer,
  };
}

/**
 * CONSUMIR PÍLDORA.
 * Reglas:
 *  - Debe existir en inventario.
 *  - Categoría pill.
 */
export function processConsumePill(player: Cultivator, itemId: string): ActionResult {
  const pill = player.inventory.find((i) => i.id === itemId);
  if (!pill) {
    return { success: false, message: 'Píldora no encontrada.', updatedPlayer: player };
  }
  if (pill.category !== 'pill') {
    return { success: false, message: 'Este objeto no es consumible.', updatedPlayer: player };
  }

  const boost = pill.cultivationBoost || 100;
  const filteredInv = player.inventory.filter((i) => i.id !== itemId);

  const updatedPlayer: Cultivator = {
    ...player,
    qi: Math.min(player.maxQi, player.qi + boost),
    hp: Math.min(player.maxHp, player.hp + Math.floor(boost * 0.5)),
    dantianPurity: Math.min(100, player.dantianPurity + 5),
    inventory: filteredInv,
  };

  savePlayer(updatedPlayer);

  return {
    success: true,
    message: `Has ingerido «${pill.name}». +${boost} Qi.`,
    updatedPlayer,
  };
}