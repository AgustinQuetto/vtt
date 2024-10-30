// components/CharacterSheet.jsx
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarFallback } from "../utils/avatarUtils";

const CharacterSheet = ({ character }) => {
  const hpPercentage = (character.hp.current / character.hp.max) * 100;
  const armorPercentage =
    (character.armorPoints.current / character.armorPoints.max) * 100;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={character.avatar} alt={character.name} />
          <AvatarFallback className="text-lg">
            {getAvatarFallback(character.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-2xl font-bold">{character.name}</h3>
          <p className="text-muted-foreground">
            {character.class} - Nivel {character.level}
          </p>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">PV</span>
          <span className="text-sm text-gray-500">
            {character.hp.current}/{character.hp.max}
          </span>
        </div>
        <Progress
          value={hpPercentage}
          className="h-2"
          indicatorClassName={`${
            hpPercentage <= 30 ? "bg-red-500" : "bg-green-500"
          }`}
        />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">PA</span>
          <span className="text-sm text-gray-500">
            {character.armorPoints.current}/{character.armorPoints.max}
          </span>
        </div>
        <Progress value={armorPercentage} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(character.attributes).map(([key, value]) => (
          <div key={key} className="p-2 border rounded-lg text-center">
            <div className="text-sm font-medium">{key}</div>
            <div className="text-lg">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Inventario</h4>
        <div className="space-y-1">
          {character.inventory.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.name}</span>
              {item.damage && (
                <span className="text-gray-500">{item.damage}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
