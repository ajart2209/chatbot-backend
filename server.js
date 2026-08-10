/* ==================================================================
   server.js  ·  BACKEND (Nivel 3 - paso 1)
   Ahora los clientes viven en SUPABASE (base de datos), no en el código.
   Hace 3 cosas:
     1) sirve el widget.js
     2) entrega la config de cada cliente  (GET /config)  -> desde Supabase
     3) atiende el chat usando TU API KEY   (POST /chat)   -> desde Supabase
   Variables de entorno necesarias (en Railway):
     ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
   Requiere Node 18+ (trae fetch incluido).
   ================================================================== */
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

// --- CORS: permitir que cualquier web de tus clientes llame al backend ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ================= Conexión a Supabase ================= */
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

// Trae un cliente de la base de datos por su cliente_id (o null si no existe)
async function getCliente(id) {
  if (!id) return null;
  try {
    const url = `${SB_URL}/rest/v1/clientes?cliente_id=eq.${encodeURIComponent(id)}&select=*`;
    const r = await fetch(url, {
      headers: {
        "apikey": SB_KEY,
        "Authorization": "Bearer " + SB_KEY
      }
    });
    if (!r.ok) {
      console.error("❌ Error consultando Supabase. status =", r.status, "|", await r.text());
      return null;
    }
    const filas = await r.json();
    return filas[0] || null;
  } catch (e) {
    console.error("💥 Excepción consultando Supabase:", e);
    return null;
  }
}

/* ================= 1) Servir el widget universal ================= */
app.get("/widget.js", (req, res) => {
  res.type("application/javascript");
  res.sendFile(path.join(__dirname, "widget.js"));
});

/* ============ 2) Config pública de un cliente (sin secretos) ============ */
app.get("/config", async (req, res) => {
  const c = await getCliente(req.query.cliente);
  if (!c) return res.status(404).json({ error: "cliente no encontrado" });
  // Enviamos SOLO lo público (nunca el campo 'info' al navegador).
  res.json({
    negocio: c.negocio,
    subtitulo: c.subtitulo,
    color: c.color,
    whatsapp: c.whatsapp,
    bienvenida: c.bienvenida,
    chips: c.chips || [],
    agendarActivo: c.agendar_activo
  });
});

/* ============ 3) Chat: aquí se usa la API KEY en secreto ============ */
app.post("/chat", async (req, res) => {
  let { cliente, messages, message } = req.body || {};
  if (!messages && message) {
    messages = [{ role: "user", content: String(message) }];
  }

  const c = await getCliente(cliente);
  if (!c) return res.status(404).json({ error: "cliente no encontrado" });

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.json({ text: "¿Me repites tu mensaje, por favor? No alcancé a leerlo." });
  }

  const sistema = construirSistema(c);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1000,
        system: sistema,
        messages: messages
      })
    });

    const data = await r.json();

    if (!r.ok || data.error) {
      console.error("❌ Error de la API de Anthropic. status =", r.status, "|", JSON.stringify(data));
      return res.json({
        text: "Disculpa, estoy teniendo un problema técnico en este momento. Por favor escríbenos por WhatsApp al " + (c.whatsapp || "") + " y te atendemos enseguida. 🙏"
      });
    }

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    if (!text) console.error("⚠️ La API respondió OK pero sin texto:", JSON.stringify(data));

    res.json({ text: text || "Disculpa, no pude procesar eso. ¿Puedes reformular tu pregunta?" });
  } catch (e) {
    console.error("💥 Excepción al contactar la IA:", e);
    res.json({
      text: "Disculpa, estoy teniendo un problema técnico en este momento. Por favor escríbenos por WhatsApp al " + (c.whatsapp || "") + " y te atendemos enseguida. 🙏"
    });
  }
});

// Construye la "personalidad" + conocimiento del bot para cada cliente
function construirSistema(c) {
  return `Eres el asistente virtual de atención al cliente de "${c.negocio}".
PERSONALIDAD: cálido, cercano y natural, como una persona real amable. Respuestas BREVES y claras.
IDIOMA: responde en el mismo idioma en que te escriban. Si el cliente da su nombre, recuérdalo y úsalo.
FORMATO: escribe en TEXTO PLANO, como en un chat de WhatsApp. NO uses Markdown: nada de asteriscos para negrita (**), ni almohadillas (#), ni guiones ni números para listas. Si necesitas enfatizar algo, hazlo con las palabras, no con símbolos.
Usa ÚNICAMENTE la información de abajo. Si preguntan algo que no está, dilo con honestidad y ofrece el WhatsApp. Nunca inventes precios ni horarios.
--- INFORMACIÓN DEL NEGOCIO ---
${c.info || "(sin información cargada todavía)"}
--- FIN ---
${c.agendar_activo ? `AGENDAR CITAS: pide de a poco (uno por mensaje): 1) nombre, 2) servicio, 3) día, 4) hora. Cuando tengas los cuatro, confirma y AL FINAL agrega EXACTAMENTE una línea:
[CITA]{"nombre":"...","servicio":"...","dia":"...","hora":"..."}[/CITA]
` : ""}EMOCIÓN: termina SIEMPRE tu mensaje con una etiqueta oculta de tu estado de ánimo, en una línea aparte y con este formato exacto: [M:feliz] · [M:neutral] · [M:triste] · [M:enojado] · [M:sorprendido] · [M:confundido]. Usa "feliz" al saludar o dar buenas noticias, "confundido" si no entiendes, "triste" si no puedes ayudar, "sorprendido" ante algo inesperado. Nunca expliques la etiqueta.`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔑 API key Anthropic:", process.env.ANTHROPIC_API_KEY ? "OK" : "🚨 FALTA");
  console.log("🗄️  Supabase URL:", SB_URL ? "OK" : "🚨 FALTA");
  console.log("🗄️  Supabase KEY:", SB_KEY ? "OK" : "🚨 FALTA");
  console.log("Backend del chatbot en marcha, puerto " + PORT);
});
