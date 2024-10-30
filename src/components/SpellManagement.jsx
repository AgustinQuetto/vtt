import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Book, Brain, Check, RefreshCw } from "lucide-react";
import {
  divineSpells,
  arcaneSpells,
  clericSpellTable,
  mageSpellTable,
} from "@/utils/spellUtils";

const SpellManagement = ({
  character,
  onMemorizeSpell,
  onForgetSpell,
  onRestoreSpells,
}) => {
  const [selectedTab, setSelectedTab] = useState("spellbook");

  // Determinar si es un conjuro divino o arcano
  const spellType = character.class === "Clérigo" ? "divine" : "arcane";

  // Obtener lista de conjuros según la clase
  const getSpellList = () => {
    return spellType === "divine" ? divineSpells : arcaneSpells;
  };

  // Calcular espacios de conjuro disponibles por nivel
  const getSpellSlots = () => {
    const table = spellType === "divine" ? clericSpellTable : mageSpellTable;
    return table[character.level - 1] || Array(7).fill(0);
  };

  return (
    <Card className="mt-4 z-400">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full">
          <TabsTrigger value="spellbook" className="flex-1">
            <Book className="w-4 h-4 mr-2" />
            Libro de Conjuros
          </TabsTrigger>
          <TabsTrigger value="memorized" className="flex-1">
            <Brain className="w-4 h-4 mr-2" />
            Conjuros Memorizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spellbook">
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((level) => {
                  const spellsOfLevel = getSpellList().filter(
                    (s) => s.level === level
                  );
                  if (spellsOfLevel.length === 0) return null;

                  return (
                    <div key={level}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Nivel {level}</h3>
                        <Badge variant="outline">
                          {character.spellsRemaining?.[level] || 0}/
                          {getSpellSlots()[level - 1]}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {spellsOfLevel.map((spell) => (
                          <Button
                            key={spell.name}
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => onMemorizeSpell(spell)}
                            disabled={
                              character.memorizedSpells?.includes(spell.name) ||
                              (character.memorizedSpells?.length || 0) >=
                                character.level
                            }
                          >
                            <div className="flex items-center gap-2">
                              <span>{spell.name}</span>
                              {character.memorizedSpells?.includes(
                                spell.name
                              ) && <Check className="w-4 h-4 text-green-500" />}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {spell.range}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={onRestoreSpells}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restaurar Espacios de Conjuro
              </Button>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="memorized">
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Conjuros Memorizados</h3>
                <Badge variant="outline">
                  {character.memorizedSpells?.length || 0}/{character.level}
                </Badge>
              </div>

              {character.memorizedSpells?.length > 0 ? (
                <div className="space-y-2">
                  {character.memorizedSpells.map((spellName) => {
                    const spell = getSpellList().find(
                      (s) => s.name === spellName
                    );
                    return (
                      <Button
                        key={spellName}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => onForgetSpell(spellName)}
                      >
                        <span>{spellName}</span>
                        <Badge>Nivel {spell?.level}</Badge>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hay conjuros memorizados
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
export default SpellManagement;
