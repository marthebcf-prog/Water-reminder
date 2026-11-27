import { NIVELES } from "../data/perfil";

export function calcularMetaSugerida(peso: number, unidadPeso: "kg" | "lbs", nivelActividad: string): number {
  const pesoKg = unidadPeso === "lbs" ? peso * 0.453592 : peso;
  // Base: 30ml por kg (estándar médico conservador)
  // Factores más moderados por nivel de actividad
  const factores: Record<string, number> = {
    sedentario: 1.0,   // 30ml/kg
    moderado: 1.1,     // 33ml/kg
    activo: 1.2,       // 36ml/kg
    muy_activo: 1.3,   // 39ml/kg
  };
  const factor = factores[nivelActividad] || 1.0;
  return Math.round((pesoKg * 30 * factor) / 50) * 50;
}

export function getNivel(p: number) {
  if (p >= 100) return { color: "#22c55e", emoji: "🎉", nombre: "¡Meta alcanzada!" };
  return NIVELES.find((n) => p >= n.min && p < n.max) || NIVELES[0];
}

export function fechaHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function esDentroDeHorario(horaInicio: string, horaFin: string): boolean {
  const ahora = new Date();
  const [hI, mI] = horaInicio.split(":").map(Number);
  const [hF, mF] = horaFin.split(":").map(Number);
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= hI * 60 + mI && min <= hF * 60 + mF;
}
