// components/map/MapGrid.jsx
import React from "react";
import MapCell from "./MapCell";
import { getMoveablePositions } from "../../utils/mapUtils";

const MapGrid = ({ gameState, gridSize, selectedCharacter, onCellClick }) => {
  const moveablePositions = selectedCharacter
    ? getMoveablePositions(
        selectedCharacter.position,
        gameState.mapElements,
        gridSize
      )
    : [];

  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const character = gameState.characters.find(
          (c) => c.position.x === x && c.position.y === y
        );
        const mapElement = gameState.mapElements.find(
          (e) => e.position.x === x && e.position.y === y
        );

        cells.push(
          <MapCell
            key={`${x}-${y}`}
            x={x}
            y={y}
            character={character}
            monster={monster}
            mapElement={mapElement}
            selectedCharacter={selectedCharacter}
            onClick={onCellClick}
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="grid grid-cols-10 gap-0 border border-gray-700">
      {renderGrid()}
    </div>
  );
};

export default MapGrid;
