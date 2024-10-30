import React, { useCallback } from "react";

const calculateSpellDamage = (spell, spellLevel, casterLevel) => {
  // Función auxiliar para tirar dados
  const rollDice = (numDice, diceType) => {
    let total = 0;
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * diceType) + 1;
    }
    return total;
  };

  console.log({ spell });
  // Calcular daño base según el conjuro
  switch (spell.name) {
    case "Proyectil Mágico":
      // 1d4 por nivel, hasta 5 proyectiles
      const numProjectiles = Math.min(5, spellLevel);
      return rollDice(numProjectiles, 4);

    case "Bola de Fuego":
      // 1d6 por nivel
      return rollDice(spellLevel, 6);

    case "Toque Vampírico":
      // 1d6 por cada dos niveles
      return rollDice(Math.floor(spellLevel / 2), 6);

    case "Rayo":
      // 1d6 por nivel, hasta 10d6
      const maxDice = Math.min(10, spellLevel);
      return rollDice(maxDice, 6);

    // Añadir más conjuros según sea necesario
    default:
      return 0;
  }
};

const SpellDamageHandler = ({
  gameState,
  onUpdateGameState,
  onAddToGameLog,
}) => {
  const applySpellDamage = useCallback(
    (spell, caster, target, spellLevel) => {
      // Calcular el daño base del conjuro
      const baseDamage = calculateSpellDamage(spell, spellLevel, caster.level);

      // Aplicar modificadores según el tipo de conjuro y resistencias
      let finalDamage = baseDamage;

      // Comprobar resistencias mágicas
      if (target.resistances?.magic) {
        finalDamage = Math.floor(finalDamage / 2);
        onAddToGameLog(`${target.name} resiste parte del daño mágico`);
      }

      // Aplicar daño al objetivo
      const targetType = target.id.startsWith("M") ? "monsters" : "characters";

      console.log({ target, targetType });
      const updatedState = {
        ...gameState,
        [targetType]: gameState[targetType].map((entity) =>
          entity.id === target.id
            ? {
                ...entity,
                hp: {
                  ...entity.hp,
                  current: Math.max(0, entity.hp.current - finalDamage),
                },
              }
            : entity
        ),
      };

      console.log({ updatedState, finalDamage, baseDamage, target });

      // Actualizar estado del juego
      onUpdateGameState(updatedState);

      // Generar mensaje de log
      const damageMessage = `${caster.name} lanza ${spell.name} sobre ${target.name} causando ${finalDamage} puntos de daño`;
      onAddToGameLog(damageMessage, "magic");

      // Comprobar si el objetivo ha caído
      const updatedTarget = updatedState[targetType].find(
        (e) => e.id === target.id
      );
      if (updatedTarget.hp.current === 0) {
        onAddToGameLog(`${target.name} ha caído`, "combat");
      }

      return finalDamage;
    },
    [gameState, onUpdateGameState, onAddToGameLog]
  );

  const handleSpellEffect = useCallback(
    (spell, caster, target, spellLevel) => {
      switch (spell.effect) {
        case "Daño":
          return applySpellDamage(spell, caster, target, spellLevel);

        case "Curación":
          // Implementar lógica de curación
          const healing = calculateSpellDamage(spell, spellLevel, caster.level);
          const targetType = target.id.startsWith("M")
            ? "monsters"
            : "characters";

          onUpdateGameState({
            ...gameState,
            [targetType]: gameState[targetType].map((entity) =>
              entity.id === target.id
                ? {
                    ...entity,
                    hp: {
                      ...entity.hp,
                      current: Math.min(
                        entity.hp.max,
                        entity.hp.current + healing
                      ),
                    },
                  }
                : entity
            ),
          });

          onAddToGameLog(
            `${caster.name} cura ${healing} puntos de vida a ${target.name}`,
            "magic"
          );
          return healing;

        // Añadir más tipos de efectos según sea necesario
        default:
          return 0;
      }
    },
    [gameState, applySpellDamage, onUpdateGameState, onAddToGameLog]
  );

  return {
    handleSpellEffect,
    calculateSpellDamage,
  };
};

export default SpellDamageHandler;
