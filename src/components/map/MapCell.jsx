// components/map/MapCell.jsx
import React from "react";
import { calculateDistance } from "../../utils/mapUtils";

const MapCell = ({
  x,
  y,
  character,
  monster,
  mapElement,
  selectedCharacter,
  isValidMove,
  onClick,
}) => {
  // Calcular si la celda es alcanzable
  const isReachable = selectedCharacter && isValidMove;

  const getCellStyle = () => {
    let baseStyle =
      "w-12 h-12 border-[0.5px] border-gray-700 flex items-center justify-center relative ";

    if (character) baseStyle += "bg-blue-200 ";
    if (monster) baseStyle += "bg-red-200 ";
    if (mapElement?.type === "wall") baseStyle += "bg-gray-800 ";
    if (mapElement?.type === "door")
      baseStyle += `bg-yellow-800 ${mapElement.isOpen ? "opacity-50" : ""} `;
    if (mapElement?.type === "difficult") baseStyle += "bg-orange-200 ";
    if (mapElement?.type === "hazard") baseStyle += "bg-red-100 ";

    if (isReachable && !character && !monster && mapElement?.type !== "wall") {
      baseStyle += "hover:bg-green-200 cursor-pointer ";
    }

    return baseStyle.trim();
  };

  const getTerrainIcon = () => {
    if (mapElement?.type === "difficult") return "↔";
    if (mapElement?.type === "hazard") return "⚠";
    if (mapElement?.type === "door") return mapElement.isOpen ? "□" : "■";
    return null;
  };

  return (
    <div
      className={getCellStyle()}
      onClick={() => (isReachable ? onClick(x, y) : null)}
      title={mapElement?.description || ""}
    >
      {/* Indicador de movimiento válido */}
      {isReachable &&
        !character &&
        !monster &&
        !mapElement?.type === "wall" && (
          <div className="absolute inset-0 border-2 border-green-400 opacity-0 hover:opacity-100" />
        )}

      {/* Contenido de la celda */}
      {character && (
        <div
          className={`w-8 h-8 rounded-full ${
            selectedCharacter?.id === character.id
              ? "bg-blue-600"
              : "bg-blue-500"
          } 
          flex items-center justify-center text-white text-sm z-10`}
        >
          {character.name[0]}
        </div>
      )}
      {monster && (
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm z-10">
          M
        </div>
      )}

      {/* Icono de terreno */}
      {getTerrainIcon() && (
        <div className="absolute top-0 right-0 text-xs p-1">
          {getTerrainIcon()}
        </div>
      )}

      {/* Coordenadas para debugging - quitar en producción */}
      {/* <div className="absolute bottom-0 left-0 text-[8px] text-gray-400">
        {x},{y}
      </div> */}
    </div>
  );
};

export default MapCell;
