import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sword,
  Shield,
  RotateCcw,
  Play,
  Pause,
  Heart,
  Target,
  MoveHorizontal,
  AlertTriangle,
} from "lucide-react";

const CombatManager = ({
  gameState, // Añadimos el gameState completo como prop
  initiativeOrder,
  currentTurn,
  onStartCombat,
  onNextTurn,
  onEndCombat,
  onSelectEntity,
  movedEntities,
  canMove,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Función para obtener los datos actualizados de una entidad
  const getUpdatedEntityData = (entity) => {
    if (entity.type === "character") {
      return gameState.characters.find((c) => c.id === entity.id) || entity;
    } else {
      return gameState.monsters.find((m) => m.id === entity.id) || entity;
    }
  };

  // Usar useMemo para crear la lista actualizada de entidades
  const updatedInitiativeOrder = useMemo(() => {
    return initiativeOrder.map((entity) => ({
      ...entity,
      ...getUpdatedEntityData(entity),
    }));
  }, [initiativeOrder, gameState.characters, gameState.monsters]);

  const getEntityStatus = (entity) => {
    const updatedEntity = getUpdatedEntityData(entity);
    const hpPercentage =
      (updatedEntity.hp.current / updatedEntity.hp.max) * 100;
    const hasMoved = movedEntities.has(`${entity.type}-${entity.id}`);
    const isCurrentTurn = currentTurn?.id === entity.id;

    return { hpPercentage, hasMoved, isCurrentTurn };
  };

  const getStatusColor = (hpPercentage) => {
    if (hpPercentage <= 25) return "bg-red-500";
    if (hpPercentage <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!initiativeOrder.length) {
    return (
      <Card className="fixed top-4 right-4 w-64 z-400">
        <CardContent className="p-4">
          <Button className="w-full" onClick={onStartCombat} variant="default">
            <Sword className="w-4 h-4 mr-2" />
            Iniciar Combate
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`fixed top-4 right-4 ${
        isExpanded ? "w-80" : "w-64"
      } transition-all duration-300 z-400`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5" />
            <h3 className="font-bold">Gestor de Combate</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Minimizar" : "Expandir"}
          </Button>
        </div>

        {/* Turno actual */}
        {currentTurn && (
          <div className="bg-secondary p-3 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Turno Actual</span>
              <Badge
                variant={
                  currentTurn.type === "monster" ? "destructive" : "default"
                }
              >
                {currentTurn.type === "monster" ? "Monstruo" : "Personaje"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">{currentTurn.name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {!movedEntities.has(
                    `${currentTurn.type}-${currentTurn.id}`
                  ) ? (
                    <span className="flex items-center">
                      <MoveHorizontal className="w-4 h-4 mr-1" />
                      Puede moverse
                    </span>
                  ) : (
                    <span className="flex items-center text-yellow-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Ya se movió
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={onNextTurn}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {updatedInitiativeOrder.map((entity, index) => {
              const { hpPercentage, hasMoved, isCurrentTurn } =
                getEntityStatus(entity);
              const updatedEntity = getUpdatedEntityData(entity);

              return (
                <div
                  key={`${entity.type}-${entity.id}`}
                  className={`p-2 rounded-lg transition-colors ${
                    isCurrentTurn ? "bg-secondary" : "bg-background"
                  } ${
                    canMove(entity.id, entity.type)
                      ? "cursor-pointer hover:bg-secondary/80"
                      : ""
                  }`}
                  onClick={() => onSelectEntity(entity, entity.type)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {index + 1}. {entity.name}
                      </span>
                      {hasMoved && (
                        <Badge variant="outline" className="text-xs">
                          Movido
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant={
                        entity.type === "monster" ? "destructive" : "default"
                      }
                    >
                      {entity.initiative}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <Progress
                      value={hpPercentage}
                      className="h-2 flex-1"
                      indicatorClassName={getStatusColor(hpPercentage)}
                    />
                    <span className="text-xs">
                      {updatedEntity.hp.current}/{updatedEntity.hp.max}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button
          variant="destructive"
          className="w-full mt-4"
          onClick={onEndCombat}
        >
          <Pause className="w-4 h-4 mr-2" />
          Finalizar Combate
        </Button>
      </CardContent>
    </Card>
  );
};

export default CombatManager;
