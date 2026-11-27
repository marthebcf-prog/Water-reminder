// Notificaciones push reales: llegan aunque la app esté cerrada,
// y el iPhone las reenvía al Garmin.
import { auth } from "./firebase";

export const VAPID_PUBLIC_KEY =
  "BHy677_y0wG9yu_FV0RalFTDmq-oWCuqV_-J1JQxYcmyvGsH3Qp0VT_ClLRrMPxO3_v2ZUET5wKNOUkXa1aJTmo";

const FLAG = "water-push-activo";

export type EstadoPush =
  | "no-soportado"      // navegador sin push
  | "instalar-primero"  // iPhone/iPad en Safari: hay que agregar a pantalla de inicio
  | "bloqueado"         // el usuario negó el permiso
  | "inactivo"
  | "activo";

function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function esStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

export function pushActivoEnEsteDispositivo() {
  try { return localStorage.getItem(FLAG) === "1"; } catch { return false; }
}

function base64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function llamarApi(method: "POST" | "DELETE", body: any) {
  const user = auth.currentUser;
  if (!user) throw new Error("Inicia sesión primero");
  const token = await user.getIdToken();
  const r = await fetch("/api/suscripcion", {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
  return data;
}

export async function obtenerEstadoPush(): Promise<EstadoPush> {
  if (esIOS() && !esStandalone()) return "instalar-primero";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "no-soportado";
  if (Notification.permission === "denied") return "bloqueado";
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub && Notification.permission === "granted") {
      // Volver a registrar en el servidor (por si antes falló o se perdió)
      await llamarApi("POST", { subscription: sub.toJSON() });
      localStorage.setItem(FLAG, "1");
      return "activo";
    }
  } catch {}
  localStorage.removeItem(FLAG);
  return "inactivo";
}

// Debe llamarse desde un toque del usuario (requisito de iPhone).
export async function activarPush(): Promise<EstadoPush> {
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") return permiso === "denied" ? "bloqueado" : "inactivo";
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  await llamarApi("POST", { subscription: sub.toJSON() });
  localStorage.setItem(FLAG, "1");
  return "activo";
}

export async function desactivarPush(): Promise<EstadoPush> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await llamarApi("DELETE", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  localStorage.removeItem(FLAG);
  return "inactivo";
}

export async function enviarPrueba(): Promise<number> {
  const r = await llamarApi("POST", { accion: "prueba" });
  return r.enviadas || 0;
}
