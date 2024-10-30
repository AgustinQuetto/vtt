// utils/gameState.js
export const initialGameState = {
  characters: [
    {
      id: `C1`,
      name: "Thorgrim",
      class: "Guerrero",
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
    },
    {
      id: `C2`,
      name: "Elara",
      class: "Hechicero",
      avatar:
        "https://i.etsystatic.com/40173929/r/il/5f64a8/4498858790/il_fullxfull.4498858790_8b00.jpg",
      level: 1,
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
      // ... otros atributos del personaje
      spellsRemaining: {
        1: 2, // Nivel 1: 2 espacios
        2: 1, // Nivel 2: 1 espacio
        // etc.
      }, // Espacios de conjuro por nivel
      memorizedSpells: [], // Conjuros memorizados
      spellbook: [], // Lista de conjuros conocidos
    },
  ],
  monsters: [
    {
      id: `M1`,
      name: "Ghoul",
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
