import { DiaHistorial } from "../data/perfil";
import { fechaHoy } from "./utils";

// ── Cálculo correcto de racha (días consecutivos hasta hoy) ────
export function calcularRacha(historial: DiaHistorial[]): number {
  const ordenado = [...historial].sort((a, b) => b.fecha.localeCompare(a.fecha));
  let cuenta = 0;
  const diaAnterior = (fecha: string) => {
    const d = new Date(fecha + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  let fechaEsperada = fechaHoy();
  for (const d of ordenado) {
    // Si hoy está en progreso (no cumplió meta aún), saltarlo y empezar desde ayer
    if (d.fecha === fechaHoy() && d.total < d.metaDelDia) {
      fechaEsperada = diaAnterior(fechaHoy());
      continue;
    }
    if (d.fecha !== fechaEsperada) break; // hueco en las fechas = racha rota
    if (d.total >= d.metaDelDia && d.metaDelDia > 0) {
      cuenta++;
      fechaEsperada = diaAnterior(d.fecha);
    } else break;
  }
  return cuenta;
}

export const ACCESORIOS = [
  { id: "gorra", nombre: "Gorra", diasRequeridos: 3, opciones: [
    { id: "gorra_rosa", img: "/pets/acc_gorra_rosa.png" },
    { id: "gorra_azul", img: "/pets/acc_gorra_azul.png" },
  ]},
  { id: "lentes", nombre: "Lentes", diasRequeridos: 7, opciones: [
    { id: "lentes_rosa", img: "/pets/acc_lentes_rosa.png" },
    { id: "lentes_negro", img: "/pets/acc_lentes_negro.png" },
  ]},
  { id: "corona", nombre: "Corona", diasRequeridos: 20, opciones: [
    { id: "corona_dorada", img: "/pets/acc_corona_dorada.png" },
    { id: "corona_azul", img: "/pets/acc_corona_azul.png" },
  ]},
  { id: "arcoiris", nombre: "Legendario", diasRequeridos: 100, opciones: [
    { id: "arcoiris", img: "/pets/acc_arcoiris.png" },
  ]},
];

export function calcularRachaCompleta(historial: DiaHistorial[]): { racha: number; enGracia: boolean } {
  const rachaBase = calcularRacha(historial);
  if (rachaBase > 0) return { racha: rachaBase, enGracia: false };
  const diaAnterior = (f: string) => {
    const d = new Date(f + "T00:00:00"); d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const hoy = fechaHoy();
  const ayer = diaAnterior(hoy);
  const antesDeAyer = diaAnterior(ayer);
  const diasCumplidos = new Set(historial.filter(d => d.total >= d.metaDelDia && d.metaDelDia > 0).map(d => d.fecha));
  if (!diasCumplidos.has(ayer) && diasCumplidos.has(antesDeAyer)) {
    let cuenta = 0; let fecha = antesDeAyer;
    while (diasCumplidos.has(fecha) && cuenta < 365) { cuenta++; fecha = diaAnterior(fecha); }
    return { racha: cuenta, enGracia: true };
  }
  return { racha: 0, enGracia: false };
}
