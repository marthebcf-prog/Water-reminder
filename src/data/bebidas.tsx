

export type CategoriaBebida =
  | "Agua"
  | "Té e infusiones"
  | "Café"
  | "Leches"
  | "Jugos"
  | "Refrescos"
  | "Deporte y electrolitos"
  | "Tradicionales"
  | "Preparadas";

export type Bebida = {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  categoria: CategoriaBebida;
  cuentaDefault: boolean;
  kcal100: number | null;
  azucar100: number | null;
  cafeina100: number | null;
  fuente: "USDA" | "Etiqueta/receta" | "Usuario";
  variable?: boolean;
  personalizada?: boolean;
  marca?: string;
  azucarAnadida100?: number | null;
  proteina100?: number | null;
  sodio100?: number | null;
  fuenteDetalle?: string;
};

export const BEBIDAS_DEFAULT: Bebida[] = [
  // ── Agua ───────────────────────────────────────────────────────
  { id: "agua", nombre: "Agua", emoji: "💧", color: "#1187c9", categoria: "Agua", cuentaDefault: true, kcal100: 0, azucar100: 0, cafeina100: 0, fuente: "USDA" },
  { id: "agua_mineral", nombre: "Agua mineral", emoji: "🫧", color: "#0ea5e9", categoria: "Agua", cuentaDefault: true, kcal100: 0, azucar100: 0, cafeina100: 0, fuente: "USDA" },
  { id: "agua_gas", nombre: "Agua con gas", emoji: "🫧", color: "#38bdf8", categoria: "Agua", cuentaDefault: true, kcal100: 0, azucar100: 0, cafeina100: 0, fuente: "USDA" },
  { id: "agua_sabor_sin", nombre: "Agua saborizada sin azúcar", emoji: "🍋", color: "#22c55e", categoria: "Agua", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "agua_limon", nombre: "Agua con limón sin azúcar", emoji: "🍋", color: "#84cc16", categoria: "Agua", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "agua_coco", nombre: "Agua de coco", emoji: "🥥", color: "#15803d", categoria: "Agua", cuentaDefault: true, kcal100: 18, azucar100: 4, cafeina100: 0, fuente: "USDA" },

  // ── Té e infusiones ────────────────────────────────────────────
  { id: "te", nombre: "Té", emoji: "🍵", color: "#2e7d32", categoria: "Té e infusiones", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 15, fuente: "USDA", variable: true },
  { id: "te_negro", nombre: "Té negro sin azúcar", emoji: "🍵", color: "#3f6212", categoria: "Té e infusiones", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 20, fuente: "USDA" },
  { id: "te_verde", nombre: "Té verde sin azúcar", emoji: "🍵", color: "#16a34a", categoria: "Té e infusiones", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 12, fuente: "USDA" },
  { id: "manzanilla", nombre: "Manzanilla", emoji: "🌼", color: "#d97706", categoria: "Té e infusiones", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 0, fuente: "USDA" },
  { id: "te_herbal", nombre: "Infusión herbal", emoji: "🌿", color: "#22c55e", categoria: "Té e infusiones", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 0, fuente: "USDA", variable: true },
  { id: "jamaica_sin", nombre: "Jamaica sin azúcar", emoji: "🌺", color: "#db2777", categoria: "Té e infusiones", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "te_helado_sin", nombre: "Té helado sin azúcar", emoji: "🧊", color: "#0f766e", categoria: "Té e infusiones", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 15, fuente: "USDA", variable: true },
  { id: "te_endulzado", nombre: "Té endulzado", emoji: "🧋", color: "#ca8a04", categoria: "Té e infusiones", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "matcha_agua", nombre: "Matcha con agua", emoji: "🍵", color: "#65a30d", categoria: "Té e infusiones", cuentaDefault: true, kcal100: null, azucar100: 0, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "matcha_latte", nombre: "Matcha latte", emoji: "🍵", color: "#4d7c0f", categoria: "Té e infusiones", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },

  // ── Café ───────────────────────────────────────────────────────
  { id: "cafe", nombre: "Café", emoji: "☕", color: "#7c4a1e", categoria: "Café", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 40, fuente: "USDA", variable: true },
  { id: "cafe_filtrado", nombre: "Café filtrado solo", emoji: "☕", color: "#78350f", categoria: "Café", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 40, fuente: "USDA" },
  { id: "descafeinado", nombre: "Café descafeinado", emoji: "☕", color: "#a16207", categoria: "Café", cuentaDefault: true, kcal100: 0, azucar100: 0, cafeina100: 1, fuente: "USDA" },
  { id: "espresso", nombre: "Espresso", emoji: "☕", color: "#713f12", categoria: "Café", cuentaDefault: true, kcal100: 9, azucar100: 0, cafeina100: 212, fuente: "USDA" },
  { id: "americano", nombre: "Americano", emoji: "☕", color: "#92400e", categoria: "Café", cuentaDefault: true, kcal100: 2, azucar100: 0, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "cafe_con_leche", nombre: "Café con leche", emoji: "☕", color: "#a16207", categoria: "Café", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "cold_brew", nombre: "Cold brew sin azúcar", emoji: "🧊", color: "#854d0e", categoria: "Café", cuentaDefault: true, kcal100: 2, azucar100: 0, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "latte", nombre: "Latte sin azúcar", emoji: "☕", color: "#b45309", categoria: "Café", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "cappuccino", nombre: "Cappuccino sin azúcar", emoji: "☕", color: "#c2410c", categoria: "Café", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "mocha", nombre: "Mocha", emoji: "🍫", color: "#9a3412", categoria: "Café", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "cafe_frio_dulce", nombre: "Café frío endulzado", emoji: "🧋", color: "#a21caf", categoria: "Café", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },

  // ── Leches ─────────────────────────────────────────────────────
  { id: "leche", nombre: "Leche", emoji: "🥛", color: "#64748b", categoria: "Leches", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "leche_entera", nombre: "Leche entera", emoji: "🥛", color: "#475569", categoria: "Leches", cuentaDefault: true, kcal100: 61, azucar100: 5, cafeina100: 0, fuente: "USDA" },
  { id: "leche_2", nombre: "Leche 2%", emoji: "🥛", color: "#64748b", categoria: "Leches", cuentaDefault: true, kcal100: 50, azucar100: 5.1, cafeina100: 0, fuente: "USDA" },
  { id: "leche_1", nombre: "Leche 1%", emoji: "🥛", color: "#94a3b8", categoria: "Leches", cuentaDefault: true, kcal100: 42, azucar100: 5, cafeina100: 0, fuente: "USDA" },
  { id: "leche_descremada", nombre: "Leche descremada", emoji: "🥛", color: "#0ea5e9", categoria: "Leches", cuentaDefault: true, kcal100: 34, azucar100: 5.1, cafeina100: 0, fuente: "USDA" },
  { id: "leche_chocolate", nombre: "Leche con chocolate", emoji: "🍫", color: "#92400e", categoria: "Leches", cuentaDefault: true, kcal100: 83, azucar100: 10, cafeina100: null, fuente: "USDA", variable: true },
  { id: "almendra_sin", nombre: "Almendra sin azúcar", emoji: "🌰", color: "#a16207", categoria: "Leches", cuentaDefault: true, kcal100: 17, azucar100: 0, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "soya_sin", nombre: "Soya sin azúcar", emoji: "🌱", color: "#15803d", categoria: "Leches", cuentaDefault: true, kcal100: 39, azucar100: 0.6, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "avena", nombre: "Bebida de avena", emoji: "🌾", color: "#ca8a04", categoria: "Leches", cuentaDefault: true, kcal100: 45, azucar100: 2, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "arroz", nombre: "Bebida de arroz", emoji: "🍚", color: "#78716c", categoria: "Leches", cuentaDefault: true, kcal100: 47, azucar100: 5.3, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "kefir", nombre: "Kéfir natural", emoji: "🥛", color: "#0891b2", categoria: "Leches", cuentaDefault: true, kcal100: 43, azucar100: 4.6, cafeina100: 0, fuente: "USDA", variable: true },

  // ── Jugos ──────────────────────────────────────────────────────
  { id: "jugo", nombre: "Jugo", emoji: "🧃", color: "#f57c00", categoria: "Jugos", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "naranja", nombre: "Jugo de naranja 100%", emoji: "🍊", color: "#f97316", categoria: "Jugos", cuentaDefault: true, kcal100: 45, azucar100: 8.4, cafeina100: 0, fuente: "USDA" },
  { id: "manzana", nombre: "Jugo de manzana 100%", emoji: "🍎", color: "#ef4444", categoria: "Jugos", cuentaDefault: true, kcal100: 46, azucar100: 9.6, cafeina100: 0, fuente: "USDA" },
  { id: "uva", nombre: "Jugo de uva 100%", emoji: "🍇", color: "#7c3aed", categoria: "Jugos", cuentaDefault: true, kcal100: 60, azucar100: 14.2, cafeina100: 0, fuente: "USDA" },
  { id: "pina", nombre: "Jugo de piña 100%", emoji: "🍍", color: "#eab308", categoria: "Jugos", cuentaDefault: true, kcal100: 53, azucar100: 11, cafeina100: 0, fuente: "USDA" },
  { id: "tomate", nombre: "Jugo de tomate", emoji: "🍅", color: "#dc2626", categoria: "Jugos", cuentaDefault: true, kcal100: 17, azucar100: null, cafeina100: 0, fuente: "USDA", variable: true },
  { id: "zanahoria", nombre: "Jugo de zanahoria", emoji: "🥕", color: "#ea580c", categoria: "Jugos", cuentaDefault: true, kcal100: 40, azucar100: 3.9, cafeina100: 0, fuente: "USDA" },
  { id: "jugo_verde", nombre: "Jugo verde", emoji: "🥬", color: "#16a34a", categoria: "Jugos", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "limonada", nombre: "Limonada con azúcar", emoji: "🍋", color: "#84cc16", categoria: "Jugos", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },

  // ── Refrescos ──────────────────────────────────────────────────
  { id: "refresco", nombre: "Refresco", emoji: "🥤", color: "#dc2626", categoria: "Refrescos", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "cola", nombre: "Cola regular", emoji: "🥤", color: "#b91c1c", categoria: "Refrescos", cuentaDefault: true, kcal100: 42, azucar100: 10.4, cafeina100: 9, fuente: "USDA" },
  { id: "refresco_regular", nombre: "Refresco regular", emoji: "🥤", color: "#ef4444", categoria: "Refrescos", cuentaDefault: true, kcal100: 42, azucar100: 10.5, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "refresco_sin", nombre: "Refresco sin azúcar", emoji: "🥤", color: "#64748b", categoria: "Refrescos", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: null, fuente: "Etiqueta/receta", variable: true },

  // ── Deporte y electrolitos ─────────────────────────────────────
  { id: "deportiva", nombre: "Bebida deportiva", emoji: "🏃", color: "#2563eb", categoria: "Deporte y electrolitos", cuentaDefault: true, kcal100: 26, azucar100: 5.2, cafeina100: 0, fuente: "USDA", variable: true },
  { id: "deportiva_light", nombre: "Deportiva baja en calorías", emoji: "🏃", color: "#0284c7", categoria: "Deporte y electrolitos", cuentaDefault: true, kcal100: 8, azucar100: 2, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "electrolitos_sin", nombre: "Electrolitos sin azúcar", emoji: "⚡", color: "#06b6d4", categoria: "Deporte y electrolitos", cuentaDefault: true, kcal100: 1, azucar100: 0, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "energetica", nombre: "Bebida energética", emoji: "⚡", color: "#7c3aed", categoria: "Deporte y electrolitos", cuentaDefault: true, kcal100: 45, azucar100: 11, cafeina100: 30, fuente: "Etiqueta/receta", variable: true },
  { id: "energetica_sin", nombre: "Energética sin azúcar", emoji: "⚡", color: "#6d28d9", categoria: "Deporte y electrolitos", cuentaDefault: true, kcal100: 2, azucar100: 0, cafeina100: null, fuente: "Etiqueta/receta", variable: true },

  // ── Tradicionales ──────────────────────────────────────────────
  { id: "horchata", nombre: "Horchata", emoji: "🥛", color: "#a16207", categoria: "Tradicionales", cuentaDefault: true, kcal100: 54, azucar100: 9.4, cafeina100: 0, fuente: "USDA", variable: true },
  { id: "jamaica_dulce", nombre: "Agua de jamaica endulzada", emoji: "🌺", color: "#be185d", categoria: "Tradicionales", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "tamarindo", nombre: "Agua de tamarindo", emoji: "🫘", color: "#92400e", categoria: "Tradicionales", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "agua_limon_dulce", nombre: "Agua de limón", emoji: "🍋", color: "#65a30d", categoria: "Tradicionales", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "atole", nombre: "Atole", emoji: "🥣", color: "#b45309", categoria: "Tradicionales", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "atole_chocolate", nombre: "Atole de chocolate", emoji: "🍫", color: "#78350f", categoria: "Tradicionales", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },

  // ── Preparadas ─────────────────────────────────────────────────
  { id: "smoothie", nombre: "Smoothie", emoji: "🍓", color: "#a21caf", categoria: "Preparadas", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "licuado", nombre: "Licuado", emoji: "🍌", color: "#d97706", categoria: "Preparadas", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: 0, fuente: "Etiqueta/receta", variable: true },
  { id: "proteina", nombre: "Proteína", emoji: "💪", color: "#d97706", categoria: "Preparadas", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "proteina_agua", nombre: "Proteína con agua", emoji: "💪", color: "#f59e0b", categoria: "Preparadas", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "proteina_leche", nombre: "Proteína con leche", emoji: "🥛", color: "#fb923c", categoria: "Preparadas", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "kombucha", nombre: "Kombucha", emoji: "🫧", color: "#0f766e", categoria: "Preparadas", cuentaDefault: true, kcal100: 16, azucar100: 4, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "milkshake", nombre: "Milkshake", emoji: "🍨", color: "#db2777", categoria: "Preparadas", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
  { id: "otro", nombre: "Otra bebida", emoji: "🫙", color: "#6a1b9a", categoria: "Preparadas", cuentaDefault: true, kcal100: null, azucar100: null, cafeina100: null, fuente: "Etiqueta/receta", variable: true },
];

export const CATEGORIAS_BEBIDA: Array<{ id: "Todas" | CategoriaBebida; emoji: string; nombre: string }> = [
  { id: "Todas", emoji: "✨", nombre: "Todas" },
  { id: "Agua", emoji: "💧", nombre: "Agua" },
  { id: "Té e infusiones", emoji: "🍵", nombre: "Té" },
  { id: "Café", emoji: "☕", nombre: "Café" },
  { id: "Leches", emoji: "🥛", nombre: "Leches" },
  { id: "Jugos", emoji: "🍊", nombre: "Jugos" },
  { id: "Refrescos", emoji: "🥤", nombre: "Refrescos" },
  { id: "Deporte y electrolitos", emoji: "⚡", nombre: "Deporte" },
  { id: "Tradicionales", emoji: "🌺", nombre: "Tradicionales" },
  { id: "Preparadas", emoji: "🍓", nombre: "Preparadas" },
];

export function normalizarBusqueda(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function cantidadAMl(cantidad: number, unidad: string) {
  return unidad === "oz" ? cantidad * 29.5735 : cantidad;
}

export function calcularNutricionBebida(bebida: Bebida, cantidad: number, unidad: string) {
  const ml = cantidadAMl(cantidad, unidad);
  const factor = ml / 100;
  return {
    kcal: bebida.kcal100 == null ? null : bebida.kcal100 * factor,
    azucar: bebida.azucar100 == null ? null : bebida.azucar100 * factor,
    azucarAnadida: bebida.azucarAnadida100 == null ? null : bebida.azucarAnadida100 * factor,
    cafeina: bebida.cafeina100 == null ? null : bebida.cafeina100 * factor,
    proteina: bebida.proteina100 == null ? null : bebida.proteina100 * factor,
    sodio: bebida.sodio100 == null ? null : bebida.sodio100 * factor,
  };
}

export type ComposicionCafeLeche = {
  cafeCantidad: number;
  lecheCantidad: number;
  cafeTipoId: string;
  lecheTipoId: string;
};

export type NutricionCalculada = ReturnType<typeof calcularNutricionBebida>;

export type AzucarAgregada = {
  cucharaditas: number;
  gramos: number;
  kcal: number;
};

export function crearAzucarAgregada(cucharaditas: number): AzucarAgregada | undefined {
  if (!cucharaditas || cucharaditas <= 0) return undefined;
  const gramos = cucharaditas * 4.2;
  return { cucharaditas, gramos, kcal: gramos * 4 };
}

export function sumarAzucarAgregadaNutricion(nutricion: NutricionCalculada, azucar?: AzucarAgregada): NutricionCalculada {
  if (!azucar) return nutricion;
  return {
    ...nutricion,
    kcal: nutricion.kcal == null ? null : nutricion.kcal + azucar.kcal,
    azucar: (nutricion.azucar ?? 0) + azucar.gramos,
    azucarAnadida: (nutricion.azucarAnadida ?? 0) + azucar.gramos,
  };
}

export const BEBIDAS_CAFE_CON_LECHE = new Set(["cafe_con_leche", "latte", "cappuccino"]);
export const TIPOS_CAFE_COMPOSICION = ["espresso", "cafe_filtrado", "descafeinado", "cold_brew"] as const;
export const TIPOS_LECHE_COMPOSICION = ["leche_entera", "leche_2", "leche_1", "leche_descremada", "almendra_sin", "soya_sin", "avena", "arroz"] as const;
export const CATEGORIAS_CON_AZUCAR_OPCIONAL = new Set<CategoriaBebida>(["Té e infusiones", "Café", "Jugos", "Tradicionales", "Preparadas"]);

export function sumarNutricion(a: NutricionCalculada, b: NutricionCalculada): NutricionCalculada {
  const sumar = (x: number | null, y: number | null) => x == null && y == null ? null : (x || 0) + (y || 0);
  return {
    kcal: sumar(a.kcal, b.kcal),
    azucar: sumar(a.azucar, b.azucar),
    azucarAnadida: sumar(a.azucarAnadida, b.azucarAnadida),
    cafeina: sumar(a.cafeina, b.cafeina),
    proteina: sumar(a.proteina, b.proteina),
    sodio: sumar(a.sodio, b.sodio),
  };
}

export function calcularNutricionCafeLeche(composicion: ComposicionCafeLeche, unidad: string): NutricionCalculada {
  const cafe = BEBIDAS_DEFAULT.find((b) => b.id === composicion.cafeTipoId);
  const leche = BEBIDAS_DEFAULT.find((b) => b.id === composicion.lecheTipoId);
  const vacio: NutricionCalculada = { kcal: null, azucar: null, azucarAnadida: null, cafeina: null, proteina: null, sodio: null };
  if (!cafe || !leche) return vacio;
  return sumarNutricion(
    calcularNutricionBebida(cafe, composicion.cafeCantidad, unidad),
    calcularNutricionBebida(leche, composicion.lecheCantidad, unidad),
  );
}

export function cargarBebidasCustom(): Bebida[] {
  try {
    const s = localStorage.getItem("water-bebidas-custom-v1");
    return s ? JSON.parse(s) as Bebida[] : [];
  } catch {
    return [];
  }
}

export function guardarBebidasCustom(bebidas: Bebida[]) {
  try { localStorage.setItem("water-bebidas-custom-v1", JSON.stringify(bebidas)); } catch {}
}

export function cargarFavoritasBebidas() {
  try {
    const s = localStorage.getItem("water-bebidas-favoritas-v1");
    return s ? JSON.parse(s) as string[] : ["agua", "agua_mineral", "cafe", "te"];
  } catch {
    return ["agua", "agua_mineral", "cafe", "te"];
  }
}

export function guardarFavoritasBebidas(ids: string[]) {
  try { localStorage.setItem("water-bebidas-favoritas-v1", JSON.stringify(ids)); } catch {}
}

export function IconoBebidaKawaii({ bebida, size = 42 }: { bebida: Bebida; size?: number }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "16px",
      background: `${bebida.color}14`,
      border: `1.5px solid ${bebida.color}2f`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: `${Math.round(size * 0.58)}px`, lineHeight: 1 }}>{bebida.emoji}</span>
      <span style={{ position: "absolute", top: "-4px", right: "-3px", fontSize: `${Math.max(9, Math.round(size * 0.24))}px`, color: bebida.color }}>✦</span>
    </div>
  );
}
