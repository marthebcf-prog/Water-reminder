import { useState } from "react";
import { DiaHistorial } from "../data/perfil";

// ── Modal para editar días del historial ───────────────────────
export function ModalEditarDia({ dia, unidad, meta, onGuardar, onCerrar }: {
  dia: DiaHistorial; unidad: string; meta: number;
  onGuardar: (fecha: string, total: number) => void; onCerrar: () => void;
}) {
  const [total, setTotal] = useState(dia.total);
  const pct = meta > 0 ? Math.min(100, Math.round((total / meta) * 100)) : 0;
  const fecha = new Date(dia.fecha + "T00:00:00");
  const fechaLabel = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const totalOriginal = dia.total; // candado: no se puede subir
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(14,34,48,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "28px", padding: "28px", width: "100%", maxWidth: "360px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📅</div>
          <h2 style={{ color: "#0D3B66", fontSize: "18px", margin: "0 0 4px", textTransform: "capitalize" }}>{fechaLabel}</h2>
          <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0 }}>Solo puedes corregir a la baja</p>
        </div>
        <div style={{ background: "#FFF8E1", borderRadius: "12px", padding: "8px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🔒</span>
          <span style={{ fontSize: "12px", color: "#92400E", fontWeight: "600" }}>Máximo: {totalOriginal} {unidad} (lo que registraste)</span>
        </div>
        <div style={{ background: "#F0F9FF", borderRadius: "16px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: "600", letterSpacing: "0.05em" }}>TOTAL DEL DÍA</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <button onClick={() => setTotal(Math.max(0, total - 50))} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: "#D5E8F5", color: "#1187c9", fontSize: "22px", cursor: "pointer", fontWeight: "bold" }}>−</button>
            <span style={{ fontSize: "40px", fontWeight: "900", color: "#0D3B66", minWidth: "120px", textAlign: "center", lineHeight: 1 }}>
              {total}<span style={{ fontSize: "16px", color: "#94A3B8", fontWeight: "normal" }}> {unidad}</span>
            </span>
            <button
              onClick={() => setTotal(Math.min(totalOriginal, total + 50))}
              disabled={total >= totalOriginal}
              style={{ width: "40px", height: "40px", borderRadius: "50%", border: "none", background: total >= totalOriginal ? "#F1F5F9" : "#D5E8F5", color: total >= totalOriginal ? "#CBD5E1" : "#1187c9", fontSize: "22px", cursor: total >= totalOriginal ? "not-allowed" : "pointer", fontWeight: "bold" }}>+</button>
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
