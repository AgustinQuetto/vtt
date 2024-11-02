// utils/gameState.js
export const initialGameState = {
  characters: [
    {
      id: `C1`,
      name: "Thorgrim",
      class: "Guerrero",
      type: "character",
      avatar:
        "https://i.etsystatic.com/40957748/r/il/7cdb2f/5224864998/il_570xN.5224864998_6aoc.jpg",
      level: 1,
      speed: 9,
      attributes: {
        FUE: 16,
        DES: 12,
        CON: 14,
        INT: 8,
        SAB: 10,
        CAR: 11,
      },
      hp: {
        current: 28,
        max: 28,
      },
      armorPoints: {
        current: 8,
        max: 8,
      },
      position: { x: 10, y: 20 },
      inventory: [
        {
          name: "Espada larga",
          damage: "1d8",
          range: "inmediato",
        },
        { name: "Escudo", armorPoints: 2 },
      ],
      spellcaster: false,
      activeSpellEffects: [],
    },
    {
      id: `C2`,
      name: "Elara",
      class: "Hechicero",
      type: "character",
      avatar:
        "https://i.etsystatic.com/40173929/r/il/5f64a8/4498858790/il_fullxfull.4498858790_8b00.jpg",
      level: 3,
      speed: 4,
      attributes: {
        FUE: 8,
        DES: 14,
        CON: 10,
        INT: 17,
        SAB: 13,
        CAR: 12,
      },
      hp: {
        current: 16,
        max: 16,
      },
      armorPoints: {
        current: 2,
        max: 2,
      },
      position: { x: 12, y: 21 },
      inventory: [
        { name: "Vara", damage: "1d4" },
        { name: "Libro de conjuros" },
      ],
      spellcaster: true,
      spellsRemaining: {
        1: 2, // Nivel 1: 2 espacios
        2: 2, // Nivel 2: Sin espacios aún
        3: 3, // Nivel 3: Sin espacios aún
      },
      memorizedSpells: ["magicMissile", "shield", "fireball"], // Hechizos preparados
      spellbook: ["magicMissile", "shield", "detectMagic", "light", "fireball"], // Todos los hechizos conocidos
      spellAttributes: {
        castingAttribute: "INT", // Atributo principal para lanzar hechizos
        spellSaveDC: 12 + Math.floor((17 - 10) / 2), // Base 12 + modificador de INT
        spellHitBonus: Math.floor((17 - 10) / 2), // Modificador de INT
      },
      activeSpellEffects: [], // Efectos de hechizos activos en el personaje
    },
    {
      id: "C3",
      name: "Aldrich",
      class: "Clérigo",
      type: "character",
      avatar:
        "https://images.nightcafe.studio/jobs/dxEZI4yELsUaBGJeZ1yj/dxEZI4yELsUaBGJeZ1yj--1--u9tef.jpg?tr=w-1600,c-at_max",
      level: 1,
      speed: 6,
      attributes: {
        FUE: 12,
        DES: 10,
        CON: 14,
        INT: 10,
        SAB: 16,
        CAR: 12,
      },
      hp: {
        current: 20,
        max: 20,
      },
      armorPoints: {
        current: 6,
        max: 6,
      },
      position: { x: 11, y: 20 },
      inventory: [
        { name: "Maza", damage: "1d6" },
        { name: "Símbolo sagrado", type: "holy" },
      ],
      spellcaster: true,
      spellsRemaining: {
        1: 2,
        2: 2,
        3: 3,
      },
      memorizedSpells: ["cureWounds", "bless"],
      spellbook: ["cureWounds", "bless", "detectEvil", "light", "protection"],
      spellAttributes: {
        castingAttribute: "SAB",
        spellSaveDC: 12 + Math.floor((16 - 10) / 2),
        spellHitBonus: Math.floor((16 - 10) / 2),
      },
      activeSpellEffects: [],
    },
    {
      id: `M1`,
      name: "Ghoul",
      type: "monster",
      avatar:
        "https://cdn.openart.ai/published/T87VxORCfOcnblJHM9uu/2qeOeKOa_O-Wi_1024.webp",
      level: 2,
      speed: 6,
      attributes: {
        FUE: 16,
        DES: 12,
        CON: 14,
        INT: 8,
        SAB: 10,
        CAR: 11,
      },
      hp: {
        current: 12,
        max: 12,
      },
      armorPoints: {
        current: 1,
        max: 1,
      },
      position: { x: 15, y: 22 },
      attacks: [
        {
          name: "Garras",
          damage: "1d6",
          range: "inmediato",
          effect: "Parálisis",
        },
      ],
      activeSpellEffects: [],
    },
  ],
  mapElements: [
    { type: "wall", position: { x: 16, y: 18 } },
    { type: "door", position: { x: 16, y: 19 }, isOpen: false },
    {
      type: "difficult",
      position: { x: 16, y: 20 },
      description: "Terreno difícil",
    },
    { type: "hazard", position: { x: 16, y: 21 }, description: "Trampa" },
  ],
  gameLog: [],
};

// Función para aplicar efectos activos
export const applyActiveEffects = (character) => {
  let modifiedCharacter = { ...character };

  character.activeSpellEffects.forEach((effect) => {
    switch (effect.type) {
      case "attribute_modifier":
        modifiedCharacter = {
          ...modifiedCharacter,
          attributes: {
            ...modifiedCharacter.attributes,
            [effect.attribute]:
              modifiedCharacter.attributes[effect.attribute] + effect.value,
          },
        };
        break;
      case "temporary_hp":
        modifiedCharacter = {
          ...modifiedCharacter,
          hp: {
            ...modifiedCharacter.hp,
            temporary: (modifiedCharacter.hp.temporary || 0) + effect.value,
          },
        };
        break;
      case "armor_modifier":
        modifiedCharacter = {
          ...modifiedCharacter,
          armorPoints: {
            ...modifiedCharacter.armorPoints,
            current: modifiedCharacter.armorPoints.current + effect.value,
          },
        };
        break;
      // Añadir más tipos de efectos según sea necesario
    }
  });

  return modifiedCharacter;
};

// Ejemplo de estructura de efecto de hechizo
const spellEffectExample = {
  id: "bless-1",
  name: "Bendición",
  type: "attribute_modifier",
  attribute: "SAB",
  value: 2,
  source: "bless",
  caster: "C3",
  duration: {
    type: "turns",
    total: 3,
    remaining: 3,
  },
  // Para hechizos que requieren concentración
  concentration: {
    required: true,
    broken: false,
  },
};
