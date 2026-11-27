// GET /api/cron-recordatorios?clave=<CRON_SECRET>
// Lo llama cron-job.org cada 5 minutos. Revisa a cada usuario con notificaciones
// activadas y le manda un recordatorio si ya le toca según su intervalo y horario.
const { getAdmin, enviarATodas } = require("./_lib");

const ZONA = "America/Mexico_City";
const TOLERANCIA_MS = 2 * 60 * 1000; // el cron corre cada 5 min; no esperar de más

function ahoraEnMexico(ts) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(ts));
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  const hora = Number(p.hour) % 24;
  return { fecha: `${p.year}-${p.month}-${p.day}`, minutos: hora * 60 + Number(p.minute) };
}

function aMinutos(hhmm, porDefecto) {
  if (typeof hhmm !== "string" || !hhmm.includes(":")) return porDefecto;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// "2:05 p.m.", "14:05", "02:05 PM" → minutos desde medianoche
function horaRegistroAMinutos(texto) {
  if (typeof texto !== "string") return null;
  const m = texto.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const t = texto.toLowerCase().replace(/\s|\./g, "");
  if (t.includes("pm") && h !== 12) h += 12;
  if (t.includes("am") && h === 12) h = 0;
  return h * 60 + min;
}

module.exports = async (req, res) => {
  const secreto = (process.env.CRON_SECRET || "").trim();
  const clave = (req.query && req.query.clave) || (req.headers.authorization || "").replace("Bearer ", "");
  if (!secreto || clave !== secreto) return res.status(401).json({ error: "No autorizado" });

  const ahora = Date.now();
  const mx = ahoraEnMexico(ahora);
  const db = getAdmin().firestore();
  const pushDocs = await db.collection("push").get();
  const resumen = { revisados: 0, enviados: 0, omitidos: {} };
  const omitir = (motivo) => { resumen.omitidos[motivo] = (resumen.omitidos[motivo] || 0) + 1; };

  for (const docPush of pushDocs.docs) {
    resumen.revisados++;
    try {
      const datosPush = docPush.data();
      const subs = Array.isArray(datosPush.suscripciones) ? datosPush.suscripciones : [];
      if (!subs.length) { omitir("sin_dispositivos"); continue; }

      const userSnap = await db.collection("usuarios").doc(docPush.id).get();
      const u = userSnap.exists ? userSnap.data() : {};
      const perfil = u.perfil || {};
      const intervalo = Number(perfil.intervaloMs) || 90 * 60 * 1000;

      // 1) ¿Dentro del horario del usuario?
      const inicio = aMinutos(perfil.horaInicio, 7 * 60);
      const fin = aMinutos(perfil.horaFin, 22 * 60);
      if (mx.minutos < inicio || mx.minutos > fin) { omitir("fuera_de_horario"); continue; }

      // 2) ¿Ya cumplió la meta de hoy? Entonces no molestamos.
      const dia = u.diaActual || {};
      const meta = perfil.unidad === "oz" ? Number(perfil.metaOz) : Number(perfil.metaMl);
      if (dia.fecha === mx.fecha && meta > 0 && Number(dia.ml) >= meta) { omitir("meta_cumplida"); continue; }

      // 3) ¿Ya pasó el intervalo desde el último aviso, la última alarma apagada o el último vaso?
      let base = Math.max(Number(datosPush.ultimoEnvio) || 0, Number(u.alarmaApagada) || 0);
      if (dia.fecha === mx.fecha && Array.isArray(dia.registros) && dia.registros.length) {
        const ultimos = dia.registros.map((r) => horaRegistroAMinutos(r.hora)).filter((x) => x !== null);
        if (ultimos.length) {
          const minutosDesde = mx.minutos - Math.max(...ultimos);
          if (minutosDesde >= 0) base = Math.max(base, ahora - minutosDesde * 60 * 1000);
        }
      }
      if (!base) {
        await docPush.ref.set({ ultimoEnvio: ahora }, { merge: true });
        omitir("primer_conteo");
        continue;
      }
      if (ahora - base < intervalo - TOLERANCIA_MS) { omitir("aun_no_toca"); continue; }

      const unidad = perfil.unidad === "oz" ? "oz" : "ml";
      const llevas = dia.fecha === mx.fecha ? Number(dia.ml) || 0 : 0;
      const nombre = perfil.nombre ? `${perfil.nombre}, ` : "";
      const { vivas, enviadas } = await enviarATodas(subs, {
        title: "💧 ¡Hora de hidratarte!",
        body: meta > 0
          ? `${nombre}llevas ${llevas} de ${meta} ${unidad}. ¡Un vasito!`
          : `${nombre}ya es momento de tomar agua 💧`,
      });
      await docPush.ref.set({ suscripciones: vivas, ultimoEnvio: ahora }, { merge: true });
      if (enviadas) resumen.enviados++;
    } catch (e) {
      console.error("usuario", docPush.id, e);
      omitir("error");
    }
  }

  return res.status(200).json({ ok: true, hora_mx: mx, ...resumen });
};
