import { useState } from "react";
import { BEBIDAS_DEFAULT, CATEGORIAS_BEBIDA, IconoBebidaKawaii } from "../data/bebidas";
import { NIVELES_ACTIVIDAD, OPCIONES_INTERVALO, Perfil, SONIDOS_INTEGRADOS } from "../data/perfil";
import { playAlerta, playGota, playPop } from "../lib/sonidos";
import { calcularMetaSugerida } from "../lib/utils";

export function SeccionPerfil({ onGuardar, onCerrar, perfil, esInicio }: {
  onGuardar: (p: Perfil) => void; onCerrar?: () => void; perfil?: Perfil | null; esInicio: boolean;
}) {
  const [nombre, setNombre] = useState(perfil?.nombre || "");
  const [unidad, setUnidad] = useState<"ml" | "oz">(perfil?.unidad || "ml");
  const [metaMl, setMetaMl] = useState(perfil?.metaMl || 2000);
  const [metaOz, setMetaOz] = useState(perfil?.metaOz || 64);
  const [tamanoVasoDefault, setTamanoVasoDefault] = useState(perfil?.tamanoVasoDefault || 250);
  const [configBebidas, setConfigBebidas] = useState(() => {
    const saved = perfil?.configBebidas || [];
    const merged = BEBIDAS_DEFAULT.map((b) => {
      const existing = saved.find((x: any) => x.id === b.id);
      return existing || { id: b.id, cuenta: b.cuentaDefault };
    });
    return merged;
  });
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
  const tamanos = unidad === "ml" ? [100, 150, 200, 250, 350, 500] : [4, 8, 12, 16, 20];
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
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          {([["perrito", "🐶", "Perrito"], ["gatito", "🐱", "Gatito"], ["gota", "💧", "Gotita"]] as const).map(([id, emoji, label]) => (
            <button key={id} onClick={() => setMascotaTipo(id)} style={{ flex: 1, padding: "12px 8px", borderRadius: "16px", border: `2px solid ${mascotaTipo === id ? "#1187c9" : "#e0eaf2"}`, background: mascotaTipo === id ? "#e8f4fd" : "white", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "28px" }}>{emoji}</div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: mascotaTipo === id ? "#1187c9" : "#94A3B8", marginTop: "4px" }}>{label}</div>
            </button>
          ))}
        </div>
        {/* Preview de mascota */}
        <div style={{ background: "#F0F9FF", borderRadius: "16px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div style={{ width: "56px", height: "56px", animation: "flotar 3s ease-in-out infinite", flexShrink: 0 }}>
            {mascotaTipo === "perrito" ? (
              <img src="/pets/perro_sin_skin_normal.png.png" alt="perrito" style={{ width: "56px", height: "56px", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.12))" }} onError={(e) => { (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement("span"), { textContent: "🐶", style: "font-size:48px" })); }} />
            ) : mascotaTipo === "gatito" ? (
              <span style={{ fontSize: "48px" }}>🐱</span>
            ) : (
              <span style={{ fontSize: "48px" }}>💧</span>
            )}
          </div>
          <div style={{ fontSize: "13px", color: "#0D3B66", fontWeight: "600" }}>
            {mascotaTipo === "perrito" ? "¡Woof! ¡Toma agua, porfa! 🐾" : mascotaTipo === "gatito" ? "¡Miau! ¡Hidratarse es de pros! 🐾" : "¡Hora de hidratarse! 💧"}
          </div>
        </div>

        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "8px" }}>🔔 Sonido de alarma</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SONIDOS_INTEGRADOS.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: sonidoSeleccionado === s.id ? "#e8f4fd" : "#f8fafc", borderRadius: "12px", border: `1.5px solid ${sonidoSeleccionado === s.id ? "#1187c9" : "#e0eaf2"}`, cursor: "pointer" }} onClick={() => setSonidoSeleccionado(s.id)}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: sonidoSeleccionado === s.id ? "#1187c9" : "#143350" }}>{s.nombre}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {s.id !== "custom" && (
                  <button onClick={(e) => {
                    e.stopPropagation();
                    const stopFn = s.id === "gota" ? playGota() : s.id === "pop" ? playPop() : playAlerta();
                    setTimeout(stopFn, 3000);
                  }} style={{ background: "#e8f4fd", border: "none", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", cursor: "pointer", color: "#1187c9", fontWeight: "700" }}>▶ Probar</button>
                )}
                {sonidoSeleccionado === s.id && <span style={{ color: "#1187c9", fontSize: "16px" }}>✓</span>}
              </div>
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
        <label style={{ fontSize: "13px", color: "#678098", fontWeight: "bold", display: "block", marginBottom: "4px" }}>¿Qué bebidas quieres sumar a tu meta de líquidos?</label>
        <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.4, marginBottom: "10px" }}>
          Las bebidas aportan líquido, pero tú decides cuáles quieres incluir en tu meta diaria.
        </div>
        <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #E7EEF4", borderRadius: "16px", padding: "10px", background: "#FCFEFF" }}>
          {CATEGORIAS_BEBIDA.filter((cat) => cat.id !== "Todas").map((cat) => (
            <div key={cat.id} style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: "900", color: "#0D3B66", margin: "2px 2px 6px" }}>{cat.emoji} {cat.nombre}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {BEBIDAS_DEFAULT.filter((b) => b.categoria === cat.id).map((b) => {
                  const config = configBebidas.find((x) => x.id === b.id);
                  const cuenta = config?.cuenta ?? b.cuentaDefault;
                  return (
                    <div key={b.id} onClick={() => setConfigBebidas((prev) => prev.map((x) => x.id === b.id ? { ...x, cuenta: !cuenta } : x))}
                      style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px", background: cuenta ? `${b.color}0D` : "#F8FAFC", borderRadius: "12px", border: `1.5px solid ${cuenta ? b.color + "45" : "#E6EDF3"}`, cursor: "pointer" }}>
                      <IconoBebidaKawaii bebida={b} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#143350", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.nombre}</div>
                        <div style={{ fontSize: "9px", color: cuenta ? "#16A34A" : "#94A3B8", fontWeight: "700" }}>{cuenta ? "💧 Suma" : "Solo registro"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
