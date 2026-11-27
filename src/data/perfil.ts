import { AzucarAgregada, ComposicionCafeLeche, NutricionCalculada } from "./bebidas";
import { fechaHoy } from "../lib/utils";

export const EJERCICIOS = [
  { id: "gym", nombre: "Gym / pesas", emoji: "🏋️", mlPorMin: 10 },
  { id: "yoga", nombre: "Yoga / pilates", emoji: "🧘", mlPorMin: 6 },
  { id: "beatsaber", nombre: "Beat Saber", emoji: "🎮", mlPorMin: 12 },
  { id: "otro", nombre: "Otro", emoji: "🏃", mlPorMin: 8 },
];

export const NIVELES_ACTIVIDAD = [
  { id: "sedentario", nombre: "Sedentario", descripcion: "Trabajo de escritorio, poco movimiento", factor: 1.0 },
  { id: "moderado", nombre: "Moderado", descripcion: "Ejercicio 2-3 veces por semana", factor: 1.2 },
  { id: "activo", nombre: "Activo", descripcion: "Ejercicio 4-5 veces por semana", factor: 1.4 },
  { id: "muy_activo", nombre: "Muy activo", descripcion: "Ejercicio intenso diario", factor: 1.6 },
];

export const NIVELES = [
  { min: 0, max: 25, color: "#60b8f5", emoji: "💧", nombre: "Empezando" },
  { min: 25, max: 50, color: "#1187c9", emoji: "🌊", nombre: "Fluyendo" },
  { min: 50, max: 75, color: "#0d6fa8", emoji: "🫧", nombre: "Hidratándote" },
  { min: 75, max: 100, color: "#0a5280", emoji: "🏆", nombre: "¡Casi lista!" },
];

export const OPCIONES_INTERVALO = [
  { label: "30 min", ms: 30 * 60 * 1000 },
  { label: "45 min", ms: 45 * 60 * 1000 },
  { label: "1 hora", ms: 60 * 60 * 1000 },
  { label: "1.5 hrs", ms: 90 * 60 * 1000 },
  { label: "2 hrs", ms: 120 * 60 * 1000 },
  { label: "3 hrs", ms: 180 * 60 * 1000 },
];

export const SONIDOS_INTEGRADOS = [
  { id: "alerta", nombre: "🔔 Alerta" },
  { id: "gota", nombre: "💧 Gota" },
  { id: "pop", nombre: "🎵 Pop" },
  { id: "custom", nombre: "📁 Personalizado" },
];

export type Perfil = {
  nombre: string; unidad: "ml" | "oz"; metaMl: number; metaOz: number;
  tamanoVasoDefault: number; configBebidas: { id: string; cuenta: boolean }[];
  verificacionFoto: boolean; intervaloMs: number; horaInicio: string; horaFin: string;
  peso: number; unidadPeso: "kg" | "lbs"; nivelActividad: string; sonidoSeleccionado: string;
  mascotaTipo: "perrito" | "gatito" | "gota";
};
export type Registro = { hora: string; bebidaId: string; cantidad: number; fecha?: string; composicionCafeLeche?: ComposicionCafeLeche; azucarAgregada?: AzucarAgregada; nutricion?: NutricionCalculada; cuentaParaMeta?: boolean };
export type RegistroEjercicio = { hora: string; ejercicioId: string; minutos: number; aguaSugerida: number; fecha?: string };
export type DiaHistorial = { fecha: string; total: number; metaDelDia: number };
export type EjercicioCustom = { id: string; nombre: string; emoji: string; mlPorMin: number };

export function cargarPerfil(): Perfil | null {
  try { const s = localStorage.getItem("water-perfil-v4"); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function guardarPerfil(p: Perfil) { localStorage.setItem("water-perfil-v4", JSON.stringify(p)); }
export function cargarHistorial(): DiaHistorial[] {
  try { const s = localStorage.getItem("water-historial-v1"); return s ? JSON.parse(s) : []; } catch { return []; }
}
export function guardarHistorial(h: DiaHistorial[]) { localStorage.setItem("water-historial-v1", JSON.stringify(h)); }
export function cargarEjerciciosCustom(): EjercicioCustom[] {
  try { const s = localStorage.getItem("water-ejercicios-custom"); return s ? JSON.parse(s) : []; } catch { return []; }
}

// ── Persistencia del día actual ─────────────────────────────────
export type DiaActual = { fecha: string; ml: number; registros: Registro[]; ejercicios: RegistroEjercicio[] };

export function cargarDiaActual(): DiaActual | null {
  try {
    const s = localStorage.getItem("water-dia-actual");
    if (!s) return null;
    const d: DiaActual = JSON.parse(s);
    if (d.fecha === fechaHoy()) return d;
    return null;
  } catch { return null; }
}

export function guardarDiaActual(data: DiaActual) {
  localStorage.setItem("water-dia-actual", JSON.stringify(data));
}
