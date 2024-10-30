// utils/spellUtils.js

// Tablas de conjuros por nivel
export const clericSpellTable = [
  [0, 0, 0, 0, 0, 0, 0], // Nivel 1
  [1, 0, 0, 0, 0, 0, 0], // Nivel 2
  [2, 1, 0, 0, 0, 0, 0], // Nivel 3
  [2, 2, 0, 0, 0, 0, 0], // Nivel 4
  [2, 2, 1, 0, 0, 0, 0], // Nivel 5
  [2, 2, 2, 0, 0, 0, 0], // Nivel 6
  [2, 2, 2, 1, 0, 0, 0], // Nivel 7
  [2, 2, 2, 2, 1, 0, 0], // Nivel 8
  [3, 3, 2, 2, 2, 1, 0], // Nivel 9
  [3, 3, 3, 2, 2, 2, 1], // Nivel 10
];

export const mageSpellTable = [
  [1, 0, 0, 0, 0, 0, 0], // Nivel 1
  [2, 0, 0, 0, 0, 0, 0], // Nivel 2
  [3, 1, 0, 0, 0, 0, 0], // Nivel 3
  [3, 2, 0, 0, 0, 0, 0], // Nivel 4
  [4, 2, 1, 0, 0, 0, 0], // Nivel 5
  [4, 3, 2, 0, 0, 0, 0], // Nivel 6
  [4, 3, 2, 1, 0, 0, 0], // Nivel 7
  [4, 3, 3, 2, 1, 0, 0], // Nivel 8
  [4, 3, 3, 2, 2, 1, 0], // Nivel 9
  [4, 3, 3, 2, 2, 2, 1], // Nivel 10
];

// Lista completa de conjuros divinos
export const divineSpells = [
  {
    name: "Curar Heridas Ligeras",
    level: 1,
    range: "Cercano",
    description: "Cura 1d8 PG a un objetivo",
    effect: (target) => ({ type: "heal", amount: "1d8" }),
  },
  {
    name: "Detectar el Mal",
    level: 1,
    range: "Cercano",
    description: "Todo lo malvado brilla durante 5 minutos",
    effect: () => ({ type: "detect", duration: 5 }),
  },
  // ... resto de conjuros divinos de nivel 1

  {
    name: "Bendición",
    level: 2,
    range: "Cercano",
    description:
      "Aliados Cercanos reciben +1 a los atributos para ataques y salvaciones",
    effect: () => ({ type: "buff", bonus: 1, duration: 60 }),
  },
  // ... resto de conjuros divinos
];

// Lista completa de conjuros arcanos
export const arcaneSpells = [
  {
    name: "Proyectil Mágico",
    level: 1,
    range: "Lejano",
    description: "1d4 daño por nivel",
    effect: (casterLevel) => ({ type: "damage", amount: `${casterLevel}d4` }),
  },
  {
    name: "Detectar Magia",
    level: 1,
    range: "Cercano",
    description: "Todo lo mágico brilla durante 5 minutos",
    effect: () => ({ type: "detect", duration: 5 }),
  },
  // ... resto de conjuros arcanos de nivel 1

  {
    name: "Invisibilidad",
    level: 2,
    range: "Cercano",
    description: "El objetivo se vuelve invisible hasta que ataque",
    effect: () => ({ type: "invisibility", duration: "special" }),
  },
  // ... resto de conjuros arcanos
];

// Funciones auxiliares para los conjuros
export const calculateSpellDamage = (spell, casterLevel) => {
  const [diceCount, diceType] = spell.damage.split("d");
  let totalDamage = 0;

  // Si el conjuro escala con nivel
  const effectiveDiceCount = spell.scaling
    ? parseInt(diceCount) * casterLevel
    : parseInt(diceCount);

  for (let i = 0; i < effectiveDiceCount; i++) {
    totalDamage += Math.floor(Math.random() * parseInt(diceType)) + 1;
  }

  return totalDamage;
};

export const calculateHealing = (spellHealing) => {
  const [diceCount, diceType] = spellHealing.split("d");
  let total = 0;

  for (let i = 0; i < parseInt(diceCount); i++) {
    total += Math.floor(Math.random() * parseInt(diceType)) + 1;
  }

  if (spellHealing.includes("+")) {
    const modifier = parseInt(spellHealing.split("+")[1]);
    total += modifier;
  }

  return total;
};

export const applyHealing = (target, amount, maxHp) => {
  const newHp = Math.min(target.hp.current + amount, maxHp);
  return {
    ...target,
    hp: {
      ...target.hp,
      current: newHp,
    },
  };
};

export const handleHealingEffect = (spell, target) => {
  switch (spell.effect) {
    case "remove_disease":
      return {
        ...target,
        conditions: target.conditions?.filter((c) => c !== "diseased") || [],
      };
    case "remove_poison":
      return {
        ...target,
        conditions: target.conditions?.filter((c) => c !== "poisoned") || [],
        temporaryEffects: [
          ...(target.temporaryEffects || []),
          {
            type: "poison_immunity",
            duration: 10,
          },
        ],
      };
    default:
      return target;
  }
};

// Funciones de validación
export const isHealingSpell = (spell) => {
  return spell?.type === "healing";
};

export const isDamageSpell = (spell) => {
  return spell?.type === "damage";
};

export const isUtilitySpell = (spell) => {
  return spell?.type === "utility";
};

// Función para obtener todos los conjuros disponibles para una clase
export const getAvailableSpells = (characterClass, level) => {
  const allSpells = [...divineSpells, ...arcaneSpells];

  // Filtrar por clase y nivel
  return allSpells.filter((spell) => {
    if (characterClass === "Clérigo") {
      return (
        spell.level <= level &&
        (spell.type === "healing" || spell.type === "utility")
      );
    } else if (characterClass === "Hechicero") {
      return spell.level <= level;
    }
    return false;
  });
};

// Función para validar objetivos
export const getValidSpellTargets = (
  spell,
  caster,
  gameState,
  distanceToTarget
) => {
  if (isHealingSpell(spell)) {
    return gameState.characters.filter(
      (char) =>
        char.hp.current > 0 && // Vivo
        char.hp.current < char.hp.max && // Necesita curación
        distanceToTarget(char) <= 18 // Rango Cercano
    );
  } else if (isDamageSpell(spell)) {
    return gameState.monsters.filter(
      (monster) =>
        monster.hp.current > 0 && // Vivo
        distanceToTarget(monster) <= getSpellRange(spell)
    );
  }
  return [];
};

// Función para obtener el rango en metros
export const getSpellRange = (spell) => {
  switch (spell.range) {
    case "Inmediato":
      return 1.5;
    case "Cercano":
      return 18;
    case "Lejano":
      return 36;
    case "Distante":
      return 72;
    default:
      return 18;
  }
};
