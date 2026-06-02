export function clampDigits(value: string, max: number): string {
  if (value === "") return "";
  const normalized = value.replace(/\D/g, "");
  if (normalized === "") return "";
  const numeric = Number(normalized);
  return String(numeric > max ? max : numeric);
}

export function clampPercentage(
  value: string,
  max: number,
  decimals: number
): string {
  if (value === "") return "";

  let filtered = value.replace(/\./g, ",").replace(/[^0-9,]/g, "");
  const firstCommaIndex = filtered.indexOf(",");
  if (firstCommaIndex !== -1) {
    filtered =
      filtered.slice(0, firstCommaIndex + 1) +
      filtered.slice(firstCommaIndex + 1).replace(/,/g, "");
  }

  const hasComma = filtered.includes(",");
  const parts = filtered.split(",");
  const intPart = parts[0] || "";
  let decPart = parts[1] ?? "";
  if (decPart.length > decimals) decPart = decPart.slice(0, decimals);

  const numericStr = intPart + (decPart ? "." + decPart : "");
  const numeric =
    numericStr !== "" && numericStr !== "." ? Number(numericStr) : NaN;

  if (!isNaN(numeric) && numeric > max) {
    if (decimals > 0) {
      return String(Number(max).toFixed(decimals)).replace(".", ",");
    }
    return String(max);
  }

  if (hasComma) {
    return `${intPart},${decPart}`;
  }
  return intPart;
}

export function parsePercentToStored(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/,/g, ".");
  const num = Number(normalized);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function formatPercentStored(value: number, decimals = 2): string {
  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)} %`;
}

export function formatPpm(value: number): string {
  return `${new Intl.NumberFormat("es-ES").format(value)} ppm`;
}

export function formatCelsius(value: number): string {
  return `${new Intl.NumberFormat("es-ES").format(value)} °C`;
}

export function formatRpm(value: number): string {
  return `${new Intl.NumberFormat("es-ES").format(value)} rpm`;
}

export function isDieselInspection(item: InspectionLike): boolean {
  return item.opacity > 0;
}

interface InspectionLike {
  opacity: number;
}

export function defectLabels(item: {
  emiteHumoContinuo: boolean;
  fugaEscape: boolean;
  faltaTapon: boolean;
}): string[] {
  const labels: string[] = [];
  if (item.emiteHumoContinuo) labels.push("Humo continuo");
  if (item.fugaEscape) labels.push("Fuga de escape");
  if (item.faltaTapon) labels.push("Falta tapón/filtro");
  return labels;
}
