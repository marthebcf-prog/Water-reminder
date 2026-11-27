// POST   /api/suscripcion  { subscription }        → guarda este dispositivo
// POST   /api/suscripcion  { accion: "prueba" }      → manda una notificación de prueba
// DELETE /api/suscripcion  { endpoint }              → quita este dispositivo
// Todas requieren el header Authorization: Bearer <token de Firebase>.
const { getAdmin, usuarioDesdeRequest, enviarATodas } = require("./_lib");

module.exports = async (req, res) => {
  try {
    const uid = await usuarioDesdeRequest(req);
    if (!uid) return res.status(401).json({ error: "No autorizado" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const db = getAdmin().firestore();
    const ref = db.collection("push").doc(uid);
    const snap = await ref.get();
    const actual = snap.exists ? snap.data() : {};
    const subs = Array.isArray(actual.suscripciones) ? actual.suscripciones : [];

    if (req.method === "DELETE") {
      const restantes = subs.filter((s) => s.endpoint !== body.endpoint);
      await ref.set({ suscripciones: restantes }, { merge: true });
      return res.status(200).json({ ok: true, dispositivos: restantes.length });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    if (body.accion === "prueba") {
      const { vivas, enviadas } = await enviarATodas(subs, {
        title: "💧 Prueba de Water Reminder",
        body: "Si ves esto en tu reloj, ¡ya quedó! 🎉",
      });
      await ref.set({ suscripciones: vivas }, { merge: true });
      return res.status(200).json({ ok: true, enviadas });
    }

    const s = body.subscription;
    if (!s || typeof s.endpoint !== "string" || !s.keys || !s.keys.p256dh || !s.keys.auth) {
      return res.status(400).json({ error: "Suscripción inválida" });
    }
    const limpia = { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } };
    const nuevas = [...subs.filter((x) => x.endpoint !== limpia.endpoint), limpia].slice(-5);
    await ref.set(
      { suscripciones: nuevas, ultimoEnvio: actual.ultimoEnvio || Date.now() },
      { merge: true }
    );
    return res.status(200).json({ ok: true, dispositivos: nuevas.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
