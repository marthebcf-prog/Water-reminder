import { useEffect, useState } from "react";
import { EstadoPush, activarPush, desactivarPush, enviarPrueba, obtenerEstadoPush } from "../lib/push";

const caja = {
  width: "100%", maxWidth: "380px", borderRadius: "16px", padding: "12px 16px", marginBottom: "14px",
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
} as const;
const boton = {
  border: "none", borderRadius: "12px", padding: "8px 12px", fontSize: "12px", fontWeight: "700",
  cursor: "pointer", whiteSpace: "nowrap",
} as const;

export function TarjetaPush() {
  const [estado, setEstado] = useState<EstadoPush | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => { obtenerEstadoPush().then(setEstado); }, []);

  const ejecutar = async (fn: () => Promise<void>) => {
    setOcupado(true); setMensaje(null);
    try { await fn(); } catch (e: any) { setMensaje(e?.message || "Algo falló, intenta de nuevo"); }
    setOcupado(false);
  };

  if (!estado || estado === "no-soportado") return null;

  if (estado === "activo") {
    return (
      <div style={{ ...caja, background: "#ECFDF5", border: "1.5px solid #A7F3D0" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#065F46" }}>⌚ Recordatorios activos</div>
          <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>
            {mensaje || "Llegan aunque cierres la app (y a tu reloj)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button disabled={ocupado} style={{ ...boton, background: "#10B981", color: "white" }}
            onClick={() => ejecutar(async () => {
              const r = await enviarPrueba();
              setMensaje(r.enviadas
                ? "Prueba enviada, revisa tu reloj ⌚"
                : r.dispositivos
                  ? `No se pudo enviar: ${r.error || "error desconocido"}`
                  : "No se encontró este dispositivo; desactiva y vuelve a activar");
            })}>
            Probar
          </button>
          <button disabled={ocupado} style={{ ...boton, background: "white", color: "#047857", border: "1.5px solid #A7F3D0" }}
            onClick={() => ejecutar(async () => setEstado(await desactivarPush()))}>
            Quitar
          </button>
        </div>
      </div>
    );
  }

  const textos: Record<string, { titulo: string; detalle: string }> = {
    "instalar-primero": {
      titulo: "📲 Agrega la app a tu pantalla de inicio",
      detalle: "En Safari: botón Compartir → \"Agregar a pantalla de inicio\". Ábrela desde ahí para activar recordatorios en tu iPhone y Garmin.",
    },
    bloqueado: {
      titulo: "🔕 Notificaciones bloqueadas",
      detalle: "Actívalas en Ajustes → Notificaciones → Water y vuelve a abrir la app.",
    },
    inactivo: {
      titulo: "🔔 Recordatorios en tu teléfono y reloj",
      detalle: "Te llegan aunque la app esté cerrada.",
    },
  };
  const t = textos[estado];

  return (
    <div style={{ ...caja, background: "#FFF8E1", border: "1.5px solid #FCD34D" }}>
      <div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400E" }}>{t.titulo}</div>
        <div style={{ fontSize: "11px", color: "#B45309", marginTop: "2px" }}>{mensaje || t.detalle}</div>
      </div>
      {estado === "inactivo" && (
        <button disabled={ocupado} style={{ ...boton, background: "#F59E0B", color: "white" }}
          onClick={() => ejecutar(async () => setEstado(await activarPush()))}>
          {ocupado ? "..." : "Activar"}
        </button>
      )}
    </div>
  );
}
