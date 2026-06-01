export const PLATE_REGEX = /^[a-zA-Z]{3}[0-9]{3}$/;

export const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/register", label: "Registrar vehículo" },
  { href: "/inspection", label: "Registrar inspección" },
  { href: "/history", label: "Historial" },
  { href: "/blocks", label: "Cadena de bloques" },
] as const;
