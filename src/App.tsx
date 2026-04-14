import "./styles.css";
import { useState, useEffect, useRef } from "react";

const BEBIDAS_DEFAULT = [
  {
    id: "agua",
    nombre: "Agua",
    emoji: "💧",
    color: "#1187c9",
    cuentaDefault: true,
  },
  {
    id: "cafe",
    nombre: "Café",
    emoji: "☕",
    color: "#7c4a1e",
    cuentaDefault: false,
  },
  {
    id: "te",
    nombre: "Té",
    emoji: "🍵",
    color: "#2e7d32",
    cuentaDefault: false,
  },
  {
    id: "jugo",
    nombre: "Jugo",
    emoji: "🧃",
    color: "#f57c00",
    cuentaDefault: false,
  },
  {
    id: "otro",
    nombre: "Otro",
    emoji: "🥤",
    color: "#6a1b9a",
    cuentaDefault: false,
  },
];

const EJERCICIOS = [
  { id: "gym", nombre: "Gym / pesas", emoji: "🏋️", mlPorMin: 10 },
  { id: "yoga", nombre: "Yoga / pilates", emoji: "🧘", mlPorMin: 6 },
  { id: "beatsaber", nombre: "Beat Saber", emoji: "🎮", mlPorMin: 12 },
  { id: "otro", nombre: "Otro", emoji: "🏃", mlPorMin: 8 },
];

const NIVELES_ACTIVIDAD = [
  {
    id: "sedentario",
    nombre: "Sedentario",
    descripcion: "Trabajo de escritorio, poco movimiento",
    factor: 1.0,
  },
  {
    id: "moderado",
    nombre: "Moderado",
    descripcion: "Ejercicio 2-3 veces por semana",
    factor: 1.2,
  },
  {
    id: "activo",
    nombre: "Activo",
    descripcion: "Ejercicio 4-5 veces por semana",
    factor: 1.4,
  },
  {
    id: "muy_activo",
    nombre: "Muy activo",
    descripcion: "Ejercicio intenso diario",
    factor: 1.6,
  },
];

const NIVELES = [
  { min: 0, max: 25, color: "#60b8f5", emoji: "💧", nombre: "Empezando" },
  { min: 25, max: 50, color: "#1187c9", emoji: "🌊", nombre: "Fluyendo" },
  { min: 50, max: 75, color: "#0d6fa8", emoji: "🫧", nombre: "Hidratándote" },
  { min: 75, max: 100, color: "#0a5280", emoji: "🏆", nombre: "¡Casi lista!" },
];

const OPCIONES_INTERVALO = [
  { label: "30 min", ms: 30 * 60 * 1000 },
  { label: "45 min", ms: 45 * 60 * 1000 },
  { label: "1 hora", ms: 60 * 60 * 1000 },
  { label: "1.5 hrs", ms: 90 * 60 * 1000 },
  { label: "2 hrs", ms: 120 * 60 * 1000 },
  { label: "3 hrs", ms: 180 * 60 * 1000 },
];

const SONIDOS_INTEGRADOS = [
  { id: "alerta", nombre: "🔔 Alerta" },
  { id: "gota", nombre: "💧 Gota" },
  { id: "pop", nombre: "🎵 Pop" },
  { id: "custom", nombre: "📁 Personalizado" },
];

type Perfil = {
  nombre: string;
  unidad: "ml" | "oz";
  metaMl: number;
  metaOz: number;
  tamanoVasoDefault: number;
  configBebidas: { id: string; cuenta: boolean }[];
  verificacionFoto: boolean;
  intervaloMs: number;
  horaInicio: string;
  horaFin: string;
  peso: number;
  unidadPeso: "kg" | "lbs";
  nivelActividad: string;
  sonidoSeleccionado: string;
};

type Registro = { hora: string; bebidaId: string; cantidad: number };
type RegistroEjercicio = {
  hora: string;
  ejercicioId: string;
  minutos: number;
  aguaSugerida: number;
};
type DiaHistorial = { fecha: string; total: number; metaDelDia: number };

function cargarPerfil(): Perfil | null {
  try {
    const s = localStorage.getItem("water-perfil-v4");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function guardarPerfil(p: Perfil) {
  localStorage.setItem("water-perfil-v4", JSON.stringify(p));
}
function cargarHistorial(): DiaHistorial[] {
  try {
    const s = localStorage.getItem("water-historial-v1");
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}
function guardarHistorial(h: DiaHistorial[]) {
  localStorage.setItem("water-historial-v1", JSON.stringify(h));
}

function calcularMetaSugerida(
  peso: number,
  unidadPeso: "kg" | "lbs",
  nivelActividad: string
): number {
  const pesoKg = unidadPeso === "lbs" ? peso * 0.453592 : peso;
  const factor =
    NIVELES_ACTIVIDAD.find((n) => n.id === nivelActividad)?.factor || 1.0;
  return Math.round((pesoKg * 35 * factor) / 50) * 50;
}

function getNivel(p: number) {
  if (p >= 100)
    return { color: "#22c55e", emoji: "🎉", nombre: "¡Meta alcanzada!" };
  return NIVELES.find((n) => p >= n.min && p < n.max) || NIVELES[0];
}

function fechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

function esDentroDeHorario(horaInicio: string, horaFin: string): boolean {
  const ahora = new Date();
  const [hI, mI] = horaInicio.split(":").map(Number);
  const [hF, mF] = horaFin.split(":").map(Number);
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= hI * 60 + mI && min <= hF * 60 + mF;
}

// ── Sonidos sintéticos ──────────────────────────────────────────
function playAlerta(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC();
  let active = true;
  const burst = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(740, t);
    o.frequency.linearRampToValueAtTime(900, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.36);
  };
  const loop = () => {
    if (!active) return;
    const n = ctx.currentTime;
    burst(n + 0.01);
    burst(n + 0.55);
    setTimeout(loop, 1800);
  };
  loop();
  return () => {
    active = false;
    ctx.close();
  };
}

function playGota(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC();
  let active = true;
  const drop = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.4);
  };
  const loop = () => {
    if (!active) return;
    const n = ctx.currentTime;
    drop(n + 0.01);
    drop(n + 0.6);
    drop(n + 1.1);
    setTimeout(loop, 2500);
  };
  loop();
  return () => {
    active = false;
    ctx.close();
  };
}

function playPop(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC();
  let active = true;
  const pop = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.18);
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(1320, t + 0.2);
    o2.frequency.exponentialRampToValueAtTime(1600, t + 0.28);
    g2.gain.setValueAtTime(0.0001, t + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.06, t + 0.21);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o2.connect(g2);
    g2.connect(ctx.destination);
    o2.start(t + 0.2);
    o2.stop(t + 0.35);
  };
  const loop = () => {
    if (!active) return;
    const n = ctx.currentTime;
    pop(n + 0.01);
    setTimeout(loop, 3000);
  };
  loop();
  return () => {
    active = false;
    ctx.close();
  };
}

function iniciarSonido(
  sonidoId: string,
  sonidoData: string | null
): { audio: HTMLAudioElement | null; stop: () => void } {
  if (sonidoId === "custom" && sonidoData) {
    const audio = new Audio(sonidoData);
    audio.loop = true;
    audio.play().catch(() => {});
    return {
      audio,
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
      },
    };
  }
  const stopFn =
    sonidoId === "gota"
      ? playGota()
      : sonidoId === "pop"
      ? playPop()
      : playAlerta();
  return { audio: null, stop: stopFn };
}

// ── Componentes visuales ────────────────────────────────────────
function GraficaSemanal({ historial }: { historial: DiaHistorial[] }) {
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const fecha = d.toISOString().slice(0, 10);
    const dato = historial.find((h) => h.fecha === fecha);
    return {
      fecha,
      total: dato?.total || 0,
      metaDelDia: dato?.metaDelDia || 0,
    };
  });
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "6px",
      }}
    >
      {ultimos7.map((d, i) => {
        const pct =
          d.metaDelDia > 0
            ? Math.min(100, Math.round((d.total / d.metaDelDia) * 100))
            : 0;
        const cumplioMeta = d.total > 0 && d.total >= d.metaDelDia;
        const sinDatos = d.total === 0;
        const fecha = new Date(d.fecha + "T00:00:00");
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: "bold",
                color: cumplioMeta
                  ? "#22c55e"
                  : sinDatos
                  ? "#c0ccd8"
                  : "#678098",
              }}
            >
              {sinDatos ? "-" : `${pct}%`}
            </span>
            <div
              style={{
                width: "100%",
                height: "70px",
                background: "#eef2f5",
                borderRadius: "6px",
                overflow: "hidden",
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: sinDatos ? "3px" : `${Math.max(pct, 4)}%`,
                  background: sinDatos
                    ? "#d0dde8"
                    : cumplioMeta
                    ? "linear-gradient(to top,#16a34a,#4ade80)"
                    : "linear-gradient(to top,#1187c9,#60b8f5)",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.6s ease",
                }}
              />
            </div>
            <span
              style={{ fontSize: "10px", fontWeight: "bold", color: "#143350" }}
            >
              {fecha.toLocaleDateString("es-MX", { weekday: "short" })}
            </span>
            <span style={{ fontSize: "9px", color: "#678098" }}>
              {fecha.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GraficaMensual({
  historial,
  unidad,
}: {
  historial: DiaHistorial[];
  unidad: string;
}) {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const nombreMes = hoy.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  const diasMes = Array.from({ length: diasEnMes }, (_, i) => {
    const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(
      i + 1
    ).padStart(2, "0")}`;
    const dato = historial.find((d) => d.fecha === fecha);
    return {
      fecha,
      dia: i + 1,
      total: dato?.total || 0,
      metaDelDia: dato?.metaDelDia || 0,
    };
  });
  const diasConDatos = diasMes.filter((d) => d.total > 0);
  const diasCumplidos = diasConDatos.filter(
    (d) => d.total >= d.metaDelDia
  ).length;
  const promedio =
    diasConDatos.length > 0
      ? Math.round(
          diasConDatos.reduce((s, d) => s + d.total, 0) / diasConDatos.length
        )
      : 0;
  let mejorRacha = 0;
  let rachaActual = 0;
  for (const d of diasMes) {
    if (d.total >= d.metaDelDia && d.metaDelDia > 0) {
      rachaActual++;
      mejorRacha = Math.max(mejorRacha, rachaActual);
    } else rachaActual = 0;
  }
  const metaBase = diasMes.find((d) => d.metaDelDia > 0)?.metaDelDia || 2000;
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {[
          {
            label: "Promedio diario",
            valor: `${promedio} ${unidad}`,
            color: "#1187c9",
          },
          {
            label: "Días cumplidos",
            valor: `${diasCumplidos} / ${hoy.getDate()}`,
            color: "#22c55e",
          },
          {
            label: "Mejor racha",
            valor: `${mejorRacha} días 🔥`,
            color: "#f59e0b",
          },
          { label: "Meta", valor: `${metaBase} ${unidad}`, color: "#678098" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#94a3b8",
                marginBottom: "2px",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: "bold",
                color: item.color,
              }}
            >
              {item.valor}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          marginBottom: "8px",
          textTransform: "capitalize",
        }}
      >
        {nombreMes}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "3px",
        }}
      >
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
          <div
            key={d}
            style={{
              fontSize: "9px",
              color: "#94a3b8",
              textAlign: "center",
              paddingBottom: "4px",
            }}
          >
            {d}
          </div>
        ))}
        {Array.from(
          { length: (new Date(año, mes, 1).getDay() + 6) % 7 },
          (_, i) => (
            <div key={`e-${i}`} />
          )
        )}
        {diasMes.map((d) => {
          const pct =
            d.metaDelDia > 0
              ? Math.min(100, Math.round((d.total / d.metaDelDia) * 100))
              : 0;
          const cumplioMeta = d.total > 0 && d.total >= d.metaDelDia;
          const esHoy = d.dia === hoy.getDate();
          return (
            <div
              key={d.dia}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "28px",
                  background: "#eef2f5",
                  borderRadius: "4px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  border: esHoy ? "1.5px solid #1187c9" : "none",
                }}
              >
                {d.total > 0 && (
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(pct, 8)}%`,
                      background: cumplioMeta
                        ? "linear-gradient(to top,#16a34a,#4ade80)"
                        : "linear-gradient(to top,#1187c9,#60b8f5)",
                      borderRadius: "2px 2px 0 0",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: "8px",
                  color: esHoy ? "#1187c9" : "#94a3b8",
                  fontWeight: esHoy ? "bold" : "normal",
                }}
              >
                {d.dia}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VasoAgua({
  porcentaje,
  nivel,
  animacion,
}: {
  porcentaje: number;
  nivel: any;
  animacion: string | null;
}) {
  return (
    <div style={{ position: "relative", width: "130px", marginTop: "20px" }}>
      <svg viewBox="0 0 130 200" width="130" height="200">
        <defs>
          <clipPath id="vaso-clip">
            <polygon points="15,10 115,10 100,190 30,190" />
          </clipPath>
          <linearGradient id="agua-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ec8f0" />
            <stop offset="100%" stopColor={nivel.color} />
          </linearGradient>
        </defs>
        <g clipPath="url(#vaso-clip)">
          <rect
            x="0"
            y={190 - (180 * porcentaje) / 100}
            width="130"
            height="180"
            fill="url(#agua-grad)"
            style={{ transition: "y 0.8s ease" }}
          />
          {porcentaje > 0 && (
            <ellipse
              cx="65"
              cy={190 - (180 * porcentaje) / 100}
              rx="50"
              ry="6"
              fill="#7ec8f0"
              opacity="0.6"
            />
          )}
        </g>
        <polygon
          points="15,10 115,10 100,190 30,190"
          fill="none"
          stroke="#90bcd8"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect x="10" y="6" width="110" height="10" rx="5" fill="#c8e4f4" />
        <text
          x="65"
          y="108"
          textAnchor="middle"
          fontSize="22"
          fontWeight="bold"
          fill={porcentaje > 45 ? "white" : "#1187c9"}
        >
          {porcentaje}%
        </text>
      </svg>
      {animacion === "gotas" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${20 + i * 15}%`,
                top: "-10px",
                fontSize: "16px",
                animation: `caer 1s ease-in ${i * 0.15}s 1`,
              }}
            >
              💧
            </div>
          ))}
        </div>
      )}
      {animacion === "ondas" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${60 + i * 30}px`,
                height: `${60 + i * 30}px`,
                borderRadius: "50%",
                border: "2px solid #1187c9",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                opacity: 0,
                animation: `onda 1s ease-out ${i * 0.2}s 1`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Celebracion() {
  const particulas = Array.from({ length: 80 }, (_, i) => {
    const angulo = (i / 80) * 360;
    const distancia = 80 + Math.random() * 180;
    const dx = Math.cos((angulo * Math.PI) / 180) * distancia;
    const dy = Math.sin((angulo * Math.PI) / 180) * distancia;
    const colores = [
      "#ff4444",
      "#ffcc00",
      "#44aaff",
      "#ff44cc",
      "#44ff88",
      "#ff8800",
      "#ffffff",
    ];
    const color = colores[i % colores.length];
    const esEstrella = i % 5 === 0;
    const delay = (i % 4) * 0.15;
    const origen = [
      { x: "20%", y: "30%" },
      { x: "50%", y: "20%" },
      { x: "80%", y: "30%" },
      { x: "35%", y: "60%" },
      { x: "65%", y: "60%" },
    ];
    const { x, y } = origen[i % origen.length];
    return { dx, dy, color, esEstrella, delay, x, y, i };
  });
  return (
    <>
      <style>{`
        @keyframes fuego { 0%{transform:translate(0,0) scale(1);opacity:1} 60%{opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0.2);opacity:0} }
        @keyframes destello { 0%{transform:scale(0);opacity:0} 20%{transform:scale(1.4);opacity:1} 50%{transform:scale(1);opacity:1} 100%{transform:scale(0);opacity:0} }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 999,
          overflow: "hidden",
        }}
      >
        {[
          { x: "20%", y: "30%" },
          { x: "50%", y: "20%" },
          { x: "80%", y: "30%" },
          { x: "35%", y: "60%" },
          { x: "65%", y: "60%" },
        ].map((pos, i) => (
          <div
            key={`d-${i}`}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: "40px",
              height: "40px",
              marginLeft: "-20px",
              marginTop: "-20px",
              borderRadius: "50%",
              background: `radial-gradient(circle,white,${
                ["#ffcc00", "#ff4444", "#44aaff", "#ff44cc", "#44ff88"][i]
              })`,
              animation: `destello 0.6s ease-out ${i * 0.15}s 1 forwards`,
            }}
          />
        ))}
        {particulas.map(({ dx, dy, color, esEstrella, delay, x, y, i }) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: esEstrella ? "12px" : "6px",
              height: esEstrella ? "12px" : "6px",
              borderRadius: esEstrella ? "2px" : "50%",
              background: color,
              boxShadow: `0 0 6px ${color}`,
              ["--dx" as any]: `${dx}px`,
              ["--dy" as any]: `${dy}px`,
              animation: `fuego 3s ease-out ${delay}s 1 forwards`,
              transform: esEstrella ? "rotate(45deg)" : "none",
            }}
          />
        ))}
      </div>
    </>
  );
}

function ModalEjercicio({
  onConfirmar,
  onCerrar,
  unidad,
}: {
  onConfirmar: (id: string, min: number, agua: number) => void;
  onCerrar: () => void;
  unidad: string;
}) {
  const [ejercicioId, setEjercicioId] = useState<string | null>(null);
  const [minutos, setMinutos] = useState(30);
  const ejercicio = EJERCICIOS.find((e) => e.id === ejercicioId);
  const aguaSugerida = ejercicio
    ? Math.round((ejercicio.mlPorMin * minutos) / 50) * 50
    : 0;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(14,34,48,0.7)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "28px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#143350", fontSize: "20px", margin: "0 0 4px" }}>
            🏋️ Registrar ejercicio
          </h2>
          <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>
            El agua sugerida se sumará a tu progreso del día
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {EJERCICIOS.map((e) => (
            <button
              key={e.id}
              onClick={() => setEjercicioId(e.id)}
              style={{
                padding: "14px 12px",
                borderRadius: "16px",
                border: `2px solid ${
                  ejercicioId === e.id ? "#f59e0b" : "#e0eaf2"
                }`,
                background: ejercicioId === e.id ? "#fffbeb" : "white",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "26px" }}>{e.emoji}</div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: ejercicioId === e.id ? "#b45309" : "#143350",
                  marginTop: "4px",
                }}
              >
                {e.nombre}
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              fontSize: "13px",
              color: "#678098",
              fontWeight: "bold",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Duración
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <button
              onClick={() => setMinutos(Math.max(5, minutos - 5))}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "#d5e8f5",
                color: "#1187c9",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              −
            </button>
            <span
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: "#1187c9",
                minWidth: "90px",
                textAlign: "center",
              }}
            >
              {minutos} min
            </span>
            <button
              onClick={() => setMinutos(minutos + 5)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "#d5e8f5",
                color: "#1187c9",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        </div>
        {ejercicioId && (
          <div
            style={{
              background: "#fffbeb",
              borderRadius: "14px",
              padding: "14px 16px",
              marginBottom: "20px",
              textAlign: "center",
              border: "1.5px solid #fcd34d",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#78350f",
                marginBottom: "4px",
              }}
            >
              💧 Agua extra sugerida:
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#f59e0b" }}
            >
              {aguaSugerida} {unidad}
            </div>
            <div
              style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}
            >
              Estimación general — escucha a tu cuerpo y consulta con tu
              especialista.
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCerrar}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "14px",
              border: "1px solid #d0dde8",
              background: "transparent",
              color: "#a0b0c0",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!ejercicioId}
            onClick={() => onConfirmar(ejercicioId!, minutos, aguaSugerida)}
            style={{
              flex: 2,
              padding: "12px",
              borderRadius: "14px",
              border: "none",
              background: ejercicioId ? "#f59e0b" : "#d0dde8",
              color: ejercicioId ? "white" : "#a0b0c0",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: ejercicioId ? "pointer" : "not-allowed",
            }}
          >
            Registrar y sumar 💧
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalBebida({
  onConfirmar,
  onCerrar,
  unidad,
  tamanoDefault,
  verificacionFoto,
  configBebidas,
}: {
  onConfirmar: (bebidaId: string, cantidad: number) => void;
  onCerrar: () => void;
  unidad: string;
  tamanoDefault: number;
  verificacionFoto: boolean;
  configBebidas: { id: string; cuenta: boolean }[];
}) {
  const [paso, setPaso] = useState<"bebida" | "tamano" | "fotos">("bebida");
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState<string | null>(
    null
  );
  const [tamano, setTamano] = useState(tamanoDefault);
  const [fotoLleno, setFotoLleno] = useState<string | null>(null);
  const [fotoVacio, setFotoVacio] = useState<string | null>(null);
  const tamanos =
    unidad === "ml" ? [150, 200, 250, 350, 500] : [4, 8, 12, 16, 20];
  const leerFoto = (file: File, setter: (v: string) => void) => {
    const r = new FileReader();
    r.onload = () => setter(String(r.result));
    r.readAsDataURL(file);
  };
  const getBebida = (id: string) => {
    const base = BEBIDAS_DEFAULT.find((b) => b.id === id)!;
    const config = configBebidas.find((c) => c.id === id);
    return { ...base, cuentaParaMeta: config?.cuenta ?? base.cuentaDefault };
  };
  const bebida = bebidaSeleccionada ? getBebida(bebidaSeleccionada) : null;
  const listoFotos = fotoLleno && fotoVacio;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(14,34,48,0.7)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "28px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        {paso === "bebida" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#143350", fontSize: "20px", margin: 0 }}>
                ¿Qué tomaste?
              </h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {BEBIDAS_DEFAULT.map((b) => {
                const cuenta = getBebida(b.id).cuentaParaMeta;
                const sel = bebidaSeleccionada === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setBebidaSeleccionada(b.id)}
                    style={{
                      padding: "16px 12px",
                      borderRadius: "16px",
                      border: `2px solid ${sel ? b.color : "#e0eaf2"}`,
                      background: sel ? `${b.color}15` : "white",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "28px" }}>{b.emoji}</div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: sel ? b.color : "#143350",
                        marginTop: "4px",
                      }}
                    >
                      {b.nombre}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: cuenta ? "#22c55e" : "#a0b0c0",
                        marginTop: "2px",
                      }}
                    >
                      {cuenta ? "✅ Cuenta" : "No cuenta"}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={onCerrar}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid #d0dde8",
                  background: "transparent",
                  color: "#a0b0c0",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                disabled={!bebidaSeleccionada}
                onClick={() => setPaso("tamano")}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  background: bebidaSeleccionada
                    ? bebida?.color || "#1187c9"
                    : "#d0dde8",
                  color: bebidaSeleccionada ? "white" : "#a0b0c0",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: bebidaSeleccionada ? "pointer" : "not-allowed",
                }}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}
        {paso === "tamano" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "32px" }}>{bebida?.emoji}</div>
              <h2
                style={{
                  color: "#143350",
                  fontSize: "20px",
                  margin: "8px 0 4px",
                }}
              >
                {bebida?.nombre}
              </h2>
              <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>
                ¿Cuánto tomaste?
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              {tamanos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTamano(t)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "14px",
                    border: `2px solid ${
                      tamano === t ? bebida?.color || "#1187c9" : "#e0eaf2"
                    }`,
                    background:
                      tamano === t
                        ? `${bebida?.color || "#1187c9"}15`
                        : "white",
                    color:
                      tamano === t ? bebida?.color || "#1187c9" : "#94a3b8",
                    fontWeight: tamano === t ? "bold" : "normal",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {t} {unidad}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={() =>
                  setTamano(Math.max(10, tamano - (unidad === "ml" ? 50 : 2)))
                }
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#d5e8f5",
                  color: "#1187c9",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  color: bebida?.color || "#1187c9",
                  minWidth: "90px",
                  textAlign: "center",
                }}
              >
                {tamano} {unidad}
              </span>
              <button
                onClick={() => setTamano(tamano + (unidad === "ml" ? 50 : 2))}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#d5e8f5",
                  color: "#1187c9",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setPaso("bebida")}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid #d0dde8",
                  background: "transparent",
                  color: "#a0b0c0",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                ← Atrás
              </button>
              <button
                onClick={() =>
                  verificacionFoto
                    ? setPaso("fotos")
                    : onConfirmar(bebidaSeleccionada!, tamano)
                }
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  background: bebida?.color || "#1187c9",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {verificacionFoto
                  ? "Siguiente →"
                  : `Registrar ${bebida?.emoji}`}
              </button>
            </div>
          </>
        )}
        {paso === "fotos" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "32px" }}>{bebida?.emoji}</div>
              <h2
                style={{
                  color: "#143350",
                  fontSize: "20px",
                  margin: "8px 0 4px",
                }}
              >
                Confirma tu {bebida?.nombre}
              </h2>
              <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>
                {tamano} {unidad}
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {[
                { label: "Lleno", foto: fotoLleno, setter: setFotoLleno },
                { label: "Vacío", foto: fotoVacio, setter: setFotoVacio },
              ].map(({ label, foto, setter }) => (
                <div
                  key={label}
                  style={{
                    border: "2px dashed #b8d8f0",
                    borderRadius: "16px",
                    padding: "12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      color: "#1187c9",
                      marginBottom: "8px",
                    }}
                  >
                    {label}
                  </div>
                  <label style={{ cursor: "pointer", display: "block" }}>
                    {foto ? (
                      <img
                        src={foto}
                        alt={label}
                        style={{
                          width: "100%",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "10px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          background: "#eef6fd",
                          borderRadius: "10px",
                          padding: "16px 10px",
                          color: "#678098",
                          fontSize: "12px",
                        }}
                      >
                        📷 Subir
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) leerFoto(f, setter);
                      }}
                    />
                  </label>
                  {foto && (
                    <div
                      style={{
                        color: "#22c55e",
                        fontSize: "11px",
                        marginTop: "4px",
                      }}
                    >
                      ✅ Lista
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setPaso("tamano")}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "1px solid #d0dde8",
                  background: "transparent",
                  color: "#a0b0c0",
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                ← Atrás
              </button>
              <button
                disabled={!listoFotos}
                onClick={() => onConfirmar(bebidaSeleccionada!, tamano)}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  background: listoFotos
                    ? bebida?.color || "#1187c9"
                    : "#d0dde8",
                  color: listoFotos ? "white" : "#a0b0c0",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: listoFotos ? "pointer" : "not-allowed",
                }}
              >
                ✅ Confirmar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SeccionPerfil({
  onGuardar,
  onCerrar,
  perfil,
  esInicio,
}: {
  onGuardar: (p: Perfil) => void;
  onCerrar?: () => void;
  perfil?: Perfil | null;
  esInicio: boolean;
}) {
  const [nombre, setNombre] = useState(perfil?.nombre || "");
  const [unidad, setUnidad] = useState<"ml" | "oz">(perfil?.unidad || "ml");
  const [metaMl, setMetaMl] = useState(perfil?.metaMl || 2000);
  const [metaOz, setMetaOz] = useState(perfil?.metaOz || 64);
  const [tamanoVasoDefault, setTamanoVasoDefault] = useState(
    perfil?.tamanoVasoDefault || 250
  );
  const [configBebidas, setConfigBebidas] = useState(
    perfil?.configBebidas ||
      BEBIDAS_DEFAULT.map((b) => ({ id: b.id, cuenta: b.cuentaDefault }))
  );
  const [verificacionFoto, setVerificacionFoto] = useState(
    perfil?.verificacionFoto || false
  );
  const [intervaloMs, setIntervaloMs] = useState(
    perfil?.intervaloMs || 90 * 60 * 1000
  );
  const [horaInicio, setHoraInicio] = useState(perfil?.horaInicio || "07:00");
  const [horaFin, setHoraFin] = useState(perfil?.horaFin || "22:00");
  const [peso, setPeso] = useState(perfil?.peso || 65);
  const [unidadPeso, setUnidadPeso] = useState<"kg" | "lbs">(
    perfil?.unidadPeso || "kg"
  );
  const [nivelActividad, setNivelActividad] = useState(
    perfil?.nivelActividad || "moderado"
  );
  const [sonidoSeleccionado, setSonidoSeleccionado] = useState(
    perfil?.sonidoSeleccionado || "alerta"
  );
  const [sonidoCustomNombre, setSonidoCustomNombre] =
    useState("Subir archivo...");
  const [sonidoCustomData, setSonidoCustomData] = useState<string | null>(null);
  const [usarSugerida, setUsarSugerida] = useState(!perfil);
  const tamanos =
    unidad === "ml" ? [150, 200, 250, 350, 500] : [4, 8, 12, 16, 20];
  const meta = unidad === "ml" ? metaMl : metaOz;
  const metaSugerida = calcularMetaSugerida(peso, unidadPeso, nivelActividad);

  const contenido = (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {esInicio && (
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "52px", marginBottom: "8px" }}>💧</div>
          <h1 style={{ color: "#1187c9", fontSize: "24px", margin: "0 0 4px" }}>
            Water Reminder
          </h1>
          <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>
            Configura tu perfil para empezar
          </p>
        </div>
      )}
      {!esInicio && (
        <h2 style={{ color: "#143350", fontSize: "20px", margin: 0 }}>
          ⚙️ Configuración
        </h2>
      )}

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "6px",
          }}
        >
          ¿Cómo te llamas?
        </label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "14px",
            border: "1.5px solid #d0e8f5",
            fontSize: "16px",
            outline: "none",
            boxSizing: "border-box",
            color: "#143350",
          }}
        />
      </div>

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Unidad para bebidas
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          {(["ml", "oz"] as const).map((u) => (
            <button
              key={u}
              onClick={() => {
                setUnidad(u);
                setTamanoVasoDefault(u === "ml" ? 250 : 8);
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "14px",
                border: `2px solid ${unidad === u ? "#1187c9" : "#e0eaf2"}`,
                background: unidad === u ? "#e8f4fd" : "white",
                color: unidad === u ? "#1187c9" : "#94a3b8",
                fontWeight: "bold",
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Tu peso
        </label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <button
              onClick={() => setPeso(Math.max(30, peso - 1))}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: "#d5e8f5",
                color: "#1187c9",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              −
            </button>
            <span
              style={{
                color: "#1187c9",
                fontWeight: "bold",
                fontSize: "20px",
                minWidth: "50px",
                textAlign: "center",
              }}
            >
              {peso}
            </span>
            <button
              onClick={() => setPeso(peso + 1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: "#d5e8f5",
                color: "#1187c9",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["kg", "lbs"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnidadPeso(u)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "10px",
                  border: `2px solid ${
                    unidadPeso === u ? "#1187c9" : "#e0eaf2"
                  }`,
                  background: unidadPeso === u ? "#e8f4fd" : "white",
                  color: unidadPeso === u ? "#1187c9" : "#94a3b8",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Nivel de actividad
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {NIVELES_ACTIVIDAD.map((n) => (
            <button
              key={n.id}
              onClick={() => setNivelActividad(n.id)}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: `2px solid ${
                  nivelActividad === n.id ? "#1187c9" : "#e0eaf2"
                }`,
                background: nivelActividad === n.id ? "#e8f4fd" : "white",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: nivelActividad === n.id ? "#1187c9" : "#143350",
                }}
              >
                {n.nombre}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                {n.descripcion}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "#f0f9ff",
          borderRadius: "16px",
          padding: "14px 16px",
          border: "1.5px solid #bae0fd",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            color: "#1187c9",
            marginBottom: "4px",
          }}
        >
          💧 Meta sugerida: {metaSugerida} ml/día
        </div>
        <div
          style={{ fontSize: "11px", color: "#678098", marginBottom: "10px" }}
        >
          Basado en tu peso y nivel de actividad. Siempre consulta con tu médico
          o nutriólogo.
        </div>
        {esInicio && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: usarSugerida ? 0 : "10px",
            }}
          >
            <button
              onClick={() => setUsarSugerida(true)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "10px",
                border: `2px solid ${usarSugerida ? "#1187c9" : "#e0eaf2"}`,
                background: usarSugerida ? "#1187c9" : "white",
                color: usarSugerida ? "white" : "#94a3b8",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Usar sugerida
            </button>
            <button
              onClick={() => setUsarSugerida(false)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "10px",
                border: `2px solid ${!usarSugerida ? "#1187c9" : "#e0eaf2"}`,
                background: !usarSugerida ? "#1187c9" : "white",
                color: !usarSugerida ? "white" : "#94a3b8",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Personalizar
            </button>
          </div>
        )}
        {!esInicio && (
          <button
            onClick={() => {
              setMetaMl(metaSugerida);
              setMetaOz(Math.round(metaSugerida / 29.5735));
            }}
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              border: "none",
              background: "#1187c9",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Usar esta meta
          </button>
        )}
      </div>

      {(!esInicio || !usarSugerida) && (
        <div>
          <label
            style={{
              fontSize: "13px",
              color: "#678098",
              fontWeight: "bold",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Meta diaria
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <button
              onClick={() =>
                unidad === "ml"
                  ? setMetaMl(
                      Math.max(500, Math.round((metaMl - 50) / 50) * 50)
                    )
                  : setMetaOz(Math.max(16, Math.round((metaOz - 2) / 2) * 2))
              }
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "#d5e8f5",
                color: "#1187c9",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              −
            </button>
            <span
              style={{
                color: "#1187c9",
                fontWeight: "bold",
                fontSize: "22px",
                minWidth: "100px",
                textAlign: "center",
              }}
            >
              {meta} {unidad}
            </span>
            <button
              onClick={() =>
                unidad === "ml"
                  ? setMetaMl(Math.round((metaMl + 50) / 50) * 50)
                  : setMetaOz(Math.round((metaOz + 2) / 2) * 2)
              }
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "#d5e8f5",
                color: "#1187c9",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>
        </div>
      )}

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Tamaño de vaso favorito
        </label>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {tamanos.map((t) => (
            <button
              key={t}
              onClick={() => setTamanoVasoDefault(t)}
              style={{
                padding: "8px 14px",
                borderRadius: "14px",
                border: `2px solid ${
                  tamanoVasoDefault === t ? "#1187c9" : "#e0eaf2"
                }`,
                background: tamanoVasoDefault === t ? "#e8f4fd" : "white",
                color: tamanoVasoDefault === t ? "#1187c9" : "#94a3b8",
                fontWeight: tamanoVasoDefault === t ? "bold" : "normal",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {t} {unidad}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "8px",
          }}
        >
          ⏰ Horario de recordatorios
        </label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#678098",
                marginBottom: "4px",
              }}
            >
              Inicio
            </div>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "10px",
                border: "1.5px solid #d0e8f5",
                fontSize: "14px",
                color: "#1187c9",
                fontWeight: "bold",
                outline: "none",
                textAlign: "center",
              }}
            />
          </div>
          <span style={{ color: "#94a3b8" }}>→</span>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#678098",
                marginBottom: "4px",
              }}
            >
              Fin
            </div>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "10px",
                border: "1.5px solid #d0e8f5",
                fontSize: "14px",
                color: "#1187c9",
                fontWeight: "bold",
                outline: "none",
                textAlign: "center",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Intervalo de recordatorio
        </label>
        <select
          value={intervaloMs}
          onChange={(e) => setIntervaloMs(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1.5px solid #d0e8f5",
            fontSize: "14px",
            color: "#1187c9",
            fontWeight: "bold",
            outline: "none",
          }}
        >
          {OPCIONES_INTERVALO.map((op) => (
            <option key={op.ms} value={op.ms}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "8px",
          }}
        >
          🔔 Sonido de alarma
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SONIDOS_INTEGRADOS.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: sonidoSeleccionado === s.id ? "#e8f4fd" : "#f8fafc",
                borderRadius: "12px",
                border: `1.5px solid ${
                  sonidoSeleccionado === s.id ? "#1187c9" : "#e0eaf2"
                }`,
                cursor: "pointer",
              }}
              onClick={() => setSonidoSeleccionado(s.id)}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: sonidoSeleccionado === s.id ? "#1187c9" : "#143350",
                }}
              >
                {s.nombre}
              </span>
              {sonidoSeleccionado === s.id && (
                <span style={{ color: "#1187c9", fontSize: "16px" }}>✓</span>
              )}
            </div>
          ))}
          {sonidoSeleccionado === "custom" && (
            <label
              style={{
                fontSize: "13px",
                color: "#1187c9",
                cursor: "pointer",
                padding: "8px 14px",
                background: "#e8f4fd",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              {sonidoCustomNombre}
              <input
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    setSonidoCustomData(String(r.result));
                    setSonidoCustomNombre(f.name);
                  };
                  r.readAsDataURL(f);
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "bold", color: "#143350" }}
          >
            📷 Verificación por foto
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            Requiere fotos para confirmar
          </div>
        </div>
        <button
          onClick={() => setVerificacionFoto(!verificacionFoto)}
          style={{
            padding: "6px 16px",
            borderRadius: "20px",
            border: "none",
            background: verificacionFoto ? "#22c55e" : "#e0eaf2",
            color: verificacionFoto ? "white" : "#94a3b8",
            fontWeight: "bold",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          {verificacionFoto ? "ON" : "OFF"}
        </button>
      </div>

      <div>
        <label
          style={{
            fontSize: "13px",
            color: "#678098",
            fontWeight: "bold",
            display: "block",
            marginBottom: "10px",
          }}
        >
          ¿Qué bebidas cuentan para tu meta?
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {BEBIDAS_DEFAULT.map((b) => {
            const config = configBebidas.find((x) => x.id === b.id);
            const cuenta = config?.cuenta ?? b.cuentaDefault;
            return (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: `1.5px solid ${cuenta ? b.color + "40" : "#e0eaf2"}`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "20px" }}>{b.emoji}</span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#143350",
                    }}
                  >
                    {b.nombre}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setConfigBebidas((prev) =>
                      prev.map((x) =>
                        x.id === b.id ? { ...x, cuenta: !cuenta } : x
                      )
                    )
                  }
                  style={{
                    padding: "5px 14px",
                    borderRadius: "20px",
                    border: "none",
                    background: cuenta ? b.color : "#e0eaf2",
                    color: cuenta ? "white" : "#94a3b8",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {cuenta ? "✅ Cuenta" : "❌ No cuenta"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        {!esInicio && (
          <button
            onClick={onCerrar}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "14px",
              border: "1px solid #d0dde8",
              background: "transparent",
              color: "#a0b0c0",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        )}
        <button
          disabled={!nombre.trim()}
          onClick={() => {
            if (!nombre.trim()) return;
            const metaFinalMl =
              esInicio && usarSugerida
                ? calcularMetaSugerida(peso, unidadPeso, nivelActividad)
                : metaMl;
            const metaFinalOz =
              esInicio && usarSugerida
                ? Math.round(metaFinalMl / 29.5735)
                : metaOz;
            const customData =
              sonidoSeleccionado === "custom" ? sonidoCustomData : null;
            onGuardar({
              nombre: nombre.trim(),
              unidad,
              metaMl: metaFinalMl,
              metaOz: metaFinalOz,
              tamanoVasoDefault,
              configBebidas,
              verificacionFoto,
              intervaloMs,
              horaInicio,
              horaFin,
              peso,
              unidadPeso,
              nivelActividad,
              sonidoSeleccionado,
            });
            if (customData)
              localStorage.setItem("water-custom-sound", customData);
          }}
          style={{
            flex: esInicio ? undefined : 2,
            width: esInicio ? "100%" : undefined,
            padding: "14px",
            borderRadius: "16px",
            border: "none",
            background: nombre.trim() ? "#1187c9" : "#d0dde8",
            color: nombre.trim() ? "white" : "#a0b0c0",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: nombre.trim() ? "pointer" : "not-allowed",
          }}
        >
          {esInicio ? "¡Empezar! 💧" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );

  if (esInicio)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #e8f4fd 0%, #eef2f5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "28px",
            padding: "36px 28px",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 20px 40px rgba(17,135,201,0.12)",
          }}
        >
          {contenido}
        </div>
      </div>
    );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(14,34,48,0.7)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "28px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {contenido}
      </div>
    </div>
  );
}

export default function App() {
  const [perfil, setPerfil] = useState<Perfil | null>(() => cargarPerfil());
  const [mlAcumulados, setMlAcumulados] = useState(0);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ejercicios, setEjercicios] = useState<RegistroEjercicio[]>([]);
  const [animacion, setAnimacion] = useState<
    "gotas" | "ondas" | "burbujas" | "celebracion" | null
  >(null);
  const [historialCompleto, setHistorialCompleto] = useState<DiaHistorial[]>(
    () => cargarHistorial()
  );
  const [racha, setRacha] = useState(0);
  const [vistaGrafica, setVistaGrafica] = useState<"semana" | "mes">("semana");
  const [proximaAlarma, setProximaAlarma] = useState(
    () => Date.now() + 90 * 60 * 1000
  );
  const [ahora, setAhora] = useState(Date.now());
  const [alarmaActiva, setAlarmaActiva] = useState(false);
  const [recordatoriosOn, setRecordatoriosOn] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarEjercicio, setMostrarEjercicio] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const stopAlarmaRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!perfil) return;
    if (
      recordatoriosOn &&
      ahora >= proximaAlarma &&
      !alarmaActiva &&
      esDentroDeHorario(perfil.horaInicio, perfil.horaFin)
    ) {
      setAlarmaActiva(true);
      setMostrarModal(true);
      const sonidoData =
        perfil.sonidoSeleccionado === "custom"
          ? localStorage.getItem("water-custom-sound")
          : null;
      const { audio, stop } = iniciarSonido(
        perfil.sonidoSeleccionado,
        sonidoData
      );
      audioRef.current = audio;
      stopAlarmaRef.current = stop;
    }
  }, [ahora, proximaAlarma, alarmaActiva, recordatoriosOn, perfil]);

  useEffect(() => {
    if (!perfil) return;
    const meta = perfil.unidad === "ml" ? perfil.metaMl : perfil.metaOz;
    const hoy = fechaHoy();
    setHistorialCompleto((prev) => {
      const sinHoy = prev.filter((d) => d.fecha !== hoy);
      const nuevo = [
        ...sinHoy,
        { fecha: hoy, total: mlAcumulados, metaDelDia: meta },
      ];
      guardarHistorial(nuevo);
      const ordenado = [...nuevo].sort((a, b) =>
        b.fecha.localeCompare(a.fecha)
      );
      let cuenta = 0;
      for (const d of ordenado) {
        if (d.total >= d.metaDelDia && d.metaDelDia > 0) cuenta++;
        else break;
      }
      setRacha(cuenta);
      return nuevo;
    });
  }, [mlAcumulados, perfil]);

  if (!perfil)
    return (
      <SeccionPerfil
        esInicio={true}
        onGuardar={(p) => {
          guardarPerfil(p);
          setPerfil(p);
          setProximaAlarma(Date.now() + p.intervaloMs);
        }}
      />
    );

  const {
    unidad,
    metaMl,
    metaOz,
    configBebidas,
    verificacionFoto,
    intervaloMs,
    tamanoVasoDefault,
  } = perfil;
  const meta = unidad === "ml" ? metaMl : metaOz;
  const porcentaje = Math.min(100, Math.round((mlAcumulados / meta) * 100));
  const nivel = getNivel(porcentaje);
  const totalEjercicioHoy = ejercicios.reduce((s, e) => s + e.aguaSugerida, 0);
  const msRestantes = Math.max(0, proximaAlarma - ahora);
  const hh = Math.floor(msRestantes / 3600000);
  const mm = Math.floor((msRestantes % 3600000) / 60000);
  const ss = Math.floor((msRestantes % 60000) / 1000);
  const tiempoRestante = `${hh}:${String(mm).padStart(2, "0")}:${String(
    ss
  ).padStart(2, "0")}`;
  const horaActual = new Date(ahora).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const pararAlarma = () => {
    stopAlarmaRef.current?.();
    audioRef.current?.pause();
    setAlarmaActiva(false);
    setProximaAlarma(Date.now() + intervaloMs);
  };

  const dispararAnimacion = (nuevoTotal: number) => {
    const pct = Math.min(100, Math.round((nuevoTotal / meta) * 100));
    if (pct >= 100) setAnimacion("celebracion");
    else if (pct >= 50) setAnimacion("burbujas");
    else if (pct >= 25) setAnimacion("ondas");
    else setAnimacion("gotas");
    setTimeout(() => setAnimacion(null), 3200);
  };

  const confirmarBebida = (bebidaId: string, cantidad: number) => {
    const base = BEBIDAS_DEFAULT.find((b) => b.id === bebidaId)!;
    const config = configBebidas.find((c) => c.id === bebidaId);
    const cuentaParaMeta = config?.cuenta ?? base.cuentaDefault;
    const hora = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (cuentaParaMeta) {
      const nuevo = mlAcumulados + cantidad;
      dispararAnimacion(nuevo);
      setMlAcumulados(nuevo);
    }
    setRegistros((prev) => [{ hora, bebidaId, cantidad }, ...prev]);
    setMostrarModal(false);
    pararAlarma();
  };

  const confirmarEjercicio = (
    ejercicioId: string,
    minutos: number,
    aguaSugerida: number
  ) => {
    const hora = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setEjercicios((prev) => [
      { hora, ejercicioId, minutos, aguaSugerida },
      ...prev,
    ]);
    const nuevo = mlAcumulados + aguaSugerida;
    dispararAnimacion(nuevo);
    setMlAcumulados(nuevo);
    setMostrarEjercicio(false);
  };

  const guardarCambios = (nuevoPerfil: Perfil) => {
    guardarPerfil(nuevoPerfil);
    setPerfil(nuevoPerfil);
    setProximaAlarma(Date.now() + nuevoPerfil.intervaloMs);
    setMostrarConfig(false);
  };

  return (
    <>
      <style>{`
        @keyframes caer { 0%{transform:translateY(-10px);opacity:1} 100%{transform:translateY(300px);opacity:0} }
        @keyframes onda { 0%{opacity:0.8;transform:translate(-50%,-50%) scale(0.3)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1)} }
        @keyframes subir { 0%{transform:translateY(0);opacity:0.8} 100%{transform:translateY(-200px);opacity:0} }
      `}</style>

      {animacion === "celebracion" && <Celebracion />}
      {mostrarModal && (
        <ModalBebida
          onConfirmar={confirmarBebida}
          onCerrar={() => {
            setMostrarModal(false);
            pararAlarma();
          }}
          unidad={unidad}
          tamanoDefault={tamanoVasoDefault}
          verificacionFoto={verificacionFoto}
          configBebidas={configBebidas}
        />
      )}
      {mostrarEjercicio && (
        <ModalEjercicio
          onConfirmar={confirmarEjercicio}
          onCerrar={() => setMostrarEjercicio(false)}
          unidad={unidad}
        />
      )}
      {mostrarConfig && (
        <SeccionPerfil
          esInicio={false}
          perfil={perfil}
          onGuardar={guardarCambios}
          onCerrar={() => setMostrarConfig(false)}
        />
      )}

      <div
        style={{
          minHeight: "100vh",
          background: "#eef2f5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 20px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "2px",
          }}
        >
          <h1 style={{ color: "#1187c9", fontSize: "26px", margin: 0 }}>
            💧 Water Reminder
          </h1>
          <button
            onClick={() => setMostrarConfig(true)}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ⚙️
          </button>
        </div>
        <p style={{ color: "#678098", margin: "0 0 2px", fontSize: "15px" }}>
          ¡Hola, {perfil.nombre}!
        </p>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: "13px" }}>
          {horaActual}
        </p>

        <div
          style={{
            marginTop: "12px",
            background: racha > 0 ? "#fff8e1" : "white",
            border: `2px solid ${racha > 0 ? "#fbbf24" : "#e0e8f0"}`,
            borderRadius: "16px",
            padding: "10px 24px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "22px" }}>{racha > 0 ? "🔥" : "💤"}</span>
          <span
            style={{
              marginLeft: "8px",
              fontWeight: "bold",
              color: racha > 0 ? "#b45309" : "#94a3b8",
              fontSize: "16px",
            }}
          >
            {racha > 0
              ? `${racha} día${racha > 1 ? "s" : ""} de racha`
              : "Sin racha aún"}
          </span>
          {racha === 0 && (
            <div
              style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}
            >
              ¡Cumple tu meta hoy para empezar!
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "16px",
            background: "white",
            borderRadius: "18px",
            padding: "16px 24px",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
            width: "100%",
            maxWidth: "360px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#678098",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Próximo recordatorio
          </div>
          <div
            style={{
              fontSize: "42px",
              fontWeight: "bold",
              color: "#143350",
              lineHeight: 1.1,
            }}
          >
            {tiempoRestante}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Activo: {perfil.horaInicio} — {perfil.horaFin}
          </div>
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#678098" }}>
              Intervalo:
            </span>
            <select
              value={intervaloMs}
              onChange={(e) =>
                guardarCambios({
                  ...perfil,
                  intervaloMs: Number(e.target.value),
                })
              }
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid #d0dde8",
                background: "white",
                color: "#1187c9",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {OPCIONES_INTERVALO.map((op) => (
                <option key={op.ms} value={op.ms}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              marginTop: "12px",
            }}
          >
            <button
              onClick={() => setRecordatoriosOn(!recordatoriosOn)}
              style={{
                background: recordatoriosOn ? "#1187c9" : "#d5e8f5",
                color: recordatoriosOn ? "white" : "#1187c9",
                border: "none",
                borderRadius: "20px",
                padding: "6px 16px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              🔔 {recordatoriosOn ? "Alarma ON" : "Alarma OFF"}
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "#678098",
            display: "flex",
            gap: "16px",
          }}
        >
          <span>
            Meta:{" "}
            <strong style={{ color: "#1187c9" }}>
              {meta} {unidad}
            </strong>
          </span>
          {totalEjercicioHoy > 0 && (
            <span>
              🏋️{" "}
              <strong style={{ color: "#f59e0b" }}>
                +{totalEjercicioHoy} {unidad}
              </strong>
            </span>
          )}
        </div>

        <VasoAgua porcentaje={porcentaje} nivel={nivel} animacion={animacion} />
        <div
          style={{
            marginTop: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            color: nivel.color,
          }}
        >
          {nivel.emoji} {nivel.nombre}
        </div>
        <div style={{ fontSize: "13px", color: "#678098", marginTop: "2px" }}>
          {mlAcumulados}/{meta} {unidad} de agua
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          style={{
            marginTop: "16px",
            background: "#1187c9",
            color: "white",
            border: "none",
            borderRadius: "14px",
            padding: "14px 32px",
            fontSize: "16px",
            cursor: "pointer",
            width: "280px",
          }}
        >
          💧 Registrar bebida
        </button>
        <button
          onClick={() => setMostrarEjercicio(true)}
          style={{
            marginTop: "8px",
            background: "white",
            color: "#f59e0b",
            border: "2px solid #f59e0b",
            borderRadius: "14px",
            padding: "12px 32px",
            fontSize: "15px",
            cursor: "pointer",
            width: "280px",
            fontWeight: "bold",
          }}
        >
          🏋️ Registrar ejercicio
        </button>
        <button
          onClick={() => {
            setMlAcumulados(0);
            setRegistros([]);
            setEjercicios([]);
          }}
          style={{
            marginTop: "8px",
            background: "transparent",
            color: "#a0b0c0",
            border: "1px solid #d0dde8",
            borderRadius: "14px",
            padding: "10px 32px",
            fontSize: "14px",
            cursor: "pointer",
            width: "280px",
          }}
        >
          🔄 Resetear
        </button>

        {ejercicios.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              width: "100%",
              maxWidth: "360px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2 style={{ color: "#f59e0b", fontSize: "16px", margin: 0 }}>
                🏋️ Ejercicio de hoy
              </h2>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#f59e0b",
                }}
              >
                +{totalEjercicioHoy} {unidad}
              </span>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {ejercicios.map((e, i) => {
                const ej = EJERCICIOS.find((x) => x.id === e.ejercicioId)!;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#fffbeb",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{ej.emoji}</span>
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#143350",
                          }}
                        >
                          {ej.nombre}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {e.minutos} min
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: "#f59e0b",
                          }}
                        >
                          +{e.aguaSugerida} {unidad}
                        </div>
                        <div style={{ fontSize: "11px", color: "#a0b0c0" }}>
                          {e.hora}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMlAcumulados(
                            Math.max(0, mlAcumulados - e.aguaSugerida)
                          );
                          setEjercicios((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          );
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "16px",
                          cursor: "pointer",
                          color: "#fca5a5",
                          padding: "4px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {registros.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              width: "100%",
              maxWidth: "360px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
            }}
          >
            <h2
              style={{ color: "#1187c9", fontSize: "16px", margin: "0 0 12px" }}
            >
              📋 Bebidas de hoy
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {registros.map((r, i) => {
                const b = BEBIDAS_DEFAULT.find((b) => b.id === r.bebidaId)!;
                const config = configBebidas.find((c) => c.id === r.bebidaId);
                const cuentaParaMeta = config?.cuenta ?? b.cuentaDefault;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{b.emoji}</span>
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#143350",
                          }}
                        >
                          {b.nombre}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: cuentaParaMeta ? "#22c55e" : "#a0b0c0",
                          }}
                        >
                          {cuentaParaMeta ? "✅ Cuenta" : "No cuenta"}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: b.color,
                        }}
                      >
                        {r.cantidad} {unidad}
                      </div>
                      <div style={{ fontSize: "11px", color: "#a0b0c0" }}>
                        {r.hora}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            background: "white",
            borderRadius: "20px",
            padding: "20px",
            width: "100%",
            maxWidth: "360px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.07)",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ color: "#1187c9", fontSize: "16px", margin: 0 }}>
              📊 Historial
            </h2>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setVistaGrafica("semana")}
                style={{
                  padding: "5px 14px",
                  borderRadius: "20px",
                  border: "none",
                  background: vistaGrafica === "semana" ? "#1187c9" : "#eef2f5",
                  color: vistaGrafica === "semana" ? "white" : "#678098",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                7 días
              </button>
              <button
                onClick={() => setVistaGrafica("mes")}
                style={{
                  padding: "5px 14px",
                  borderRadius: "20px",
                  border: "none",
                  background: vistaGrafica === "mes" ? "#1187c9" : "#eef2f5",
                  color: vistaGrafica === "mes" ? "white" : "#678098",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Este mes
              </button>
            </div>
          </div>

          {vistaGrafica === "semana" ? (
            <GraficaSemanal historial={historialCompleto} />
          ) : (
            <GraficaMensual historial={historialCompleto} unidad={unidad} />
          )}

          <div
            style={{
              marginTop: "14px",
              display: "flex",
              gap: "16px",
              fontSize: "12px",
              color: "#678098",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "3px",
                  background: "#1187c9",
                }}
              />{" "}
              En progreso
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "3px",
                  background: "#22c55e",
                }}
              />{" "}
              Meta cumplida
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
