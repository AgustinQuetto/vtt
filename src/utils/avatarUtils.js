export const getAvatarFallback = (name) => {
  if (!name) return "";
  // Obtener iniciales (hasta 2 caracteres)
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export const getRandomAvatarUrl = (seed) => {
  // Puedes usar servicios como Dicebear para avatares aleatorios
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
};
