// Utilidades compartidas por las funciones del servidor (Vercel).
// Los archivos que empiezan con "_" no se publican como rutas.
const admin = require("firebase-admin");
const webpush = require("web-push");

// Clave pública VAPID (también está en src/lib/push.ts). La privada vive en Vercel.
const VAPID_PUBLIC_KEY =
  "BHy677_y0wG9yu_FV0RalFTDmq-oWCuqV_-J1JQxYcmyvGsH3Qp0VT_ClLRrMPxO3_v2ZUET5wKNOUkXa1aJTmo";

// Lee la clave de Firebase aunque se haya pegado con comillas extra o saltos de línea raros.
function leerCuentaServicio(raw) {
  let txt = raw.trim();
  if ((txt.startsWith("'") && txt.endsWith("'")) || (txt.startsWith('"') && txt.endsWith('"') && !txt.startsWith('"{'))) {
    txt = txt.slice(1, -1).trim();
  }
  const intentos = [
    txt,
    // saltos de línea reales dentro de textos (p. ej. la llave privada)
    txt.replace(/"(?:[^"\\]|\\.)*"/gs, (m) => m.replace(/\r?\n/g, "\\n")),
  ];
  for (const t of intentos) {
    try {
      const c = JSON.parse(t);
      const obj = typeof c === "string" ? JSON.parse(c) : c;
      if (obj && obj.private_key && obj.client_email) {
        obj.private_key = obj.private_key.replace(/\\n/g, "\n");
        return obj;
      }
    } catch (e) {}
  }
  throw new Error(
    `FIREBASE_SERVICE_ACCOUNT no es válido: mide ${txt.length} caracteres, ` +
    `empieza con "${txt.slice(0, 1)}" y termina con "${txt.slice(-1)}". ` +
    "Debe empezar con { y terminar con } y medir unos 2,300 caracteres."
  );
}

function getAdmin() {
  if (!admin.apps.length) {
    const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
    if (!raw) throw new Error("Falta la variable FIREBASE_SERVICE_ACCOUNT en Vercel");
    const cuenta = leerCuentaServicio(raw);
    admin.initializeApp({ credential: admin.credential.cert(cuenta), projectId: cuenta.project_id });
  }
  return admin;
}

function getWebPush() {
  const privada = (process.env.VAPID_PRIVATE_KEY || "").trim();
  if (!privada) throw new Error("Falta la variable VAPID_PRIVATE_KEY en Vercel");
  webpush.setVapidDetails("https://water-reminder-psi.vercel.app", VAPID_PUBLIC_KEY, privada);
  return webpush;
}

// Verifica el token de Firebase que manda la app y devuelve el uid.
async function usuarioDesdeRequest(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const adm = getAdmin(); // si falla la configuración, que se vea el error real
  try {
    const decoded = await adm.auth().verifyIdToken(token);
    return decoded.uid;
  } catch (e) {
    console.warn("verifyIdToken falló:", e && e.code, e && e.message);
    const err = new Error(`Sesión no válida (${(e && e.code) || "sin código"})`);
    err.status = 401;
    throw err;
  }
}

// Envía una notificación a todas las suscripciones; devuelve las que siguen vivas.
async function enviarATodas(suscripciones, payload) {
  const wp = getWebPush();
  const vivas = [];
  let enviadas = 0;
  for (const s of suscripciones || []) {
    try {
      await wp.sendNotification(s, JSON.stringify(payload), { TTL: 60 * 30, urgency: "high" });
      vivas.push(s);
      enviadas++;
    } catch (e) {
      // 404/410 = el dispositivo ya no existe (app borrada, permiso quitado)
      if (e && (e.statusCode === 404 || e.statusCode === 410)) continue;
      vivas.push(s);
      console.warn("push error", e && e.statusCode, e && e.body);
    }
  }
  return { vivas, enviadas };
}

module.exports = { getAdmin, getWebPush, usuarioDesdeRequest, enviarATodas, VAPID_PUBLIC_KEY };
