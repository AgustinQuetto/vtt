import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sword,
  Shield,
  Backpack,
  ChevronDown,
  ChevronUp,
  MoveHorizontal,
  Skull,
  Wand,
  Cross,
} from "lucide-react";
import { getAvatarFallback } from "../utils/avatarUtils";

const CharacterSheet = ({ entity }) => {
  const [showInventory, setShowInventory] = useState(false);

  const hpPercentage = (entity.hp.current / entity.hp.max) * 100;
  const armorPercentage =
    (entity.armorPoints.current / entity.armorPoints.max) * 100;
  const isMonster = entity.type === "monster";

  // Calcular modificador de atributo
  const getModifier = (value) => {
    const mod = Math.floor((value - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod;
  };

  // Obtener icono según la clase/tipo
  const getEntityIcon = () => {
    if (isMonster) return <Skull className="w-4 h-4" />;
    switch (entity.class) {
      case "Guerrero":
        return <Sword className="w-4 h-4" />;
      case "Clérigo":
        return <Cross className="w-4 h-4" />;
      case "Hechicero":
        return <Wand className="w-4 h-4" />;
      case "Ladrón":
        return <Shield className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2 py-4">
      {/* Cabecera con información básica */}
      <div className="flex items-center gap-3">
        {/*         <Avatar className="h-12 w-12">
          <AvatarImage src={entity.avatar} alt={entity.name} />
          <AvatarFallback>{getAvatarFallback(entity.name)}</AvatarFallback>
        </Avatar> */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{entity.name}</h3>
            <Badge
              variant={isMonster ? "destructive" : "default"}
              className="flex items-center gap-1"
            >
              {getEntityIcon()}
              {isMonster ? "Monstruo" : entity.class}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {!isMonster && <span>Nivel {entity.level}</span>}
            <div className="flex items-center gap-1">
              <MoveHorizontal className="w-3 h-3" />
              <span>{entity.speed}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barras de estado compactas */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>PV</span>
            <span className="text-muted-foreground">
              {entity.hp.current}/{entity.hp.max}
            </span>
          </div>
          <Progress
            value={hpPercentage}
            className="h-2"
            indicatorClassName={`${
              hpPercentage <= 30
                ? "bg-red-500"
                : hpPercentage <= 60
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
          />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>PA</span>
            <span className="text-muted-foreground">
              {entity.armorPoints.current}/{entity.armorPoints.max}
            </span>
          </div>
          <Progress value={armorPercentage} className="h-2" />
        </div>
      </div>

      {/* Grid de atributos compacto */}
      <div className="grid grid-cols-6 gap-1">
        {Object.entries(entity.attributes).map(([key, value]) => (
          <div key={key} className="text-center p-1 border rounded">
            <div className="text-xs font-medium text-muted-foreground">
              {key}
            </div>
            <div className="font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">
              {getModifier(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Ataques y habilidades especiales para monstruos */}
      {isMonster && entity.attacks && entity.attacks.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Ataques</div>
          <div className="grid grid-cols-1 gap-1">
            {entity.attacks.map((attack, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm p-1 bg-secondary rounded"
              >
                <span className="flex items-center gap-2">
                  <Sword className="w-3 h-3" />
                  {attack.name}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {attack.damage}
                  </Badge>
                  {attack.effect && (
                    <Badge variant="destructive" className="text-xs">
                      {attack.effect}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventario para personajes */}
      {!isMonster && entity.inventory && (
        <>
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowInventory(!showInventory)}
          >
            <div className="flex items-center gap-2">
              <Backpack className="w-4 h-4" />
              <span>Inventario</span>
            </div>
            {showInventory ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showInventory && (
            <div className="pl-4 space-y-1">
              {entity.inventory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="flex items-center gap-2">
                    {item.damage ? (
                      <Sword className="w-3 h-3" />
                    ) : item.armorPoints ? (
                      <Shield className="w-3 h-3" />
                    ) : null}
                    {item.name}
                  </span>
                  {(item.damage || item.armorPoints) && (
                    <Badge variant="outline" className="text-xs">
                      {item.damage || `+${item.armorPoints} PA`}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Estado y condiciones */}
      {entity.conditions && entity.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entity.conditions.map((condition, index) => (
            <Badge key={index} variant="destructive" className="text-xs">
              {condition}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterSheet;
