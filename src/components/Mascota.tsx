

// ── Mascota Kawaii con imágenes reales ─────────────────────────
export function getPetImage(racha: number, porcentaje: number): string {
  const nivel = racha === 0 ? "sin_skin"
    : racha <= 7 ? "cobre"
    : racha <= 20 ? "plata"
    : racha <= 50 ? "dorado"
    : "diamante";

  const expresion = porcentaje >= 100 ? "feliz"
    : porcentaje === 0 ? "zzz"
    : "normal";

  return `/pets/perro_${nivel}_${expresion}.png.png`;
}

export function SvgPerrito({ emocion, animando, racha, porcentajeReal, nivelOverride, accesorioImg }: { emocion: number; animando: boolean; racha: number; porcentajeReal: number; nivelOverride?: string; accesorioImg?: string }) {
  const src = nivelOverride
    ? `/pets/perro_${nivelOverride}_${porcentajeReal >= 100 ? "feliz" : porcentajeReal === 0 ? "zzz" : "normal"}.png.png`
    : getPetImage(racha, porcentajeReal);
  return (
    <div style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <img
        src={src}
        alt="mascota"
        style={{
          width: "80px",
          height: "80px",
          objectFit: "contain",
          animation: animando ? "saltar 0.5s ease" : "flotar 3s ease-in-out infinite",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
          mixBlendMode: "multiply",
        }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {accesorioImg && (
        <img src={accesorioImg} alt="accesorio" style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", width: "52px", height: "52px", objectFit: "contain", mixBlendMode: "multiply", pointerEvents: "none" }} />
      )}
    </div>
  );
}

export function SvgGatito({ emocion, animando }: { emocion: number; animando: boolean }) {
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
export function SvgGota({ emocion, animando }: { emocion: number; animando: boolean }) {
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

export function Mascota({ porcentaje, animando, tipo, racha, nivelOverride, accesorioImg }: { porcentaje: number; animando: boolean; tipo: "perrito" | "gatito" | "gota"; racha: number; nivelOverride?: string; accesorioImg?: string }) {
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
        {tipo === "perrito" && <SvgPerrito emocion={emocion} animando={animando} racha={racha} porcentajeReal={porcentaje} nivelOverride={nivelOverride} accesorioImg={accesorioImg} />}
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
