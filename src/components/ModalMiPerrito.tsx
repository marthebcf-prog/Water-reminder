import { useState } from "react";
import { ACCESORIOS } from "../lib/racha";

export function AccesoriosTab({ racha, accesorioElegido, onAccesorioChange }: { racha: number; accesorioElegido?: string; onAccesorioChange: (img: string) => void }) {
  const [seleccion, setSeleccion] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    ACCESORIOS.forEach(acc => { init[acc.id] = acc.opciones[0].id; });
    return init;
  });

  const handleSelect = (accId: string, opId: string, img: string) => {
    setSeleccion(prev => ({ ...prev, [accId]: opId }));
    onAccesorioChange(img);
  };

  return (
    <div>
      <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        Mantén tu racha para desbloquear accesorios 🎁
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
        {ACCESORIOS.map((acc) => {
          const desbloqueado = racha >= acc.diasRequeridos;
          const seleccionado = seleccion[acc.id] || acc.opciones[0].id;
          return (
            <div key={acc.id} style={{ background: desbloqueado ? "#F0FDF4" : "#F8FAFC", borderRadius: "20px", padding: "16px", border: `1.5px solid ${desbloqueado ? "#86EFAC" : "#EEF2F7"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: desbloqueado ? "12px" : "0" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: desbloqueado ? "#0D3B66" : "#94A3B8", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{acc.nombre}</div>
                  {desbloqueado
                    ? <div style={{ fontSize: "11px", color: "#22c55e", fontWeight: "600" }}>✅ Desbloqueado</div>
                    : <div style={{ fontSize: "11px", color: "#94A3B8" }}>🔒 {acc.diasRequeridos} días de racha</div>}
                </div>
                {!desbloqueado && (
                  <img src={acc.opciones[0].img} alt={acc.nombre} style={{ width: "52px", height: "52px", objectFit: "contain", filter: "grayscale(1)", opacity: 0.3 }} />
                )}
              </div>
              {desbloqueado && (
                <div style={{ display: "flex", gap: "10px" }}>
                  {acc.opciones.map((op) => (
                    <button key={op.id} onClick={() => handleSelect(acc.id, op.id, op.img)}
                      style={{ flex: 1, padding: "10px", borderRadius: "16px", border: `2px solid ${accesorioElegido === op.img ? "#1187c9" : "#E0EAF2"}`, background: accesorioElegido === op.img ? "#E8F4FD" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={op.img} alt={op.id} style={{ width: "72px", height: "72px", objectFit: "contain", mixBlendMode: "multiply" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ background: "#F0F9FF", borderRadius: "16px", padding: "14px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", color: "#1187c9", fontWeight: "600", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>🛍️ Tienda de accesorios</div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Próximamente — accesorios exclusivos comprables</div>
      </div>
    </div>
  );
}

export function ModalMiPerrito({ racha, enGracia, porcentaje, mascotaTipo, nivelElegido, accesorioElegido, onNivelChange, onAccesorioChange, onCerrar }: {
  racha: number; enGracia: boolean; porcentaje: number;
  mascotaTipo: "perrito" | "gatito" | "gota";
  nivelElegido?: string; accesorioElegido?: string;
  onNivelChange: (nivel: string) => void;
  onAccesorioChange: (img: string) => void;
  onCerrar: () => void;
}) {
  const [tab, setTab] = useState<"nivel" | "accesorios">("nivel");
  const NIVELES_MASCOTA = [
    { id: "sin_skin", nombre: "Sin nivel",  diasMin: 0,  diasMax: 0,        color: "#94A3B8", emoji: "🐾" },
    { id: "cobre",    nombre: "Cobre",      diasMin: 1,  diasMax: 7,        color: "#CD7F32", emoji: "🥉" },
    { id: "plata",    nombre: "Plata",      diasMin: 8,  diasMax: 20,       color: "#94A3B8", emoji: "🥈" },
    { id: "dorado",   nombre: "Dorado",     diasMin: 21, diasMax: 50,       color: "#F59E0B", emoji: "🥇" },
    { id: "diamante", nombre: "Diamante",   diasMin: 51, diasMax: Infinity, color: "#60b8f5", emoji: "💎" },
  ];
  const nivelIdx = racha === 0 ? 0 : racha <= 7 ? 1 : racha <= 20 ? 2 : racha <= 50 ? 3 : 4;
  const nivelActual = NIVELES_MASCOTA[nivelIdx];
  const nivelSiguiente = NIVELES_MASCOTA[nivelIdx + 1];
  const progresoPct = nivelIdx === 0 ? 0
    : nivelSiguiente
    ? Math.round(((racha - nivelActual.diasMin) / (nivelSiguiente.diasMin - nivelActual.diasMin)) * 100)
    : 100;
  const diasParaSiguiente = nivelSiguiente ? Math.max(0, nivelSiguiente.diasMin - racha) : 0;
  const imgSrc = mascotaTipo === "perrito"
    ? `/pets/perro_${nivelActual.id}_${porcentaje >= 100 ? "feliz" : porcentaje === 0 ? "zzz" : "normal"}.png.png`
    : null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(14,34,48,0.75)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: "480px", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#0D3B66", fontSize: "20px", fontWeight: "800", margin: 0 }}>🐾 Mi mascota</h2>
          <button onClick={onCerrar} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "18px", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", background: "#F1F5F9", borderRadius: "16px", padding: "4px" }}>
          {([["nivel", "📊 Nivel"], ["accesorios", "🎽 Accesorios"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: "none", background: tab === id ? "white" : "transparent", color: tab === id ? "#0D3B66" : "#94A3B8", fontWeight: "700", fontSize: "14px", cursor: "pointer", boxShadow: tab === id ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "nivel" && (
          <div>
            {enGracia && (
              <div style={{ background: "#FFF8E1", border: "1.5px solid #FCD34D", borderRadius: "12px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#92400E", fontWeight: "600" }}>
                ⚠️ Día de gracia activo — ¡completa tu meta hoy para salvar la racha!
              </div>
            )}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                {imgSrc ? (
                  <img src={imgSrc} alt="mascota" style={{ width: "120px", height: "120px", objectFit: "contain", animation: "flotar 3s ease-in-out infinite", filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.15))" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
                ) : (
                  <div style={{ fontSize: "96px", animation: "flotar 3s ease-in-out infinite" }}>{mascotaTipo === "gatito" ? "🐱" : "💧"}</div>
                )}
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "18px" }}>{nivelActual.emoji}</span>
                  <span style={{ fontSize: "16px", fontWeight: "800", color: nivelActual.color, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{nivelActual.nombre}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{racha} día{racha !== 1 ? "s" : ""} de racha {racha > 0 ? "🔥" : ""}</div>
              </div>
              {nivelSiguiente ? (
                <div style={{ background: "#F8FAFC", borderRadius: "16px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "700", color: nivelActual.color }}>{nivelActual.emoji} {nivelActual.nombre}</span>
                    <span style={{ fontWeight: "700", color: nivelSiguiente.color }}>{nivelSiguiente.emoji} {nivelSiguiente.nombre}</span>
                  </div>
                  <div style={{ height: "10px", background: "#EEF4FA", borderRadius: "99px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ height: "100%", width: `${Math.max(progresoPct, 3)}%`, background: `linear-gradient(to right, ${nivelActual.color}, ${nivelSiguiente.color})`, borderRadius: "99px", transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ fontSize: "13px", color: "#678098", fontWeight: "600", textAlign: "center" }}>
                    {nivelIdx === 0
                      ? "Completa tu meta hoy para ganar nivel Cobre 🥉"
                      : diasParaSiguiente > 0
                      ? `Faltan ${diasParaSiguiente} días para ${nivelSiguiente.nombre}`
                      : "¡Ya alcanzaste el siguiente nivel!"}
                  </div>
                </div>
              ) : (
                <div style={{ background: "#F0FDF4", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px" }}>💎</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#16a34a", marginTop: "6px" }}>¡Nivel máximo alcanzado!</div>
                </div>
              )}
            </div>

            {/* Selector de nivel libre */}
            {nivelIdx > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "600", marginBottom: "10px", textAlign: "center" }}>Elige tu skin</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                  {NIVELES_MASCOTA.slice(1, nivelIdx + 1).map((n) => (
                    <button key={n.id} onClick={() => onNivelChange(n.id)}
                      style={{ padding: "8px 14px", borderRadius: "20px", border: `2px solid ${(nivelElegido || nivelActual.id) === n.id ? n.color : "#E0EAF2"}`, background: (nivelElegido || nivelActual.id) === n.id ? `${n.color}20` : "white", color: (nivelElegido || nivelActual.id) === n.id ? n.color : "#94A3B8", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                      {n.emoji} {n.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "accesorios" && (
          <AccesoriosTab racha={racha} accesorioElegido={accesorioElegido} onAccesorioChange={onAccesorioChange} />
        )}
      </div>
    </div>
  );
}
