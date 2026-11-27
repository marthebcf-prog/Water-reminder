import { useState, useEffect } from "react";
import { EJERCICIOS, EjercicioCustom } from "../data/perfil";

// ── ModalEjercicio ACTUALIZADO: agua editable + ejercicios personalizados ──
export function ModalEjercicio({
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
