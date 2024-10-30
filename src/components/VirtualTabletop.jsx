import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Camera,
  Dice6,
  Shield,
  RotateCcw,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import LeafletGrid from "./LeafletGrid";
import CharacterSheet from "./CharacterSheet";
import MonsterCard from "./MonsterCard";
import CombatManager from "./CombatManager";
import GameLog from "./GameLog";
import AttackDialog from "./AttackDialog";
import SpellcastingDialog from "./SpellcastingDialog";
import SpellManagement from "./SpellManagement";
import SpellDamageHandler from "./SpellDamageHandler";
import { initialGameState } from "../utils/gameState";

const FloatingPanel = ({ title, children, isOpen, onToggle, position }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState(position);

  const handleMouseDown = (e) => {
    if (e.target.closest(".drag-handle")) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        setPos({
          x: e.clientX - 150,
          y: e.clientY - 20,
        });
      }
    },
    [isDragging]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  if (!isOpen) return null;

  return (
    <Card
      className="absolute shadow-lg min-w-[300px] max-w-[400px] z-400"
      style={{
        left: pos.x,
        top: pos.y,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseDown={handleMouseDown}
    >
      <CardHeader className="drag-handle cursor-grab p-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[70vh] overflow-y-auto">
        {children}
      </CardContent>
    </Card>
  );
};

const VirtualTabletop = () => {
  const [gameState, setGameState] = useState(initialGameState);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [movementMode, setMovementMode] = useState(false);
  const [isDungeonMaster] = useState(true);
  const gridSize = 30;

  // Estados de combate
  const [combatActive, setCombatActive] = useState(false);
  const [initiativeOrder, setInitiativeOrder] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [movedEntities, setMovedEntities] = useState(new Set());
  const [attackedEntities, setAttackedEntities] = useState(new Set());
  const [attackDialogOpen, setAttackDialogOpen] = useState(false);
  const [spellDialogOpen, setSpellDialogOpen] = useState(false);

  // Estado para controlar la visibilidad de los paneles
  const [panels, setPanels] = useState({
    combat: true,
    characters: true,
    log: true,
  });

  const togglePanel = (panelName) => {
    setPanels((prev) => ({
      ...prev,
      [panelName]: !prev[panelName],
    }));
  };

  const addToGameLog = useCallback((message, type = "info") => {
    setGameState((prev) => ({
      ...prev,
      gameLog: [
        {
          message,
          timestamp: new Date().toLocaleTimeString(),
          type,
        },
        ...prev.gameLog,
      ].slice(0, 50),
    }));
  }, []);

  // Toolbar flotante para mostrar/ocultar paneles
  const FloatingToolbar = () => (
    <div className="fixed top-4 left-4 z-400 bg-white rounded-lg shadow-lg p-2 flex gap-2">
      {/* <Button
        variant={panels.combat ? "default" : "outline"}
        size="sm"
        onClick={() => togglePanel("combat")}
      >
        <Dice6 className="w-4 h-4" />
      </Button> */}
      <Button
        variant={panels.characters ? "default" : "outline"}
        size="sm"
        onClick={() => togglePanel("characters")}
      >
        <Shield className="w-4 h-4" />
      </Button>
      <Button
        variant={panels.log ? "default" : "outline"}
        size="sm"
        onClick={() => togglePanel("log")}
      >
        <Camera className="w-4 h-4" />
      </Button>
    </div>
  );

  const canMove = useCallback(
    (entityId, entityType) => {
      if (!combatActive) return true;
      const isCurrentTurn =
        currentTurn?.id === entityId && currentTurn?.type === entityType;
      return isCurrentTurn && !movedEntities.has(`${entityType}-${entityId}`);
    },
    [combatActive, currentTurn, movedEntities]
  );

  // Función para iniciar el combate y establecer el orden de iniciativa
  const startCombat = useCallback(() => {
    // Combinar personajes y monstruos
    const allEntities = [
      ...gameState.characters.map((char) => ({
        ...char,
        type: "character",
        initiative:
          Math.floor(Math.random() * 20) +
          1 +
          Math.floor((char.attributes.DES - 10) / 2),
      })),
      ...gameState.monsters.map((monster) => ({
        ...monster,
        type: "monster",
        initiative:
          Math.floor(Math.random() * 20) +
          1 +
          Math.floor((monster.attributes.DES - 10) / 2),
      })),
    ];

    // Ordenar por iniciativa
    const sortedEntities = allEntities.sort(
      (a, b) => b.initiative - a.initiative
    );
    setInitiativeOrder(sortedEntities);
    setCurrentTurn(sortedEntities[0]);
    setMovedEntities(new Set());
    addToGameLog("¡Comienza el combate!");

    // Mostrar orden de iniciativa
    sortedEntities.forEach((entity, index) => {
      addToGameLog(
        `${index + 1}. ${entity.name} - Iniciativa: ${entity.initiative}`
      );
    });
  }, [gameState]);

  // Función para pasar al siguiente turno
  const nextTurn = useCallback(() => {
    const currentIndex = initiativeOrder.findIndex(
      (entity) =>
        entity.id === currentTurn.id && entity.type === currentTurn.type
    );
    const nextIndex = (currentIndex + 1) % initiativeOrder.length;
    const nextEntity = initiativeOrder[nextIndex];

    // Si completamos una ronda, restaurar estados
    if (nextIndex === 0) {
      setMovedEntities(new Set());
      setAttackedEntities(new Set());
      addToGameLog("¡Nueva ronda de combate!", "combat");
    }

    setCurrentTurn(nextEntity);
    addToGameLog(`Turno de ${nextEntity.name}`, "turn");

    // Deseleccionar entidades actuales
    setSelectedCharacter(null);
    setSelectedMonster(null);
    setMovementMode(false);
  }, [initiativeOrder, currentTurn, addToGameLog]);

  // Función para calcular modificador de atributo
  const calculateModifier = (value) => Math.floor((value - 10) / 2);

  const startCombate = useCallback(() => {
    // Calcular iniciativas con modificadores
    const allEntities = [
      ...gameState.characters.map((char) => ({
        ...char,
        type: "character",
        initiative:
          Math.floor(Math.random() * 20) +
          1 +
          calculateModifier(char.attributes.DES),
      })),
      ...gameState.monsters.map((monster) => ({
        ...monster,
        type: "monster",
        initiative:
          Math.floor(Math.random() * 20) +
          1 +
          calculateModifier(monster.attributes.DES),
      })),
    ];

    // Ordenar por iniciativa
    const sortedEntities = allEntities.sort((a, b) => {
      if (b.initiative === a.initiative) {
        // En caso de empate, mayor DES va primero
        return b.attributes.DES - a.attributes.DES;
      }
      return b.initiative - a.initiative;
    });

    setInitiativeOrder(sortedEntities);
    setCurrentTurn(sortedEntities[0]);
    setMovedEntities(new Set());
    setAttackedEntities(new Set());
    setCombatActive(true);

    addToGameLog("¡Comienza el combate!", "combat");
    sortedEntities.forEach((entity, index) => {
      addToGameLog(
        `${index + 1}. ${entity.name} - Iniciativa: ${
          entity.initiative
        } (DES: ${entity.attributes.DES})`,
        "initiative"
      );
    });
  }, [gameState, addToGameLog]);

  const endCombat = useCallback(() => {
    setCombatActive(false);
    setInitiativeOrder([]);
    setCurrentTurn(null);
    setMovedEntities(new Set());
    setAttackedEntities(new Set());
    setSelectedCharacter(null);
    setSelectedMonster(null);
    setMovementMode(false);

    addToGameLog("El combate ha terminado", "combat");
  }, [addToGameLog]);

  const canAttack = useCallback(
    (entityId, entityType) => {
      if (!combatActive) return true;
      const isCurrentTurn =
        currentTurn?.id === entityId && currentTurn?.type === entityType;
      return (
        isCurrentTurn && !attackedEntities.has(`${entityType}-${entityId}`)
      );
    },
    [combatActive, currentTurn, attackedEntities]
  );

  const handleCharacterMove = useCallback(
    (characterId, newPosition) => {
      if (!canMove(characterId, "character")) {
        addToGameLog("No puedes mover este personaje en este turno", "error");
        return false;
      }

      const character = gameState.characters.find((c) => c.id === characterId);

      setGameState((prev) => ({
        ...prev,
        characters: prev.characters.map((char) =>
          char.id === characterId ? { ...char, position: newPosition } : char
        ),
      }));

      setMovedEntities((prev) => new Set(prev.add(`character-${characterId}`)));
      addToGameLog(
        `${character.name} se mueve a la posición (${newPosition.x}, ${newPosition.y})`,
        "movement"
      );
      return true;
    },
    [gameState.characters, addToGameLog, canMove]
  );

  const handleMonsterMove = useCallback(
    (monsterId, newPosition) => {
      if (!canMove(monsterId, "monster") && !isDungeonMaster) {
        addToGameLog("No puedes mover este monstruo en este turno", "error");
        return false;
      }

      const monster = gameState.monsters.find((m) => m.id === monsterId);

      setGameState((prev) => ({
        ...prev,
        monsters: prev.monsters.map((m) =>
          m.id === monsterId ? { ...m, position: newPosition } : m
        ),
      }));

      setMovedEntities((prev) => new Set(prev.add(`monster-${monsterId}`)));
      addToGameLog(
        `${monster.name} se mueve a la posición (${newPosition.x}, ${newPosition.y})`,
        "movement"
      );
      return true;
    },
    [gameState.monsters, addToGameLog, canMove, isDungeonMaster]
  );

  const handleTerrainCheck = useCallback(
    async (terrainType, description) => {
      if (!selectedCharacter) return false;

      const roll = Math.floor(Math.random() * 20) + 1;
      let attribute;
      let difficulty;

      switch (terrainType) {
        case "difficult":
          attribute = "DES";
          difficulty = selectedCharacter.attributes.DES - 5;
          break;
        case "hazard":
          attribute = "CON";
          difficulty = selectedCharacter.attributes.CON - 7;
          break;
        default:
          return true;
      }

      const success = roll <= difficulty;

      addToGameLog(
        `${selectedCharacter.name} intenta atravesar ${description} ` +
          `(${attribute} ${roll} vs ${difficulty}): ${
            success ? "¡Éxito!" : "Fallo"
          }`
      );

      if (!success && terrainType === "hazard") {
        const damage = Math.floor(Math.random() * 6) + 1;
        setGameState((prev) => ({
          ...prev,
          characters: prev.characters.map((char) =>
            char.id === selectedCharacter.id
              ? {
                  ...char,
                  hp: {
                    ...char.hp,
                    current: Math.max(0, char.hp.current - damage),
                  },
                }
              : char
          ),
        }));
        addToGameLog(
          `${selectedCharacter.name} sufre ${damage} puntos de daño`
        );
      }

      return success;
    },
    [selectedCharacter, addToGameLog]
  );

  const toggleMovementMode = useCallback(() => {
    setMovementMode((prev) => !prev);
    if (!movementMode) {
      addToGameLog(
        `Modo de movimiento activado para ${
          selectedCharacter?.name || selectedMonster?.name
        }`
      );
    } else {
      addToGameLog("Modo de movimiento desactivado");
    }
  }, [movementMode, selectedCharacter, selectedMonster, addToGameLog]);

  const handleSelectEntity = useCallback(
    (entity, type) => {
      if (type === "character") {
        setSelectedCharacter(entity);
        setSelectedMonster(null);
      } else {
        setSelectedMonster(entity);
        setSelectedCharacter(null);
      }
      setMovementMode(false);
      addToGameLog(`${entity.name} seleccionado`, "selection");
    },
    [addToGameLog]
  );

  const handleAttack = (target, damage) => {
    // Actualizar HP del objetivo
    const targetType = target.type === "monster" ? "monsters" : "characters";
    setGameState((prev) => ({
      ...prev,
      [targetType]: prev[targetType].map((entity) =>
        entity.id === target.id
          ? {
              ...entity,
              hp: {
                ...entity.hp,
                current: Math.max(0, entity.hp.current - damage),
              },
            }
          : entity
      ),
    }));

    // Marcar la entidad como que ya atacó
    setAttackedEntities(
      (prev) => new Set(prev.add(`${currentTurn.type}-${currentTurn.id}`))
    );
  };

  const getPossibleTargets = useCallback(() => {
    if (selectedCharacter) {
      return gameState.monsters;
    } else if (selectedMonster) {
      return gameState.characters;
    }
    return [];
  }, [selectedCharacter, selectedMonster, gameState]);

  const calculateDistance = useCallback((entity1, entity2) => {
    const dx = entity1.position.x - entity2.position.x;
    const dy = entity1.position.y - entity2.position.y;
    return Math.sqrt(dx * dx + dy * dy) * 1.5; // 1.5 metros por casilla
  }, []);

  const handleCastSpell = (spell, target, spellLevel, failed = false) => {
    if (!failed && target) {
      spellDamageHandler.handleSpellEffect(
        spell,
        selectedCharacter,
        target,
        spellLevel
      );
    }

    // Reducir espacios de conjuro disponibles
    setGameState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === selectedCharacter.id
          ? {
              ...char,
              spellsRemaining: {
                ...char.spellsRemaining,
                [spellLevel]: (char.spellsRemaining[spellLevel] || 0) - 1,
              },
            }
          : char
      ),
    }));

    // Marcar el personaje como que ya actuó
    setAttackedEntities(
      (prev) => new Set(prev.add(`character-${selectedCharacter.id}`))
    );
  };

  const handleMemorizeSpell = (character, spell) => {
    setGameState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === character.id
          ? {
              ...char,
              memorizedSpells: [...char.memorizedSpells, spell.name],
            }
          : char
      ),
    }));
    addToGameLog(`${character.name} memoriza ${spell.name}`, "magic");
  };

  const handleForgetSpell = (character, spellName) => {
    setGameState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === character.id
          ? {
              ...char,
              memorizedSpells: char.memorizedSpells.filter(
                (s) => s !== spellName
              ),
            }
          : char
      ),
    }));
    addToGameLog(`${character.name} olvida ${spellName}`, "magic");
  };

  const handleRestoreSpells = (character) => {
    const slots =
      character.class === "Clérigo"
        ? clericSpellTable[character.level - 1]
        : mageSpellTable[character.level - 1];

    setGameState((prev) => ({
      ...prev,
      characters: prev.characters.map((char) =>
        char.id === character.id
          ? {
              ...char,
              spellsRemaining: slots.reduce(
                (acc, slots, index) => ({
                  ...acc,
                  [index + 1]: slots,
                }),
                {}
              ),
            }
          : char
      ),
    }));
    addToGameLog(
      `${character.name} restaura todos sus espacios de conjuro`,
      "magic"
    );
  };

  const canCastSpells = useCallback(
    (characterId) => {
      // Si no hay combate activo, se puede lanzar conjuros libremente
      if (!combatActive) return true;

      const character = gameState.characters.find((c) => c.id === characterId);
      if (!character) return false;

      // Validar que sea el turno del personaje
      const isCurrentTurn =
        currentTurn?.id === characterId && currentTurn?.type === "character";
      if (!isCurrentTurn) return false;

      // Validar que no haya actuado ya
      const hasActed = attackedEntities.has(`character-${characterId}`);
      if (hasActed) return false;

      // Validar que sea una clase lanzadora de conjuros
      const isSpellcaster =
        character.class === "Clérigo" || character.class === "Hechicero";
      if (!isSpellcaster) return false;

      // Validar que tenga espacios de conjuro disponibles
      const hasAvailableSpells = Object.values(
        character.spellsRemaining || {}
      ).some((slots) => slots > 0);
      if (!hasAvailableSpells) return false;

      return true;
    },
    [combatActive, currentTurn, attackedEntities, gameState.characters]
  );

  // Función auxiliar para verificar espacios de conjuro específicos
  const hasSpellSlots = useCallback((character, spellLevel) => {
    return (character.spellsRemaining?.[spellLevel] || 0) > 0;
  }, []);

  // Función para verificar si un conjuro específico puede ser lanzado
  const canCastSpecificSpell = useCallback(
    (character, spell) => {
      if (!character) return false;

      // Validar que el personaje pueda lanzar conjuros en general
      if (!canCastSpells(character.id)) return false;

      // Validar que tenga el conjuro memorizado o en su libro
      const isMemorized = character.memorizedSpells?.includes(spell.name);
      const isInSpellbook = character.spellbook?.includes(spell.name);
      if (!isMemorized && !isInSpellbook) return false;

      // Validar que tenga espacios de conjuro del nivel apropiado
      return hasSpellSlots(character, spell.level);
    },
    [canCastSpells, hasSpellSlots]
  );

  // Función para obtener el texto de razón por la que no se puede lanzar
  const getCannotCastReason = useCallback(
    (characterId) => {
      const character = gameState.characters.find((c) => c.id === characterId);
      if (!character) return "Personaje no encontrado";

      if (combatActive && (!currentTurn || currentTurn.id !== characterId)) {
        return "No es tu turno";
      }

      if (attackedEntities.has(`character-${characterId}`)) {
        return "Ya has actuado en este turno";
      }

      if (!["Clérigo", "Hechicero"].includes(character.class)) {
        return "Tu clase no puede lanzar conjuros";
      }

      if (
        !Object.values(character.spellsRemaining || {}).some(
          (slots) => slots > 0
        )
      ) {
        return "No te quedan espacios de conjuro";
      }

      return "";
    },
    [combatActive, currentTurn, attackedEntities, gameState.characters]
  );

  const spellDamageHandler = SpellDamageHandler({
    gameState,
    onUpdateGameState: setGameState,
    onAddToGameLog: addToGameLog,
  });

  return (
    <TooltipProvider>
      <div className="w-screen h-screen relative overflow-hidden">
        {/* Mapa a pantalla completa */}
        <div className="w-full h-full">
          <LeafletGrid
            gameState={gameState}
            gridSize={gridSize}
            selectedCharacter={selectedCharacter}
            selectedMonster={selectedMonster}
            onCharacterMove={handleCharacterMove}
            onMonsterMove={handleMonsterMove}
            onTerrainCheck={handleTerrainCheck}
            movementMode={movementMode}
            isDungeonMaster={isDungeonMaster}
            canMove={canMove}
          />
        </div>

        {/* Gestor de Combate */}
        <CombatManager
          gameState={gameState}
          initiativeOrder={initiativeOrder}
          currentTurn={currentTurn}
          onStartCombat={startCombate}
          onEndCombat={endCombat}
          onNextTurn={nextTurn}
          onSelectEntity={handleSelectEntity}
          movedEntities={movedEntities}
          attackedEntities={attackedEntities}
          canMove={canMove}
          canAttack={canAttack}
          combatActive={combatActive}
        />

        <AttackDialog
          isOpen={attackDialogOpen}
          onClose={() => setAttackDialogOpen(false)}
          attacker={selectedCharacter || selectedMonster}
          possibleTargets={getPossibleTargets()}
          onAttack={handleAttack}
          distanceToTarget={(target) =>
            calculateDistance(selectedCharacter || selectedMonster, target)
          }
          addToGameLog={addToGameLog}
        />

        {console.log(selectedCharacter)}
        <SpellcastingDialog
          isOpen={spellDialogOpen}
          onClose={() => setSpellDialogOpen(false)}
          caster={selectedCharacter}
          possibleTargets={getPossibleTargets()}
          onCastSpell={handleCastSpell}
          distanceToTarget={(target) =>
            calculateDistance(selectedCharacter, target)
          }
          addToGameLog={addToGameLog}
        />

        {/* Toolbar flotante */}
        <FloatingToolbar />

        {/* Panel de combate */}
        {/*  <FloatingPanel
        title="Combate"
        isOpen={panels.combat}
        onToggle={() => togglePanel("combat")}
        position={{ x: 20, y: 80 }}
      >
        {initiativeOrder.length > 0 ? (
          <div className="space-y-2">
            <div className="font-medium">Turno actual: {currentTurn?.name}</div>
            <Button className="w-full" onClick={nextTurn}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Siguiente turno
            </Button>
            <div className="mt-2">
              <h3 className="font-medium mb-2">Orden de iniciativa:</h3>
              <div className="space-y-1">
                {initiativeOrder.map((entity, index) => (
                  <div
                    key={`${entity.type}-${entity.id}`}
                    className={`p-2 rounded ${
                      currentTurn?.id === entity.id ? "bg-blue-100" : ""
                    }`}
                  >
                    {index + 1}. {entity.name} ({entity.initiative})
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          isDungeonMaster && (
            <Button className="w-full" onClick={startCombat}>
              Iniciar Combate
            </Button>
          )
        )}
      </FloatingPanel> */}

        {/* Panel de personajes y monstruos */}
        <FloatingPanel
          title="Personajes y Monstruos"
          isOpen={panels.characters}
          onToggle={() => togglePanel("characters")}
          position={{ x: window.innerWidth - 380, y: 100 }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Personajes</h3>
              {gameState.characters.map((character) => (
                <Button
                  key={character.id}
                  onClick={() => handleSelectEntity(character, "character")}
                  variant={
                    selectedCharacter?.id === character.id
                      ? "default"
                      : "outline"
                  }
                  className="w-full justify-start mb-2"
                >
                  {character.name} ({character.class})
                  {character.hp.current <= character.hp.max * 0.3 && (
                    <span className="ml-2 text-red-500">⚠</span>
                  )}
                </Button>
              ))}
            </div>

            {isDungeonMaster && (
              <div>
                <h3 className="text-sm font-medium mb-2">Monstruos</h3>
                {gameState.monsters.map((monster) => (
                  <Button
                    key={monster.id}
                    onClick={() => handleSelectEntity(monster, "monster")}
                    variant={
                      selectedMonster?.id === monster.id ? "default" : "outline"
                    }
                    className="w-full justify-start mb-2"
                  >
                    {monster.name}
                    {monster.hp.current <= monster.hp.max * 0.3 && (
                      <span className="ml-2 text-yellow-500">⚠</span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {selectedCharacter && (
              <>
                <CharacterSheet character={selectedCharacter} />
                {selectedCharacter?.class === "Clérigo" ||
                selectedCharacter?.class === "Hechicero" ? (
                  <SpellManagement
                    character={selectedCharacter}
                    onMemorizeSpell={(spell) =>
                      handleMemorizeSpell(selectedCharacter, spell)
                    }
                    onForgetSpell={(spellName) =>
                      handleForgetSpell(selectedCharacter, spellName)
                    }
                    onRestoreSpells={() =>
                      handleRestoreSpells(selectedCharacter)
                    }
                  />
                ) : null}
              </>
            )}
            {selectedMonster && isDungeonMaster && (
              <MonsterCard monster={selectedMonster} />
            )}
          </div>
        </FloatingPanel>

        {/* Panel de registro */}
        <FloatingPanel
          title="Registro de juego"
          isOpen={panels.log}
          onToggle={() => togglePanel("log")}
          position={{ x: 20, y: window.innerHeight - 300 }}
        >
          <GameLog logs={gameState.gameLog} />
        </FloatingPanel>

        {/* Panel de entidad seleccionada */}
        {(selectedCharacter || selectedMonster) && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 z-400">
            <span className="font-medium">
              {selectedCharacter?.name || selectedMonster?.name}
            </span>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setMovementMode((prev) => !prev)}
                    variant={movementMode ? "default" : "outline"}
                    disabled={
                      (selectedCharacter &&
                        !canMove(selectedCharacter.id, "character")) ||
                      (selectedMonster &&
                        !canMove(selectedMonster.id, "monster") &&
                        !isDungeonMaster)
                    }
                  >
                    {movementMode ? "Cancelar movimiento" : "Mover"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {(selectedCharacter &&
                    !canMove(selectedCharacter.id, "character")) ||
                  (selectedMonster &&
                    !canMove(selectedMonster.id, "monster") &&
                    !isDungeonMaster)
                    ? "Ya te has movido en este turno"
                    : "Mover personaje"}
                </TooltipContent>
              </Tooltip>

              {(selectedCharacter?.class === "Clérigo" ||
                selectedCharacter?.class === "Hechicero") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      onClick={() => setSpellDialogOpen(true)}
                      disabled={!canCastSpells(selectedCharacter.id)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Lanzar Conjuro
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!canCastSpells(selectedCharacter.id)
                      ? getCannotCastReason(selectedCharacter.id)
                      : "Lanzar conjuro"}
                  </TooltipContent>
                </Tooltip>
              )}

              {combatActive && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      disabled={
                        (selectedCharacter &&
                          !canAttack(selectedCharacter.id, "character")) ||
                        (selectedMonster &&
                          !canAttack(selectedMonster.id, "monster") &&
                          !isDungeonMaster)
                      }
                      onClick={() => setAttackDialogOpen(true)}
                    >
                      Atacar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {(selectedCharacter &&
                      !canAttack(selectedCharacter.id, "character")) ||
                    (selectedMonster &&
                      !canAttack(selectedMonster.id, "monster") &&
                      !isDungeonMaster)
                      ? "Ya has atacado en este turno"
                      : "Realizar ataque"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default VirtualTabletop;
