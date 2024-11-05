import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sword, Target, Crosshair, Shield, Dices } from "lucide-react";

const AttackDialog = ({
  isOpen,
  onClose,
  attacker,
  possibleTargets = [],
  onAttack,
  distanceToTarget,
  addToGameLog,
}) => {
  // Validación inicial - si no hay atacante, cerrar el diálogo
  if (!attacker) {
    if (isOpen) {
      onClose();
    }
    return null;
  }

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [attackType, setAttackType] = useState(null);
  const [rollResult, setRollResult] = useState(null);

  const resetState = () => {
    setSelectedTarget(null);
    setAttackType(null);
    setRollResult(null);
  };

  // Asegurarse de que los atributos existan
  const attackerAttributes = attacker?.attributes || {
    FUE: 10,
    DES: 10,
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const isInMeleeRange = (target) => {
    if (!target) return false;
    return distanceToTarget(target) <= 1.5;
  };

  const isInRangedRange = (target) => {
    if (!target) return false;
    const distance = distanceToTarget(target);
    return distance <= 18;
  };

  const hasDisadvantage = (target) => {
    if (!target || !attackType) return false;
    return attackType === "ranged" && isInMeleeRange(target);
  };

  const handleAttack = () => {
    if (!selectedTarget || !attackType || !attacker) return;

    let roll1 = Math.floor(Math.random() * 20) + 1;
    let roll2 = Math.floor(Math.random() * 20) + 1;

    const finalRoll = hasDisadvantage(selectedTarget)
      ? Math.max(roll1, roll2)
      : roll1;

    const attribute = attackType === "melee" ? "FUE" : "DES";
    const attributeValue = attackerAttributes[attribute];

    const isSuccess = finalRoll <= attributeValue;

    let damage = 0;
    if (isSuccess) {
      // Determinar el dado de daño según la clase del atacante
      let damageDie = 6; // valor por defecto

      if (attacker.class === "Guerrero") {
        damageDie = 8;
      } else if (attacker.class === "Clérigo") {
        damageDie = 6;
      } else if (attacker.class === "Ladrón") {
        damageDie = 6;
      } else if (attacker.class === "Hechicero") {
        damageDie = 4;
      }

      const damageRoll = Math.floor(Math.random() * damageDie) + 1;
      damage = damageRoll;

      if (finalRoll === 1) {
        damage *= 2;
      }
    }

    setRollResult({
      roll: finalRoll,
      attribute,
      attributeValue,
      isSuccess,
      damage,
      isCritical: finalRoll === 1,
    });

    const attackDescription = `${attacker.name} ${
      isSuccess ? "impacta" : "falla"
    } su ataque ${
      attackType === "melee" ? "cuerpo a cuerpo" : "a distancia"
    } contra ${selectedTarget.name}`;

    if (isSuccess) {
      addToGameLog(
        `${attackDescription} causando ${damage} puntos de daño${
          finalRoll === 1 ? " (¡Crítico!)" : ""
        }`,
        "combat"
      );
    } else {
      addToGameLog(attackDescription, "combat");
    }

    if (isSuccess) {
      onAttack(selectedTarget, damage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] z-500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sword className="w-5 h-5" />
            Realizar Ataque con {attacker.name}
          </DialogTitle>
        </DialogHeader>

        {!rollResult ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Button
                variant={attackType === "melee" ? "default" : "outline"}
                className="flex flex-col items-center p-4"
                onClick={() => setAttackType("melee")}
              >
                <Sword className="w-8 h-8 mb-2" />
                <span>Cuerpo a Cuerpo</span>
                <span className="text-sm text-muted-foreground">
                  (FUE: {attackerAttributes.FUE})
                </span>
              </Button>
              <Button
                variant={attackType === "ranged" ? "default" : "outline"}
                className="flex flex-col items-center p-4"
                onClick={() => setAttackType("ranged")}
              >
                <Crosshair className="w-8 h-8 mb-2" />
                <span>A Distancia</span>
                <span className="text-sm text-muted-foreground">
                  (DES: {attackerAttributes.DES})
                </span>
              </Button>
            </div>

            {possibleTargets.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium mb-2">Selecciona un objetivo:</h4>
                {possibleTargets.map((target) => {
                  const inRange =
                    attackType === "melee"
                      ? isInMeleeRange(target)
                      : isInRangedRange(target);

                  return (
                    <Button
                      key={target.id}
                      variant={
                        selectedTarget?.id === target.id ? "default" : "outline"
                      }
                      className="w-full justify-between"
                      disabled={!attackType || !inRange}
                      onClick={() => setSelectedTarget(target)}
                    >
                      <span>{target.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {Math.round(distanceToTarget(target))}m
                        </span>
                        {!inRange && attackType && (
                          <Shield className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No hay objetivos disponibles para atacar
                </AlertDescription>
              </Alert>
            )}

            {selectedTarget && hasDisadvantage(selectedTarget) && (
              <Alert className="mt-4">
                <AlertDescription>
                  Atacar a distancia en rango Inmediato impone desventaja
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                disabled={!selectedTarget || !attackType}
                onClick={handleAttack}
              >
                <Dices className="w-4 h-4 mr-2" />
                Atacar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{rollResult.roll}</div>
                <div className="text-sm text-muted-foreground">
                  vs {rollResult.attribute}: {rollResult.attributeValue}
                </div>
              </div>

              <Alert
                className={rollResult.isSuccess ? "bg-green-50" : "bg-red-50"}
              >
                <AlertDescription>
                  {rollResult.isSuccess ? (
                    <>
                      ¡Impacto exitoso! {rollResult.isCritical && "(¡Crítico!)"}
                      <br />
                      Daño causado: {rollResult.damage}
                    </>
                  ) : (
                    "El ataque falla"
                  )}
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttackDialog;
