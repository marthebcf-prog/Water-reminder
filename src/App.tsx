import "./styles.css";
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCX0LcXwAc2nIHp3h30H_l8OH2ScKViRL8",
  authDomain: "water-reminder-81de3.firebaseapp.com",
  projectId: "water-reminder-81de3",
  storageBucket: "water-reminder-81de3.firebasestorage.app",
  messagingSenderId: "851037166480",
  appId: "1:851037166480:web:a572b97da2c5f4451ab115"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

function sincronizarFirebase(userId: string, data: any) {
  return setDoc(doc(db, "usuarios", userId), data, { merge: true }).catch((e) => console.warn("Firebase sync error:", e));
}

function getDocRef(userId: string) {
  return doc(db, "usuarios", userId);
}

// ── Pantalla de Login ───────────────────────────────────────────
function PantallaLogin({ onLogin }: { onLogin: () => void }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const entrarConGoogle = async () => {
    setCargando(true); setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (e: any) {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #E3F2FD 0%, #EEF6FB 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "white", borderRadius: "28px", padding: "40px 28px", width: "100%", maxWidth: "380px", boxShadow: "0 20px 40px rgba(17,135,201,0.12)", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>💧</div>
        <h1 style={{ color: "#0D3B66", fontSize: "26px", fontWeight: "900", margin: "0 0 8px" }}>Water Reminder</h1>
        <p style={{ color: "#94A3B8", fontSize: "15px", margin: "0 0 32px" }}>Tu compañero de hidratación diaria</p>

        <button onClick={entrarConGoogle} disabled={cargando} style={{ width: "100%", padding: "14px 20px", borderRadius: "16px", border: "1.5px solid #E0EAF2", background: cargando ? "#F8FBFD" : "white", color: "#0D3B66", fontSize: "16px", fontWeight: "700", cursor: cargando ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {cargando ? (
            <span style={{ color: "#94A3B8" }}>Iniciando sesión...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </>
          )}
        </button>

        {error && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px" }}>{error}</p>}

        <p style={{ color: "#CBD5E1", fontSize: "11px", marginTop: "24px", lineHeight: 1.5 }}>
          Tus datos están protegidos y solo tú puedes acceder a ellos. No compartimos tu información con nadie.
        </p>
      </div>
    </div>
  );
}

const BEBIDAS_DEFAULT = [
  { id: "agua", nombre: "Agua", emoji: "💧", color: "#1187c9", cuentaDefault: true },
  { id: "cafe", nombre: "Café", emoji: "☕", color: "#7c4a1e", cuentaDefault: false },
  { id: "te", nombre: "Té", emoji: "🍵", color: "#2e7d32", cuentaDefault: false },
  { id: "jugo", nombre: "Jugo", emoji: "🧃", color: "#f57c00", cuentaDefault: false },
  { id: "otro", nombre: "Otro", emoji: "🥤", color: "#6a1b9a", cuentaDefault: false },
];

const EJERCICIOS = [
  { id: "gym", nombre: "Gym / pesas", emoji: "🏋️", mlPorMin: 10 },
  { id: "yoga", nombre: "Yoga / pilates", emoji: "🧘", mlPorMin: 6 },
  { id: "beatsaber", nombre: "Beat Saber", emoji: "🎮", mlPorMin: 12 },
  { id: "otro", nombre: "Otro", emoji: "🏃", mlPorMin: 8 },
];

const NIVELES_ACTIVIDAD = [
  { id: "sedentario", nombre: "Sedentario", descripcion: "Trabajo de escritorio, poco movimiento", factor: 1.0 },
  { id: "moderado", nombre: "Moderado", descripcion: "Ejercicio 2-3 veces por semana", factor: 1.2 },
  { id: "activo", nombre: "Activo", descripcion: "Ejercicio 4-5 veces por semana", factor: 1.4 },
  { id: "muy_activo", nombre: "Muy activo", descripcion: "Ejercicio intenso diario", factor: 1.6 },
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
  nombre: string; unidad: "ml" | "oz"; metaMl: number; metaOz: number;
  tamanoVasoDefault: number; configBebidas: { id: string; cuenta: boolean }[];
  verificacionFoto: boolean; intervaloMs: number; horaInicio: string; horaFin: string;
  peso: number; unidadPeso: "kg" | "lbs"; nivelActividad: string; sonidoSeleccionado: string;
  mascotaTipo: "perrito" | "gatito" | "gota";
};
type Registro = { hora: string; bebidaId: string; cantidad: number; fecha?: string };
type RegistroEjercicio = { hora: string; ejercicioId: string; minutos: number; aguaSugerida: number; fecha?: string };
type DiaHistorial = { fecha: string; total: number; metaDelDia: number };
type EjercicioCustom = { id: string; nombre: string; emoji: string; mlPorMin: number };

function cargarPerfil(): Perfil | null {
  try { const s = localStorage.getItem("water-perfil-v4"); return s ? JSON.parse(s) : null; } catch { return null; }
}
function guardarPerfil(p: Perfil) { localStorage.setItem("water-perfil-v4", JSON.stringify(p)); }
function cargarHistorial(): DiaHistorial[] {
  try { const s = localStorage.getItem("water-historial-v1"); return s ? JSON.parse(s) : []; } catch { return []; }
}
function guardarHistorial(h: DiaHistorial[]) { localStorage.setItem("water-historial-v1", JSON.stringify(h)); }
function cargarEjerciciosCustom(): EjercicioCustom[] {
  try { const s = localStorage.getItem("water-ejercicios-custom"); return s ? JSON.parse(s) : []; } catch { return []; }
}

// ── Persistencia del día actual ─────────────────────────────────
type DiaActual = { fecha: string; ml: number; registros: Registro[]; ejercicios: RegistroEjercicio[] };

function cargarDiaActual(): DiaActual | null {
  try {
    const s = localStorage.getItem("water-dia-actual");
    if (!s) return null;
    const d: DiaActual = JSON.parse(s);
    if (d.fecha === fechaHoy()) return d;
    return null;
  } catch { return null; }
}

function guardarDiaActual(data: DiaActual) {
  localStorage.setItem("water-dia-actual", JSON.stringify(data));
}

// ── Mascota Kawaii con emojis ───────────────────────────────────
function SvgPerrito({ emocion, animando }: { emocion: number; animando: boolean }) {
  const emoji = emocion === 0 ? "🐶" : emocion === 1 ? "🐶" : emocion === 2 ? "🐕" : emocion === 3 ? "🐶" : "🐶";
  const cara = emocion === 0 ? "😴" : emocion === 1 ? "🙂" : emocion === 2 ? "😊" : emocion === 3 ? "😄" : "🥳";
  return (
    <div style={{ position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: "70px", lineHeight: 1, animation: animando ? "saltar 0.5s ease" : "flotar 3s ease-in-out infinite", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", display: "flex", alignItems: "center", justifyContent: "center" }}>
        🐶
      </div>
      <div style={{ position: "absolute", bottom: -2, right: -2, fontSize: "22px" }}>{cara}</div>
    </div>
  );
}

function SvgGatito({ emocion, animando }: { emocion: number; animando: boolean }) {
  const cara = emocion === 0 ? "😴" : emocion === 1 ? "🙂" : emocion === 2 ? "😊" : emocion === 3 ? "😄" : "🥳";
  return (
    <div style={{ position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: "70px", lineHeight: 1, animation: animando ? "saltar 0.5s ease" : "flotar 3s ease-in-out infinite", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", display: "flex", alignItems: "center", justifyContent: "center" }}>
        🐱
      </div>
      <div style={{ position: "absolute", bottom: -2, right: -2, fontSize: "22px" }}>{cara}</div>
    </div>
  );
}
function SvgGota({ emocion, animando }: { emocion: number; animando: boolean }) {
  const cara = emocion === 0 ? "😴" : emocion === 1 ? "🙂" : emocion === 2 ? "😊" : emocion === 3 ? "😄" : "🥳";
  return (
    <svg width="80" height="80" viewBox="0 0 64 64" style={{ animation: animando ? "saltar 0.5s ease" : "flotar 3s ease-in-out infinite", filter: "drop-shadow(0 4px 8px rgba(17,135,201,0.25))" }}>
      <path d="M32 4 C32 4 8 30 8 42 C8 55 19 62 32 62 C45 62 56 55 56 42 C56 30 32 4 32 4Z" fill="#60b8f5" />
      <path d="M32 10 C32 10 14 32 14 42 C14 52 22 58 32 58 C42 58 50 52 50 42 C50 32 32 10 32 10Z" fill="#7ec8f0" />
      <ellipse cx="22" cy="28" rx="5" ry="7" fill="white" opacity="0.35" transform="rotate(-20 22 28)" />
      <text x="32" y="52" textAnchor="middle" fontSize="22">{cara}</text>
    </svg>
  );
}

function Mascota({ porcentaje, animando, tipo }: { porcentaje: number; animando: boolean; tipo: "perrito" | "gatito" | "gota" }) {
  const emocion = porcentaje >= 100 ? 4 : porcentaje >= 75 ? 3 : porcentaje >= 50 ? 2 : porcentaje >= 25 ? 1 : 0;
  const mensaje = porcentaje >= 100 ? "¡META CUMPLIDA! ¡Eres lo máximo! 🎉"
    : porcentaje >= 75 ? "¡Ya casi llegas! ¡Tú puedes! 💪"
    : porcentaje >= 50 ? "¡Vamos muy bien! ¡Sigue así! 🌊"
    : porcentaje >= 25 ? "¡Buen inicio! No pares 👍"
    : tipo === "perrito" ? "¡Woof! ¡Toma agua, porfa! 🐾"
    : tipo === "gatito" ? "¡Miau! ¡Hidratarse es de pros! 🐾"
    : "¡Hora de hidratarse! 💧";

  const corazones = animando && ["💗","💖","✨","💧"].map((e, i) => (
    <div key={i} style={{ position: "absolute", top: -10 - i * 8, left: `${20 + i * 18}%`, fontSize: "14px", animation: `aparecer 0.8s ease ${i * 0.1}s both` }}>{e}</div>
  ));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", borderRadius: "24px", padding: "14px 18px", width: "100%", maxWidth: "380px", boxShadow: "0 3px 16px rgba(17,135,201,0.10)", marginBottom: "14px", border: "1.5px solid #EEF4FA" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        {tipo === "perrito" && <SvgPerrito emocion={emocion} animando={animando} />}
        {tipo === "gatito" && <SvgGatito emocion={emocion} animando={animando} />}
        {tipo === "gota" && <SvgGota emocion={emocion} animando={animando} />}
        {corazones}
      </div>
      <div style={{ flex: 1, background: "#F0F9FF", borderRadius: "16px", padding: "12px 14px", position: "relative" }}>
        <div style={{ position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "8px solid #F0F9FF" }} />
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0D3B66", lineHeight: 1.4 }}>{mensaje}</div>
        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "3px" }}>{porcentaje}% de tu meta hoy</div>
      </div>
    </div>
  );
}


function calcularMetaSugerida(peso: number, unidadPeso: "kg" | "lbs", nivelActividad: string): number {
  const pesoKg = unidadPeso === "lbs" ? peso * 0.453592 : peso;
  const factor = NIVELES_ACTIVIDAD.find((n) => n.id === nivelActividad)?.factor || 1.0;
  return Math.round((pesoKg * 35 * factor) / 50) * 50;
}

function getNivel(p: number) {
  if (p >= 100) return { color: "#22c55e", emoji: "🎉", nombre: "¡Meta alcanzada!" };
  return NIVELES.find((n) => p >= n.min && p < n.max) || NIVELES[0];
}

function fechaHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function esDentroDeHorario(horaInicio: string, horaFin: string): boolean {
  const ahora = new Date();
  const [hI, mI] = horaInicio.split(":").map(Number);
  const [hF, mF] = horaFin.split(":").map(Number);
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= hI * 60 + mI && min <= hF * 60 + mF;
}

function playAlerta(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC(); let active = true;
  const burst = (t: number) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(740, t); o.frequency.linearRampToValueAtTime(900, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.36);
  };
  const loop = () => { if (!active) return; const n = ctx.currentTime; burst(n + 0.01); burst(n + 0.55); setTimeout(loop, 1800); };
  loop();
  return () => { active = false; ctx.close(); };
}

function playGota(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC(); let active = true;
  const drop = (t: number) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(1200, t); o.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.4);
  };
  const loop = () => { if (!active) return; const n = ctx.currentTime; drop(n + 0.01); drop(n + 0.6); drop(n + 1.1); setTimeout(loop, 2500); };
  loop();
  return () => { active = false; ctx.close(); };
}

function playPop(): () => void {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return () => {};
  const ctx = new AC(); let active = true;
  const pop = (t: number) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.18);
    const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
    o2.type = "sine"; o2.frequency.setValueAtTime(1320, t + 0.2); o2.frequency.exponentialRampToValueAtTime(1600, t + 0.28);
    g2.gain.setValueAtTime(0.0001, t + 0.2); g2.gain.exponentialRampToValueAtTime(0.06, t + 0.21); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o2.connect(g2); g2.connect(ctx.destination); o2.start(t + 0.2); o2.stop(t + 0.35);
  };
  const loop = () => { if (!active) return; const n = ctx.currentTime; pop(n + 0.01); setTimeout(loop, 3000); };
  loop();
  return () => { active = false; ctx.close(); };
}

function iniciarSonido(sonidoId: string, sonidoData: string | null): { audio: HTMLAudioElement | null; stop: () => void } {
  if (sonidoId === "custom" && sonidoData) {
    const audio = new Audio(sonidoData); audio.loop = true;
    audio.play().catch(() => {});
    return { audio, stop: () => { audio.pause(); audio.currentTime = 0; } };
  }
  const stopFn = sonidoId === "gota" ? playGota() : sonidoId === "pop" ? playPop() : playAlerta();
  return { audio: null, stop: stopFn };
}

// ── Modal para editar días del historial ───────────────────────
function ModalEditarDia({ dia, unidad, meta, onGuardar, onCerrar }: {
  dia: DiaHistorial; unidad: string; meta: number;
  onGuardar: (fecha: string, total: number) => void; onCerrar: () => void;
}) {
  const [total, setTotal] = useState(dia.total);
  const pct = meta > 0 ? Math.min(100, Math.round((total / meta) * 100)) : 0;
  const fecha = new Date(dia.fecha + "T00:00:00");
  const fechaLabel = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(14,34,48,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "28px", padding: "28px", width: "100%", maxWidth: "360px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📅</div>
          <h2 style={{ color: "#0D3B66", fontSize: "18px", margin: "0 0 4px", textTransform: "capitalize" }}>{fechaLabel}</h2>
          <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>Edita el total de agua de este día</p>
        </div>
        <div style={{ background: "#F0F9FF", borderRadius: "16px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: "600", letterSpacing: "0.05em" }}>TOTAL DEL DÍA</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <button onClick={() => setTotal(Math.max(0, total - 50))} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "#D5E8F5", color: "#1187c9", fontSize: "22px", cursor: "pointer", fontWeight: "bold" }}>−</button>
            <span style={{ fontSize: "40px", fontWeight: "900", color: "#0D3B66", minWidth: "120px", textAlign: "center", lineHeight: 1 }}>
              {total}<span style={{ fontSize: "16px", color: "#94A3B8", fontWeight: "normal" }}> {unidad}</span>
            </span>
            <button onClick={() => setTotal(total + 50)} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "#D5E8F5", color: "#1187c9", fontSize: "22px", cursor: "pointer", fontWeight: "bold" }}>+</button>
          </div>
          <div style={{ marginTop: "12px", height: "8px", background: "#EEF4FA", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? "linear-gradient(to right,#16a34a,#4ade80)" : "linear-gradient(to right,#1187c9,#7ec8f0)", borderRadius: "99px", transition: "width 0.3s ease" }} />
          </div>
          <div style={{ fontSize: "12px", color: pct >= 100 ? "#16a34a" : "#94A3B8", marginTop: "6px", fontWeight: "700" }}>{pct}% de la meta</div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1.5px solid #E0EAF2", background: "transparent", color: "#94A3B8", fontSize: "15px", cursor: "pointer", fontWeight: "600" }}>Cancelar</button>
          <button onClick={() => { onGuardar(dia.fecha, total); onCerrar(); }} style={{ flex: 2, padding: "12px", borderRadius: "14px", border: "none", background: "#1187c9", color: "white", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
            Guardar ✓
          </button>
        </div>
      </div>
    </div>
  );
}

function GraficaSemanal({ historial, onEditarDia }: { historial: DiaHistorial[]; onEditarDia: (dia: DiaHistorial) => void }) {
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const fecha = d.toISOString().slice(0, 10);
    const dato = historial.find((h) => h.fecha === fecha);
    return { fecha, total: dato?.total || 0, metaDelDia: dato?.metaDelDia || 0 };
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
      {ultimos7.map((d, i) => {
        const pct = d.metaDelDia > 0 ? Math.min(100, Math.round((d.total / d.metaDelDia) * 100)) : 0;
        const cumplioMeta = d.total > 0 && d.total >= d.metaDelDia;
        const sinDatos = d.total === 0;
        const fecha = new Date(d.fecha + "T00:00:00");
        const esHoy = d.fecha === fechaHoy();
        return (
          <div key={i} onClick={() => onEditarDia(d)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer" }} title="Toca para editar">
            <span style={{ fontSize: "9px", fontWeight: "bold", color: cumplioMeta ? "#22c55e" : sinDatos ? "#c0ccd8" : "#678098" }}>{sinDatos ? "✏️" : `${pct}%`}</span>
            <div style={{ width: "100%", height: "70px", background: "#eef2f5", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "flex-end", border: "1px solid transparent", transition: "border 0.2s" }}>
              <div style={{ width: "100%", height: sinDatos ? "3px" : `${Math.max(pct, 4)}%`, background: sinDatos ? "#d0dde8" : cumplioMeta ? "linear-gradient(to top,#16a34a,#4ade80)" : "linear-gradient(to top,#1187c9,#60b8f5)", borderRadius: "4px 4px 0 0", transition: "height 0.6s ease" }} />
            </div>
            <span style={{ fontSize: "10px", fontWeight: "bold", color: "#143350" }}>{fecha.toLocaleDateString("es-MX", { weekday: "short" })}</span>
            <span style={{ fontSize: "9px", color: "#678098" }}>{fecha.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

function GraficaMensual({ historial, unidad }: { historial: DiaHistorial[]; unidad: string }) {
  const hoy = new Date();
  const año = hoy.getFullYear(); const mes = hoy.getMonth();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const nombreMes = hoy.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const diasMes = Array.from({ length: diasEnMes }, (_, i) => {
    const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    const dato = historial.find((d) => d.fecha === fecha);
    return { fecha, dia: i + 1, total: dato?.total || 0, metaDelDia: dato?.metaDelDia || 0 };
  });
  const diasConDatos = diasMes.filter((d) => d.total > 0);
  const diasCumplidos = diasConDatos.filter((d) => d.total >= d.metaDelDia).length;
  const promedio = diasConDatos.length > 0 ? Math.round(diasConDatos.reduce((s, d) => s + d.total, 0) / diasConDatos.length) : 0;
  let mejorRacha = 0; let rachaActual = 0;
  for (const d of diasMes) { if (d.total >= d.metaDelDia && d.metaDelDia > 0) { rachaActual++; mejorRacha = Math.max(mejorRacha, rachaActual); } else rachaActual = 0; }
  const metaBase = diasMes.find((d) => d.metaDelDia > 0)?.metaDelDia || 2000;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        {[
          { label: "Promedio diario", valor: `${promedio} ${unidad}`, color: "#1187c9" },
          { label: "Días cumplidos", valor: `${diasCumplidos} / ${hoy.getDate()}`, color: "#22c55e" },
          { label: "Mejor racha", valor: `${mejorRacha} días 🔥`, color: "#f59e0b" },
          { label: "Meta", valor: `${metaBase} ${unidad}`, color: "#678098" },
        ].map((item) => (
          <div key={item.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "10px 12px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>{item.label}</div>
            <div style={{ fontSize: "15px", fontWeight: "bold", color: item.color }}>{item.valor}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px", textTransform: "capitalize" }}>{nombreMes}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (<div key={d} style={{ fontSize: "9px", color: "#94a3b8", textAlign: "center", paddingBottom: "4px" }}>{d}</div>))}
        {Array.from({ length: (new Date(año, mes, 1).getDay() + 6) % 7 }, (_, i) => (<div key={`e-${i}`} />))}
        {diasMes.map((d) => {
          const pct = d.metaDelDia > 0 ? Math.min(100, Math.round((d.total / d.metaDelDia) * 100)) : 0;
          const cumplioMeta = d.total > 0 && d.total >= d.metaDelDia;
          const esHoy = d.dia === hoy.getDate();
          return (
            <div key={d.dia} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
              <div style={{ width: "100%", height: "28px", background: "#eef2f5", borderRadius: "4px", overflow: "hidden", display: "flex", alignItems: "flex-end", border: esHoy ? "1.5px solid #1187c9" : "none" }}>
                {d.total > 0 && <div style={{ width: "100%", height: `${Math.max(pct, 8)}%`, background: cumplioMeta ? "linear-gradient(to top,#16a34a,#4ade80)" : "linear-gradient(to top,#1187c9,#60b8f5)", borderRadius: "2px 2px 0 0" }} />}
              </div>
              <span style={{ fontSize: "8px", color: esHoy ? "#1187c9" : "#94a3b8", fontWeight: esHoy ? "bold" : "normal" }}>{d.dia}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VasoAgua({ porcentaje, nivel, animacion }: { porcentaje: number; nivel: any; animacion: string | null }) {
  return (
    <div style={{ position: "relative", width: "130px" }}>
      <svg viewBox="0 0 130 200" width="130" height="200">
        <defs>
          <clipPath id="vaso-clip"><polygon points="15,10 115,10 100,190 30,190" /></clipPath>
          <linearGradient id="agua-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ec8f0" /><stop offset="100%" stopColor={nivel.color} />
          </linearGradient>
        </defs>
        <g clipPath="url(#vaso-clip)">
          <rect x="0" y={190 - (180 * porcentaje) / 100} width="130" height="180" fill="url(#agua-grad)" style={{ transition: "y 0.8s ease" }} />
          {porcentaje > 0 && <ellipse cx="65" cy={190 - (180 * porcentaje) / 100} rx="50" ry="6" fill="#7ec8f0" opacity="0.6" />}
        </g>
        <polygon points="15,10 115,10 100,190 30,190" fill="none" stroke="#90bcd8" strokeWidth="3" strokeLinejoin="round" />
        <rect x="10" y="6" width="110" height="10" rx="5" fill="#c8e4f4" />
        <text x="65" y="108" textAnchor="middle" fontSize="22" fontWeight="bold" fill={porcentaje > 45 ? "white" : "#1187c9"}>{porcentaje}%</text>
      </svg>
      {animacion === "gotas" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>
          {[...Array(5)].map((_, i) => <div key={i} style={{ position: "absolute", left: `${20 + i * 15}%`, top: "-10px", fontSize: "16px", animation: `caer 1s ease-in ${i * 0.15}s 1` }}>💧</div>)}
        </div>
      )}
      {animacion === "ondas" && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
          {[...Array(3)].map((_, i) => <div key={i} style={{ position: "absolute", width: `${60 + i * 30}px`, height: `${60 + i * 30}px`, borderRadius: "50%", border: "2px solid #1187c9", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0, animation: `onda 1s ease-out ${i * 0.2}s 1` }} />)}
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
    const colores = ["#ff4444", "#ffcc00", "#44aaff", "#ff44cc", "#44ff88", "#ff8800", "#ffffff"];
    const color = colores[i % colores.length];
    const esEstrella = i % 5 === 0;
    const delay = (i % 4) * 0.15;
    const origen = [{ x: "20%", y: "30%" }, { x: "50%", y: "20%" }, { x: "80%", y: "30%" }, { x: "35%", y: "60%" }, { x: "65%", y: "60%" }];
    const { x, y } = origen[i % origen.length];
    return { dx, dy, color, esEstrella, delay, x, y, i };
  });
  return (
    <>
      <style>{`
        @keyframes fuego { 0%{transform:translate(0,0) scale(1);opacity:1} 60%{opacity:1} 100%{transform:translate(var(--dx),var(--dy)) scale(0.2);opacity:0} }
        @keyframes destello { 0%{transform:scale(0);opacity:0} 20%{transform:scale(1.4);opacity:1} 50%{transform:scale(1);opacity:1} 100%{transform:scale(0);opacity:0} }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 999, overflow: "hidden" }}>
        {[{ x: "20%", y: "30%" }, { x: "50%", y: "20%" }, { x: "80%", y: "30%" }, { x: "35%", y: "60%" }, { x: "65%", y: "60%" }].map((pos, i) => (
          <div key={`d-${i}`} style={{ position: "absolute", left: pos.x, top: pos.y, width: "40px", height: "40px", marginLeft: "-20px", marginTop: "-20px", borderRadius: "50%", background: `radial-gradient(circle,white,${["#ffcc00", "#ff4444", "#44aaff", "#ff44cc", "#44ff88"][i]})`, animation: `destello 0.6s ease-out ${i * 0.15}s 1 forwards` }} />
        ))}
        {particulas.map(({ dx, dy, color, esEstrella, delay, x, y, i }) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: esEstrella ? "12px" : "6px", height: esEstrella ? "12px" : "6px", borderRadius: esEstrella ? "2px" : "50%", background: color, boxShadow: `0 0 6px ${color}`, ["--dx" as any]: `${dx}px`, ["--dy" as any]: `${dy}px`, animation: `fuego 3s ease-out ${delay}s 1 forwards`, transform: esEstrella ? "rotate(45deg)" : "none" }} />
        ))}
      </div>
    </>
  );
}

// ── ModalEjercicio ACTUALIZADO: agua editable + ejercicios personalizados ──
function ModalEjercicio({
  onConfirmar, onCerrar, unidad, ejerciciosCustom, onAgregarCustom,
}: {
  onConfirmar: (id: string, min: number, agua: number) => void;
  onCerrar: () => void;
  unidad: string;
  ejerciciosCustom: EjercicioCustom[];
  onAgregarCustom: (e: EjercicioCustom) => void;
}) {
  const [ejercicioId, setEjercicioId] = useState<string | null>(null);
  const [minutos, setMinutos] = useState(30);
  const [aguaManual, setAguaManual] = useState<number | null>(null);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmoji, setNuevoEmoji] = useState("🏃");
  const [nuevoMlMin, setNuevoMlMin] = useState(8);

  const todosEjercicios = [...EJERCICIOS, ...ejerciciosCustom];
  const ejercicio = todosEjercicios.find((e) => e.id === ejercicioId);
  const aguaSugerida = ejercicio ? Math.round((ejercicio.mlPorMin * minutos) / 50) * 50 : 0;
  const aguaFinal = aguaManual !== null ? aguaManual : aguaSugerida;

  useEffect(() => { setAguaManual(null); }, [ejercicioId, minutos]);

  const guardarNuevo = () => {
    if (!nuevoNombre.trim()) return;
    const nuevo: EjercicioCustom = {
      id: `custom-${Date.now()}`,
      nombre: nuevoNombre.trim(),
      emoji: nuevoEmoji || "🏃",
      mlPorMin: nuevoMlMin,
    };
    onAgregarCustom(nuevo);
    setEjercicioId(nuevo.id);
    setMostrarNuevo(false);
    setNuevoNombre(""); setNuevoEmoji("🏃"); setNuevoMlMin(8);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(14,34,48,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "28px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#143350", fontSize: "20px", margin: "0 0 4px" }}>🏋️ Registrar ejercicio</h2>
          <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>El agua se sumará a tu progreso del día</p>
        </div>

        {/* Grid de ejercicios */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          {todosEjercicios.map((e) => (
            <button key={e.id} onClick={() => setEjercicioId(e.id)} style={{ padding: "14px 12px", borderRadius: "16px", border: `2px solid ${ejercicioId === e.id ? "#f59e0b" : "#e0eaf2"}`, background: ejercicioId === e.id ? "#fffbeb" : "white", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "26px" }}>{e.emoji}</div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: ejercicioId === e.id ? "#b45309" : "#143350", marginTop: "4px" }}>{e.nombre}</div>
            </button>
          ))}
          <button onClick={() => setMostrarNuevo(!mostrarNuevo)} style={{ padding: "14px 12px", borderRadius: "16px", border: `2px solid ${mostrarNuevo ? "#1187c9" : "#e0eaf2"}`, background: mostrarNuevo ? "#e8f4fd" : "#f8fafc", cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: "26px" }}>➕</div>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: mostrarNuevo ? "#1187c9" : "#94a3b8", marginTop: "4px" }}>Agregar</div>
          </button>
        </div>

        {/* Form para nuevo ejercicio */}
        {mostrarNuevo && (
          <div style={{ background: "#f0f9ff", borderRadius: "16px", padding: "16px", marginBottom: "16px", border: "1.5px solid #bae0fd" }}>
            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1187c9", marginBottom: "12px" }}>Nuevo ejercicio personalizado</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <input value={nuevoEmoji} onChange={(e) => setNuevoEmoji(e.target.value)} maxLength={2}
                style={{ width: "50px", padding: "8px", borderRadius: "10px", border: "1.5px solid #d0e8f5", fontSize: "20px", textAlign: "center", outline: "none" }} />
              <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre del ejercicio"
                style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #d0e8f5", fontSize: "14px", outline: "none", color: "#143350" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "#678098", whiteSpace: "nowrap" }}>Intensidad (ml/min):</span>
              <button onClick={() => setNuevoMlMin(Math.max(2, nuevoMlMin - 2))} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "16px", cursor: "pointer" }}>−</button>
              <span style={{ fontWeight: "bold", color: "#1187c9", minWidth: "28px", textAlign: "center" }}>{nuevoMlMin}</span>
              <button onClick={() => setNuevoMlMin(nuevoMlMin + 2)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "16px", cursor: "pointer" }}>+</button>
            </div>
            <button disabled={!nuevoNombre.trim()} onClick={guardarNuevo} style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "none", background: nuevoNombre.trim() ? "#1187c9" : "#d0dde8", color: nuevoNombre.trim() ? "white" : "#a0b0c0", fontWeight: "bold", fontSize: "14px", cursor: nuevoNombre.trim() ? "pointer" : "not-allowed" }}>
              Guardar ejercicio
            </button>
          </div>
        )}

        {/* Duración */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Duración</label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <button onClick={() => setMinutos(Math.max(5, minutos - 5))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>−</button>
            <span style={{ fontSize: "22px", fontWeight: "bold", color: "#1187c9", minWidth: "90px", textAlign: "center" }}>{minutos} min</span>
            <button onClick={() => setMinutos(minutos + 5)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>+</button>
          </div>
        </div>

        {/* Agua editable */}
        {ejercicioId && (
          <div style={{ background: "#fffbeb", borderRadius: "16px", padding: "16px", marginBottom: "20px", border: "1.5px solid #fcd34d", textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#78350f", marginBottom: "10px" }}>💧 Agua extra — ajusta si quieres:</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
              <button onClick={() => setAguaManual(Math.max(0, aguaFinal - 50))} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "#fef3c7", color: "#b45309", fontSize: "22px", cursor: "pointer", fontWeight: "bold" }}>−</button>
              <span style={{ fontSize: "36px", fontWeight: "900", color: "#f59e0b", minWidth: "120px", textAlign: "center", lineHeight: 1 }}>
                {aguaFinal}
                <span style={{ fontSize: "16px", fontWeight: "normal", color: "#b45309" }}> {unidad}</span>
              </span>
              <button onClick={() => setAguaManual(aguaFinal + 50)} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "#fef3c7", color: "#b45309", fontSize: "22px", cursor: "pointer", fontWeight: "bold" }}>+</button>
            </div>
            {aguaManual !== null ? (
              <button onClick={() => setAguaManual(null)} style={{ marginTop: "8px", background: "none", border: "none", fontSize: "12px", color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>
                ↩ Usar sugerida ({aguaSugerida} {unidad})
              </button>
            ) : (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>Estimación general · usa − + para ajustar</div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#a0b0c0", fontSize: "15px", cursor: "pointer" }}>Cancelar</button>
          <button disabled={!ejercicioId} onClick={() => onConfirmar(ejercicioId!, minutos, aguaFinal)} style={{ flex: 2, padding: "12px", borderRadius: "14px", border: "none", background: ejercicioId ? "#f59e0b" : "#d0dde8", color: ejercicioId ? "white" : "#a0b0c0", fontSize: "15px", fontWeight: "bold", cursor: ejercicioId ? "pointer" : "not-allowed" }}>
            Registrar y sumar 💧
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalBebida({ onConfirmar, onCerrar, unidad, tamanoDefault, verificacionFoto, configBebidas }: {
  onConfirmar: (bebidaId: string, cantidad: number) => void; onCerrar: () => void; unidad: string;
  tamanoDefault: number; verificacionFoto: boolean; configBebidas: { id: string; cuenta: boolean }[];
}) {
  const [paso, setPaso] = useState<"bebida" | "tamano" | "fotos">("bebida");
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState<string | null>(null);
  const [tamano, setTamano] = useState(tamanoDefault);
  const [fotoLleno, setFotoLleno] = useState<string | null>(null);
  const [fotoVacio, setFotoVacio] = useState<string | null>(null);
  const tamanos = unidad === "ml" ? [150, 200, 250, 350, 500] : [4, 8, 12, 16, 20];
  const leerFoto = (file: File, setter: (v: string) => void) => { const r = new FileReader(); r.onload = () => setter(String(r.result)); r.readAsDataURL(file); };
  const getBebida = (id: string) => { const base = BEBIDAS_DEFAULT.find((b) => b.id === id)!; const config = configBebidas.find((c) => c.id === id); return { ...base, cuentaParaMeta: config?.cuenta ?? base.cuentaDefault }; };
  const bebida = bebidaSeleccionada ? getBebida(bebidaSeleccionada) : null;
  const listoFotos = fotoLleno && fotoVacio;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(14,34,48,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        {paso === "bebida" && (<>
          <div style={{ textAlign: "center", marginBottom: "20px" }}><h2 style={{ color: "#143350", fontSize: "20px", margin: 0 }}>¿Qué tomaste?</h2></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            {BEBIDAS_DEFAULT.map((b) => { const cuenta = getBebida(b.id).cuentaParaMeta; const sel = bebidaSeleccionada === b.id; return (
              <button key={b.id} onClick={() => setBebidaSeleccionada(b.id)} style={{ padding: "16px 12px", borderRadius: "16px", border: `2px solid ${sel ? b.color : "#e0eaf2"}`, background: sel ? `${b.color}15` : "white", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: "28px" }}>{b.emoji}</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: sel ? b.color : "#143350", marginTop: "4px" }}>{b.nombre}</div>
                <div style={{ fontSize: "10px", color: cuenta ? "#22c55e" : "#a0b0c0", marginTop: "2px" }}>{cuenta ? "✅ Cuenta" : "No cuenta"}</div>
              </button>
            ); })}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onCerrar} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#a0b0c0", fontSize: "15px", cursor: "pointer" }}>Cancelar</button>
            <button disabled={!bebidaSeleccionada} onClick={() => setPaso("tamano")} style={{ flex: 2, padding: "12px", borderRadius: "14px", border: "none", background: bebidaSeleccionada ? (bebida?.color || "#1187c9") : "#d0dde8", color: bebidaSeleccionada ? "white" : "#a0b0c0", fontSize: "15px", fontWeight: "bold", cursor: bebidaSeleccionada ? "pointer" : "not-allowed" }}>Siguiente →</button>
          </div>
        </>)}
        {paso === "tamano" && (<>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "32px" }}>{bebida?.emoji}</div>
            <h2 style={{ color: "#143350", fontSize: "20px", margin: "8px 0 4px" }}>{bebida?.nombre}</h2>
            <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>¿Cuánto tomaste?</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "16px" }}>
            {tamanos.map((t) => (<button key={t} onClick={() => setTamano(t)} style={{ padding: "10px 16px", borderRadius: "14px", border: `2px solid ${tamano === t ? (bebida?.color || "#1187c9") : "#e0eaf2"}`, background: tamano === t ? `${bebida?.color || "#1187c9"}15` : "white", color: tamano === t ? (bebida?.color || "#1187c9") : "#94a3b8", fontWeight: tamano === t ? "bold" : "normal", fontSize: "14px", cursor: "pointer" }}>{t} {unidad}</button>))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
            <button onClick={() => setTamano(Math.max(10, tamano - (unidad === "ml" ? 50 : 2)))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>−</button>
            <span style={{ fontSize: "22px", fontWeight: "bold", color: bebida?.color || "#1187c9", minWidth: "90px", textAlign: "center" }}>{tamano} {unidad}</span>
            <button onClick={() => setTamano(tamano + (unidad === "ml" ? 50 : 2))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>+</button>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setPaso("bebida")} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#a0b0c0", fontSize: "15px", cursor: "pointer" }}>← Atrás</button>
            <button onClick={() => verificacionFoto ? setPaso("fotos") : onConfirmar(bebidaSeleccionada!, tamano)} style={{ flex: 2, padding: "12px", borderRadius: "14px", border: "none", background: bebida?.color || "#1187c9", color: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}>{verificacionFoto ? "Siguiente →" : `Registrar ${bebida?.emoji}`}</button>
          </div>
        </>)}
        {paso === "fotos" && (<>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "32px" }}>{bebida?.emoji}</div>
            <h2 style={{ color: "#143350", fontSize: "20px", margin: "8px 0 4px" }}>Confirma tu {bebida?.nombre}</h2>
            <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>{tamano} {unidad}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {[{ label: "Lleno", foto: fotoLleno, setter: setFotoLleno }, { label: "Vacío", foto: fotoVacio, setter: setFotoVacio }].map(({ label, foto, setter }) => (
              <div key={label} style={{ border: "2px dashed #b8d8f0", borderRadius: "16px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1187c9", marginBottom: "8px" }}>{label}</div>
                <label style={{ cursor: "pointer", display: "block" }}>
                  {foto ? <img src={foto} alt={label} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "10px" }} /> : <div style={{ background: "#eef6fd", borderRadius: "10px", padding: "16px 10px", color: "#678098", fontSize: "12px" }}>📷 Subir</div>}
                  <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) leerFoto(f, setter); }} />
                </label>
                {foto && <div style={{ color: "#22c55e", fontSize: "11px", marginTop: "4px" }}>✅ Lista</div>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setPaso("tamano")} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#a0b0c0", fontSize: "15px", cursor: "pointer" }}>← Atrás</button>
            <button disabled={!listoFotos} onClick={() => onConfirmar(bebidaSeleccionada!, tamano)} style={{ flex: 2, padding: "12px", borderRadius: "14px", border: "none", background: listoFotos ? (bebida?.color || "#1187c9") : "#d0dde8", color: listoFotos ? "white" : "#a0b0c0", fontSize: "15px", fontWeight: "bold", cursor: listoFotos ? "pointer" : "not-allowed" }}>✅ Confirmar</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

function SeccionPerfil({ onGuardar, onCerrar, perfil, esInicio }: {
  onGuardar: (p: Perfil) => void; onCerrar?: () => void; perfil?: Perfil | null; esInicio: boolean;
}) {
  const [nombre, setNombre] = useState(perfil?.nombre || "");
  const [unidad, setUnidad] = useState<"ml" | "oz">(perfil?.unidad || "ml");
  const [metaMl, setMetaMl] = useState(perfil?.metaMl || 2000);
  const [metaOz, setMetaOz] = useState(perfil?.metaOz || 64);
  const [tamanoVasoDefault, setTamanoVasoDefault] = useState(perfil?.tamanoVasoDefault || 250);
  const [configBebidas, setConfigBebidas] = useState(perfil?.configBebidas || BEBIDAS_DEFAULT.map((b) => ({ id: b.id, cuenta: b.cuentaDefault })));
  const [verificacionFoto, setVerificacionFoto] = useState(perfil?.verificacionFoto || false);
  const [intervaloMs, setIntervaloMs] = useState(perfil?.intervaloMs || 90 * 60 * 1000);
  const [horaInicio, setHoraInicio] = useState(perfil?.horaInicio || "07:00");
  const [horaFin, setHoraFin] = useState(perfil?.horaFin || "22:00");
  const [peso, setPeso] = useState(perfil?.peso || 65);
  const [unidadPeso, setUnidadPeso] = useState<"kg" | "lbs">(perfil?.unidadPeso || "kg");
  const [nivelActividad, setNivelActividad] = useState(perfil?.nivelActividad || "moderado");
  const [sonidoSeleccionado, setSonidoSeleccionado] = useState(perfil?.sonidoSeleccionado || "alerta");
  const [mascotaTipo, setMascotaTipo] = useState<"perrito" | "gatito" | "gota">(perfil?.mascotaTipo || "gota");
  const [sonidoCustomNombre, setSonidoCustomNombre] = useState("Subir archivo...");
  const [sonidoCustomData, setSonidoCustomData] = useState<string | null>(null);
  const [usarSugerida, setUsarSugerida] = useState(!perfil);
  const tamanos = unidad === "ml" ? [150, 200, 250, 350, 500] : [4, 8, 12, 16, 20];
  const meta = unidad === "ml" ? metaMl : metaOz;
  const metaSugerida = calcularMetaSugerida(peso, unidadPeso, nivelActividad);

  const contenido = (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {esInicio && (
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "52px", marginBottom: "8px" }}>💧</div>
          <h1 style={{ color: "#1187c9", fontSize: "24px", margin: "0 0 4px" }}>Water Reminder</h1>
          <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>Configura tu perfil para empezar</p>
        </div>
      )}
      {!esInicio && <h2 style={{ color: "#143350", fontSize: "20px", margin: 0 }}>⚙️ Configuración</h2>}

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "6px" }}>¿Cómo te llamas?</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre"
          style={{ width: "100%", padding: "12px 16px", borderRadius: "14px", border: "1.5px solid #d0e8f5", fontSize: "16px", outline: "none", boxSizing: "border-box", color: "#143350" }} />
      </div>

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Unidad para bebidas</label>
        <div style={{ display: "flex", gap: "10px" }}>
          {(["ml", "oz"] as const).map((u) => (<button key={u} onClick={() => { setUnidad(u); setTamanoVasoDefault(u === "ml" ? 250 : 8); }} style={{ flex: 1, padding: "10px", borderRadius: "14px", border: `2px solid ${unidad === u ? "#1187c9" : "#e0eaf2"}`, background: unidad === u ? "#e8f4fd" : "white", color: unidad === u ? "#1187c9" : "#94a3b8", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}>{u}</button>))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Tu peso</label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <button onClick={() => setPeso(Math.max(30, peso - 1))} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "18px", cursor: "pointer" }}>−</button>
            <span style={{ color: "#1187c9", fontWeight: "bold", fontSize: "20px", minWidth: "50px", textAlign: "center" }}>{peso}</span>
            <button onClick={() => setPeso(peso + 1)} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "18px", cursor: "pointer" }}>+</button>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["kg", "lbs"] as const).map((u) => (<button key={u} onClick={() => setUnidadPeso(u)} style={{ padding: "6px 12px", borderRadius: "10px", border: `2px solid ${unidadPeso === u ? "#1187c9" : "#e0eaf2"}`, background: unidadPeso === u ? "#e8f4fd" : "white", color: unidadPeso === u ? "#1187c9" : "#94a3b8", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>{u}</button>))}
          </div>
        </div>
      </div>

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Nivel de actividad</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {NIVELES_ACTIVIDAD.map((n) => (<button key={n.id} onClick={() => setNivelActividad(n.id)} style={{ padding: "10px 14px", borderRadius: "12px", border: `2px solid ${nivelActividad === n.id ? "#1187c9" : "#e0eaf2"}`, background: nivelActividad === n.id ? "#e8f4fd" : "white", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: nivelActividad === n.id ? "#1187c9" : "#143350" }}>{n.nombre}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>{n.descripcion}</div>
          </button>))}
        </div>
      </div>

      <div style={{ background: "#f0f9ff", borderRadius: "16px", padding: "14px 16px", border: "1.5px solid #bae0fd" }}>
        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1187c9", marginBottom: "4px" }}>💧 Meta sugerida: {metaSugerida} ml/día</div>
        <div style={{ fontSize: "11px", color: "#678098", marginBottom: "10px" }}>Basado en tu peso y nivel de actividad. Siempre consulta con tu médico o nutriólogo.</div>
        {esInicio && (
          <div style={{ display: "flex", gap: "8px", marginBottom: usarSugerida ? 0 : "10px" }}>
            <button onClick={() => setUsarSugerida(true)} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: `2px solid ${usarSugerida ? "#1187c9" : "#e0eaf2"}`, background: usarSugerida ? "#1187c9" : "white", color: usarSugerida ? "white" : "#94a3b8", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>Usar sugerida</button>
            <button onClick={() => setUsarSugerida(false)} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: `2px solid ${!usarSugerida ? "#1187c9" : "#e0eaf2"}`, background: !usarSugerida ? "#1187c9" : "white", color: !usarSugerida ? "white" : "#94a3b8", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>Personalizar</button>
          </div>
        )}
        {!esInicio && <button onClick={() => { setMetaMl(metaSugerida); setMetaOz(Math.round(metaSugerida / 29.5735)); }} style={{ padding: "6px 14px", borderRadius: "10px", border: "none", background: "#1187c9", color: "white", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>Usar esta meta</button>}
      </div>

      {(!esInicio || !usarSugerida) && (
        <div>
          <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Meta diaria</label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <button onClick={() => unidad === "ml" ? setMetaMl(Math.max(500, Math.round((metaMl - 50) / 50) * 50)) : setMetaOz(Math.max(16, Math.round((metaOz - 2) / 2) * 2))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>−</button>
            <span style={{ color: "#1187c9", fontWeight: "bold", fontSize: "22px", minWidth: "100px", textAlign: "center" }}>{meta} {unidad}</span>
            <button onClick={() => unidad === "ml" ? setMetaMl(Math.round((metaMl + 50) / 50) * 50) : setMetaOz(Math.round((metaOz + 2) / 2) * 2)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>+</button>
          </div>
        </div>
      )}

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Tamaño de vaso favorito</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          {tamanos.map((t) => (<button key={t} onClick={() => setTamanoVasoDefault(t)} style={{ padding: "8px 14px", borderRadius: "14px", border: `2px solid ${tamanoVasoDefault === t ? "#1187c9" : "#e0eaf2"}`, background: tamanoVasoDefault === t ? "#e8f4fd" : "white", color: tamanoVasoDefault === t ? "#1187c9" : "#94a3b8", fontWeight: tamanoVasoDefault === t ? "bold" : "normal", fontSize: "13px", cursor: "pointer" }}>{t} {unidad}</button>))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>⏰ Horario de recordatorios</label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#678098", marginBottom: "4px" }}>Inicio</div>
            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "1.5px solid #d0e8f5", fontSize: "14px", color: "#1187c9", fontWeight: "bold", outline: "none", textAlign: "center" }} />
          </div>
          <span style={{ color: "#94a3b8" }}>→</span>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#678098", marginBottom: "4px" }}>Fin</div>
            <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "1.5px solid #d0e8f5", fontSize: "14px", color: "#1187c9", fontWeight: "bold", outline: "none", textAlign: "center" }} />
          </div>
        </div>
      </div>

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Intervalo de recordatorio</label>
        <select value={intervaloMs} onChange={(e) => setIntervaloMs(Number(e.target.value))} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: "1.5px solid #d0e8f5", fontSize: "14px", color: "#1187c9", fontWeight: "bold", outline: "none" }}>
          {OPCIONES_INTERVALO.map((op) => <option key={op.ms} value={op.ms}>{op.label}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>🐾 Tu mascota</label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          {([["perrito", "🐶", "Perrito"], ["gatito", "🐱", "Gatito"], ["gota", "💧", "Gotita"]] as const).map(([id, emoji, label]) => (
            <button key={id} onClick={() => setMascotaTipo(id)} style={{ flex: 1, padding: "12px 8px", borderRadius: "16px", border: `2px solid ${mascotaTipo === id ? "#1187c9" : "#e0eaf2"}`, background: mascotaTipo === id ? "#e8f4fd" : "white", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "28px" }}>{emoji}</div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: mascotaTipo === id ? "#1187c9" : "#94A3B8", marginTop: "4px" }}>{label}</div>
            </button>
          ))}
        </div>

        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>🔔 Sonido de alarma</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SONIDOS_INTEGRADOS.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: sonidoSeleccionado === s.id ? "#e8f4fd" : "#f8fafc", borderRadius: "12px", border: `1.5px solid ${sonidoSeleccionado === s.id ? "#1187c9" : "#e0eaf2"}`, cursor: "pointer" }} onClick={() => setSonidoSeleccionado(s.id)}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: sonidoSeleccionado === s.id ? "#1187c9" : "#143350" }}>{s.nombre}</span>
              {sonidoSeleccionado === s.id && <span style={{ color: "#1187c9", fontSize: "16px" }}>✓</span>}
            </div>
          ))}
          {sonidoSeleccionado === "custom" && (
            <label style={{ fontSize: "13px", color: "#1187c9", cursor: "pointer", padding: "8px 14px", background: "#e8f4fd", borderRadius: "10px", textAlign: "center" }}>
              {sonidoCustomNombre}
              <input type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const r = new FileReader(); r.onload = () => { setSonidoCustomData(String(r.result)); setSonidoCustomNombre(f.name); }; r.readAsDataURL(f);
              }} />
            </label>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#143350" }}>📷 Verificación por foto</div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Requiere fotos para confirmar</div>
        </div>
        <button onClick={() => setVerificacionFoto(!verificacionFoto)} style={{ padding: "6px 16px", borderRadius: "20px", border: "none", background: verificacionFoto ? "#22c55e" : "#e0eaf2", color: verificacionFoto ? "white" : "#94a3b8", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>{verificacionFoto ? "ON" : "OFF"}</button>
      </div>

      <div>
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "10px" }}>¿Qué bebidas cuentan para tu meta?</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {BEBIDAS_DEFAULT.map((b) => {
            const config = configBebidas.find((x) => x.id === b.id);
            const cuenta = config?.cuenta ?? b.cuentaDefault;
            return (
              <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "12px", border: `1.5px solid ${cuenta ? b.color + "40" : "#e0eaf2"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{b.emoji}</span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "#143350" }}>{b.nombre}</span>
                </div>
                <button onClick={() => setConfigBebidas((prev) => prev.map((x) => x.id === b.id ? { ...x, cuenta: !cuenta } : x))} style={{ padding: "5px 14px", borderRadius: "20px", border: "none", background: cuenta ? b.color : "#e0eaf2", color: cuenta ? "white" : "#94a3b8", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>{cuenta ? "✅ Cuenta" : "❌ No cuenta"}</button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        {!esInicio && <button onClick={onCerrar} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#a0b0c0", fontSize: "15px", cursor: "pointer" }}>Cancelar</button>}
        <button disabled={!nombre.trim()} onClick={() => {
          if (!nombre.trim()) return;
          const metaFinalMl = esInicio && usarSugerida ? calcularMetaSugerida(peso, unidadPeso, nivelActividad) : metaMl;
          const metaFinalOz = esInicio && usarSugerida ? Math.round(metaFinalMl / 29.5735) : metaOz;
          const customData = sonidoSeleccionado === "custom" ? sonidoCustomData : null;
          onGuardar({ nombre: nombre.trim(), unidad, metaMl: metaFinalMl, metaOz: metaFinalOz, tamanoVasoDefault, configBebidas, verificacionFoto, intervaloMs, horaInicio, horaFin, peso, unidadPeso, nivelActividad, sonidoSeleccionado, mascotaTipo });
          if (customData) localStorage.setItem("water-custom-sound", customData);
        }} style={{ flex: esInicio ? undefined : 2, width: esInicio ? "100%" : undefined, padding: "14px", borderRadius: "16px", border: "none", background: nombre.trim() ? "#1187c9" : "#d0dde8", color: nombre.trim() ? "white" : "#a0b0c0", fontSize: "16px", fontWeight: "bold", cursor: nombre.trim() ? "pointer" : "not-allowed" }}>
          {esInicio ? "¡Empezar! 💧" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );

  if (esInicio) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e8f4fd 0%, #eef2f5 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ background: "white", borderRadius: "28px", padding: "36px 28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 40px rgba(17,135,201,0.12)" }}>{contenido}</div>
    </div>
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(14,34,48,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>{contenido}</div>
    </div>
  );
}

// ── Desbloquear AudioContext con primer toque ──────────────────
let audioContextDesbloqueado = false;
function desbloquearAudio() {
  if (audioContextDesbloqueado) return;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.connect(ctx.destination); src.start(0);
  setTimeout(() => ctx.close(), 100);
  audioContextDesbloqueado = true;
}

// ── Wrapper con autenticación ───────────────────────────────────
export default function App() {
  const [usuario, setUsuario] = useState<User | null | "cargando">("cargando");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUsuario(u));
    return () => unsub();
  }, []);

  if (usuario === "cargando") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #E3F2FD, #EEF6FB)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: "48px", animation: "flotar 1.5s ease-in-out infinite" }}>💧</div>
    </div>
  );

  if (!usuario) return <PantallaLogin onLogin={() => {}} />;

  return <AppPrincipal userId={usuario.uid} userName={usuario.displayName || "Usuario"} userPhoto={usuario.photoURL} />;
}

function limpiarLocalStorageSiUsuarioDiferente(userId: string) {
  const prevUserId = localStorage.getItem("water-current-user");
  if (prevUserId !== userId) {
    ["water-perfil-v4","water-historial-v1","water-dia-actual","water-proxima-alarma","water-ejercicios-custom","water-custom-sound"].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem("water-current-user", userId);
  }
}

function AppPrincipal({ userId, userName, userPhoto }: { userId: string; userName: string; userPhoto: string | null }) {
  // Limpiar ANTES de inicializar estados
  limpiarLocalStorageSiUsuarioDiferente(userId);

  const [perfil, setPerfil] = useState<Perfil | null>(() => cargarPerfil());
  const [mlAcumulados, setMlAcumulados] = useState(() => cargarDiaActual()?.ml || 0);
  const [registros, setRegistros] = useState<Registro[]>(() => cargarDiaActual()?.registros || []);
  const [ejercicios, setEjercicios] = useState<RegistroEjercicio[]>(() => cargarDiaActual()?.ejercicios || []);
  const [mascotaAnimando, setMascotaAnimando] = useState(false);
  const [ejerciciosCustom, setEjerciciosCustom] = useState<EjercicioCustom[]>(() => cargarEjerciciosCustom());
  const [animacion, setAnimacion] = useState<"gotas" | "ondas" | "burbujas" | "celebracion" | null>(null);
  const [historialCompleto, setHistorialCompleto] = useState<DiaHistorial[]>(() => cargarHistorial());
  const [racha, setRacha] = useState(0);
  const [vistaGrafica, setVistaGrafica] = useState<"semana" | "mes">("semana");
  const [proximaAlarma, setProximaAlarma] = useState(() => {
    const guardada = localStorage.getItem("water-proxima-alarma");
    if (guardada) {
      const t = Number(guardada);
      // Si la alarma guardada aún está en el futuro, usarla
      if (t > Date.now()) return t;
    }
    return Date.now() + 90 * 60 * 1000;
  });
  const [ahora, setAhora] = useState(Date.now());
  const [alarmaActiva, setAlarmaActiva] = useState(false);
  const [recordatoriosOn, setRecordatoriosOn] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarEjercicio, setMostrarEjercicio] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [diaEditando, setDiaEditando] = useState<DiaHistorial | null>(null);
  const [permisoNotif, setPermisoNotif] = useState<NotificationPermission>("default");
  const stopAlarmaRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Escuchar cambios en tiempo real desde Firebase
  const ignorarSnapshotRef = useRef(false);
  useEffect(() => {
    const unsub = onSnapshot(getDocRef(userId), (snap) => {
      if (!snap.exists()) return;
      if (ignorarSnapshotRef.current) return;
      const data = snap.data();
      if (data.perfil) { guardarPerfil(data.perfil); setPerfil(data.perfil); }
      if (data.historial) {
        // Merge historial: para cada día, usar el total más alto
        setHistorialCompleto((localHist) => {
          const fireHist: DiaHistorial[] = data.historial;
          const merged = [...localHist];
          for (const fireDia of fireHist) {
            const idx = merged.findIndex((d) => d.fecha === fireDia.fecha);
            if (idx === -1) {
              merged.push(fireDia);
            } else {
              // Conservar el total más alto
              if (fireDia.total > merged[idx].total) {
                merged[idx] = fireDia;
              }
            }
          }
          guardarHistorial(merged);
          const ordenado = [...merged].sort((a, b) => b.fecha.localeCompare(a.fecha));
          let cuenta = 0;
          for (const d of ordenado) { if (d.total >= d.metaDelDia && d.metaDelDia > 0) cuenta++; else break; }
          setRacha(cuenta);
          return merged;
        });
      }
      if (data.diaActual) {
        if (data.diaActual.fecha === fechaHoy()) {
          // Mismo día: cargar datos
          setMlAcumulados((localMl) => Math.max(localMl, data.diaActual.ml || 0));
          setRegistros((localRegs) => {
            const fireRegs: Registro[] = (data.diaActual.registros || [])
              .filter((r: Registro) => !r.fecha || r.fecha === fechaHoy());
            const horasLocales = new Set(localRegs.map((r: Registro) => r.hora + r.bebidaId + r.cantidad));
            const nuevos = fireRegs.filter((r) => !horasLocales.has(r.hora + r.bebidaId + r.cantidad));
            return [...nuevos, ...localRegs].sort((a, b) => b.hora.localeCompare(a.hora));
          });
          setEjercicios((localEjs) => {
            const fireEjs: RegistroEjercicio[] = (data.diaActual.ejercicios || [])
              .filter((e: RegistroEjercicio) => !e.fecha || e.fecha === fechaHoy());
            const horasLocales = new Set(localEjs.map((e: RegistroEjercicio) => e.hora + e.ejercicioId));
            const nuevos = fireEjs.filter((e) => !horasLocales.has(e.hora + e.ejercicioId));
            return [...nuevos, ...localEjs];
          });
        } else {
          // Día anterior en Firebase — limpiar inmediatamente y subir día limpio
          setMlAcumulados(0); setRegistros([]); setEjercicios([]);
          const diaLimpio = { fecha: fechaHoy(), ml: 0, registros: [], ejercicios: [] };
          guardarDiaActual(diaLimpio);
          sincronizarFirebase(userId, { diaActual: diaLimpio });
        }
      }
    }, (err) => console.warn("Firebase listener error:", err));
    return () => unsub();
  }, []);

  // Pedir permiso de notificaciones y registrar Service Worker
  useEffect(() => {
    if ("Notification" in window) {
      setPermisoNotif(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((p) => setPermisoNotif(p));
      }
    }
    // Registrar service worker para notificaciones en iOS PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    document.addEventListener("touchstart", desbloquearAudio, { once: true });
    document.addEventListener("click", desbloquearAudio, { once: true });
  }, []);

  useEffect(() => { const id = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(id); }, []);

  // Guardar próxima alarma en localStorage para que sobreviva recargas
  useEffect(() => {
    localStorage.setItem("water-proxima-alarma", String(proximaAlarma));
  }, [proximaAlarma]);

  useEffect(() => {
    if (!perfil) return;
    if (recordatoriosOn && ahora >= proximaAlarma && !alarmaActiva && esDentroDeHorario(perfil.horaInicio, perfil.horaFin)) {
      setAlarmaActiva(true); setMostrarModal(true);
      // Notificación del sistema
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("💧 ¡Hora de hidratarte!", {
          body: `${perfil.nombre}, ya es momento de tomar agua 💧`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "water-reminder",
        } as any);
      }
      const sonidoData = perfil.sonidoSeleccionado === "custom" ? localStorage.getItem("water-custom-sound") : null;
      const { audio, stop } = iniciarSonido(perfil.sonidoSeleccionado, sonidoData);
      audioRef.current = audio; stopAlarmaRef.current = stop;
    }
  }, [ahora, proximaAlarma, alarmaActiva, recordatoriosOn, perfil]);

  useEffect(() => {
    if (!perfil) return;
    const meta = perfil.unidad === "ml" ? perfil.metaMl : perfil.metaOz;
    const hoy = fechaHoy();
    setHistorialCompleto((prev) => {
      // No sobrescribir el día de hoy con 0 si ya tenía datos
      const diaHoyActual = prev.find((d) => d.fecha === hoy);
      if (mlAcumulados === 0 && diaHoyActual && diaHoyActual.total > 0) {
        // Solo recalcular racha sin tocar el historial
        const ordenado = [...prev].sort((a, b) => b.fecha.localeCompare(a.fecha));
        let cuenta = 0;
        for (const d of ordenado) { if (d.total >= d.metaDelDia && d.metaDelDia > 0) cuenta++; else break; }
        setRacha(cuenta);
        return prev;
      }
      const sinHoy = prev.filter((d) => d.fecha !== hoy);
      const nuevo = [...sinHoy, { fecha: hoy, total: mlAcumulados, metaDelDia: meta }];
      guardarHistorial(nuevo); sincronizarFirebase(userId, { historial: nuevo });
      const ordenado = [...nuevo].sort((a, b) => b.fecha.localeCompare(a.fecha));
      let cuenta = 0;
      for (const d of ordenado) { if (d.total >= d.metaDelDia && d.metaDelDia > 0) cuenta++; else break; }
      setRacha(cuenta);
      return nuevo;
    });
  }, [mlAcumulados, perfil]);

  // Guardar progreso del día actual en localStorage y Firebase
  const cargaInicialListaRef = useRef(false);
  useEffect(() => {
    const diaActual = { fecha: fechaHoy(), ml: mlAcumulados, registros, ejercicios };
    guardarDiaActual(diaActual);
    // No subir a Firebase hasta que pase 2s (tiempo para que onSnapshot cargue primero)
    if (!cargaInicialListaRef.current) {
      const timer = setTimeout(() => { cargaInicialListaRef.current = true; }, 4000);
      return () => clearTimeout(timer);
    }
    // NUNCA subir si ml es 0 y no hay registros — puede ser un estado inicial vacío
    if (mlAcumulados === 0 && registros.length === 0 && ejercicios.length === 0) return;
    ignorarSnapshotRef.current = true;
    sincronizarFirebase(userId, { diaActual }).finally(() => {
      setTimeout(() => { ignorarSnapshotRef.current = false; }, 1000);
    });
  }, [mlAcumulados, registros, ejercicios]);

  if (!perfil) return <SeccionPerfil esInicio={true} onGuardar={(p) => { guardarPerfil(p); setPerfil(p); setProximaAlarma(Date.now() + p.intervaloMs); }} />;

  const { unidad, metaMl, metaOz, configBebidas, verificacionFoto, intervaloMs, tamanoVasoDefault } = perfil;
  const meta = unidad === "ml" ? metaMl : metaOz;
  const porcentaje = Math.min(100, Math.round((mlAcumulados / meta) * 100));
  const nivel = getNivel(porcentaje);
  const totalEjercicioHoy = ejercicios.reduce((s, e) => s + e.aguaSugerida, 0);
  const msRestantes = Math.max(0, proximaAlarma - ahora);
  const hh = Math.floor(msRestantes / 3600000);
  const mm = Math.floor((msRestantes % 3600000) / 60000);
  const ss = Math.floor((msRestantes % 60000) / 1000);
  const tiempoRestante = `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const horaActual = new Date(ahora).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const pararAlarma = () => { stopAlarmaRef.current?.(); audioRef.current?.pause(); setAlarmaActiva(false); setProximaAlarma(Date.now() + intervaloMs); };

  const dispararAnimacion = (nuevoTotal: number) => {
    const pct = Math.min(100, Math.round((nuevoTotal / meta) * 100));
    if (pct >= 100) setAnimacion("celebracion");
    else if (pct >= 50) setAnimacion("burbujas");
    else if (pct >= 25) setAnimacion("ondas");
    else setAnimacion("gotas");
    setTimeout(() => setAnimacion(null), 3200);
    setMascotaAnimando(true); setTimeout(() => setMascotaAnimando(false), 1000);
  };

  const confirmarBebida = (bebidaId: string, cantidad: number) => {
    const base = BEBIDAS_DEFAULT.find((b) => b.id === bebidaId)!;
    const config = configBebidas.find((c) => c.id === bebidaId);
    const cuentaParaMeta = config?.cuenta ?? base.cuentaDefault;
    const hora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (cuentaParaMeta) { const nuevo = mlAcumulados + cantidad; dispararAnimacion(nuevo); setMlAcumulados(nuevo); }
    setRegistros((prev) => [{ hora, bebidaId, cantidad, fecha: fechaHoy() }, ...prev]);
    setMostrarModal(false); pararAlarma();
  };

  const confirmarEjercicio = (ejercicioId: string, minutos: number, aguaSugerida: number) => {
    const hora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setEjercicios((prev) => [{ hora, ejercicioId, minutos, aguaSugerida, fecha: fechaHoy() }, ...prev]);
    const nuevo = mlAcumulados + aguaSugerida;
    dispararAnimacion(nuevo); setMlAcumulados(nuevo); setMostrarEjercicio(false);
  };

  const agregarEjercicioCustom = (e: EjercicioCustom) => {
    setEjerciciosCustom((prev) => {
      const nuevo = [...prev, e];
      localStorage.setItem("water-ejercicios-custom", JSON.stringify(nuevo));
      return nuevo;
    });
  };

  const guardarCambios = (nuevoPerfil: Perfil) => { guardarPerfil(nuevoPerfil); setPerfil(nuevoPerfil); setProximaAlarma(Date.now() + nuevoPerfil.intervaloMs); setMostrarConfig(false); sincronizarFirebase(userId, { perfil: nuevoPerfil }); };

  const editarDia = (fecha: string, total: number) => {
    const meta = perfil ? (perfil.unidad === "ml" ? perfil.metaMl : perfil.metaOz) : 2000;
    setHistorialCompleto((prev) => {
      const sinFecha = prev.filter((d) => d.fecha !== fecha);
      const nuevo = [...sinFecha, { fecha, total, metaDelDia: meta }];
      guardarHistorial(nuevo);
      sincronizarFirebase(userId, { historial: nuevo });
      const ordenado = [...nuevo].sort((a, b) => b.fecha.localeCompare(a.fecha));
      let cuenta = 0;
      for (const d of ordenado) { if (d.total >= d.metaDelDia && d.metaDelDia > 0) cuenta++; else break; }
      setRacha(cuenta);
      return nuevo;
    });
  };

  // Saludo según hora
  const hora = new Date(ahora).getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <style>{`
        @keyframes caer { 0%{transform:translateY(-10px);opacity:1} 100%{transform:translateY(300px);opacity:0} }
        @keyframes onda { 0%{opacity:0.8;transform:translate(-50%,-50%) scale(0.3)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1)} }
        @keyframes subir { 0%{transform:translateY(0);opacity:0.8} 100%{transform:translateY(-200px);opacity:0} }
        @keyframes flotar { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes saltar { 0%{transform:scale(1) translateY(0)} 40%{transform:scale(1.15) translateY(-10px)} 70%{transform:scale(0.95) translateY(2px)} 100%{transform:scale(1) translateY(0)} }
        @keyframes aparecer { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.3);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes pulso { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>

      {animacion === "celebracion" && <Celebracion />}
      {mostrarModal && <ModalBebida onConfirmar={confirmarBebida} onCerrar={() => { setMostrarModal(false); pararAlarma(); }} unidad={unidad} tamanoDefault={tamanoVasoDefault} verificacionFoto={verificacionFoto} configBebidas={configBebidas} />}
      {mostrarEjercicio && <ModalEjercicio onConfirmar={confirmarEjercicio} onCerrar={() => setMostrarEjercicio(false)} unidad={unidad} ejerciciosCustom={ejerciciosCustom} onAgregarCustom={agregarEjercicioCustom} />}
      {mostrarConfig && <SeccionPerfil esInicio={false} perfil={perfil} onGuardar={guardarCambios} onCerrar={() => setMostrarConfig(false)} />}
      {diaEditando && <ModalEditarDia dia={diaEditando} unidad={unidad} meta={meta} onGuardar={editarDia} onCerrar={() => setDiaEditando(null)} />}

      {/* ── Fondo estilo Headspace ── */}
      <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #E3F2FD 0%, #EEF6FB 35%, #F4F8FC 70%, #F9FBFD 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 48px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* ── Banner permiso notificaciones ── */}
        {permisoNotif !== "granted" && (
          <div style={{ width: "100%", maxWidth: "380px", background: "#FFF8E1", border: "1.5px solid #FCD34D", borderRadius: "16px", padding: "12px 16px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400E" }}>🔔 Activa las notificaciones</div>
              <div style={{ fontSize: "11px", color: "#B45309", marginTop: "2px" }}>Para recibir recordatorios aunque la app esté en segundo plano</div>
            </div>
            <button onClick={() => Notification.requestPermission().then((p) => setPermisoNotif(p))}
              style={{ background: "#F59E0B", color: "white", border: "none", borderRadius: "12px", padding: "8px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
              Activar
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ width: "100%", maxWidth: "380px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {userPhoto && <img src={userPhoto} alt="foto" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid #E3F2FD" }} />}
            <div>
              <div style={{ fontSize: "13px", color: "#94A3B8", fontWeight: "500", letterSpacing: "0.03em" }}>{saludo} · {horaActual}</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0D3B66", lineHeight: 1.2 }}>{perfil.nombre} 👋</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setMostrarConfig(true)} style={{ background: "white", border: "none", borderRadius: "14px", width: "44px", height: "44px", fontSize: "20px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙️</button>
            <button onClick={() => signOut(auth)} style={{ background: "white", border: "none", borderRadius: "14px", width: "44px", height: "44px", fontSize: "18px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }} title="Cerrar sesión">🚪</button>
          </div>
        </div>

        {/* ── Tarjeta héroe: progreso principal ── */}
        <div style={{ width: "100%", maxWidth: "380px", background: "white", borderRadius: "28px", padding: "24px", boxShadow: "0 4px 28px rgba(17,135,201,0.10)", marginBottom: "14px" }}>

          {/* Número grande */}
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "64px", fontWeight: "900", color: "#0D3B66", lineHeight: 1, letterSpacing: "-2px" }}>{mlAcumulados}</span>
            <span style={{ fontSize: "20px", color: "#94A3B8", fontWeight: "600" }}> / {meta} {unidad}</span>
          </div>

          {/* Badge de nivel */}
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <span style={{ display: "inline-block", background: `${nivel.color}18`, color: nivel.color, borderRadius: "20px", padding: "4px 14px", fontSize: "14px", fontWeight: "700" }}>
              {nivel.emoji} {nivel.nombre}
            </span>
          </div>

          {/* Barra de progreso */}
          <div style={{ height: "10px", background: "#EEF4FA", borderRadius: "99px", overflow: "hidden", marginBottom: "6px" }}>
            <div style={{ height: "100%", width: `${porcentaje}%`, background: porcentaje >= 100 ? "linear-gradient(to right, #16a34a, #4ade80)" : "linear-gradient(to right, #1187c9, #7ec8f0)", borderRadius: "99px", transition: "width 0.8s ease" }} />
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#94A3B8", fontWeight: "600" }}>{porcentaje}%</div>

          {/* Vaso */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
            <VasoAgua porcentaje={porcentaje} nivel={nivel} animacion={animacion} />
          </div>

          {totalEjercicioHoy > 0 && (
            <div style={{ marginTop: "12px", textAlign: "center", fontSize: "13px", color: "#f59e0b", fontWeight: "600" }}>
              🏋️ +{totalEjercicioHoy} {unidad} por ejercicio
            </div>
          )}
        </div>

        {/* ── Racha + Temporizador en fila ── */}
        <div style={{ width: "100%", maxWidth: "380px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          {/* Racha */}
          <div style={{ background: racha > 0 ? "#FFFBEB" : "white", borderRadius: "20px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1.5px solid ${racha > 0 ? "#FCD34D" : "#EEF2F7"}`, textAlign: "center" }}>
            <div style={{ fontSize: "28px" }}>{racha > 0 ? "🔥" : "💤"}</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: racha > 0 ? "#B45309" : "#94A3B8", lineHeight: 1 }}>{racha}</div>
            <div style={{ fontSize: "11px", color: racha > 0 ? "#D97706" : "#CBD5E1", fontWeight: "600", marginTop: "2px" }}>{racha === 1 ? "día" : "días"} de racha</div>
          </div>

          {/* Timer */}
          <div style={{ background: "white", borderRadius: "20px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #EEF2F7", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "600", marginBottom: "2px", letterSpacing: "0.04em" }}>PRÓXIMO</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0D3B66", letterSpacing: "-0.5px", lineHeight: 1 }}>{tiempoRestante}</div>
            <button onClick={() => setRecordatoriosOn(!recordatoriosOn)} style={{ marginTop: "6px", background: recordatoriosOn ? "#DBEAFE" : "#F1F5F9", color: recordatoriosOn ? "#1187c9" : "#94A3B8", border: "none", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
              🔔 {recordatoriosOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Intervalo selector */}
        <div style={{ width: "100%", maxWidth: "380px", background: "white", borderRadius: "16px", padding: "12px 16px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#678098", fontWeight: "600" }}>⏱ Intervalo</span>
          <select value={intervaloMs} onChange={(e) => guardarCambios({ ...perfil, intervaloMs: Number(e.target.value) })} style={{ padding: "6px 12px", borderRadius: "20px", border: "1.5px solid #D0E8F5", background: "white", color: "#1187c9", fontSize: "13px", fontWeight: "bold", cursor: "pointer", outline: "none" }}>
            {OPCIONES_INTERVALO.map((op) => <option key={op.ms} value={op.ms}>{op.label}</option>)}
          </select>
        </div>

        {/* ── Mascota ── */}
        <Mascota porcentaje={porcentaje} animando={mascotaAnimando} tipo={perfil.mascotaTipo || "gota"} />

        {/* ── Botones de acción estilo Headspace ── */}
        <div style={{ width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          <button onClick={() => setMostrarModal(true)} style={{ background: "linear-gradient(135deg, #1187c9, #0ea5e9)", color: "white", border: "none", borderRadius: "18px", padding: "17px 32px", fontSize: "16px", cursor: "pointer", fontWeight: "700", letterSpacing: "0.02em", boxShadow: "0 6px 20px rgba(17,135,201,0.30)" }}>
            💧 Registrar bebida
          </button>
          <button onClick={() => setMostrarEjercicio(true)} style={{ background: "white", color: "#D97706", border: "2px solid #FCD34D", borderRadius: "18px", padding: "15px 32px", fontSize: "15px", cursor: "pointer", fontWeight: "700", boxShadow: "0 3px 12px rgba(245,158,11,0.15)" }}>
            🏋️ Registrar ejercicio
          </button>
          <button onClick={() => {
            const diaLimpio = { fecha: fechaHoy(), ml: 0, registros: [], ejercicios: [] };
            setMlAcumulados(0); setRegistros([]); setEjercicios([]);
            guardarDiaActual(diaLimpio);
            ignorarSnapshotRef.current = true;
            sincronizarFirebase(userId, { diaActual: diaLimpio }).finally(() => {
              setTimeout(() => { ignorarSnapshotRef.current = false; }, 1000);
            });
          }} style={{ background: "transparent", color: "#B0BEC5", border: "1.5px solid #E8EEF4", borderRadius: "18px", padding: "12px 32px", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}>
            🔄 Resetear día
          </button>
        </div>

        {/* ── Registro de ejercicios ── */}
        {ejercicios.length > 0 && (
          <div style={{ marginBottom: "14px", background: "white", borderRadius: "24px", padding: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 3px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ color: "#D97706", fontSize: "15px", margin: 0, fontWeight: "700" }}>🏋️ Ejercicio de hoy</h2>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#F59E0B" }}>+{totalEjercicioHoy} {unidad}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ejercicios.map((e, i) => {
                const todosEj = [...EJERCICIOS, ...ejerciciosCustom];
                const ej = todosEj.find((x) => x.id === e.ejercicioId) || { emoji: "🏃", nombre: e.ejercicioId };
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#FFFBEB", borderRadius: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "22px" }}>{ej.emoji}</span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#0D3B66" }}>{ej.nombre}</div>
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>{e.minutos} min</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#F59E0B" }}>+{e.aguaSugerida} {unidad}</div>
                        <div style={{ fontSize: "11px", color: "#CBD5E1" }}>{e.fecha ? new Date(e.fecha + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) + " · " : ""}{e.hora}</div>
                      </div>
                      <button onClick={() => { setMlAcumulados(Math.max(0, mlAcumulados - e.aguaSugerida)); setEjercicios((prev) => prev.filter((_, idx) => idx !== i)); }} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#FCA5A5", padding: "4px" }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Registro de bebidas ── */}
        {registros.length > 0 && (
          <div style={{ marginBottom: "14px", background: "white", borderRadius: "24px", padding: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 3px 16px rgba(0,0,0,0.06)" }}>
            <h2 style={{ color: "#1187c9", fontSize: "15px", margin: "0 0 12px", fontWeight: "700" }}>📋 Bebidas de hoy</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {registros.map((r, i) => {
                const b = BEBIDAS_DEFAULT.find((b) => b.id === r.bebidaId)!;
                const config = configBebidas.find((c) => c.id === r.bebidaId);
                const cuentaParaMeta = config?.cuenta ?? b.cuentaDefault;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F8FBFD", borderRadius: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "22px" }}>{b.emoji}</span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#0D3B66" }}>{b.nombre}</div>
                        <div style={{ fontSize: "12px", color: cuentaParaMeta ? "#22c55e" : "#CBD5E1", fontWeight: "600" }}>{cuentaParaMeta ? "✅ Cuenta" : "No cuenta"}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: b.color }}>{r.cantidad} {unidad}</div>
                      <div style={{ fontSize: "11px", color: "#CBD5E1" }}>{r.fecha ? new Date(r.fecha + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) + " · " : ""}{r.hora}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Historial ── */}
        <div style={{ background: "white", borderRadius: "24px", padding: "20px", width: "100%", maxWidth: "380px", boxShadow: "0 3px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ color: "#0D3B66", fontSize: "15px", margin: 0, fontWeight: "700" }}>📊 Historial</h2>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setVistaGrafica("semana")} style={{ padding: "5px 14px", borderRadius: "20px", border: "none", background: vistaGrafica === "semana" ? "#1187c9" : "#EEF4FA", color: vistaGrafica === "semana" ? "white" : "#678098", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>7 días</button>
              <button onClick={() => setVistaGrafica("mes")} style={{ padding: "5px 14px", borderRadius: "20px", border: "none", background: vistaGrafica === "mes" ? "#1187c9" : "#EEF4FA", color: vistaGrafica === "mes" ? "white" : "#678098", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Este mes</button>
            </div>
          </div>

          {vistaGrafica === "semana"
            ? <GraficaSemanal historial={historialCompleto} onEditarDia={(dia) => setDiaEditando(dia)} />
            : <GraficaMensual historial={historialCompleto} unidad={unidad} />
          }

          <div style={{ marginTop: "14px", display: "flex", gap: "16px", fontSize: "12px", color: "#94A3B8" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#1187c9" }} /> En progreso</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#22c55e" }} /> Meta cumplida</span>
          </div>
        </div>

      </div>
    </>
  );
}
