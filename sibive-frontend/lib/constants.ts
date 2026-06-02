export const PLATE_REGEX = /^[a-zA-Z]{3}[0-9]{3}$/;

export const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/register", label: "Registrar vehículo" },
  { href: "/query", label: "Consultar vehículo" },
  { href: "/inspection", label: "Registrar inspección" },
  { href: "/history", label: "Historial de inspecciones" },
  { href: "/blocks", label: "Cadena de bloques" },
] as const;
