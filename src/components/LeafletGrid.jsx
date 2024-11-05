// components/LeafletGrid.jsx
import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTerrainColor } from "../utils/leafletUtils";
import { getAvatarFallback } from "../utils/avatarUtils";
import {
  INTERACTION_MODES,
  isSpellTargetingMode,
  getModeCursor,
  MODE_CONFIGS,
  MODE_DESCRIPTIONS,
} from "../constans/interactions";

const LeafletGrid = ({
  gameState,
  gridSize,
  selectedCharacter,
  selectedMonster,
  onCharacterMove,
  onMonsterMove,
  movementMode,
  onTerrainCheck,
  isDungeonMaster,
  canMove,
  addToGameLog,
  spellEffectMarkers = [],
  // Nuevas props para selección de área
  interactionMode = INTERACTION_MODES.DEFAULT,
  activeSpell = null,
  onSpellTargetSelected = null,
  onCancelSpellTargeting = null,
}) => {
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const moveLineRef = useRef(null);
  const spellTargetingLayerRef = useRef(null);

  const IMAGE_WIDTH = 5036;
  const IMAGE_HEIGHT = 5036;
  const CELL_SIZE = IMAGE_WIDTH / gridSize;
  const METERS_PER_CELL = 1.5;

  // Función para limpiar la capa de targeting
  const clearSpellTargetingLayer = useCallback(() => {
    if (spellTargetingLayerRef.current) {
      spellTargetingLayerRef.current.clearLayers();
    }
  }, []);

  const pixelToGrid = useCallback(
    (pixelX, pixelY) => ({
      x: Math.floor(pixelX / CELL_SIZE),
      y: Math.floor(pixelY / CELL_SIZE),
    }),
    [CELL_SIZE]
  );

  const gridToPixel = useCallback(
    (map, x, y) => {
      return map.unproject(
        [x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2],
        0
      );
    },
    [CELL_SIZE]
  );

  const calculateRealDistance = useCallback(
    (pos1, pos2) => {
      if (!pos1 || !pos2) return 0;
      const dx = Math.abs(pos1.x - pos2.x);
      const dy = Math.abs(pos1.y - pos2.y);
      const diagonalDistance = Math.sqrt(dx * dx + dy * dy);
      return diagonalDistance * METERS_PER_CELL;
    },
    [METERS_PER_CELL]
  );

  const getEntitySpeed = useCallback((entity) => {
    return entity.speed || (entity.type === "monster" ? 6 : 9);
  }, []);

  const isValidMove = useCallback(
    (fromPos, toPos, entity) => {
      if (!fromPos || !toPos) return false;

      const distance = calculateRealDistance(fromPos, toPos);
      const maxDistance = getEntitySpeed(entity);

      const withinBounds =
        toPos.x >= 0 &&
        toPos.x < gridSize &&
        toPos.y >= 0 &&
        toPos.y < gridSize;

      const withinRange = distance <= maxDistance;

      const isMonsterOrDM = "speed" in entity || isDungeonMaster;

      const hasWall = gameState.mapElements.some(
        (e) =>
          e.position.x === toPos.x &&
          e.position.y === toPos.y &&
          e.type === "wall" &&
          !isMonsterOrDM
      );

      // Verificar colisiones con otras entidades
      const hasCollision = gameState.characters.some(
        (char) =>
          char.position.x === toPos.x &&
          char.position.y === toPos.y &&
          char.id !== entity.id
      );

      return withinBounds && withinRange && !hasWall && !hasCollision;
    },
    [
      gameState,
      gridSize,
      calculateRealDistance,
      getEntitySpeed,
      isDungeonMaster,
    ]
  );

  const getTerrainTypeAndColor = useCallback(
    (toPos, entity) => {
      if ("speed" in entity || isDungeonMaster) {
        return { type: "normal", color: "#10B981" };
      }

      const terrain = gameState.mapElements.find(
        (e) => e.position.x === toPos.x && e.position.y === toPos.y
      );

      switch (terrain?.type) {
        case "difficult":
          return { type: "difficult", color: "#FCD34D" };
        case "hazard":
          return { type: "hazard", color: "#EF4444" };
        default:
          return { type: "normal", color: "#10B981" };
      }
    },
    [gameState.mapElements, isDungeonMaster]
  );

  const createCustomMarker = useCallback(
    (entity, position, isSelected, isDraggable) => {
      const isMonster = entity.type === "monster";
      const avatarUrl = entity.avatar;
      const markerSize = isMonster ? 40 : 48;

      const icon = L.divIcon({
        className: `${isMonster ? "monster" : "character"}-marker ${
          isDraggable ? "cursor-move" : ""
        }`,
        html: `
        <div class="relative group">
          <div class="w-${markerSize} h-${markerSize} rounded-full ${
          isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""
        } transition-transform duration-200 transform hover:scale-110">
            ${
              avatarUrl
                ? `
              <img 
                src="${avatarUrl}" 
                alt="${entity.name}"
                class="w-full h-full rounded-full object-cover border-2 ${
                  isMonster ? "border-red-500" : "border-blue-500"
                }"
                height="${markerSize}px"
                width="${markerSize}px"
                onerror="this.onerror=null; this.src='${entity.avatar}'"
              />
            `
                : `
              <div class="w-full h-full rounded-full flex items-center justify-center ${
                isMonster ? "bg-red-500" : "bg-blue-500"
              } text-white font-bold text-lg">
                ${getAvatarFallback(entity.name)}
              </div>
            `
            }
            ${
              entity.hp.current <= entity.hp.max * 0.3
                ? `
              <div class="absolute -top-1 -right-1">
                <span class="flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${
                    isMonster ? "bg-yellow-400" : "bg-red-400"
                  } opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 ${
                    isMonster ? "bg-yellow-500" : "bg-red-500"
                  }"></span>
                </span>
              </div>
            `
                : ""
            }
          </div>
          
          <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div class="px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded whitespace-nowrap">
              ${entity.name}
            </div>
          </div>
        </div>
      `,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
        popupAnchor: [0, -markerSize / 2],
      });

      const marker = L.marker(position, {
        icon,
        draggable: isDraggable,
        zIndexOffset: isDraggable ? 1000 : 0,
      });

      return marker;
    },
    []
  );

  const updateMovementLine = useCallback(
    (fromPos, currentPos, entity) => {
      if (!moveLineRef.current || !mapRef.current) return;

      moveLineRef.current.clearLayers();

      const startPoint = gridToPixel(mapRef.current, fromPos.x, fromPos.y);
      const endPoint = currentPos;

      const gridPos = pixelToGrid(
        mapRef.current.project(endPoint, 0).x,
        mapRef.current.project(endPoint, 0).y
      );

      const distance = calculateRealDistance(fromPos, gridPos);
      const isValid = isValidMove(fromPos, gridPos, entity);
      const { color } = getTerrainTypeAndColor(gridPos, entity);
      const maxDistance = getEntitySpeed(entity);

      const lineColor = !isValid ? "#EF4444" : color;

      // Línea de movimiento
      L.polyline([startPoint, endPoint], {
        color: lineColor,
        weight: 3,
        dashArray: "5, 10",
        opacity: 0.8,
      }).addTo(moveLineRef.current);

      // Indicador de distancia
      const midPoint = L.latLng(
        (startPoint.lat + endPoint.lat) / 2,
        (startPoint.lng + endPoint.lng) / 2
      );

      const remainingDistance = maxDistance - distance;
      const distanceLabel = `${distance.toFixed(1)}m${
        remainingDistance > 0
          ? ` (${remainingDistance.toFixed(1)}m restantes)`
          : ""
      }`;

      L.marker(midPoint, {
        icon: L.divIcon({
          className: "distance-marker",
          html: `<div class="px-2 py-1 bg-black bg-opacity-75 text-white rounded text-sm">
          ${distanceLabel}
        </div>`,
          iconSize: [150, 20],
          iconAnchor: [75, 10],
        }),
      }).addTo(moveLineRef.current);

      // Área de destino
      L.circle(endPoint, {
        radius: 5,
        color: lineColor,
        fillColor: lineColor,
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(moveLineRef.current);

      // Rango máximo de movimiento
      if (movementMode) {
        L.circle(startPoint, {
          radius: maxDistance * (CELL_SIZE / METERS_PER_CELL),
          color: "#4B5563",
          fillColor: "#4B5563",
          fillOpacity: 0.1,
          weight: 1,
          dashArray: "5, 5",
        }).addTo(moveLineRef.current);
      }
    },
    [
      gridToPixel,
      pixelToGrid,
      calculateRealDistance,
      isValidMove,
      getTerrainTypeAndColor,
      getEntitySpeed,
      CELL_SIZE,
      METERS_PER_CELL,
      movementMode,
    ]
  );

  const setupDragEvents = useCallback(
    (marker, entity) => {
      let lastValidPosition = { ...entity.position };
      let dragLayer = null;
      const isMonster = entity.type === "monster";
      const entityType = entity.type;

      marker.on("dragstart", (e) => {
        console.log("Drag Start:", { entity, lastValidPosition });
        if (!canMove(entity.id, entityType) && !isDungeonMaster) {
          e.preventDefault();
          return false;
        }

        dragLayer = L.layerGroup().addTo(mapRef.current);
        moveLineRef.current = dragLayer;

        const element = e.target.getElement();
        if (element) {
          element.style.opacity = "0.7";
          element.style.transition = "opacity 0.2s";
        }
      });

      marker.on("drag", (e) => {
        if (!dragLayer) return;
        dragLayer.clearLayers();
        updateMovementLine(lastValidPosition, e.target.getLatLng(), entity);
      });

      marker.on("dragend", async (e) => {
        console.log("Drag End Start:", { entity, lastValidPosition });
        const element = e.target.getElement();

        // Obtener la nueva posición en la grilla inmediatamente
        const point = mapRef.current.project(e.target.getLatLng(), 0);
        const gridPos = pixelToGrid(point.x, point.y);
        console.log("New Position:", gridPos);

        if (element) {
          element.style.opacity = "1";
        }

        // Validar el movimiento
        const isValid = isValidMove(lastValidPosition, gridPos, entity);
        console.log("Move Validation:", {
          isValid,
          from: lastValidPosition,
          to: gridPos,
        });

        if (!isValid) {
          console.log("Invalid Move - Returning to:", lastValidPosition);
          const originalPos = gridToPixel(
            mapRef.current,
            lastValidPosition.x,
            lastValidPosition.y
          );
          marker.setLatLng(originalPos);
        } else {
          try {
            // Verificar el terreno
            const { type } = getTerrainTypeAndColor(gridPos, entity);
            const canMoveHere =
              type === "normal" || isDungeonMaster || isMonster;
            console.log("Terrain Check:", { type, canMoveHere });

            if (canMoveHere) {
              // Calcular la nueva posición antes de la actualización
              const newLatLng = gridToPixel(
                mapRef.current,
                gridPos.x,
                gridPos.y
              );
              console.log("New LatLng:", newLatLng);

              console.log({ isMonster });
              if (isMonster) {
                console.log("Moving Monster:", { id: entity.id, to: gridPos });
                // Actualizar el estado primero
                await onMonsterMove(entity.id, gridPos);
                // Actualizar la posición del marcador después
                marker.setLatLng(newLatLng);
                // Actualizar la última posición válida
                lastValidPosition = { ...gridPos };
                console.log("Monster Move Complete:", { lastValidPosition });
              } else {
                await onCharacterMove(entity.id, gridPos);
                marker.setLatLng(newLatLng);
                lastValidPosition = { ...gridPos };
              }
            } else {
              throw new Error("Terrain check failed");
            }
          } catch (error) {
            console.error("Move Error:", error);
            const originalPos = gridToPixel(
              mapRef.current,
              lastValidPosition.x,
              lastValidPosition.y
            );
            marker.setLatLng(originalPos);
          }
        }

        // Limpiar la capa de drag
        if (dragLayer) {
          mapRef.current.removeLayer(dragLayer);
          dragLayer = null;
          moveLineRef.current = null;
        }

        console.log("Drag End Complete:", {
          entity,
          finalPosition: lastValidPosition,
          markerPosition: marker.getLatLng(),
        });
      });

      return () => {
        if (dragLayer) {
          mapRef.current?.removeLayer(dragLayer);
          dragLayer = null;
          moveLineRef.current = null;
        }
        marker.off("dragstart").off("drag").off("dragend");
      };
    },
    [
      pixelToGrid,
      gridToPixel,
      isValidMove,
      getTerrainTypeAndColor,
      onTerrainCheck,
      updateMovementLine,
      isDungeonMaster,
      onCharacterMove,
      onMonsterMove,
      canMove,
    ]
  );

  // Función auxiliar para agrupar entidades por posición
  const groupEntitiesByPosition = useCallback((entities) => {
    return entities.reduce((acc, entity) => {
      const key = `${entity.position.x},${entity.position.y}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entity);
      return acc;
    }, {});
  }, []);

  const renderSpellEffects = useCallback(() => {
    if (!markersLayerRef.current) return;

    spellEffectMarkers.forEach((effect) => {
      const position = gridToPixel(
        mapRef.current,
        effect.position.x,
        effect.position.y
      );

      // Crear el icono del efecto
      const icon = L.divIcon({
        className: "spell-effect-marker",
        html: `
          <div class="absolute animate-pulse">
            <div class="relative">
              ${getEffectIcon(effect.effect)}
              ${
                effect.duration?.remaining
                  ? `
                <div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div class="px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                    ${effect.duration.remaining}
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker(position, { icon, interactive: false }).addTo(
        markersLayerRef.current
      );
    });
  }, [spellEffectMarkers, gridToPixel]);

  // Función helper para obtener el icono según el tipo de efecto
  const getEffectIcon = (effectType) => {
    switch (effectType) {
      case "buff":
        return `<div class="w-6 h-6 rounded-full bg-blue-500 bg-opacity-50 flex items-center justify-center">
            <span class="text-white">↑</span>
          </div>`;
      case "debuff":
        return `<div class="w-6 h-6 rounded-full bg-red-500 bg-opacity-50 flex items-center justify-center">
            <span class="text-white">↓</span>
          </div>`;
      case "healing":
        return `<div class="w-6 h-6 rounded-full bg-green-500 bg-opacity-50 flex items-center justify-center">
            <span class="text-white">+</span>
          </div>`;
      case "damage":
        return `<div class="w-6 h-6 rounded-full bg-orange-500 bg-opacity-50 flex items-center justify-center">
            <span class="text-white">*</span>
          </div>`;
      default:
        return `<div class="w-6 h-6 rounded-full bg-purple-500 bg-opacity-50 flex items-center justify-center">
            <span class="text-white">✧</span>
          </div>`;
    }
  };

  const handleSpellTargetingPreview = useCallback(
    (e) => {
      if (!spellTargetingLayerRef.current || !activeSpell || !selectedCharacter)
        return;

      const point = mapRef.current.project(e.latlng, 0);
      const gridPos = pixelToGrid(point.x, point.y);

      // Limpiar solo la capa de targeting, no la de marcadores
      spellTargetingLayerRef.current.clearLayers();

      // Calcular distancia desde el lanzador
      const casterPos = selectedCharacter.position;
      const distance = calculateRealDistance(casterPos, gridPos);

      // Verificar si está dentro del rango del hechizo
      if (distance > activeSpell.range) return;

      const config = MODE_CONFIGS[INTERACTION_MODES.SPELL_TARGETING.AREA];

      // Dibujar área de efecto
      const targetLatLng = gridToPixel(mapRef.current, gridPos.x, gridPos.y);
      const radius =
        (activeSpell.areaOfEffect?.radius || 1.5) *
        (CELL_SIZE / METERS_PER_CELL);

      // Círculo del área de efecto
      L.circle(targetLatLng, {
        radius,
        color: config.areaColor,
        fillColor: config.areaColor,
        fillOpacity: config.areaOpacity,
        weight: config.lineWidth,
      }).addTo(spellTargetingLayerRef.current);

      // Línea desde el lanzador
      const casterLatLng = gridToPixel(
        mapRef.current,
        casterPos.x,
        casterPos.y
      );
      L.polyline([casterLatLng, targetLatLng], {
        color: config.lineColor,
        weight: config.lineWidth,
        dashArray: config.lineDash,
      }).addTo(spellTargetingLayerRef.current);

      // Indicador de rango máximo
      L.circle(casterLatLng, {
        radius: activeSpell.range * (CELL_SIZE / METERS_PER_CELL),
        color: config.rangeIndicatorColor,
        fillColor: config.rangeIndicatorColor,
        fillOpacity: config.rangeIndicatorOpacity,
        weight: 1,
        dashArray: "5, 5",
      }).addTo(spellTargetingLayerRef.current);

      // Etiqueta de distancia
      const midPoint = L.latLng(
        (casterLatLng.lat + targetLatLng.lat) / 2,
        (casterLatLng.lng + targetLatLng.lng) / 2
      );

      L.marker(midPoint, {
        icon: L.divIcon({
          className: "distance-marker",
          html: `<div class="px-2 py-1 bg-black bg-opacity-75 text-white rounded text-sm">
          ${distance.toFixed(1)}m
        </div>`,
          iconSize: [80, 20],
          iconAnchor: [40, 10],
        }),
      }).addTo(spellTargetingLayerRef.current);
    },
    [
      activeSpell,
      selectedCharacter,
      gridToPixel,
      pixelToGrid,
      calculateRealDistance,
    ]
  );

  // Modificar el handleSpellTargeting para manejar mejor la confirmación:
  const handleSpellTargeting = useCallback(
    (e) => {
      if (!spellTargetingLayerRef.current || !activeSpell || !selectedCharacter)
        return;

      const point = mapRef.current.project(e.latlng, 0);
      const gridPos = pixelToGrid(point.x, point.y);

      // Calcular distancia desde el lanzador
      const casterPos = selectedCharacter.position;
      const distance = calculateRealDistance(casterPos, gridPos);

      // Verificar si está dentro del rango del hechizo
      if (distance > activeSpell.range) {
        addToGameLog("Fuera de rango", "warning");
        return;
      }

      // Crear una nueva capa para los botones de confirmación
      const confirmationLayer = L.layerGroup().addTo(mapRef.current);

      // Pausar la previsualización mientras los botones están visibles
      mapRef.current.off("mousemove", handleSpellTargetingPreview);

      const targetLatLng = gridToPixel(mapRef.current, gridPos.x, gridPos.y);
      const confirmButton = L.marker(targetLatLng, {
        icon: L.divIcon({
          className: "confirm-button",
          html: `
          <div class="flex gap-2" style="pointer-events: auto;">
            <button class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg confirm-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg cancel-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>`,
          iconSize: [80, 40],
          iconAnchor: [40, 20],
        }),
        interactive: true,
      }).addTo(confirmationLayer);

      const element = confirmButton.getElement();
      const confirmBtn = element.querySelector(".confirm-btn");
      const cancelBtn = element.querySelector(".cancel-btn");

      confirmBtn.onclick = () => {
        confirmationLayer.remove();
        clearSpellTargetingLayer();
        onSpellTargetSelected({ ...gridPos, distance });
      };

      cancelBtn.onclick = () => {
        confirmationLayer.remove();
        // Restaurar la previsualización
        mapRef.current.on("mousemove", handleSpellTargetingPreview);
        handleSpellTargetingPreview(e);
      };
    },
    [
      activeSpell,
      selectedCharacter,
      gridToPixel,
      pixelToGrid,
      calculateRealDistance,
      onSpellTargetSelected,
      handleSpellTargetingPreview,
      clearSpellTargetingLayer,
    ]
  );

  // Inicialización del mapa
  useEffect(() => {
    if (!mapRef.current) {
      // Configuración del mapa con límites estrictos
      const map = L.map("map", {
        crs: L.CRS.Simple,
        minZoom: -2, // Ajustar para que la imagen llene la vista
        maxZoom: 5, // Limitar el zoom máximo
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        attributionControl: false,
        dragging: !movementMode,
        bounceAtZoomLimits: true, // Evitar el efecto rebote en los límites del zoom
      });

      // Calcular las coordenadas de los límites
      const southWest = map.unproject([0, IMAGE_HEIGHT], 0);
      const northEast = map.unproject([IMAGE_WIDTH, 0], 0);
      const bounds = L.latLngBounds(southWest, northEast);

      // Añadir la imagen
      L.imageOverlay("https://i.redd.it/lye030nqyvnb1.jpg", bounds, {
        opacity: 1,
        interactive: false,
        className: "game-map-image",
      }).addTo(map);

      // Ajustar los límites del mapa
      /* map.setMaxBounds(bounds); */

      // Ajustar la vista inicial para que la imagen llene el contenedor
      map.fitBounds(bounds, {
        padding: [0, 0], // Sin padding
        animate: false, // Sin animación inicial
      });

      markersLayerRef.current = L.layerGroup().addTo(map);
      spellTargetingLayerRef.current = L.layerGroup().addTo(map);
      moveLineRef.current = L.layerGroup().addTo(map);

      /*       // Asegurar que la capa de marcadores siempre esté por encima
      markersLayerRef.current.setZIndex(1000);
      spellTargetingLayerRef.current.setZIndex(500);
      moveLineRef.current.setZIndex(500); */

      mapRef.current = map;

      return () => {
        if (mapRef.current) {
          // Limpiar listeners
          mapRef.current.off("click", handleSpellTargeting);
          mapRef.current.off("moveend");
          mapRef.current.off("zoomend");
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  // Inicialización del mapa
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.dragging[
      interactionMode === INTERACTION_MODES.DEFAULT ? "enable" : "disable"
    ]();

    // Limpiar eventos anteriores
    mapRef.current.off("click", handleSpellTargeting);
    mapRef.current.off("mousemove", handleSpellTargetingPreview);

    // Limpiar la capa de targeting cuando cambia el modo
    clearSpellTargetingLayer();

    // Configurar eventos según el modo
    if (interactionMode === INTERACTION_MODES.SPELL_TARGETING.AREA) {
      mapRef.current.on("click", handleSpellTargeting);
      mapRef.current.on("mousemove", handleSpellTargetingPreview);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleSpellTargeting);
        mapRef.current.off("mousemove", handleSpellTargetingPreview);
      }
    };
  }, [
    interactionMode,
    handleSpellTargeting,
    handleSpellTargetingPreview,
    clearSpellTargetingLayer,
  ]);

  // Limpiar la capa de targeting cuando cambie el hechizo activo
  /*   useEffect(() => {
    if (!activeSpell) {
      spellTargetingLayerRef.current.clearLayers();
    }
  }, [activeSpell]); */

  // Actualizar marcadores y elementos del mapa
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const map = mapRef.current;
    markersLayerRef.current.clearLayers();

    // Dibujar elementos del mapa
    gameState.mapElements.forEach((element) => {
      const { x, y } = element.position;
      const color = getTerrainColor(element.type);

      const topLeft = map.unproject([x * CELL_SIZE, y * CELL_SIZE], 0);
      const bottomRight = map.unproject(
        [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE],
        0
      );

      L.rectangle([topLeft, bottomRight], {
        color: "white",
        fillColor: color,
        fillOpacity: 0.3,
        weight: 1,
      }).addTo(markersLayerRef.current);
    });

    // Agrupar personajes y monstruos por posición
    const charactersByPosition = groupEntitiesByPosition(gameState.characters);
    const monstersByPosition = groupEntitiesByPosition(
      gameState.characters.filter((c) => c.type === "monster")
    );

    // Renderizar grupos de personajes
    Object.entries(charactersByPosition).forEach(([posKey, characters]) => {
      const [x, y] = posKey.split(",").map(Number);
      const position = gridToPixel(map, x, y);

      if (characters.length === 1) {
        const character = characters[0];
        const isSelected = character.id === selectedCharacter?.id;
        const isDraggable =
          isSelected && movementMode && canMove(character.id, "character");

        const marker = createCustomMarker(
          character,
          position,
          isSelected,
          isDraggable
        );

        if (isDraggable) {
          setupDragEvents(marker, character);
        }

        marker.addTo(markersLayerRef.current);
      } else {
        // Renderizar grupo de personajes
        characters.forEach((character, index) => {
          const offset = 8 * index;
          const groupPosition = L.latLng(
            position.lat + offset * 0.0001,
            position.lng + offset * 0.0001
          );

          const isSelected = character.id === selectedCharacter?.id;
          const isDraggable =
            isSelected && movementMode && canMove(character.id, "character");

          const marker = createCustomMarker(
            character,
            groupPosition,
            isSelected,
            isDraggable
          );

          if (isDraggable) {
            setupDragEvents(marker, character);
          }

          marker.addTo(markersLayerRef.current);
        });
      }
    });

    // Renderizar grupos de monstruos
    Object.entries(monstersByPosition).forEach(([posKey, monsters]) => {
      const [x, y] = posKey.split(",").map(Number);
      const position = gridToPixel(map, x, y);

      if (monsters.length === 1) {
        const monster = monsters[0];
        const isSelected = monster.id === selectedMonster?.id;
        const isDraggable =
          (isSelected || isDungeonMaster) &&
          movementMode &&
          (canMove(monster.id, "monster") || isDungeonMaster);

        const marker = createCustomMarker(
          monster,
          position,
          isSelected,
          isDraggable
        );

        if (isDraggable) {
          setupDragEvents(marker, monster);
        }

        marker.addTo(markersLayerRef.current);
      } else {
        monsters.forEach((monster, index) => {
          const offset = 8 * index;
          const groupPosition = L.latLng(
            position.lat + offset * 0.0001,
            position.lng + offset * 0.0001
          );

          const isSelected = monster.id === selectedMonster?.id;
          const isDraggable =
            (isSelected || isDungeonMaster) &&
            movementMode &&
            (canMove(monster.id, "monster") || isDungeonMaster);

          const marker = createCustomMarker(
            monster,
            groupPosition,
            isSelected,
            isDraggable
          );

          if (isDraggable) {
            setupDragEvents(marker, monster);
          }

          marker.addTo(markersLayerRef.current);
        });
      }
    });

    renderSpellEffects();
  }, [
    gameState,
    selectedCharacter,
    selectedMonster,
    movementMode,
    isDungeonMaster,
    CELL_SIZE,
    createCustomMarker,
    setupDragEvents,
    gridToPixel,
    groupEntitiesByPosition,
    canMove,
    spellEffectMarkers,
    renderSpellEffects,
  ]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Solo actualizar el estado de dragging cuando cambia el modo de movimiento
    mapRef.current.dragging[movementMode ? "disable" : "enable"]();
  }, [movementMode]);

  useEffect(() => {
    if (!activeSpell) {
      clearSpellTargetingLayer();
    }
  }, [activeSpell, clearSpellTargetingLayer]);

  console.log(interactionMode);
  return (
    <div
      id="map"
      className="w-full h-full overflow-hidden"
      style={{
        cursor:
          interactionMode === INTERACTION_MODES.SPELL_TARGETING
            ? "crosshair"
            : movementMode
            ? "grab"
            : "default",
      }}
    />
  );
};

export default LeafletGrid;
