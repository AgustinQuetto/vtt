import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollText, Sparkles, Target } from "lucide-react";
import { SPELLS, TARGET_TYPES } from "../systems/spellSystem";

const SpellDialog = ({
  isOpen,
  onClose,
  caster,
  possibleTargets,
  onCastSpell,
  distanceToTarget,
  addToGameLog,
  spellManager,
}) => {
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [spellResult, setSpellResult] = useState(null);
  const [targetingMode, setTargetingMode] = useState(false);

  const resetState = () => {
    setSelectedSpell(null);
    setSelectedTarget(null);
    setSpellResult(null);
    setTargetingMode(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getAvailableSpells = () => {
    if (!caster) return [];

    return caster.memorizedSpells
      .filter((spellId) => spellManager.canCastSpell(caster.id, spellId))
      .map((spellId) => SPELLS[spellId]);
  };

  const isValidTarget = (target, spell) => {
    if (!spell || !target) return false;

    const distance = distanceToTarget(caster, target);
    if (distance > spell.range) return false;

    /*   switch (spell.targetType) {
      case TARGET_TYPES.ENEMY:
        return target.type === "monster";
      case TARGET_TYPES.ALLY:
        return target.type === "character";
      case TARGET_TYPES.SELF:
        return target.id === caster.id;
      default:
        return true;
    } */

    return true;
  };

  const handleSpellCast = async () => {
    if (!selectedSpell || !selectedTarget) return;

    try {
      const result = await onCastSpell(
        caster.id,
        selectedSpell.id,
        selectedTarget
      );
      setSpellResult(result);
      addToGameLog(result, "spell");
    } catch (error) {
      addToGameLog(
        `Error al lanzar ${selectedSpell.name}: ${error.message}`,
        "error"
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] z-400">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Lanzar Hechizo con {caster?.name}
          </DialogTitle>
        </DialogHeader>

        {!spellResult ? (
          <>
            {!targetingMode ? (
              <div className="space-y-4">
                <Tabs defaultValue="memorized">
                  <TabsList>
                    <TabsTrigger value="memorized">
                      <ScrollText className="w-4 h-4 mr-2" />
                      Hechizos Memorizados
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {getAvailableSpells().map((spell) => (
                      <Button
                        key={spell.id}
                        variant={
                          selectedSpell?.id === spell.id ? "default" : "outline"
                        }
                        className="justify-start"
                        onClick={() => setSelectedSpell(spell)}
                      >
                        <div className="mr-2">{spell.icon}</div>
                        <div className="flex flex-col items-start">
                          <span>{spell.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Nivel {spell.level} - Alcance {spell.range}m
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </Tabs>

                {selectedSpell && (
                  <Alert>
                    <AlertDescription>
                      {selectedSpell.description}
                    </AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    disabled={!selectedSpell}
                    onClick={() => setTargetingMode(true)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Seleccionar Objetivo
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium">
                  Selecciona un objetivo para {selectedSpell.name}
                </h4>

                <div className="space-y-2">
                  {possibleTargets.map((target) => (
                    <Button
                      key={target.id}
                      variant={
                        selectedTarget?.id === target.id ? "default" : "outline"
                      }
                      className="w-full justify-between"
                      disabled={!isValidTarget(target, selectedSpell)}
                      onClick={() => setSelectedTarget(target)}
                    >
                      <span>{target.name}</span>
                      <span className="text-sm">
                        {Math.round(distanceToTarget(caster, target))}m
                      </span>
                    </Button>
                  ))}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setTargetingMode(false)}
                  >
                    Volver
                  </Button>
                  <Button disabled={!selectedTarget} onClick={handleSpellCast}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Lanzar Hechizo
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>{spellResult}</AlertDescription>
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

export default SpellDialog;
