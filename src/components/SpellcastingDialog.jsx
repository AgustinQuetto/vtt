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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Book } from "lucide-react";
import {
  divineSpells,
  arcaneSpells,
  clericSpellTable,
  mageSpellTable,
} from "../utils/spellUtils";

const SpellcastingDialog = ({
  isOpen,
  onClose,
  caster,
  possibleTargets = [],
  onCastSpell,
  distanceToTarget,
  addToGameLog,
}) => {
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [spellResult, setSpellResult] = useState(null);

  if (!caster) return null;

  const resetState = () => {
    setSelectedSpell(null);
    setSelectedTarget(null);
    setSpellResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Obtener los espacios de conjuro disponibles según el nivel
  const getAvailableSpellSlots = () => {
    const spellSlotTable =
      caster.class === "Clérigo" ? clericSpellTable : mageSpellTable;

    return spellSlotTable[caster.level - 1] || [0, 0, 0, 0, 0, 0, 0];
  };

  const availableSlots = getAvailableSpellSlots();
  const spellList = caster.class === "Clérigo" ? divineSpells : arcaneSpells;

  // Obtener los conjuros disponibles según el nivel
  const getAvailableSpells = () => {
    return spellList.filter((spell, index) => {
      const spellLevel = Math.floor(index / 5) + 1;
      return (
        availableSlots[spellLevel - 1] > 0 &&
        (caster.spellsRemaining?.[spellLevel] || 0) > 0
      );
    });
  };

  // Realizar prueba de atributo para el conjuro
  const handleCastSpell = () => {
    if (!selectedSpell) return;

    const attribute = caster.class === "Clérigo" ? "SAB" : "INT";
    const attributeValue = caster.attributes[attribute];
    const spellLevel = Math.floor(spellList.indexOf(selectedSpell) / 5) + 1;

    // Tirada con modificador por nivel de conjuro
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifiedRoll = roll + spellLevel;
    const isSuccess = modifiedRoll <= attributeValue;

    setSpellResult({
      roll: modifiedRoll,
      baseRoll: roll,
      spellLevel,
      attribute,
      attributeValue,
      isSuccess,
    });

    // Registrar el resultado
    const spellDescription = `${caster.name} ${
      isSuccess ? "lanza" : "falla al lanzar"
    } ${selectedSpell.name}`;
    addToGameLog(spellDescription, "magic");

    if (isSuccess) {
      // Ejecutar efectos del conjuro
      onCastSpell(selectedSpell, selectedTarget, spellLevel);
    } else {
      // Reducir espacios de conjuro disponibles
      onCastSpell(selectedSpell, null, spellLevel, true);
    }
  };

  const needsTarget = (spell) => {
    return spell.target === "monster" || spell.target === "character";
  };

  {
    console.log(isOpen);
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] z-400">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Lanzar Conjuro con {caster.name}
          </DialogTitle>
        </DialogHeader>

        {!spellResult ? (
          <>
            <div className="space-y-4">
              {/* Espacios de conjuro disponibles */}
              <div className="flex gap-2 flex-wrap">
                {availableSlots.map(
                  (slots, index) =>
                    slots > 0 && (
                      <Badge key={index} variant="outline">
                        Nivel {index + 1}:{" "}
                        {caster.spellsRemaining?.[index + 1] || 0}/{slots}
                      </Badge>
                    )
                )}
              </div>

              {/* Lista de conjuros */}
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {getAvailableSpells().map((spell) => (
                    <Button
                      key={spell.name}
                      variant={
                        selectedSpell?.name === spell.name
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-between"
                      onClick={() => {
                        setSelectedSpell(spell);
                        if (!needsTarget(spell)) {
                          setSelectedTarget(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Book className="w-4 h-4" />
                        <span>{spell.name}</span>
                      </div>
                      <Badge>
                        Nivel {Math.floor(spellList.indexOf(spell) / 5) + 1}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              {/* Selección de objetivo si es necesario */}
              {selectedSpell && needsTarget(selectedSpell) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selecciona un objetivo:</h4>
                  {possibleTargets.map((target) => (
                    <Button
                      key={target.id}
                      variant={
                        selectedTarget?.id === target.id ? "default" : "outline"
                      }
                      className="w-full justify-between"
                      onClick={() => setSelectedTarget(target)}
                    >
                      <span>{target.name}</span>
                      <span className="text-sm">
                        {Math.round(distanceToTarget(target))}m
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {/* Descripción del conjuro seleccionado */}
              {selectedSpell && (
                <Alert>
                  <AlertDescription className="space-y-2">
                    <p>{selectedSpell.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Prueba de {caster.class === "Clérigo" ? "SAB" : "INT"} +{" "}
                      {Math.floor(spellList.indexOf(selectedSpell) / 5) + 1}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                disabled={
                  !selectedSpell ||
                  (needsTarget(selectedSpell) && !selectedTarget)
                }
                onClick={handleCastSpell}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Lanzar Conjuro
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {spellResult.baseRoll} (+{spellResult.spellLevel})
                </div>
                <div className="text-sm text-muted-foreground">
                  vs {spellResult.attribute}: {spellResult.attributeValue}
                </div>
              </div>

              <Alert
                className={spellResult.isSuccess ? "bg-green-50" : "bg-red-50"}
              >
                <AlertDescription>
                  {spellResult.isSuccess ? (
                    <>
                      ¡Conjuro lanzado con éxito!
                      {selectedSpell.effect && (
                        <p className="mt-2">{selectedSpell.effect}</p>
                      )}
                    </>
                  ) : (
                    <>El conjuro falla y pierdes el espacio de conjuro</>
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

export default SpellcastingDialog;
