import React from "react";
import { Circle, Target, Heart, Shield, Zap, Eye, Skull } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Tipos de objetivos posibles para los hechizos
export const TARGET_TYPES = {
  SINGLE: "single",
  AREA: "area",
  SELF: "self",
  ALLY: "ally",
  ALL_ALLIES: "allAllies",
  ALL_ENEMIES: "allEnemies",
};

// Tipos de efectos que pueden causar los hechizos
export const EFFECT_TYPES = {
  DAMAGE: "damage",
  HEALING: "healing",
  BUFF: "buff",
  DEBUFF: "debuff",
  CONTROL: "control",
  SUMMON: "summon",
  UTILITY: "utility",
};

// Rangos de alcance basados en The Black Hack
export const SPELL_RANGES = {
  SELF: 0,
  IMMEDIATE: 1.5,
  CLOSE: 18,
  FAR: 36,
  DISTANT: 72,
};

// Sistema de estados que pueden ser aplicados por hechizos
export const STATUS_EFFECTS = {
  PARALYZED: {
    id: "paralyzed",
    name: "Paralizado",
    icon: <Zap className="w-4 h-4" />,
    duration: 2, // en turnos
    effect: (character) => ({
      ...character,
      canMove: false,
      canAct: false,
    }),
  },
  BLESSED: {
    id: "blessed",
    name: "Bendecido",
    icon: <Heart className="w-4 h-4" />,
    duration: 3,
    effect: (character) => ({
      ...character,
      attributes: {
        ...character.attributes,
        SAB: character.attributes.SAB + 2,
      },
    }),
  },
  // Añadir más efectos según necesidad
};

// Registro de hechizos disponibles
export const SPELLS = [
  // Hechizos de daño
  {
    id: "magicMissile",
    name: "Proyectil Mágico",
    level: 1,
    school: "arcane",
    icon: <Target className="w-4 h-4" />,
    targetType: TARGET_TYPES.SINGLE,
    range: SPELL_RANGES.FAR,
    effectType: EFFECT_TYPES.DAMAGE,
    areaOfEffect: null,
    damage: (casterLevel) => ({
      base: "1d4",
      bonus: casterLevel,
    }),
    description:
      "Un proyectil de energía mágica que impacta infaliblemente a tu objetivo.",
    check: "INT",
    onCast: async (caster, target, gameState, updateState) => {
      const damage = rollDice("1d4") + caster.level;
      await updateState((prev) => ({
        ...prev,
        characters: prev.characters.map((character) =>
          character.id === target.id
            ? {
                ...character,
                hp: {
                  ...character.hp,
                  current: Math.max(0, character.hp.current - damage),
                },
              }
            : character
        ),
      }));
      return `${caster.name} lanza Proyectil Mágico contra ${target.name} causando ${damage} de daño`;
    },
  },

  {
    id: "cureWounds",
    name: "Curar Heridas",
    level: 1,
    school: "divine",
    icon: <Heart className="w-4 h-4" />,
    targetType: TARGET_TYPES.ALLY,
    range: SPELL_RANGES.IMMEDIATE,
    effectType: EFFECT_TYPES.HEALING,
    areaOfEffect: null,
    healing: (casterLevel) => ({
      base: "1d8",
      bonus: casterLevel,
    }),
    description: "Curas las heridas de un aliado cercano.",
    check: "SAB",
    onCast: async (caster, target, gameState, updateState) => {
      const healing = rollDice("1d8") + caster.level;
      await updateState((prev) => ({
        ...prev,
        characters: prev.characters.map((character) =>
          character.id === target.id
            ? {
                ...character,
                hp: {
                  ...character.hp,
                  current: Math.min(
                    character.hp.max,
                    character.hp.current + healing
                  ),
                },
              }
            : character
        ),
      }));
      return `${caster.name} cura a ${target.name} por ${healing} puntos de vida`;
    },
  },
  {
    id: "fireball",
    name: "Bola de Fuego",
    level: 3,
    school: "arcane",
    icon: <Circle className="w-4 h-4" />,
    targetType: TARGET_TYPES.AREA,
    range: SPELL_RANGES.FAR,
    effectType: EFFECT_TYPES.DAMAGE,
    areaOfEffect: {
      type: "circle",
      radius: 6, // metros
    },
    damage: (casterLevel) => ({
      base: "6d6",
      bonus: 0,
    }),
    description:
      "Una explosión de fuego que daña a todas las criaturas en el área.",
    check: "INT",
    onCast: async (caster, target, gameState, updateState) => {
      const targetPosition = target.position;
      const baseDamage = rollDice("6d6");
      const affectedEntities = getEntitiesInArea(
        targetPosition,
        6,
        gameState.characters
      );

      console.log(affectedEntities);

      await updateState((prev) => ({
        ...prev,
        characters: prev.characters.map((character) => {
          if (affectedEntities.includes(character.id)) {
            // Permitir prueba de DES para mitad de daño
            const savingThrow = rollD20() <= character.attributes.DES;
            const damage = savingThrow
              ? Math.floor(baseDamage / 2)
              : baseDamage;

            return {
              ...character,
              hp: {
                ...character.hp,
                current: Math.max(0, character.hp.current - damage),
              },
            };
          }
          return character;
        }),
      }));

      return `${caster.name} lanza Bola de Fuego afectando a ${affectedEntities.length} objetivos`;
    },
  },
  // Añadir más hechizos según necesidad
].reduce((acc, spell) => ({ ...acc, [spell.id]: spell }), {});

// Clase helper para manejar el sistema de hechizos
export class SpellManager {
  constructor(gameState, updateState) {
    this.gameState = gameState;
    this.updateState = updateState;
  }

  // Verificar si un personaje puede lanzar un hechizo
  canCastSpell(casterId, spellId) {
    const caster = this.gameState.characters.find((c) => c.id === casterId);
    const spell = SPELLS[spellId];

    if (!caster || !spell) return false;

    // Verificar nivel del hechizo
    if (spell.level > caster.level) return false;

    // Verificar espacios de hechizo disponibles
    if (caster.spellsRemaining[spell.level] <= 0) return false;

    // Verificar si el hechizo está memorizado o en el libro
    if (
      !caster.memorizedSpells.includes(spellId) &&
      !caster.spellbook.includes(spellId)
    ) {
      return false;
    }

    return true;
  }

  // Obtener objetivos válidos para un hechizo
  getValidTargets(casterId, spellId) {
    const spell = SPELLS[spellId];
    const caster = this.gameState.characters.find((c) => c.id === casterId);

    if (!spell || !caster) return [];

    switch (spell.targetType) {
      case TARGET_TYPES.SINGLE:
      case TARGET_TYPES.ENEMY:
        return this.gameState.characters.filter(
          (c) => c.id !== casterId && c.type === "monster"
        );
      case TARGET_TYPES.ALLY:
        return this.gameState.characters.filter(
          (c) => c.id !== casterId && c.type === "character"
        );
      case TARGET_TYPES.SELF:
        return [caster];
      case TARGET_TYPES.ALL_ALLIES:
        return this.gameState.characters.filter(
          (c) => c.id !== casterId && c.type === "character"
        );
      case TARGET_TYPES.ALL_ENEMIES:
        return this.gameState.characters.filter(
          (c) => c.id !== casterId && c.type === "monster"
        );
      default:
        return [];
    }
  }

  // Lanzar un hechizo
  async castSpell(casterId, spellId, target) {
    const caster = this.gameState.characters.find((c) => c.id === casterId);
    const spell = SPELLS[spellId];

    if (!this.canCastSpell(casterId, spellId)) {
      throw new Error("No se puede lanzar el hechizo");
    }

    // Realizar prueba de atributo
    const attributeCheck = rollD20();
    const checkValue = caster.attributes[spell.check];
    const success = attributeCheck <= checkValue;

    if (!success) {
      // Reducir espacio de hechizo disponible
      await this.updateState((prev) => ({
        ...prev,
        characters: prev.characters.map((char) =>
          char.id === casterId
            ? {
                ...char,
                spellsRemaining: {
                  ...char.spellsRemaining,
                  [spell.level]: char.spellsRemaining[spell.level] - 1,
                },
              }
            : char
        ),
      }));

      return `${caster.name} falla al lanzar ${spell.name}`;
    }

    // Ejecutar el hechizo
    const result = await spell.onCast(
      caster,
      target,
      this.gameState,
      this.updateState
    );

    // Actualizar espacios de hechizo
    await this.updateState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === casterId
          ? {
              ...char,
              spellsRemaining: {
                ...char.spellsRemaining,
                [spell.level]: char.spellsRemaining[spell.level] - 1,
              },
            }
          : char
      ),
    }));

    return result;
  }

  // Restaurar espacios de hechizo después de un descanso
  async restoreSpellSlots(characterId) {
    const character = this.gameState.characters.find(
      (c) => c.id === characterId
    );
    if (!character) return;

    const maxSlots = getMaxSpellSlots(character.class, character.level);

    await this.updateState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === characterId
          ? {
              ...char,
              spellsRemaining: { ...maxSlots },
            }
          : char
      ),
    }));
  }
}

// Funciones auxiliares
function rollDice(diceNotation) {
  // Implementar lógica de dados
  const [count, sides] = diceNotation.split("d").map(Number);
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

function getEntitiesInArea(center, radius, characters) {
  return characters
    .filter((character) => {
      console.log("x", character.position.x, center, center.x);
      const distance =
        Math.sqrt(
          Math.pow(character.position.x - center.x, 2) +
            Math.pow(character.position.y - center.y, 2)
        ) * 1.5; // 1.5 metros por casilla
      return distance <= radius;
    })
    .map((character) => character.id);
}

// Tabla de espacios de hechizo por nivel y clase
const SPELL_SLOTS_TABLE = {
  Hechicero: {
    1: [1, 2, 3, 3, 4, 4, 4, 4, 4, 4],
    2: [0, 0, 1, 2, 2, 3, 3, 3, 3, 3],
    3: [0, 0, 0, 0, 1, 2, 2, 3, 3, 3],
    // ... continuar para niveles superiores
  },
  Clérigo: {
    1: [0, 1, 2, 2, 2, 2, 2, 2, 3, 3],
    2: [0, 0, 1, 2, 2, 2, 2, 2, 3, 3],
    3: [0, 0, 0, 0, 1, 2, 2, 2, 2, 3],
    // ... continuar para niveles superiores
  },
};

function getMaxSpellSlots(characterClass, level) {
  const slots = {};
  const classTable = SPELL_SLOTS_TABLE[characterClass];
  if (!classTable) return slots;

  Object.keys(classTable).forEach((spellLevel) => {
    slots[spellLevel] = classTable[spellLevel][level - 1] || 0;
  });

  return slots;
}

export default SpellManager;
