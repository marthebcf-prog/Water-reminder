import { useState } from "react";
import { AzucarAgregada, BEBIDAS_CAFE_CON_LECHE, BEBIDAS_DEFAULT, Bebida, CATEGORIAS_BEBIDA, CATEGORIAS_CON_AZUCAR_OPCIONAL, CategoriaBebida, ComposicionCafeLeche, IconoBebidaKawaii, TIPOS_CAFE_COMPOSICION, TIPOS_LECHE_COMPOSICION, calcularNutricionBebida, calcularNutricionCafeLeche, cantidadAMl, cargarFavoritasBebidas, crearAzucarAgregada, guardarFavoritasBebidas, normalizarBusqueda, sumarAzucarAgregadaNutricion } from "../data/bebidas";

export function ModalBebida({ onConfirmar, onCerrar, unidad, tamanoDefault, verificacionFoto, configBebidas, bebidasCustom, onAgregarBebidaCustom }: {
  onConfirmar: (bebidaId: string, cantidad: number, composicionCafeLeche?: ComposicionCafeLeche, azucarAgregada?: AzucarAgregada) => void;
  onCerrar: () => void;
  unidad: string;
  tamanoDefault: number;
  verificacionFoto: boolean;
  configBebidas: { id: string; cuenta: boolean }[];
  bebidasCustom: Bebida[];
  onAgregarBebidaCustom: (bebida: Bebida) => void;
}) {
  type PasoBebida = "categorias" | "bebidas" | "custom" | "tamano" | "fotos";
  type CategoriaVista = CategoriaBebida | "Mis bebidas";

  const [paso, setPaso] = useState<PasoBebida>("categorias");
  const [bebidaSeleccionada, setBebidaSeleccionada] = useState<string | null>(null);
  const [tamano, setTamano] = useState(tamanoDefault);
  const [fotoLleno, setFotoLleno] = useState<string | null>(null);
  const [fotoVacio, setFotoVacio] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaVista | null>(null);
  const [favoritas, setFavoritas] = useState<string[]>(() => cargarFavoritasBebidas());
  const [cafeCantidad, setCafeCantidad] = useState(unidad === "ml" ? 60 : 2);
  const [lecheCantidad, setLecheCantidad] = useState(Math.max(unidad === "ml" ? 20 : 1, tamanoDefault - (unidad === "ml" ? 60 : 2)));
  const [cafeTipoId, setCafeTipoId] = useState("espresso");
  const [lecheTipoId, setLecheTipoId] = useState("leche_entera");
  const [azucarCucharaditas, setAzucarCucharaditas] = useState(0);

  const [customNombre, setCustomNombre] = useState("");
  const [customMarca, setCustomMarca] = useState("");
  const [customCategoria, setCustomCategoria] = useState<CategoriaBebida>("Preparadas");
  const [customEmoji, setCustomEmoji] = useState("🥤");
  const [customCantidadRef, setCustomCantidadRef] = useState(unidad === "ml" ? "250" : "8");
  const [customKcal, setCustomKcal] = useState("");
  const [customAzucar, setCustomAzucar] = useState("");
  const [customAzucarAnadida, setCustomAzucarAnadida] = useState("");
  const [customCafeina, setCustomCafeina] = useState("");
  const [customProteina, setCustomProteina] = useState("");
  const [customSodio, setCustomSodio] = useState("");
  const [customFuente, setCustomFuente] = useState("Etiqueta");
  const [customFuenteDetalle, setCustomFuenteDetalle] = useState("");
  const [customCuenta, setCustomCuenta] = useState(true);

  const tamanos = unidad === "ml" ? [100, 150, 200, 250, 350, 500] : [4, 8, 12, 16, 20];
  const todasBebidas = [...BEBIDAS_DEFAULT, ...bebidasCustom];
  const leerFoto = (file: File, setter: (v: string) => void) => { const r = new FileReader(); r.onload = () => setter(String(r.result)); r.readAsDataURL(file); };

  const getBebida = (id: string) => {
    const base = todasBebidas.find((b) => b.id === id)!;
    const config = configBebidas.find((c) => c.id === id);
    return { ...base, cuentaParaMeta: base.personalizada ? base.cuentaDefault : (config?.cuenta ?? base.cuentaDefault) };
  };

  const bebida = bebidaSeleccionada ? getBebida(bebidaSeleccionada) : null;
  const listoFotos = fotoLleno && fotoVacio;
  const usaComposicionCafeLeche = !!bebida && BEBIDAS_CAFE_CON_LECHE.has(bebida.id);
  const permiteAzucarAgregada = !!bebida && CATEGORIAS_CON_AZUCAR_OPCIONAL.has(bebida.categoria);
  const composicionCafeLeche: ComposicionCafeLeche | undefined = usaComposicionCafeLeche ? { cafeCantidad, lecheCantidad, cafeTipoId, lecheTipoId } : undefined;
  const azucarAgregada = permiteAzucarAgregada ? crearAzucarAgregada(azucarCucharaditas) : undefined;
  const nutricionBase = bebida ? (composicionCafeLeche ? calcularNutricionCafeLeche(composicionCafeLeche, unidad) : calcularNutricionBebida(bebida, tamano, unidad)) : null;
  const nutricion = nutricionBase ? sumarAzucarAgregadaNutricion(nutricionBase, azucarAgregada) : null;
  const busquedaNorm = normalizarBusqueda(busqueda);

  const pasoComposicion = unidad === "ml" ? 10 : 1;
  const minimoComponente = unidad === "ml" ? 20 : 1;
  const opcionesComponente = (() => {
    const max = Math.max(minimoComponente, tamano - minimoComponente);
    const valores: number[] = [];
    for (let v = minimoComponente; v <= max; v += pasoComposicion) valores.push(v);
    [cafeCantidad, lecheCantidad].forEach((v) => { if (v > 0 && v < tamano && !valores.includes(v)) valores.push(v); });
    return valores.sort((a, b) => a - b);
  })();

  const ajustarComposicionATamano = (nuevoTamano: number, bebidaId = bebidaSeleccionada) => {
    setTamano(nuevoTamano);
    if (!bebidaId || !BEBIDAS_CAFE_CON_LECHE.has(bebidaId)) return;
    const cafeSugerido = bebidaId === "latte"
      ? (unidad === "ml" ? 30 : 1)
      : bebidaId === "cappuccino"
        ? (unidad === "ml" ? 60 : 2)
        : Math.round(nuevoTamano / 2 / pasoComposicion) * pasoComposicion;
    const cafeFinal = Math.min(Math.max(minimoComponente, cafeSugerido), Math.max(minimoComponente, nuevoTamano - minimoComponente));
    setCafeCantidad(cafeFinal);
    setLecheCantidad(Math.max(minimoComponente, nuevoTamano - cafeFinal));
  };

  const cambiarCafeCantidad = (valor: number) => {
    const cafe = Math.min(Math.max(minimoComponente, valor), Math.max(minimoComponente, tamano - minimoComponente));
    setCafeCantidad(cafe);
    setLecheCantidad(Math.max(minimoComponente, tamano - cafe));
  };

  const cambiarLecheCantidad = (valor: number) => {
    const leche = Math.min(Math.max(minimoComponente, valor), Math.max(minimoComponente, tamano - minimoComponente));
    setLecheCantidad(leche);
    setCafeCantidad(Math.max(minimoComponente, tamano - leche));
  };

  const categoriaInfo = (id: CategoriaBebida) => CATEGORIAS_BEBIDA.find((c) => c.id === id)!;
  const colorCategoria: Record<CategoriaBebida, string> = {
    "Agua": "#1187c9",
    "Té e infusiones": "#22c55e",
    "Café": "#9a6a45",
    "Leches": "#64748b",
    "Jugos": "#f97316",
    "Refrescos": "#ef4444",
    "Deporte y electrolitos": "#06b6d4",
    "Tradicionales": "#db2777",
    "Preparadas": "#8b5cf6",
  };

  const bebidasFavoritas = favoritas
    .map((id) => todasBebidas.find((b) => b.id === id))
    .filter(Boolean) as Bebida[];

  const toggleFavorita = (id: string) => {
    setFavoritas((prev) => {
      const nuevo = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      guardarFavoritasBebidas(nuevo);
      return nuevo;
    });
  };

  const elegirBebida = (id: string) => {
    setBebidaSeleccionada(id);
    setAzucarCucharaditas(0);
    if (BEBIDAS_CAFE_CON_LECHE.has(id)) ajustarComposicionATamano(tamanoDefault, id);
    else setTamano(tamanoDefault);
    setPaso("tamano");
  };

  const renderBebida = (b: Bebida) => {
    const cuenta = getBebida(b.id).cuentaParaMeta;
    const favorita = favoritas.includes(b.id);
    return (
      <div
        key={b.id}
        onClick={() => elegirBebida(b.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") elegirBebida(b.id); }}
        style={{
          padding: "11px",
          borderRadius: "18px",
          border: "1.5px solid #E6EEF5",
          background: "white",
          cursor: "pointer",
          textAlign: "left",
          position: "relative",
          minHeight: "116px",
          boxShadow: "0 2px 9px rgba(15,50,75,0.045)",
          outline: "none",
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFavorita(b.id); }}
          title={favorita ? "Quitar de favoritas" : "Agregar a favoritas"}
          style={{
            position: "absolute", top: "8px", right: "8px", width: "27px", height: "27px",
            borderRadius: "50%", border: "none", background: favorita ? "#FFF3C4" : "#F7FAFC",
            color: favorita ? "#F59E0B" : "#CBD5E1", fontSize: "15px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2
          }}
        >{favorita ? "★" : "☆"}</button>

        <div style={{ display: "flex", alignItems: "center", gap: "9px", paddingRight: "25px" }}>
          <IconoBebidaKawaii bebida={b} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "12px", fontWeight: "850", color: "#143350", lineHeight: 1.2 }}>{b.nombre}</div>
            <div style={{ fontSize: "9.5px", color: "#94A3B8", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {b.personalizada ? (b.marca || "Mi bebida") : b.categoria}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "9px", display: "flex", flexWrap: "wrap", gap: "5px" }}>
          <span style={{ background: "#F3F7FA", borderRadius: "10px", padding: "3px 7px", color: "#64748B", fontSize: "9px", fontWeight: "700" }}>
            {b.kcal100 == null ? "kcal variables" : `≈${Math.round(b.kcal100)} kcal/100 ml`}
          </span>
          <span style={{ background: cuenta ? "#ECFDF3" : "#F8FAFC", borderRadius: "10px", padding: "3px 7px", color: cuenta ? "#16A34A" : "#94A3B8", fontSize: "9px", fontWeight: "700" }}>
            {cuenta ? "💧 Suma" : "Solo registro"}
          </span>
        </div>
      </div>
    );
  };

  const abrirCategoria = (cat: CategoriaVista) => {
    setCategoriaActiva(cat);
    setBusqueda("");
    setPaso("bebidas");
  };

  const abrirCustom = (categoria?: CategoriaBebida) => {
    if (categoria) {
      setCustomCategoria(categoria);
      setCustomEmoji(categoriaInfo(categoria)?.emoji || "🥤");
    }
    setPaso("custom");
  };

  const numeroOpcional = (valor: string) => {
    if (!valor.trim()) return null;
    const n = Number(valor.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const guardarCustom = () => {
    const nombre = customNombre.trim();
    const cantidadRef = Number(customCantidadRef.replace(",", "."));
    if (!nombre) { alert("Escribe el nombre de la bebida."); return; }
    if (!Number.isFinite(cantidadRef) || cantidadRef <= 0) { alert("Escribe una cantidad de referencia válida."); return; }

    const mlRef = cantidadAMl(cantidadRef, unidad);
    const factor100 = 100 / mlRef;
    const convertir = (v: string) => {
      const n = numeroOpcional(v);
      return n == null ? null : Math.round(n * factor100 * 1000) / 1000;
    };

    const nueva: Bebida = {
      id: `custom_${Date.now()}`,
      nombre,
      emoji: customEmoji.trim() || "🥤",
      color: colorCategoria[customCategoria],
      categoria: customCategoria,
      cuentaDefault: customCuenta,
      kcal100: convertir(customKcal),
      azucar100: convertir(customAzucar),
      azucarAnadida100: convertir(customAzucarAnadida),
      cafeina100: convertir(customCafeina),
      proteina100: convertir(customProteina),
      sodio100: convertir(customSodio),
      fuente: "Usuario",
      fuenteDetalle: [customFuente, customFuenteDetalle.trim()].filter(Boolean).join(" · "),
      marca: customMarca.trim(),
      personalizada: true,
      variable: false,
    };

    onAgregarBebidaCustom(nueva);
    setBebidaSeleccionada(nueva.id);
    setTamano(cantidadRef);
    setPaso("tamano");
  };

  const bebidasCategoria = categoriaActiva === "Mis bebidas"
    ? bebidasCustom
    : categoriaActiva
      ? todasBebidas.filter((b) => b.categoria === categoriaActiva && !b.personalizada)
      : [];

  const bebidasCategoriaFiltradas = bebidasCategoria.filter((b) => {
    if (!busquedaNorm) return true;
    return normalizarBusqueda(`${b.nombre} ${b.marca || ""} ${b.categoria}`).includes(busquedaNorm);
  });

  const resultadosBusqueda = busquedaNorm
    ? todasBebidas.filter((b) => normalizarBusqueda(`${b.nombre} ${b.marca || ""} ${b.categoria}`).includes(busquedaNorm))
    : [];

  const campoNutri = (label: string, value: string, setter: (v: string) => void, unidadCampo: string, placeholder = "0") => (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: "10.5px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #DDEAF2", borderRadius: "12px", overflow: "hidden", background: "white" }}>
        <input type="number" min="0" step="any" value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", padding: "10px 9px", color: "#143350", fontSize: "13px", boxSizing: "border-box" }} />
        <span style={{ padding: "0 9px", color: "#94A3B8", fontSize: "10px", fontWeight: "700" }}>{unidadCampo}</span>
      </div>
    </label>
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(14,34,48,0.72)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px" }}>
      <div style={{ background: "white", borderRadius: "26px", padding: (paso === "categorias" || paso === "bebidas" || paso === "custom") ? "20px" : "28px", width: "100%", maxWidth: (paso === "categorias" || paso === "bebidas" || paso === "custom") ? "520px" : "420px", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 50px rgba(0,0,0,0.22)" }}>

        {paso === "categorias" && (<>
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "34px", marginBottom: "2px" }}>🥤✨</div>
            <h2 style={{ color: "#143350", fontSize: "21px", margin: 0 }}>¿Qué tomaste?</h2>
            <p style={{ color: "#94A3B8", fontSize: "12px", margin: "5px 0 0" }}>Elige una categoría o busca tu bebida</p>
          </div>

          <div style={{ position: "relative", marginBottom: "13px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔎</span>
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar café, té verde, horchata..."
              style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #DCEAF3", borderRadius: "16px", padding: "12px 14px 12px 40px", outline: "none", color: "#143350", fontSize: "14px", background: "#FBFDFF" }} />
          </div>

          {busquedaNorm ? (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "3px 2px 8px" }}>
                <div style={{ fontSize: "12px", fontWeight: "900", color: "#0D3B66" }}>Resultados</div>
                <div style={{ fontSize: "10px", color: "#94A3B8" }}>{resultadosBusqueda.length} opciones</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "360px", overflowY: "auto", paddingRight: "3px" }}>
                {resultadosBusqueda.length ? resultadosBusqueda.map(renderBebida) : (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "22px 10px", color: "#94A3B8", fontSize: "12px" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔎💧</div>
                    No encontré esa bebida.
                    <button onClick={() => abrirCustom()} style={{ display: "block", margin: "12px auto 0", border: "none", borderRadius: "14px", padding: "9px 14px", background: "#EAF6FD", color: "#1187C9", fontWeight: "800", cursor: "pointer" }}>➕ Agregarla</button>
                  </div>
                )}
              </div>
            </div>
          ) : (<>
            {bebidasFavoritas.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "3px 2px 8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "900", color: "#0D3B66" }}>⭐ Favoritas</div>
                  <div style={{ fontSize: "10px", color: "#94A3B8" }}>Acceso rápido</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "245px", overflowY: "auto", paddingRight: "3px" }}>
                  {bebidasFavoritas.slice(0, 6).map(renderBebida)}
                </div>
              </div>
            )}

            <div style={{ fontSize: "12px", fontWeight: "900", color: "#0D3B66", margin: "4px 2px 8px" }}>Explorar por categoría</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              {CATEGORIAS_BEBIDA.filter((c) => c.id !== "Todas").map((cat) => {
                const count = BEBIDAS_DEFAULT.filter((b) => b.categoria === cat.id).length;
                const color = colorCategoria[cat.id as CategoriaBebida];
                return (
                  <button key={cat.id} type="button" onClick={() => abrirCategoria(cat.id as CategoriaBebida)}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: `1.5px solid ${color}22`, borderRadius: "17px", background: `${color}08`, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}14`, fontSize: "22px", flexShrink: 0 }}>{cat.emoji}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: "900", color: "#143350" }}>{cat.nombre}</div>
                      <div style={{ fontSize: "9.5px", color: "#94A3B8", marginTop: "2px" }}>{count} opciones</div>
                    </div>
                    <span style={{ marginLeft: "auto", color: "#B7C5D0", fontWeight: "900" }}>›</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "13px" }}>
              <button type="button" onClick={() => abrirCategoria("Mis bebidas")}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1.5px solid #DCCCFD", borderRadius: "17px", background: "#FAF7FF", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1EAFE", fontSize: "22px" }}>💜</div>
                <div><div style={{ fontSize: "12px", fontWeight: "900", color: "#143350" }}>Mis bebidas</div><div style={{ fontSize: "9.5px", color: "#94A3B8", marginTop: "2px" }}>{bebidasCustom.length} guardadas</div></div>
                <span style={{ marginLeft: "auto", color: "#B7C5D0", fontWeight: "900" }}>›</span>
              </button>
              <button type="button" onClick={() => abrirCustom()}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1.5px dashed #9DD1EE", borderRadius: "17px", background: "#F5FBFF", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: "#E7F6FE", fontSize: "22px" }}>➕</div>
                <div><div style={{ fontSize: "12px", fontWeight: "900", color: "#1187C9" }}>Agregar bebida</div><div style={{ fontSize: "9.5px", color: "#94A3B8", marginTop: "2px" }}>Con todos sus datos</div></div>
              </button>
            </div>
          </>)}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onCerrar} style={{ width: "100%", padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#94A3B8", fontSize: "14px", cursor: "pointer" }}>Cancelar</button>
          </div>
        </>)}

        {paso === "bebidas" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <button onClick={() => { setPaso("categorias"); setBusqueda(""); }} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#F1F6F9", color: "#678098", fontSize: "19px", cursor: "pointer" }}>←</button>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: "#143350", fontSize: "19px", margin: 0 }}>{categoriaActiva === "Mis bebidas" ? "💜 Mis bebidas" : `${categoriaInfo(categoriaActiva as CategoriaBebida)?.emoji || "🥤"} ${categoriaInfo(categoriaActiva as CategoriaBebida)?.nombre || "Bebidas"}`}</h2>
              <div style={{ color: "#94A3B8", fontSize: "10.5px", marginTop: "2px" }}>Elige la bebida específica</div>
            </div>
            <button onClick={() => abrirCustom(categoriaActiva === "Mis bebidas" ? undefined : categoriaActiva as CategoriaBebida)} style={{ border: "none", borderRadius: "13px", background: "#EAF6FD", color: "#1187C9", padding: "8px 10px", fontSize: "11px", fontWeight: "900", cursor: "pointer" }}>＋ Nueva</button>
          </div>

          <div style={{ position: "relative", marginBottom: "11px" }}>
            <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>🔎</span>
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar en esta categoría..."
              style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #DCEAF3", borderRadius: "15px", padding: "10px 12px 10px 37px", outline: "none", color: "#143350", fontSize: "13px", background: "#FBFDFF" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "480px", overflowY: "auto", paddingRight: "3px", marginBottom: "12px" }}>
            {bebidasCategoriaFiltradas.length ? bebidasCategoriaFiltradas.map(renderBebida) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "30px 10px", color: "#94A3B8", fontSize: "12px" }}>
                <div style={{ fontSize: "30px", marginBottom: "8px" }}>{categoriaActiva === "Mis bebidas" ? "💜🥤" : "🥤✨"}</div>
                {categoriaActiva === "Mis bebidas" ? "Todavía no has guardado bebidas propias." : "No encontré coincidencias."}
                <button onClick={() => abrirCustom(categoriaActiva === "Mis bebidas" ? undefined : categoriaActiva as CategoriaBebida)} style={{ display: "block", margin: "12px auto 0", border: "none", borderRadius: "14px", padding: "9px 14px", background: "#EAF6FD", color: "#1187C9", fontWeight: "800", cursor: "pointer" }}>➕ Agregar bebida</button>
              </div>
            )}
          </div>

          <div style={{ background: "#F8FBFD", borderRadius: "14px", padding: "9px 11px", fontSize: "10px", lineHeight: 1.4, color: "#7890A4" }}>
            <b>Valores aproximados.</b> Pueden cambiar según marca, receta y preparación.
          </div>
        </>)}

        {paso === "custom" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "13px" }}>
            <button onClick={() => setPaso(categoriaActiva ? "bebidas" : "categorias")} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#F1F6F9", color: "#678098", fontSize: "19px", cursor: "pointer" }}>←</button>
            <div>
              <h2 style={{ color: "#143350", fontSize: "19px", margin: 0 }}>➕ Agregar mi bebida</h2>
              <div style={{ color: "#94A3B8", fontSize: "10.5px", marginTop: "2px" }}>Guárdala una vez y reutilízala después</div>
            </div>
          </div>

          <div style={{ background: "#F7FBFE", border: "1px solid #E5F0F6", borderRadius: "18px", padding: "13px", marginBottom: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "76px 1fr", gap: "9px", marginBottom: "9px" }}>
              <label><span style={{ display: "block", fontSize: "10.5px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Icono</span><input value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} maxLength={4} style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #DDEAF2", borderRadius: "12px", padding: "10px", fontSize: "18px", textAlign: "center", outline: "none" }} /></label>
              <label><span style={{ display: "block", fontSize: "10.5px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Nombre *</span><input value={customNombre} onChange={(e) => setCustomNombre(e.target.value)} placeholder="Ej. Latte de avena" style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #DDEAF2", borderRadius: "12px", padding: "10px", color: "#143350", fontSize: "13px", outline: "none" }} /></label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
              <label><span style={{ display: "block", fontSize: "10.5px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Marca</span><input value={customMarca} onChange={(e) => setCustomMarca(e.target.value)} placeholder="Opcional" style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #DDEAF2", borderRadius: "12px", padding: "10px", color: "#143350", fontSize: "13px", outline: "none" }} /></label>
              <label><span style={{ display: "block", fontSize: "10.5px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Categoría</span><select value={customCategoria} onChange={(e) => { const c = e.target.value as CategoriaBebida; setCustomCategoria(c); if (!customEmoji.trim()) setCustomEmoji(categoriaInfo(c)?.emoji || "🥤"); }} style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #DDEAF2", borderRadius: "12px", padding: "10px", color: "#143350", fontSize: "12px", outline: "none", background: "white" }}>{CATEGORIAS_BEBIDA.filter((c) => c.id !== "Todas").map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}</select></label>
            </div>
          </div>

          <div style={{ marginBottom: "9px" }}>
            <div style={{ fontSize: "11px", fontWeight: "900", color: "#0D3B66", marginBottom: "6px" }}>Los datos corresponden a esta cantidad</div>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #BFDFF1", borderRadius: "13px", overflow: "hidden", background: "#F9FDFF" }}>
              <input type="number" min="1" step="any" value={customCantidadRef} onChange={(e) => setCustomCantidadRef(e.target.value)} style={{ flex: 1, border: "none", outline: "none", padding: "11px", color: "#143350", fontSize: "15px", fontWeight: "800", background: "transparent" }} />
              <span style={{ padding: "0 12px", color: "#1187C9", fontSize: "12px", fontWeight: "900" }}>{unidad}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px", marginBottom: "12px" }}>
            {campoNutri("Calorías", customKcal, setCustomKcal, "kcal")}
            {campoNutri("Azúcar total", customAzucar, setCustomAzucar, "g")}
            {campoNutri("Azúcar añadida", customAzucarAnadida, setCustomAzucarAnadida, "g")}
            {campoNutri("Cafeína", customCafeina, setCustomCafeina, "mg")}
            {campoNutri("Proteína", customProteina, setCustomProteina, "g")}
            {campoNutri("Sodio / electrolitos", customSodio, setCustomSodio, "mg")}
          </div>

          <div style={{ background: "#F8FBFD", borderRadius: "16px", padding: "12px", marginBottom: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px", marginBottom: "9px" }}>
              <label><span style={{ display: "block", fontSize: "10.5px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Fuente del dato</span><select value={customFuente} onChange={(e) => setCustomFuente(e.target.value)} style={{ width: "100%", border: "1.5px solid #DDEAF2", borderRadius: "12px", padding: "9px", color: "#143350", background: "white", fontSize: "12px", outline: "none" }}><option>Etiqueta</option><option>USDA</option><option>Receta propia</option><option>Otro</option></select></label>
              <label><span style={{ display: "block", fontSize: "10.5px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Referencia</span><input value={customFuenteDetalle} onChange={(e) => setCustomFuenteDetalle(e.target.value)} placeholder="Ej. etiqueta / FDC ID" style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #DDEAF2", borderRadius: "12px", padding: "9px", color: "#143350", fontSize: "12px", outline: "none" }} /></label>
            </div>
            <div onClick={() => setCustomCuenta(!customCuenta)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 2px" }}>
              <div style={{ width: "42px", height: "24px", borderRadius: "99px", background: customCuenta ? "#22C55E" : "#DCE5EB", padding: "3px", boxSizing: "border-box", display: "flex", justifyContent: customCuenta ? "flex-end" : "flex-start", transition: "all .15s" }}><div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,.18)" }} /></div>
              <div><div style={{ fontSize: "12px", fontWeight: "900", color: "#143350" }}>💧 Sumar el líquido a mi meta</div><div style={{ fontSize: "9.5px", color: "#94A3B8", marginTop: "2px" }}>Puedes cambiar esta decisión creando otra versión de la bebida.</div></div>
            </div>
          </div>

          <div style={{ background: "#FFFDF4", border: "1px solid #F6EAC1", borderRadius: "14px", padding: "9px 11px", marginBottom: "12px", fontSize: "9.7px", lineHeight: 1.4, color: "#8A7440" }}>
            Water Reminder convertirá estos datos a una base de 100 ml para calcular automáticamente otras porciones.
          </div>

          <button onClick={guardarCustom} disabled={!customNombre.trim()} style={{ width: "100%", padding: "13px", borderRadius: "15px", border: "none", background: customNombre.trim() ? "#1187C9" : "#D5E2EA", color: customNombre.trim() ? "white" : "#94A3B8", fontSize: "14px", fontWeight: "900", cursor: customNombre.trim() ? "pointer" : "not-allowed" }}>Guardar en Mis bebidas ✨</button>
        </>)}

        {paso === "tamano" && (<>
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            {bebida && <div style={{ display: "flex", justifyContent: "center" }}><IconoBebidaKawaii bebida={bebida} size={58} /></div>}
            <h2 style={{ color: "#143350", fontSize: "20px", margin: "10px 0 4px" }}>{bebida?.nombre}</h2>
            {bebida?.marca && <div style={{ color: "#94A3B8", fontSize: "11px", marginBottom: "3px" }}>{bebida.marca}</div>}
            <p style={{ color: "#678098", fontSize: "14px", margin: 0 }}>¿Cuánto tomaste?</p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "16px" }}>
            {tamanos.map((t) => (<button key={t} onClick={() => ajustarComposicionATamano(t)} style={{ padding: "10px 16px", borderRadius: "14px", border: `2px solid ${tamano === t ? (bebida?.color || "#1187c9") : "#e0eaf2"}`, background: tamano === t ? `${bebida?.color || "#1187c9"}15` : "white", color: tamano === t ? (bebida?.color || "#1187c9") : "#94a3b8", fontWeight: tamano === t ? "bold" : "normal", fontSize: "14px", cursor: "pointer" }}>{t} {unidad}</button>))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "14px" }}>
            <button onClick={() => ajustarComposicionATamano(Math.max(unidad === "ml" ? 50 : 2, tamano - (unidad === "ml" ? 50 : 2)))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>−</button>
            <span style={{ fontSize: "22px", fontWeight: "bold", color: bebida?.color || "#1187c9", minWidth: "90px", textAlign: "center" }}>{tamano} {unidad}</span>
            <button onClick={() => ajustarComposicionATamano(tamano + (unidad === "ml" ? 50 : 2))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "#d5e8f5", color: "#1187c9", fontSize: "20px", cursor: "pointer" }}>+</button>
          </div>

          {bebida && usaComposicionCafeLeche && (
            <div style={{ background: "#FFF9F5", border: `1.5px solid ${bebida.color}30`, borderRadius: "18px", padding: "13px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "900", color: "#143350" }}>☕ Composición</div>
                  <div style={{ fontSize: "9.5px", color: "#94A3B8", marginTop: "2px" }}>Elige de la lista cómo estaba preparado.</div>
                </div>
                <span style={{ fontSize: "9px", fontWeight: "800", color: bebida.color, background: "white", borderRadius: "999px", padding: "4px 7px" }}>Total {tamano} {unidad}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
                <label>
                  <span style={{ display: "block", fontSize: "10px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Tipo de café</span>
                  <select value={cafeTipoId} onChange={(e) => setCafeTipoId(e.target.value)} style={{ width: "100%", border: "1.5px solid #E3EAF0", borderRadius: "12px", padding: "9px", color: "#143350", background: "white", fontSize: "11px", outline: "none" }}>
                    {TIPOS_CAFE_COMPOSICION.map((id) => { const op = BEBIDAS_DEFAULT.find((b) => b.id === id)!; return <option key={id} value={id}>{op.nombre}</option>; })}
                  </select>
                </label>
                <label>
                  <span style={{ display: "block", fontSize: "10px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Cantidad de café</span>
                  <select value={cafeCantidad} onChange={(e) => cambiarCafeCantidad(Number(e.target.value))} style={{ width: "100%", border: "1.5px solid #E3EAF0", borderRadius: "12px", padding: "9px", color: "#143350", background: "white", fontSize: "11px", outline: "none" }}>
                    {opcionesComponente.map((v) => <option key={`cafe-${v}`} value={v}>{v} {unidad}</option>)}
                  </select>
                </label>
                <label>
                  <span style={{ display: "block", fontSize: "10px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Tipo de leche</span>
                  <select value={lecheTipoId} onChange={(e) => setLecheTipoId(e.target.value)} style={{ width: "100%", border: "1.5px solid #E3EAF0", borderRadius: "12px", padding: "9px", color: "#143350", background: "white", fontSize: "11px", outline: "none" }}>
                    {TIPOS_LECHE_COMPOSICION.map((id) => { const op = BEBIDAS_DEFAULT.find((b) => b.id === id)!; return <option key={id} value={id}>{op.nombre}</option>; })}
                  </select>
                </label>
                <label>
                  <span style={{ display: "block", fontSize: "10px", color: "#678098", fontWeight: "800", marginBottom: "5px" }}>Cantidad de leche</span>
                  <select value={lecheCantidad} onChange={(e) => cambiarLecheCantidad(Number(e.target.value))} style={{ width: "100%", border: "1.5px solid #E3EAF0", borderRadius: "12px", padding: "9px", color: "#143350", background: "white", fontSize: "11px", outline: "none" }}>
                    {opcionesComponente.map((v) => <option key={`leche-${v}`} value={v}>{v} {unidad}</option>)}
                  </select>
                </label>
              </div>

              <div style={{ marginTop: "9px", fontSize: "9.5px", color: "#7890A4", lineHeight: 1.35 }}>
                Si cambias una cantidad, la otra se ajusta automáticamente para conservar los {tamano} {unidad}.
              </div>
            </div>
          )}

          {bebida && permiteAzucarAgregada && (
            <div style={{ background: "#FFF8FB", border: "1.5px solid #F8D8E6", borderRadius: "18px", padding: "13px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "900", color: "#143350" }}>🍬 ¿Le agregaste azúcar?</div>
                  <div style={{ fontSize: "9.5px", color: "#94A3B8", marginTop: "2px" }}>Elige la cantidad usada en esta porción.</div>
                </div>
                {azucarAgregada && <span style={{ fontSize: "9px", fontWeight: "900", color: "#BE185D", background: "white", borderRadius: "999px", padding: "4px 7px", whiteSpace: "nowrap" }}>+{Math.round(azucarAgregada.kcal)} kcal</span>}
              </div>
              <select value={azucarCucharaditas} onChange={(e) => setAzucarCucharaditas(Number(e.target.value))}
                style={{ width: "100%", border: "1.5px solid #F0D6E2", borderRadius: "12px", padding: "10px", color: "#143350", background: "white", fontSize: "12px", outline: "none" }}>
                <option value={0}>Sin azúcar añadida</option>
                <option value={0.5}>½ cucharadita · ≈2.1 g · +8 kcal</option>
                <option value={1}>1 cucharadita · ≈4.2 g · +17 kcal</option>
                <option value={2}>2 cucharaditas · ≈8.4 g · +34 kcal</option>
                <option value={3}>3 cucharaditas · ≈12.6 g · +50 kcal</option>
                <option value={4}>4 cucharaditas · ≈16.8 g · +67 kcal</option>
                <option value={5}>5 cucharaditas · ≈21.0 g · +84 kcal</option>
              </select>
              {azucarAgregada && (
                <div style={{ marginTop: "8px", fontSize: "10px", color: "#9F6079", lineHeight: 1.35 }}>
                  Aproximado añadido a tus datos: {azucarAgregada.gramos.toFixed(1)} g de azúcar · {Math.round(azucarAgregada.kcal)} kcal.
                </div>
              )}
              <div style={{ marginTop: "6px", fontSize: "9px", color: "#B18A9A", lineHeight: 1.35 }}>
                Referencia de cálculo: 1 cucharadita ≈ 4.2 g de azúcar. Es una estimación y puede variar según cómo se prepare.
              </div>
            </div>
          )}

          {bebida && (
            <div style={{ background: "#F8FBFD", borderRadius: "18px", padding: "13px", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", textAlign: "center" }}>
                <div><div style={{ fontSize: "16px", fontWeight: "900", color: "#0D3B66" }}>{nutricion?.kcal == null ? "—" : Math.round(nutricion.kcal)}</div><div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: "700" }}>kcal</div></div>
                <div><div style={{ fontSize: "16px", fontWeight: "900", color: "#0D3B66" }}>{nutricion?.azucar == null ? "—" : nutricion.azucar.toFixed(1)}</div><div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: "700" }}>g azúcar</div></div>
                <div><div style={{ fontSize: "16px", fontWeight: "900", color: "#0D3B66" }}>{nutricion?.cafeina == null ? "—" : Math.round(nutricion.cafeina)}</div><div style={{ fontSize: "9px", color: "#94A3B8", fontWeight: "700" }}>mg cafeína</div></div>
              </div>

              {(nutricion?.azucarAnadida != null || nutricion?.proteina != null || nutricion?.sodio != null) && (
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px", marginTop: "9px" }}>
                  {nutricion?.azucarAnadida != null && <span style={{ fontSize: "9px", color: "#64748B", background: "white", borderRadius: "10px", padding: "4px 7px" }}>{nutricion.azucarAnadida.toFixed(1)} g azúcar añadida</span>}
                  {nutricion?.proteina != null && <span style={{ fontSize: "9px", color: "#64748B", background: "white", borderRadius: "10px", padding: "4px 7px" }}>{nutricion.proteina.toFixed(1)} g proteína</span>}
                  {nutricion?.sodio != null && <span style={{ fontSize: "9px", color: "#64748B", background: "white", borderRadius: "10px", padding: "4px 7px" }}>{Math.round(nutricion.sodio)} mg sodio</span>}
                </div>
              )}

              <div style={{ borderTop: "1px solid #E7EEF4", marginTop: "10px", paddingTop: "9px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontSize: "10px", color: "#7890A4" }}>{composicionCafeLeche ? "Calculado con tu composición de café + leche" : bebida.personalizada ? (bebida.fuenteDetalle || "Dato ingresado por ti") : (bebida.variable ? "Puede variar por marca o receta" : `Referencia genérica · ${bebida.fuente}`)}</span>
                <span style={{ fontSize: "10px", fontWeight: "800", color: bebida.cuentaParaMeta ? "#16A34A" : "#94A3B8", whiteSpace: "nowrap" }}>{bebida.cuentaParaMeta ? "💧 Suma a tu meta" : "Solo registro"}</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { setPaso(categoriaActiva ? "bebidas" : "categorias"); setBebidaSeleccionada(null); }} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#a0b0c0", fontSize: "15px", cursor: "pointer" }}>← Atrás</button>
            <button onClick={() => verificacionFoto ? setPaso("fotos") : onConfirmar(bebidaSeleccionada!, tamano, composicionCafeLeche, azucarAgregada)} style={{ flex: 2, padding: "12px", borderRadius: "14px", border: "none", background: bebida?.color || "#1187c9", color: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }}>{verificacionFoto ? "Siguiente →" : `Registrar ${bebida?.emoji}`}</button>
          </div>
        </>)}

        {paso === "fotos" && (<>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            {bebida && <div style={{ display: "flex", justifyContent: "center" }}><IconoBebidaKawaii bebida={bebida} size={58} /></div>}
            <h2 style={{ color: "#143350", fontSize: "20px", margin: "10px 0 4px" }}>Confirma tu {bebida?.nombre}</h2>
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
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setPaso("tamano")} style={{ flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #d0dde8", background: "transparent", color: "#a0b0c0", fontSize: "15px", cursor: "pointer" }}>← Atrás</button>
            <button disabled={!listoFotos} onClick={() => listoFotos && onConfirmar(bebidaSeleccionada!, tamano, composicionCafeLeche, azucarAgregada)} style={{ flex: 2, padding: "12px", borderRadius: "14px", border: "none", background: listoFotos ? (bebida?.color || "#1187c9") : "#d0dde8", color: listoFotos ? "white" : "#a0b0c0", fontSize: "15px", fontWeight: "bold", cursor: listoFotos ? "pointer" : "not-allowed" }}>Confirmar ✓</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
