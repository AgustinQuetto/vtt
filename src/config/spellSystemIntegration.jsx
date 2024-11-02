// spellSystemIntegration.js
import { CONDITIONS, SPELLS, SPELL_TYPES } from "./spells";

// Gestión de libros de hechizos
export class SpellbookManager {
  constructor(character) {
    this.character = character;
    this.spellbook = character.spellcasting?.spellbook || [];
    this.memorizedSpells = character.spellcasting?.memorizedSpells || [];
    this.spellSlots = character.spellcasting?.spellsRemaining || {};
  }

  // Obtener hechizos disponibles por nivel
  getAvailableSpells(level) {
    return this.spellbook.filter((spell) => {
      const currentSpell = SPELLS.find((s) => s.id === spell.id);
      return currentSpell && currentSpell.level === level;
    });
  }

  // Memorizar un hechizo
  memorizeSpell(spellId) {
    const spell = SPELLS.find((s) => s.id === spellId);
    if (!spell) return false;

    if (this.memorizedSpells.length >= this.character.level) {
      return false;
    }

    this.memorizedSpells.push(spellId);
    return true;
  }

  // Olvidar un hechizo memorizado
  forgetSpell(spellId) {
    const index = this.memorizedSpells.indexOf(spellId);
    if (index > -1) {
      this.memorizedSpells.splice(index, 1);
      return true;
    }
    return false;
  }

  // Verificar si se puede lanzar un hechizo
  canCastSpell(spellId) {
    const spell = SPELLS.find((s) => s.id == spellId);
    if (!spell) return false;

    // Verificar espacios de conjuro disponibles
    if (!this.spellSlots[spell.level] || this.spellSlots[spell.level] <= 0) {
      return false;
    }

    // Verificar si está memorizado (solo para hechiceros)
    if (
      this.character.class === "Hechicero" &&
      !this.memorizedSpells.includes(spellId)
    ) {
      return false;
    }

    return true;
  }

  // Consumir un espacio de conjuro
  useSpellSlot(level) {
    if (this.spellSlots[level] > 0) {
      this.spellSlots[level]--;
      return true;
    }
    return false;
  }

  // Restaurar espacios de conjuro (al descansar)
  restoreSpellSlots() {
    Object.keys(this.spellSlots).forEach((level) => {
      this.spellSlots[level] = this.getMaxSpellSlots(level);
    });
  }

  // Obtener máximo de espacios de conjuro por nivel
  getMaxSpellSlots(level) {
    const spellSlotsTable = {
      Clérigo: {
        1: [0, 1, 2, 2, 2, 2, 2, 2, 3, 3],
        2: [0, 0, 1, 2, 2, 2, 2, 2, 3, 3],
        3: [0, 0, 0, 0, 1, 2, 2, 2, 2, 3],
        // ... hasta nivel 7
      },
      Hechicero: {
        1: [1, 2, 3, 3, 4, 4, 4, 4, 4, 4],
        2: [0, 0, 1, 2, 2, 3, 3, 3, 3, 3],
        3: [0, 0, 0, 0, 1, 2, 2, 3, 3, 3],
        // ... hasta nivel 7
      },
    };

    const table = spellSlotsTable[this.character.class];
    if (!table || !table[level]) return 0;

    return table[level][this.character.level - 1] || 0;
  }
}

// Gestión de estados y condiciones
export class ConditionManager {
  constructor() {
    this.activeConditions = new Map();
  }

  // Aplicar una condición a una entidad
  applyCondition(entityId, conditionId, duration = null) {
    const condition = CONDITIONS[conditionId];
    if (!condition) return false;

    const entityConditions = this.activeConditions.get(entityId) || [];
    entityConditions.push({
      ...condition,
      appliedAt: Date.now(),
      duration,
      remainingRounds: duration,
    });

    this.activeConditions.set(entityId, entityConditions);
    return true;
  }

  // Remover una condición
  removeCondition(entityId, conditionId) {
    const entityConditions = this.activeConditions.get(entityId);
    if (!entityConditions) return false;

    const updatedConditions = entityConditions.filter(
      (c) => c.id !== conditionId
    );
    this.activeConditions.set(entityId, updatedConditions);
    return true;
  }

  // Actualizar condiciones al final del turno
  updateConditions(entityId) {
    const entityConditions = this.activeConditions.get(entityId);
    if (!entityConditions) return;

    const updatedConditions = entityConditions.filter((condition) => {
      if (!condition.duration) return true;
      condition.remainingRounds--;
      return condition.remainingRounds > 0;
    });

    this.activeConditions.set(entityId, updatedConditions);
  }

  // Verificar si una entidad tiene una condición específica
  hasCondition(entityId, conditionId) {
    const entityConditions = this.activeConditions.get(entityId);
    return entityConditions?.some((c) => c.id === conditionId) || false;
  }

  // Obtener todas las condiciones activas de una entidad
  getConditions(entityId) {
    return this.activeConditions.get(entityId) || [];
  }
}

// Integración con el sistema de combate
export class SpellCombatManager {
  constructor(gameState, spellbookManager, conditionManager) {
    this.gameState = gameState;
    this.spellbookManager = spellbookManager;
    this.conditionManager = conditionManager;
  }

  // Resolver el lanzamiento de un hechizo
  async resolveSpellCast(caster, spell, targets) {
    // Verificar si se puede lanzar el hechizo
    if (!this.spellbookManager.canCastSpell(spell.id)) {
      return {
        success: false,
        message: "No quedan espacios de conjuro disponibles",
      };
    }

    // Realizar la tirada de ataque si es necesaria
    const results = [];
    for (const target of targets) {
      const result = await this.resolveSpellEffect(caster, spell, target);
      results.push(result);
    }

    // Consumir el espacio de conjuro
    this.spellbookManager.useSpellSlot(spell.level);

    return {
      success: true,
      results,
    };
  }

  // Resolver los efectos del hechizo
  async resolveSpellEffect(caster, spell, target) {
    let result = {
      target,
      success: true,
      damage: 0,
      healing: 0,
      conditions: [],
    };

    // Tirada de salvación si es necesaria
    if (spell.savingThrow) {
      const savingThrowValue = target.attributes[spell.savingThrow];
      const roll = Math.floor(Math.random() * 20) + 1;
      result.success = roll <= savingThrowValue;
    }

    if (result.success) {
      // Aplicar daño/curación
      if (spell.damage) {
        result.damage = await this.resolveDamage(spell.damage, caster.level);
      }
      if (spell.healing) {
        result.healing = await this.resolveHealing(spell.healing, caster.level);
      }

      // Aplicar condiciones
      if (spell.conditions) {
        for (const conditionId of spell.conditions) {
          const applied = this.conditionManager.applyCondition(
            target.id,
            conditionId,
            spell.duration === "instant" ? 1 : null
          );
          if (applied) {
            result.conditions.push(conditionId);
          }
        }
      }
    }

    return result;
  }

  // Resolver daño
  async resolveDamage(damageFormula, casterLevel) {
    // Implementar lógica de dados aquí
    return 0;
  }

  // Resolver curación
  async resolveHealing(healingFormula, casterLevel) {
    // Implementar lógica de dados aquí
    return 0;
  }

  // Verificar línea de visión
  hasLineOfSight(caster, target) {
    // Implementar verificación usando el sistema de grid
    return true;
  }

  // Verificar rango
  isInRange(caster, target, range) {
    // Implementar verificación usando el sistema de grid
    return true;
  }
}
