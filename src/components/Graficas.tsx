import { useState } from "react";
import { DiaHistorial } from "../data/perfil";
import { fechaHoy } from "../lib/utils";

export function GraficaSemanal({ historial, onEditarDia }: { historial: DiaHistorial[]; onEditarDia: (dia: DiaHistorial) => void }) {
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

export function GraficaMensual({ historial, unidad }: { historial: DiaHistorial[]; unidad: string }) {
  const hoy = new Date();
  const [mesOffset, setMesOffset] = useState(0); // 0 = mes actual, -1 = mes anterior, etc.
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1);
  const año = fecha.getFullYear(); const mes = fecha.getMonth();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const nombreMes = fecha.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const esMesActual = mesOffset === 0;
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
          { label: "Días cumplidos", valor: `${diasCumplidos} / ${esMesActual ? hoy.getDate() : diasEnMes}`, color: "#22c55e" },
          { label: "Mejor racha", valor: `${mejorRacha} días 🔥`, color: "#f59e0b" },
          { label: "Meta", valor: `${metaBase} ${unidad}`, color: "#678098" },
        ].map((item) => (
          <div key={item.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "10px 12px" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>{item.label}</div>
            <div style={{ fontSize: "15px", fontWeight: "bold", color: item.color }}>{item.valor}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <button onClick={() => setMesOffset(mesOffset - 1)} style={{ background: "#EEF4FA", border: "none", borderRadius: "10px", padding: "6px 12px", fontSize: "16px", cursor: "pointer", color: "#1187c9", fontWeight: "bold" }}>‹</button>
        <div style={{ fontSize: "13px", color: "#94a3b8", textTransform: "capitalize", fontWeight: "600" }}>{nombreMes}</div>
        <button onClick={() => setMesOffset(Math.min(0, mesOffset + 1))} style={{ background: esMesActual ? "#F8FBFD" : "#EEF4FA", border: "none", borderRadius: "10px", padding: "6px 12px", fontSize: "16px", cursor: esMesActual ? "not-allowed" : "pointer", color: esMesActual ? "#CBD5E1" : "#1187c9", fontWeight: "bold" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (<div key={d} style={{ fontSize: "9px", color: "#94a3b8", textAlign: "center", paddingBottom: "4px" }}>{d}</div>))}
        {Array.from({ length: (new Date(año, mes, 1).getDay() + 6) % 7 }, (_, i) => (<div key={`e-${i}`} />))}
        {diasMes.map((d) => {
          const pct = d.metaDelDia > 0 ? Math.min(100, Math.round((d.total / d.metaDelDia) * 100)) : 0;
          const cumplioMeta = d.total > 0 && d.total >= d.metaDelDia;
          const esHoy = esMesActual && d.dia === hoy.getDate();
          return (
            <div key={d.dia} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", position: "relative" }}
              onMouseEnter={(e) => {
                if (!d.total) return;
                const tip = document.getElementById("cal-tooltip");
                if (tip) { tip.style.display = "block"; tip.innerText = `${d.total} ${unidad}\n${pct}%`; tip.style.left = e.currentTarget.getBoundingClientRect().left + "px"; tip.style.top = (e.currentTarget.getBoundingClientRect().top - 48) + "px"; }
              }}
              onMouseLeave={() => { const tip = document.getElementById("cal-tooltip"); if (tip) tip.style.display = "none"; }}
            >
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

export function VasoAgua({ porcentaje, nivel, animacion }: { porcentaje: number; nivel: any; animacion: string | null }) {
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

export function Celebracion() {
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
