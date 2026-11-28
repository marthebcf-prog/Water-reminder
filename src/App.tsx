import "./styles.css";
import { useState, useEffect, useRef } from "react";
import { onSnapshot } from "firebase/firestore";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { Celebracion, GraficaMensual, GraficaSemanal, VasoAgua } from "./components/Graficas";
import { Mascota } from "./components/Mascota";
import { ModalBebida } from "./components/ModalBebida";
import { ModalEditarDia } from "./components/ModalEditarDia";
import { ModalEjercicio } from "./components/ModalEjercicio";
import { ModalMiPerrito } from "./components/ModalMiPerrito";
import { PantallaLogin } from "./components/PantallaLogin";
import { SeccionPerfil } from "./components/SeccionPerfil";
import { TarjetaPush } from "./components/TarjetaPush";
import { pushActivoEnEsteDispositivo } from "./lib/push";
import { AzucarAgregada, BEBIDAS_DEFAULT, Bebida, ComposicionCafeLeche, IconoBebidaKawaii, calcularNutricionBebida, calcularNutricionCafeLeche, cargarBebidasCustom, guardarBebidasCustom, sumarAzucarAgregadaNutricion } from "./data/bebidas";
import { DiaHistorial, EJERCICIOS, EjercicioCustom, OPCIONES_INTERVALO, Perfil, Registro, RegistroEjercicio, cargarDiaActual, cargarEjerciciosCustom, cargarHistorial, cargarPerfil, guardarDiaActual, guardarHistorial, guardarPerfil } from "./data/perfil";
import { auth, getDocRef, sincronizarFirebase } from "./lib/firebase";
import { calcularRachaCompleta } from "./lib/racha";
import { desbloquearAudio, iniciarSonido } from "./lib/sonidos";
import { esDentroDeHorario, fechaHoy, getNivel } from "./lib/utils";

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
    ["water-perfil-v4","water-historial-v1","water-dia-actual","water-proxima-alarma","water-ejercicios-custom","water-custom-sound","water-bebidas-custom-v1","water-bebidas-favoritas-v1"].forEach((k) => localStorage.removeItem(k));
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
  const [bebidasCustom, setBebidasCustom] = useState<Bebida[]>(() => cargarBebidasCustom());
  const [animacion, setAnimacion] = useState<"gotas" | "ondas" | "burbujas" | "celebracion" | null>(null);
  const [historialCompleto, setHistorialCompleto] = useState<DiaHistorial[]>(() => cargarHistorial());
  const [racha, setRacha] = useState(0);
  const [enGracia, setEnGracia] = useState(false);
  const [mostrarMiPerrito, setMostrarMiPerrito] = useState(false);
  const [nivelElegido, setNivelElegido] = useState<string | undefined>(undefined);
  const [accesorioElegido, setAccesorioElegido] = useState<string | undefined>(undefined);
  const [vistaGrafica, setVistaGrafica] = useState<"semana" | "mes">("semana");
  const [proximaAlarma, setProximaAlarma] = useState(() => {
    const perfil = cargarPerfil();
    const intervaloActual = perfil?.intervaloMs || 30 * 60 * 1000;
    const guardada = localStorage.getItem("water-proxima-alarma");
    if (guardada) {
      const t = Number(guardada);
      const tiempoRestante = t - Date.now();
      // Válido solo si está en el futuro Y no excede el intervalo actual
      if (tiempoRestante > 0 && tiempoRestante <= intervaloActual) return t;
    }
    return Date.now() + intervaloActual;
  });
  const [ahora, setAhora] = useState(Date.now());
  const [alarmaActiva, setAlarmaActiva] = useState(false);
  const [recordatoriosOn, setRecordatoriosOn] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarEjercicio, setMostrarEjercicio] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [diaEditando, setDiaEditando] = useState<DiaHistorial | null>(null);
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
      if (Array.isArray(data.bebidasCustom)) { guardarBebidasCustom(data.bebidasCustom); setBebidasCustom(data.bebidasCustom); }
      // Detectar señal de alarma apagada desde otro dispositivo
      // Con recordatorios push activos, el contador de la app sigue al del servidor
      if (typeof data.proximoAviso === "number" && pushActivoEnEsteDispositivo() && data.proximoAviso > Date.now()) {
        setProximaAlarma(data.proximoAviso);
      }
      if (data.alarmaApagada && alarmaActiva) {
        stopAlarmaRef.current?.();
        audioRef.current?.pause();
        setAlarmaActiva(false);
        setMostrarModal(false);
      }
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
          const _r = calcularRachaCompleta(merged); setRacha(_r.racha); setEnGracia(_r.enGracia);
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
            const parseHora = (r: Registro) => {
              const [h, m] = r.hora.replace(" a.m.","").replace(" p.m.","").split(":").map(Number);
              const esPm = r.hora.includes("p.m.") && h !== 12;
              const esAm = r.hora.includes("a.m.") && h === 12;
              return (esPm ? h + 12 : esAm ? 0 : h) * 60 + m;
            };
            return [...nuevos, ...localRegs].sort((a, b) => parseHora(b) - parseHora(a));
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
    // El permiso ahora se pide desde la tarjeta "Recordatorios" (iPhone exige un toque del usuario)
    // Registrar service worker para notificaciones en iOS PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    document.addEventListener("touchstart", desbloquearAudio, { once: true });
    document.addEventListener("click", desbloquearAudio, { once: true });
    document.addEventListener("scroll", desbloquearAudio, { once: true });
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
      // Si este dispositivo ya recibe push del servidor, no duplicar la notificación
      if ("Notification" in window && Notification.permission === "granted" && !pushActivoEnEsteDispositivo()) {
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
        const _r = calcularRachaCompleta(prev); setRacha(_r.racha); setEnGracia(_r.enGracia);
        return prev;
      }
      const sinHoy = prev.filter((d) => d.fecha !== hoy);
      const nuevo = [...sinHoy, { fecha: hoy, total: mlAcumulados, metaDelDia: meta }];
      guardarHistorial(nuevo); sincronizarFirebase(userId, { historial: nuevo });
      const _r = calcularRachaCompleta(nuevo); setRacha(_r.racha); setEnGracia(_r.enGracia);
      return nuevo;
    });
  }, [mlAcumulados, perfil]);

  // Guardar progreso del día actual en localStorage y Firebase
  const cargaInicialListaRef = useRef(false);
  const ultimaSincronizacionRef = useRef(Date.now());
  useEffect(() => {
    const diaActual = { fecha: fechaHoy(), ml: mlAcumulados, registros, ejercicios };
    guardarDiaActual(diaActual);
    // No subir a Firebase hasta que pase 4s (tiempo para que onSnapshot cargue primero)
    if (!cargaInicialListaRef.current) {
      const timer = setTimeout(() => { cargaInicialListaRef.current = true; }, 4000);
      return () => clearTimeout(timer);
    }
    // NUNCA subir si ml es 0 y no hay registros — puede ser un estado inicial vacío
    if (mlAcumulados === 0 && registros.length === 0 && ejercicios.length === 0) return;
    // NUNCA subir si la última sincronización fue hace más de 8 horas (compu dormida)
    const horasDesdeUltimaSync = (Date.now() - ultimaSincronizacionRef.current) / (1000 * 60 * 60);
    if (horasDesdeUltimaSync > 8) {
      console.warn("Skipping sync — computer was asleep too long");
      ultimaSincronizacionRef.current = Date.now();
      return;
    }
    ultimaSincronizacionRef.current = Date.now();
    ignorarSnapshotRef.current = true;
    sincronizarFirebase(userId, { diaActual }).finally(() => {
      setTimeout(() => { ignorarSnapshotRef.current = false; }, 1000);
    });
  }, [mlAcumulados, registros, ejercicios]);

  // Mantener el progreso principal SIEMPRE igual a la suma real de las bebidas de hoy.
  // `registros` es la fuente de verdad; así evitamos que Firebase/localStorage y el contador
  // principal se desincronicen (por ejemplo: lista = 1300 ml pero portada = 700 ml).
  useEffect(() => {
    if (!perfil) return;
    const totalRealBebidas = registros.reduce((total, r) => {
      const bebida = BEBIDAS_DEFAULT.find((b) => b.id === r.bebidaId) || bebidasCustom.find((b) => b.id === r.bebidaId);
      if (!bebida) return total;
      const config = perfil.configBebidas.find((c) => c.id === r.bebidaId);
      const cuenta = r.cuentaParaMeta ?? (bebida.personalizada ? bebida.cuentaDefault : (config?.cuenta ?? bebida.cuentaDefault));
      return cuenta ? total + r.cantidad : total;
    }, 0);
    setMlAcumulados((actual) => actual === totalRealBebidas ? actual : totalRealBebidas);
  }, [registros, bebidasCustom, perfil]);

  if (!perfil) return <SeccionPerfil esInicio={true} onGuardar={(p) => { guardarPerfil(p); setPerfil(p); setProximaAlarma(Date.now() + p.intervaloMs); }} />;

  const { unidad, metaMl, metaOz, configBebidas, verificacionFoto, intervaloMs, tamanoVasoDefault } = perfil;
  const meta = unidad === "ml" ? metaMl : metaOz;
  const porcentaje = Math.min(100, Math.round((mlAcumulados / meta) * 100));
  const nivel = getNivel(porcentaje);
  const totalEjercicioHoy = ejercicios.reduce((s, e) => s + e.aguaSugerida, 0);
  const resumenNutricionHoy = registros.reduce((acc, r) => {
    const b = BEBIDAS_DEFAULT.find((x) => x.id === r.bebidaId) || bebidasCustom.find((x) => x.id === r.bebidaId);
    if (!b) return acc;
    const baseCalculada = r.composicionCafeLeche ? calcularNutricionCafeLeche(r.composicionCafeLeche, unidad) : calcularNutricionBebida(b, r.cantidad, unidad);
    const n = r.nutricion || sumarAzucarAgregadaNutricion(baseCalculada, r.azucarAgregada);
    if (n.kcal == null) acc.sinKcal += 1; else acc.kcal += n.kcal;
    if (n.azucar == null) acc.sinAzucar += 1; else acc.azucar += n.azucar;
    if (n.azucarAnadida != null) acc.azucarAnadida += n.azucarAnadida;
    return acc;
  }, { kcal: 0, azucar: 0, azucarAnadida: 0, sinKcal: 0, sinAzucar: 0 });
  const mlBebidasMetaHoy = registros.reduce((total, r) => {
    const b = BEBIDAS_DEFAULT.find((x) => x.id === r.bebidaId) || bebidasCustom.find((x) => x.id === r.bebidaId);
    if (!b) return total;
    const config = configBebidas.find((c) => c.id === r.bebidaId);
    const cuenta = r.cuentaParaMeta ?? (b.personalizada ? b.cuentaDefault : (config?.cuenta ?? b.cuentaDefault));
    return cuenta ? total + r.cantidad : total;
  }, 0);
  const porcentajeBebidasHoy = Math.min(100, Math.round((mlBebidasMetaHoy / meta) * 100));
  const fechaHoyLarga = new Date(fechaHoy() + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  const msRestantes = Math.max(0, proximaAlarma - ahora);
  const hh = Math.floor(msRestantes / 3600000);
  const mm = Math.floor((msRestantes % 3600000) / 60000);
  const ss = Math.floor((msRestantes % 60000) / 1000);
  const tiempoRestante = `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const horaActual = new Date(ahora).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const pararAlarma = () => {
    stopAlarmaRef.current?.();
    audioRef.current?.pause();
    setAlarmaActiva(false);
    const nuevaAlarma = Date.now() + intervaloMs;
    setProximaAlarma(nuevaAlarma);
    localStorage.setItem("water-proxima-alarma", String(nuevaAlarma));
    // Señal a Firebase para que otros dispositivos también paren
    sincronizarFirebase(userId, { alarmaApagada: Date.now() });
  };

  const dispararAnimacion = (nuevoTotal: number) => {
    const pct = Math.min(100, Math.round((nuevoTotal / meta) * 100));
    if (pct >= 100) setAnimacion("celebracion");
    else if (pct >= 50) setAnimacion("burbujas");
    else if (pct >= 25) setAnimacion("ondas");
    else setAnimacion("gotas");
    setTimeout(() => setAnimacion(null), 3200);
    setMascotaAnimando(true); setTimeout(() => setMascotaAnimando(false), 1000);
  };

  const agregarBebidaCustom = (bebida: Bebida) => {
    const nuevo = [...bebidasCustom, bebida];
    setBebidasCustom(nuevo);
    guardarBebidasCustom(nuevo);
    sincronizarFirebase(userId, { bebidasCustom: nuevo });
  };

  const confirmarBebida = (bebidaId: string, cantidad: number, composicionCafeLeche?: ComposicionCafeLeche, azucarAgregada?: AzucarAgregada) => {
    const base = BEBIDAS_DEFAULT.find((b) => b.id === bebidaId) || bebidasCustom.find((b) => b.id === bebidaId);
    if (!base) return;
    const config = configBebidas.find((c) => c.id === bebidaId);
    const cuentaParaMeta = base.personalizada ? base.cuentaDefault : (config?.cuenta ?? base.cuentaDefault);
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Candado 3: máximo 3 registros en la última hora
    const haceUnaHora = Date.now() - 60 * 60 * 1000;
    const registrosUltimaHora = registros.filter((r) => {
      const [h, m] = r.hora.replace(" a.m.","").replace(" p.m.","").split(":").map(Number);
      const esPm = r.hora.includes("p.m.") && h !== 12;
      const esAm = r.hora.includes("a.m.") && h === 12;
      const minutos = (esPm ? h + 12 : esAm ? 0 : h) * 60 + m;
      const hoy = new Date();
      const tsEstimado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), Math.floor(minutos/60), minutos%60).getTime();
      return tsEstimado >= haceUnaHora;
    });
    if (registrosUltimaHora.length >= 3) {
      alert("🔒 Máximo 3 registros por hora. ¡Hidratate a tu ritmo!");
      return;
    }

    if (cuentaParaMeta) { const nuevo = mlAcumulados + cantidad; dispararAnimacion(nuevo); setMlAcumulados(nuevo); }
    const nutricionBaseRegistro = composicionCafeLeche ? calcularNutricionCafeLeche(composicionCafeLeche, perfil?.unidad || "ml") : calcularNutricionBebida(base, cantidad, perfil?.unidad || "ml");
    const nutricionRegistro = sumarAzucarAgregadaNutricion(nutricionBaseRegistro, azucarAgregada);
    const nuevoRegistro: Registro = {
      hora,
      bebidaId,
      cantidad,
      fecha: fechaHoy(),
      nutricion: nutricionRegistro,
      cuentaParaMeta,
    };
    if (composicionCafeLeche) nuevoRegistro.composicionCafeLeche = composicionCafeLeche;
    if (azucarAgregada) nuevoRegistro.azucarAgregada = azucarAgregada;

    setRegistros((prev) => [nuevoRegistro, ...prev]);
    setMostrarModal(false); pararAlarma();
  };

  const eliminarRegistroBebida = (indice: number) => {
    const registro = registros[indice];
    if (!registro) return;

    const bebida = BEBIDAS_DEFAULT.find((b) => b.id === registro.bebidaId) || bebidasCustom.find((b) => b.id === registro.bebidaId);
    const config = configBebidas.find((c) => c.id === registro.bebidaId);
    const cuentaParaMeta = registro.cuentaParaMeta ?? (bebida ? (bebida.personalizada ? bebida.cuentaDefault : (config?.cuenta ?? bebida.cuentaDefault)) : false);
    const nombre = bebida?.nombre || "esta bebida";

    const confirmar = window.confirm(`¿Eliminar ${nombre} (${registro.cantidad} ${unidad})?\n\nTambién se corregirá tu progreso de hoy.`);
    if (!confirmar) return;

    if (cuentaParaMeta) {
      setMlAcumulados((prev) => Math.max(0, prev - registro.cantidad));
    }
    setRegistros((prev) => prev.filter((_, idx) => idx !== indice));
  };

  const confirmarEjercicio = (ejercicioId: string, minutos: number, aguaSugerida: number) => {
    const hora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setEjercicios((prev) => [{ hora, ejercicioId, minutos, aguaSugerida, fecha: fechaHoy() }, ...prev]);
    // El ejercicio genera una sugerencia de hidratación, pero NO cuenta como líquido bebido.
    // El progreso solo aumenta cuando se registra una bebida.
    setMostrarEjercicio(false);
  };

  const agregarEjercicioCustom = (e: EjercicioCustom) => {
    setEjerciciosCustom((prev) => {
      const nuevo = [...prev, e];
      localStorage.setItem("water-ejercicios-custom", JSON.stringify(nuevo));
      return nuevo;
    });
  };

  const guardarCambios = (nuevoPerfil: Perfil) => {
    // Candado 1: meta no se puede subir después de las 10am
    const horaActual = new Date().getHours();
    if (horaActual >= 10 && nuevoPerfil.metaMl < perfil.metaMl) {
      alert("🔒 No puedes bajar tu meta después de las 10am. ¡Tú puedes llegar!");
      return;
    }
    guardarPerfil(nuevoPerfil);
    setPerfil(nuevoPerfil);
    // Solo resetear el timer si cambió el intervalo
    if (nuevoPerfil.intervaloMs !== perfil.intervaloMs) {
      const nuevaAlarma = Date.now() + nuevoPerfil.intervaloMs;
      setProximaAlarma(nuevaAlarma);
      localStorage.setItem("water-proxima-alarma", String(nuevaAlarma));
    }
    setMostrarConfig(false);
    sincronizarFirebase(userId, { perfil: nuevoPerfil });
  };

  const editarDia = (fecha: string, total: number) => {
    const meta = perfil ? (perfil.unidad === "ml" ? perfil.metaMl : perfil.metaOz) : 2000;
    setHistorialCompleto((prev) => {
      const sinFecha = prev.filter((d) => d.fecha !== fecha);
      const nuevo = [...sinFecha, { fecha, total, metaDelDia: meta }];
      guardarHistorial(nuevo);
      sincronizarFirebase(userId, { historial: nuevo });
      const _r = calcularRachaCompleta(nuevo); setRacha(_r.racha); setEnGracia(_r.enGracia);
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
      <div id="cal-tooltip" style={{ position: "fixed", display: "none", background: "#0D3B66", color: "white", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontWeight: "700", zIndex: 9999, pointerEvents: "none", whiteSpace: "pre", lineHeight: 1.4, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />

      {animacion === "celebracion" && <Celebracion />}
      {mostrarMiPerrito && <ModalMiPerrito racha={racha} enGracia={enGracia} porcentaje={porcentaje} mascotaTipo={perfil.mascotaTipo || "gota"} nivelElegido={nivelElegido} accesorioElegido={accesorioElegido} onNivelChange={setNivelElegido} onAccesorioChange={setAccesorioElegido} onCerrar={() => setMostrarMiPerrito(false)} />}
      {mostrarModal && <ModalBebida onConfirmar={confirmarBebida} onCerrar={() => { setMostrarModal(false); pararAlarma(); }} unidad={unidad} tamanoDefault={tamanoVasoDefault} verificacionFoto={verificacionFoto} configBebidas={configBebidas} bebidasCustom={bebidasCustom} onAgregarBebidaCustom={agregarBebidaCustom} />}
      {mostrarEjercicio && <ModalEjercicio onConfirmar={confirmarEjercicio} onCerrar={() => setMostrarEjercicio(false)} unidad={unidad} ejerciciosCustom={ejerciciosCustom} onAgregarCustom={agregarEjercicioCustom} />}
      {mostrarConfig && <SeccionPerfil esInicio={false} perfil={perfil} onGuardar={guardarCambios} onCerrar={() => setMostrarConfig(false)} />}
      {diaEditando && <ModalEditarDia dia={diaEditando} unidad={unidad} meta={meta} onGuardar={editarDia} onCerrar={() => setDiaEditando(null)} />}

      {/* ── Fondo estilo Headspace ── */}
      <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #E3F2FD 0%, #EEF6FB 35%, #F4F8FC 70%, #F9FBFD 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px 48px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* ── Recordatorios push (teléfono + Garmin) ── */}
        <TarjetaPush />

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
          <div style={{ background: racha > 0 ? (enGracia ? "#FFF8E1" : "#FFFBEB") : "white", borderRadius: "20px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1.5px solid ${racha > 0 ? (enGracia ? "#FCD34D" : "#FCD34D") : "#EEF2F7"}`, textAlign: "center" }}>
            <div style={{ fontSize: "28px" }}>{enGracia ? "⚠️" : racha > 0 ? "🔥" : "💤"}</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: racha > 0 ? "#B45309" : "#94A3B8", lineHeight: 1 }}>{racha}</div>
            <div style={{ fontSize: "11px", color: racha > 0 ? "#D97706" : "#CBD5E1", fontWeight: "600", marginTop: "2px" }}>{racha === 1 ? "día" : "días"} de racha</div>
            {enGracia && <div style={{ fontSize: "10px", color: "#92400E", marginTop: "4px", fontWeight: "700" }}>¡Día de gracia!</div>}
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
          <select value={intervaloMs} onChange={(e) => {
            const nuevoMs = Number(e.target.value);
            if (nuevoMs !== intervaloMs) {
              setProximaAlarma(Date.now() + nuevoMs);
              guardarCambios({ ...perfil, intervaloMs: nuevoMs });
            }
          }} style={{ padding: "6px 12px", borderRadius: "20px", border: "1.5px solid #D0E8F5", background: "white", color: "#1187c9", fontSize: "13px", fontWeight: "bold", cursor: "pointer", outline: "none" }}>
            {OPCIONES_INTERVALO.map((op) => <option key={op.ms} value={op.ms}>{op.label}</option>)}
          </select>
        </div>

        {/* ── Mascota ── */}
        <Mascota porcentaje={porcentaje} animando={mascotaAnimando} tipo={perfil.mascotaTipo || "gota"} racha={racha} nivelOverride={nivelElegido} accesorioImg={accesorioElegido} />
        <button onClick={() => setMostrarMiPerrito(true)} style={{ marginTop: "-6px", marginBottom: "20px", background: "white", border: "1.5px solid #D0E8F5", borderRadius: "20px", padding: "8px 20px", fontSize: "13px", color: "#1187c9", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 8px rgba(17,135,201,0.08)" }}>
          🐾 Ver mi mascota
        </button>

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
            // También resetear el historial de hoy y la racha
            setHistorialCompleto((prev) => {
              const sinHoy = prev.filter((d) => d.fecha !== fechaHoy());
              const nuevo = [...sinHoy, { fecha: fechaHoy(), total: 0, metaDelDia: meta }];
              guardarHistorial(nuevo);
              sincronizarFirebase(userId, { historial: nuevo });
              const _r = calcularRachaCompleta(nuevo); setRacha(_r.racha); setEnGracia(_r.enGracia);
              return nuevo;
            });
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
                      <button onClick={() => { setEjercicios((prev) => prev.filter((_, idx) => idx !== i)); }} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#FCA5A5", padding: "4px" }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Registro de bebidas ── */}
        {registros.length > 0 && (
          <div style={{ marginBottom: "14px", background: "white", borderRadius: "24px", padding: "18px", width: "100%", maxWidth: "380px", boxShadow: "0 3px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
              <h2 style={{ color: "#1187c9", fontSize: "15px", margin: 0, fontWeight: "800" }}>📋 Bebidas de hoy</h2>
              <span style={{ color: "#94A3B8", fontSize: "10.5px", fontWeight: "700", textTransform: "capitalize", whiteSpace: "nowrap" }}>{fechaHoyLarga}</span>
            </div>

            {/* Resumen compacto dentro de Bebidas de hoy */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", background: "#F7FBFE", border: "1px solid #EAF2F7", borderRadius: "18px", padding: "12px 8px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center", padding: "0 6px", borderRight: "1px solid #DDEAF2" }}>
                <div style={{ fontSize: "19px", lineHeight: 1 }}>🔥</div>
                <div style={{ fontSize: "15px", fontWeight: "900", color: "#0D3B66", marginTop: "3px" }}>≈{Math.round(resumenNutricionHoy.kcal)}</div>
                <div style={{ fontSize: "8.5px", color: "#7890A4", fontWeight: "700" }}>kcal en bebidas</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 6px", borderRight: "1px solid #DDEAF2" }}>
                <div style={{ fontSize: "19px", lineHeight: 1 }}>🍬</div>
                <div style={{ fontSize: "15px", fontWeight: "900", color: "#0D3B66", marginTop: "3px" }}>{resumenNutricionHoy.azucar.toFixed(1)} g</div>
                <div style={{ fontSize: "8.5px", color: "#7890A4", fontWeight: "700", lineHeight: 1.25 }}>azúcar total{resumenNutricionHoy.azucarAnadida > 0 ? ` · ${resumenNutricionHoy.azucarAnadida.toFixed(1)} g añadida` : ""}</div>
              </div>
              <div style={{ textAlign: "center", padding: "0 6px" }}>
                <div style={{ fontSize: "19px", lineHeight: 1 }}>💧</div>
                <div style={{ fontSize: "15px", fontWeight: "900", color: "#0D3B66", marginTop: "3px" }}>{mlBebidasMetaHoy} {unidad}</div>
                <div style={{ fontSize: "8.5px", color: "#7890A4", fontWeight: "700" }}>de tu meta · {porcentajeBebidasHoy}%</div>
              </div>
            </div>

            {(resumenNutricionHoy.sinKcal > 0 || resumenNutricionHoy.sinAzucar > 0) && (
              <div style={{ fontSize: "9px", color: "#94A3B8", lineHeight: 1.35, margin: "-3px 4px 10px", textAlign: "center" }}>
                Totales aproximados con los datos disponibles.{resumenNutricionHoy.sinKcal > 0 ? ` ${resumenNutricionHoy.sinKcal} bebida${resumenNutricionHoy.sinKcal === 1 ? "" : "s"} sin calorías estimadas.` : ""}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {registros.map((r, i) => {
                const b = BEBIDAS_DEFAULT.find((b) => b.id === r.bebidaId) || bebidasCustom.find((b) => b.id === r.bebidaId) || BEBIDAS_DEFAULT.find((b) => b.id === "otro")!;
                const config = configBebidas.find((c) => c.id === r.bebidaId);
                const cuentaParaMeta = r.cuentaParaMeta ?? (b.personalizada ? b.cuentaDefault : (config?.cuenta ?? b.cuentaDefault));
                const nutri = r.nutricion || sumarAzucarAgregadaNutricion(
                  r.composicionCafeLeche ? calcularNutricionCafeLeche(r.composicionCafeLeche, unidad) : calcularNutricionBebida(b, r.cantidad, unidad),
                  r.azucarAgregada,
                );
                const detalleComposicion = r.composicionCafeLeche ? (() => {
                  const cafe = BEBIDAS_DEFAULT.find((x) => x.id === r.composicionCafeLeche!.cafeTipoId);
                  const leche = BEBIDAS_DEFAULT.find((x) => x.id === r.composicionCafeLeche!.lecheTipoId);
                  return `${r.composicionCafeLeche!.cafeCantidad} ${unidad} ${cafe?.nombre || "café"} · ${r.composicionCafeLeche!.lecheCantidad} ${unidad} ${leche?.nombre || "leche"}`;
                })() : "";
                const detalleNutri = [
                  nutri.kcal == null ? null : `≈${Math.round(nutri.kcal)} kcal`,
                  nutri.azucar == null ? null : `${nutri.azucar.toFixed(1)} g azúcar`,
                  nutri.cafeina == null || nutri.cafeina <= 0 ? null : `${Math.round(nutri.cafeina)} mg cafeína`,
                ].filter(Boolean).join(" · ");
                const fechaHora = `${r.fecha ? new Date(r.fecha + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) + " · " : ""}${r.hora}`;

                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) auto", columnGap: "10px", rowGap: "3px", alignItems: "start", padding: "12px 11px", background: "#F8FBFD", borderRadius: "17px", border: "1px solid #F0F5F8" }}>
                    <div style={{ gridColumn: 1, gridRow: "1 / span 4", alignSelf: "center" }}>
                      <IconoBebidaKawaii bebida={b} size={40} />
                    </div>

                    <div style={{ gridColumn: 2, gridRow: 1, minWidth: 0, fontSize: "13.5px", fontWeight: "900", color: "#0D3B66", lineHeight: 1.18, overflowWrap: "anywhere" }}>
                      {b.nombre}
                    </div>
                    <div style={{ gridColumn: 3, gridRow: 1, textAlign: "right", whiteSpace: "nowrap", fontSize: "14px", fontWeight: "900", color: b.color, paddingLeft: "4px" }}>
                      {r.cantidad} {unidad}
                    </div>

                    <div style={{ gridColumn: "2 / 4", gridRow: 2, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "3px 5px", minWidth: 0 }}>
                      <span style={{ fontSize: "10px", color: cuentaParaMeta ? "#16A34A" : "#94A3B8", fontWeight: "800" }}>{cuentaParaMeta ? "💧 Suma a tu meta" : "Solo registro"}</span>
                      <span style={{ fontSize: "10px", color: "#B8C7D4" }}>· {fechaHora}</span>
                    </div>

                    {(detalleNutri || detalleComposicion || r.azucarAgregada) && (
                      <div style={{ gridColumn: "2 / 4", gridRow: 3, minWidth: 0 }}>
                        {detalleNutri && <div style={{ fontSize: "10px", color: "#7890A4", lineHeight: 1.35, overflowWrap: "anywhere" }}>{detalleNutri}</div>}
                        {detalleComposicion && <div style={{ fontSize: "9.5px", color: "#7890A4", lineHeight: 1.35, marginTop: "2px", overflowWrap: "anywhere" }}>{detalleComposicion}</div>}
                        {r.azucarAgregada && <div style={{ fontSize: "9.5px", color: "#BE185D", lineHeight: 1.35, marginTop: "2px", fontWeight: "700", overflowWrap: "anywhere" }}>🍬 +{r.azucarAgregada.cucharaditas} cdta{r.azucarAgregada.cucharaditas === 1 ? "" : "s"} · {r.azucarAgregada.gramos.toFixed(1)} g añadidos</div>}
                      </div>
                    )}

                    <button
                      onClick={() => eliminarRegistroBebida(i)}
                      aria-label={`Eliminar ${b.nombre}`}
                      title="Eliminar registro"
                      style={{ gridColumn: 3, gridRow: 4, justifySelf: "end", marginTop: "2px", width: "26px", height: "26px", border: "none", background: "transparent", color: "#E11D48", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "15px", padding: 0, opacity: 0.8 }}
                    >
                      🗑️
                    </button>
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
