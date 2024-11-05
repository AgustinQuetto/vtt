export const INTERACTION_MODES = {
  DEFAULT: "default", // Modo normal, permite pan/zoom del mapa
  MOVEMENT: "movement", // Modo de movimiento de personajes/monstruos
  SPELL_TARGETING: {
    SINGLE: "spell_targeting_single", // Selección de objetivo único
    AREA: "spell_targeting_area", // Selección de área de efecto
    LINE: "spell_targeting_line", // Selección de línea (para rayos, etc.)
    CONE: "spell_targeting_cone", // Selección de cono
  },
  MEASURE: "measure", // Modo de medición de distancias
  DRAWING: "drawing", // Modo de dibujo en el mapa (para DM)
  TERRAIN_EDITING: "terrain_editing", // Modo de edición de terreno (para DM)
};

// Helper para verificar si estamos en algún modo de targeting de hechizos
export const isSpellTargetingMode = (mode) => {
  return Object.values(INTERACTION_MODES.SPELL_TARGETING).includes(mode);
};

// Helper para obtener el cursor apropiado según el modo
export const getModeCursor = (mode) => {
  switch (mode) {
    case INTERACTION_MODES.DEFAULT:
      return "default";
    case INTERACTION_MODES.MOVEMENT:
      return "grab";
    case INTERACTION_MODES.SPELL_TARGETING.SINGLE:
      return "crosshair";
    case INTERACTION_MODES.SPELL_TARGETING.AREA:
      return "cell";
    case INTERACTION_MODES.SPELL_TARGETING.LINE:
      return "crosshair";
    case INTERACTION_MODES.SPELL_TARGETING.CONE:
      return "crosshair";
    case INTERACTION_MODES.MEASURE:
      return "help";
    case INTERACTION_MODES.DRAWING:
      return "pencil";
    case INTERACTION_MODES.TERRAIN_EDITING:
      return "pointer";
    default:
      return "default";
  }
};

// Configuraciones específicas para cada modo
export const MODE_CONFIGS = {
  [INTERACTION_MODES.SPELL_TARGETING.AREA]: {
    areaColor: "#EF4444",
    areaOpacity: 0.2,
    lineColor: "#4B5563",
    lineWidth: 2,
    lineDash: [5, 10],
    rangeIndicatorColor: "#4B5563",
    rangeIndicatorOpacity: 0.1,
  },
  [INTERACTION_MODES.SPELL_TARGETING.LINE]: {
    lineColor: "#3B82F6",
    lineWidth: 3,
    lineOpacity: 0.6,
  },
  [INTERACTION_MODES.SPELL_TARGETING.CONE]: {
    fillColor: "#8B5CF6",
    fillOpacity: 0.3,
    borderColor: "#6D28D9",
    borderWidth: 2,
  },
  [INTERACTION_MODES.MEASURE]: {
    lineColor: "#059669",
    lineWidth: 2,
    lineDash: [4, 8],
    labelBackgroundColor: "rgba(0, 0, 0, 0.75)",
  },
};

// Textos descriptivos para cada modo
export const MODE_DESCRIPTIONS = {
  [INTERACTION_MODES.DEFAULT]: "Modo normal",
  [INTERACTION_MODES.MOVEMENT]: "Modo de movimiento",
  [INTERACTION_MODES.SPELL_TARGETING.SINGLE]: "Selecciona un objetivo",
  [INTERACTION_MODES.SPELL_TARGETING.AREA]:
    "Selecciona el centro del área de efecto",
  [INTERACTION_MODES.SPELL_TARGETING.LINE]:
    "Selecciona el punto inicial y final de la línea",
  [INTERACTION_MODES.SPELL_TARGETING.CONE]: "Selecciona la dirección del cono",
  [INTERACTION_MODES.MEASURE]: "Modo de medición",
  [INTERACTION_MODES.DRAWING]: "Modo de dibujo",
  [INTERACTION_MODES.TERRAIN_EDITING]: "Editando terreno",
};

// Permisos requeridos para cada modo
export const MODE_PERMISSIONS = {
  [INTERACTION_MODES.DEFAULT]: null,
  [INTERACTION_MODES.MOVEMENT]: "canMove",
  [INTERACTION_MODES.SPELL_TARGETING.SINGLE]: "canCastSpells",
  [INTERACTION_MODES.SPELL_TARGETING.AREA]: "canCastSpells",
  [INTERACTION_MODES.SPELL_TARGETING.LINE]: "canCastSpells",
  [INTERACTION_MODES.SPELL_TARGETING.CONE]: "canCastSpells",
  [INTERACTION_MODES.MEASURE]: null,
  [INTERACTION_MODES.DRAWING]: "isDungeonMaster",
  [INTERACTION_MODES.TERRAIN_EDITING]: "isDungeonMaster",
};
