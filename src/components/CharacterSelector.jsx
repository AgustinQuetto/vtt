import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Sword, Shield, Wand, Cross, Skull } from "lucide-react";
import { getAvatarFallback } from "../utils/avatarUtils";

const ClassIcon = ({ characterClass }) => {
  switch (characterClass) {
    case "Guerrero":
      return <Sword className="w-3 h-3" />;
    case "Clérigo":
      return <Cross className="w-3 h-3" />;
    case "Hechicero":
      return <Wand className="w-3 h-3" />;
    case "Ladrón":
      return <Shield className="w-3 h-3" />;
    default:
      return null;
  }
};

const CharacterSelector = ({
  characters,
  monsters,
  selectedCharacter,
  selectedMonster,
  onSelectCharacter,
  onSelectMonster,
  isDungeonMaster,
}) => {
  const characterList = characters.filter((c) => c.type === "character");
  const monsterList = characters.filter((c) => c.type === "monster");

  return (
    <div className="space-y-4">
      {/* Personajes */}
      <div>
        <h3 className="text-sm font-medium mb-2">Personajes</h3>
        <div className="flex flex-wrap gap-2">
          {characterList.map((character) => (
            <Tooltip key={character.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectCharacter(character)}
                  className={`relative group ${
                    selectedCharacter?.id === character.id
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback>
                      {getAvatarFallback(character.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Indicador de clase */}
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                    <ClassIcon characterClass={character.class} />
                  </div>

                  {/* Indicador de salud baja */}
                  {character.hp.current <= character.hp.max * 0.3 && (
                    <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-0">
                <div className="px-3 py-2">
                  <div className="font-semibold">{character.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <ClassIcon characterClass={character.class} />
                    {character.class} • Nivel {character.level}
                  </div>
                  <div className="text-xs mt-1">
                    PV: {character.hp.current}/{character.hp.max}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Monstruos (solo visible para el DM) */}
      {isDungeonMaster && monsterList.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Monstruos</h3>
          <div className="flex flex-wrap gap-2">
            {monsterList.map((monster) => (
              <Tooltip key={monster.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectMonster(monster)}
                    className={`relative group ${
                      selectedMonster?.id === monster.id
                        ? "ring-2 ring-destructive ring-offset-2"
                        : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={monster.avatar} alt={monster.name} />
                      <AvatarFallback>
                        {getAvatarFallback(monster.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Indicador de tipo de monstruo */}
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                      <Skull className="w-3 h-3" />
                    </div>

                    {/* Indicador de salud baja */}
                    {monster.hp.current <= monster.hp.max * 0.3 && (
                      <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-0">
                  <div className="px-3 py-2">
                    <div className="font-semibold">{monster.name}</div>
                    <div className="text-xs mt-1">
                      PV: {monster.hp.current}/{monster.hp.max}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSelector;
