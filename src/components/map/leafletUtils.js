// components/map/leafletUtils.js
import L from "leaflet";

export const getTerrainColor = (type) => {
  switch (type) {
    case "wall":
      return "#1F2937";
    case "door":
      return "#D97706";
    case "difficult":
      return "#FCD34D";
    case "hazard":
      return "#EF4444";
    default:
      return "#D1D5DB";
  }
};

export const createGridLayer = (gridSize) => {
  const gridLayer = L.layerGroup();

  // Líneas verticales
  for (let i = 0; i <= gridSize; i++) {
    L.polyline(
      [
        [0, i],
        [gridSize, i],
      ],
      {
        color: "#374151",
        weight: 1,
        opacity: 0.5,
      }
    ).addTo(gridLayer);
  }

  // Líneas horizontales
  for (let i = 0; i <= gridSize; i++) {
    L.polyline(
      [
        [i, 0],
        [i, gridSize],
      ],
      {
        color: "#374151",
        weight: 1,
        opacity: 0.5,
      }
    ).addTo(gridLayer);
  }

  return gridLayer;
};

export const calculateValidMoves = (position, mapElements, gridSize) => {
  const moves = [];
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  directions.forEach(([dy, dx]) => {
    const newX = position.x + dx;
    const newY = position.y + dy;

    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
      const hasWall = mapElements.some(
        (element) =>
          element.position.x === newX &&
          element.position.y === newY &&
          element.type === "wall"
      );

      if (!hasWall) {
        moves.push({
          x: newX,
          y: newY,
          terrain:
            mapElements.find(
              (e) => e.position.x === newX && e.position.y === newY
            )?.type || "normal",
        });
      }
    }
  });

  return moves;
};
