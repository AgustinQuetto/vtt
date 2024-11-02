// effectsSystem.js
import { EFFECT_TYPES, STATUS_EFFECTS } from "./spellSystem";

// Tipos de duración de efectos
export const DURATION_TYPES = {
  TURNS: "turns",
  ROUNDS: "rounds",
  MINUTES: "minutes",
  HOURS: "hours",
  CONCENTRATION: "concentration",
  PERMANENT: "permanent",
};

// Sistema de procesar efectos por tipo
const effectProcessors = {
  [EFFECT_TYPES.DAMAGE]: (entity, effect) => ({
    ...entity,
    hp: {
      ...entity.hp,
      current: Math.max(0, entity.hp.current - effect.value),
    },
  }),

  [EFFECT_TYPES.HEALING]: (entity, effect) => ({
    ...entity,
    hp: {
      ...entity.hp,
      current: Math.min(entity.hp.max, entity.hp.current + effect.value),
    },
  }),

  [EFFECT_TYPES.BUFF]: (entity, effect) => ({
    ...entity,
    attributes: {
      ...entity.attributes,
      [effect.attribute]: entity.attributes[effect.attribute] + effect.value,
    },
  }),

  [EFFECT_TYPES.DEBUFF]: (entity, effect) => ({
    ...entity,
    attributes: {
      ...entity.attributes,
      [effect.attribute]: entity.attributes[effect.attribute] - effect.value,
    },
  }),

  [EFFECT_TYPES.CONTROL]: (entity, effect) => ({
    ...entity,
    conditions: [...(entity.conditions || []), effect.condition],
  }),
};

// Función principal para procesar efectos expirados
export const checkExpiredEffects = (entity, currentTurn, gameTime) => {
  if (!entity.activeSpellEffects) return entity;

  // Separar efectos activos de expirados
  const { activeEffects, expiredEffects } = entity.activeSpellEffects.reduce(
    (acc, effect) => {
      if (isEffectExpired(effect, currentTurn, gameTime)) {
        acc.expiredEffects.push(effect);
      } else {
        acc.activeEffects.push(
          updateEffectDuration(effect, currentTurn, gameTime)
        );
      }
      return acc;
    },
    { activeEffects: [], expiredEffects: [] }
  );

  // Revertir efectos expirados
  let updatedEntity = removeExpiredEffects(entity, expiredEffects);

  // Actualizar la lista de efectos activos
  updatedEntity = {
    ...updatedEntity,
    activeSpellEffects: activeEffects,
  };

  return updatedEntity;
};

// Verificar si un efecto ha expirado
const isEffectExpired = (effect, currentTurn, gameTime) => {
  switch (effect.duration.type) {
    case DURATION_TYPES.TURNS:
      return effect.duration.remaining <= 0;

    case DURATION_TYPES.ROUNDS:
      return effect.duration.rounds <= 0;

    case DURATION_TYPES.MINUTES:
      return gameTime - effect.startTime >= effect.duration.minutes * 60 * 1000;

    case DURATION_TYPES.HOURS:
      return (
        gameTime - effect.startTime >= effect.duration.hours * 60 * 60 * 1000
      );

    case DURATION_TYPES.CONCENTRATION:
      return effect.concentration.broken;

    case DURATION_TYPES.PERMANENT:
      return false;

    default:
      return true;
  }
};

// Actualizar la duración de un efecto
const updateEffectDuration = (effect, currentTurn, gameTime) => {
  switch (effect.duration.type) {
    case DURATION_TYPES.TURNS:
      return {
        ...effect,
        duration: {
          ...effect.duration,
          remaining: effect.duration.remaining - 1,
        },
      };

    case DURATION_TYPES.ROUNDS:
      // Actualizar solo cuando cambia la ronda
      if (currentTurn.roundChanged) {
        return {
          ...effect,
          duration: {
            ...effect.duration,
            rounds: effect.duration.rounds - 1,
          },
        };
      }
      return effect;

    default:
      return effect;
  }
};

// Revertir efectos expirados
const removeExpiredEffects = (entity, expiredEffects) => {
  let updatedEntity = { ...entity };

  expiredEffects.forEach((effect) => {
    switch (effect.type) {
      case EFFECT_TYPES.BUFF:
      case EFFECT_TYPES.DEBUFF:
        // Revertir modificadores de atributos
        updatedEntity = {
          ...updatedEntity,
          attributes: {
            ...updatedEntity.attributes,
            [effect.attribute]:
              updatedEntity.attributes[effect.attribute] - effect.value,
          },
        };
        break;

      case EFFECT_TYPES.CONTROL:
        // Remover condiciones
        updatedEntity = {
          ...updatedEntity,
          conditions: (updatedEntity.conditions || []).filter(
            (condition) => condition !== effect.condition
          ),
        };
        break;

      // Otros tipos de efectos que necesiten limpieza específica
    }
  });

  return updatedEntity;
};

// Clase para gestionar los efectos
export class EffectManager {
  constructor(gameState, updateState) {
    this.gameState = gameState;
    this.updateState = updateState;
  }

  // Añadir un nuevo efecto
  async addEffect(targetId, effect) {
    const target = this.findEntity(targetId);
    if (!target) throw new Error("Objetivo no encontrado");

    const newEffect = {
      ...effect,
      id: `${effect.id}-${Date.now()}`,
      startTime: Date.now(),
    };

    await this.updateState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === targetId
          ? {
              ...char,
              activeSpellEffects: [
                ...(char.activeSpellEffects || []),
                newEffect,
              ],
            }
          : char
      ),
    }));

    return newEffect;
  }

  // Remover un efecto específico
  async removeEffect(targetId, effectId) {
    const target = this.findEntity(targetId);
    if (!target) throw new Error("Objetivo no encontrado");

    await this.updateState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === targetId
          ? {
              ...char,
              activeSpellEffects: (char.activeSpellEffects || []).filter(
                (effect) => effect.id !== effectId
              ),
            }
          : char
      ),
    }));
  }

  // Romper concentración
  async breakConcentration(casterId) {
    await this.updateState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === casterId
          ? {
              ...char,
              activeSpellEffects: (char.activeSpellEffects || []).map(
                (effect) =>
                  effect.duration.type === DURATION_TYPES.CONCENTRATION
                    ? {
                        ...effect,
                        concentration: {
                          ...effect.concentration,
                          broken: true,
                        },
                      }
                    : effect
              ),
            }
          : char
      ),
    }));
  }

  // Aplicar efectos activos
  applyActiveEffects(entity) {
    if (!entity.activeSpellEffects?.length) return entity;

    return entity.activeSpellEffects.reduce((updatedEntity, effect) => {
      const processor = effectProcessors[effect.type];
      return processor ? processor(updatedEntity, effect) : updatedEntity;
    }, entity);
  }

  // Helper para encontrar una entidad
  findEntity(entityId) {
    return this.gameState.characters.find((char) => char.id === entityId);
  }
}

// Ejemplo de estructura de efecto
export const createEffect = ({
  id,
  name,
  type,
  value,
  attribute,
  condition,
  duration,
  source,
  caster,
  visualEffect,
}) => ({
  id,
  name,
  type,
  value,
  attribute,
  condition,
  duration,
  source,
  caster,
  visualEffect,
  startTime: Date.now(),
  concentration: {
    required: duration.type === DURATION_TYPES.CONCENTRATION,
    broken: false,
  },
});

// Ejemplos de uso:
/*
const blessEffect = createEffect({
  id: 'bless',
  name: 'Bendición',
  type: EFFECT_TYPES.BUFF,
  value: 2,
  attribute: 'SAB',
  duration: {
    type: DURATION_TYPES.TURNS,
    remaining: 3
  },
  source: 'bless',
  caster: 'C1',
  visualEffect: {
    type: 'buff',
    icon: 'sparkles'
  }
});

const paralyzeEffect = createEffect({
  id: 'paralyze',
  name: 'Parálisis',
  type: EFFECT_TYPES.CONTROL,
  condition: 'paralyzed',
  duration: {
    type: DURATION_TYPES.CONCENTRATION,
    maxRounds: 10
  },
  source: 'holdPerson',
  caster: 'C1',
  visualEffect: {
    type: 'control',
    icon: 'zap'
  }
});
*/
