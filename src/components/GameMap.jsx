// GameMap.jsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const GameMap = ({ gameState, gridSize, onCellClick }) => {
  const renderCell = (x, y) => {
    const character = gameState.characters.find(
      (c) => c.position.x === x && c.position.y === y
    );
    const monster = gameState.monsters.find(
      (m) => m.position.x === x && m.position.y === y
    );
    const mapElement = gameState.mapElements.find(
      (e) => e.position.x === x && e.position.y === y
    );

    return (
      <div
        key={`${x}-${y}`}
        className={`w-12 h-12 border border-gray-300 flex items-center justify-center cursor-pointer
          ${character ? "bg-blue-200" : ""}
          ${monster ? "bg-red-200" : ""}
          ${mapElement?.type === "wall" ? "bg-gray-800" : ""}
          ${mapElement?.type === "door" ? "bg-yellow-800" : ""}
        `}
        onClick={() => onCellClick(x, y)}
      >
        {character && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
            {character.name[0]}
          </div>
        )}
        {monster && (
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm">
            M
          </div>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        cells.push(renderCell(x, y));
      }
    }
    return cells;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de juego</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-0">{renderGrid()}</div>
      </CardContent>
    </Card>
  );
};

export default GameMap;
