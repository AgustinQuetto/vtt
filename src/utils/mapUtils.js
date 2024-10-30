// utils/mapUtils.js
export const calculateDistance = (pos1, pos2) => {
  // Usamos distancia Manhattan para movimiento en cuadrícula
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

export const getMoveablePositions = (position, mapElements, gridSize) => {
  const positions = [];
  // Movimientos ortogonales (arriba, abajo, izquierda, derecha)
  const orthogonal = [
    [0, -1], // arriba
    [1, 0], // derecha
    [0, 1], // abajo
    [-1, 0], // izquierda
  ];

  // Movimientos diagonales
  const diagonal = [
    [-1, -1], // arriba-izquierda
    [1, -1], // arriba-derecha
    [-1, 1], // abajo-izquierda
    [1, 1], // abajo-derecha
  ];

  // Combinar todos los movimientos posibles
  const allDirections = [...orthogonal, ...diagonal];

  allDirections.forEach(([dx, dy]) => {
    const newX = position.x + dx;
    const newY = position.y + dy;

    // Verificar límites del mapa
    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
      const mapElement = mapElements.find(
        (element) => element.position.x === newX && element.position.y === newY
      );

      // Verificar si la posición es accesible
      const isWall = mapElement?.type === "wall";
      const isClosedDoor = mapElement?.type === "door" && !mapElement.isOpen;

      if (!isWall && !isClosedDoor) {
        positions.push({
          x: newX,
          y: newY,
          requiresCheck:
            mapElement?.type === "difficult" || mapElement?.type === "hazard",
          terrain: mapElement?.type || "normal",
        });
      }
    }
  });

  return positions;
};

export const isValidMove = (currentPos, targetPos, mapElements, gridSize) => {
  // Verificar límites del mapa
  if (
    targetPos.x < 0 ||
    targetPos.x >= gridSize ||
    targetPos.y < 0 ||
    targetPos.y >= gridSize
  ) {
    return false;
  }

  // Calcular distancia Manhattan
  const distance = calculateDistance(currentPos, targetPos);
  if (distance > 1) {
    return false;
  }

  // Verificar obstáculos
  const mapElement = mapElements.find(
    (element) =>
      element.position.x === targetPos.x && element.position.y === targetPos.y
  );

  if (mapElement?.type === "wall") {
    return false;
  }

  if (mapElement?.type === "door" && !mapElement.isOpen) {
    return false;
  }

  return true;
};

export const getTerrainDifficulty = (position, mapElements) => {
  const element = mapElements.find(
    (e) => e.position.x === position.x && e.position.y === position.y
  );

  return {
    type: element?.type || "normal",
    description: element?.description || "",
    requiresCheck: element?.type === "difficult" || element?.type === "hazard",
  };
};
