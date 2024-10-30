// utils/leafletUtils.js
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
