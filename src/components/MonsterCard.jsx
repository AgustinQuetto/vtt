// components/MonsterCard.jsx
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const MonsterCard = ({ monster }) => {
  const hpPercentage = (monster.hp.current / monster.hp.max) * 100;
  const armorPercentage = (monster.armorPoints.current / monster.armorPoints.max) * 100;

  // Calcular modificador de atributo
  const getAttributeModifier = (value) => {
    const modifier = Math.floor((value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : modifier;
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Información básica */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{monster.name}</h3>
          <p className="text-sm text-gray-500">{monster.type}</p>
        </div>
        <Badge variant={monster.speed > 6 ? "destructive" : "secondary"}>
          {monster.speed}m de movimiento
        </Badge>
      </div>

      {/* Barras de estado */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Puntos de Golpe</span>
            <span className="text-sm text-gray-500">
              {monster.hp.current}/{monster.hp.max}
            </span>
          </div>
          <Progress
            value={hpPercentage}
            className="h-2"
            indicatorClassName={`${
              hpPercentage <= 30 ? 'bg-red-500' : 
              hpPercentage <= 60 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Puntos de Armadura</span>
            <span className="text-sm text-gray-500">
              {monster.armorPoints.current}/{monster.armorPoints.max}
            </span>
          </div>
          <Progress value={armorPercentage} className="h-2" />
        </div>
      </div>

      {/* Atributos */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(monster.attributes).map(([key, value]) => (
          <div
            key={key}
            className="p-2 border rounded-lg text-center bg-gray-50"
          >
            <div className="text-xs font-medium text-gray-500">{key}</div>
            <div className="text-sm font-bold">{value}</div>
            <div className="text-xs text-gray-500">
              {getAttributeModifier(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Ataques y habilidades especiales */}
      {monster.attacks && monster.attacks.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Ataques</h4>
          <div className="space-y-2">
            {monster.attacks.map((attack, index) => (
              <div 
                key={index}
                className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{attack.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{attack.damage}</span>
                  {attack.effect && (
                    <Badge variant="outline">{attack.effect}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habilidades especiales */}
      {monster.abilities && monster.abilities.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Habilidades especiales</h4>
          <div className="space-y-2">
            {monster.abilities.map((ability, index) => (
              <div 
                key={index}
                className="p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{ability.name}</span>
                  {ability.uses && (
                    <Badge variant="outline">
                      {ability.usesRemaining}/{ability.uses} usos
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{ability.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado y condiciones */}
      {monster.conditions && monster.conditions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {monster.conditions.map((condition, index) => (
            <Badge 
              key={index}
              variant="destructive"
            >
              {condition}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonsterCard;