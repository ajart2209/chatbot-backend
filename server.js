/* ==================================================================
   server.js  ·  BACKEND (Nivel 2)  —  VERSIÓN CON DIAGNÓSTICO
   Hace 3 cosas:
     1) sirve el widget.js
     2) entrega la configuración de cada cliente  (GET /config)
     3) atiende el chat usando TU API KEY en secreto (POST /chat)
   La API key NUNCA está en el código: se lee de una variable de entorno.
   Requiere Node 18+ (trae fetch incluido).  Instalar:  npm install express
   Ejecutar:  ANTHROPIC_API_KEY=tu_clave  node server.js
   ================================================================== */
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

// --- Permitir que cualquier web de tus clientes llame al backend (CORS) ---
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ==================================================================
   "BASE DE DATOS" DE CLIENTES
   ================================================================== */
const CLIENTES = {
  "taller123": {
    negocio: "Taller AutoExperto",
    subtitulo: "Asistente virtual",
    color: "#0F766E",
    whatsapp: "593991234567",
    bienvenida: "Soy el asistente de Taller AutoExperto 👋 Puedo resolver tus dudas o ayudarte a agendar una cita. ¿En qué te ayudo?",
    chips: ["¿Qué servicios ofrecen?", "¿Cuál es el horario?", "Quiero agendar una cita"],
    agendarActivo: true,
    info: `
      NEGOCIO: Taller AutoExperto — mecánica automotriz.
      HORARIOS: Lun-Vie 8:00–18:00; Sáb 8:00–13:00. Domingo cerrado.
      UBICACIÓN: Av. Principal 123, sector Norte. Hay parqueo.
      CONTACTO: WhatsApp 099 123 4567.
      SERVICIOS Y PRECIOS: Cambio de aceite desde $35; Frenos (pastillas) desde $45;
        Alineación y balanceo $30; Diagnóstico (scanner) $20; Suspensión desde $25;
        Mantenimiento preventivo desde $80.
      GARANTÍA: 3 meses o 5.000 km. PAGOS: efectivo, transferencia y tarjeta.
    `
  },
  "dental456": {
    negocio: "Clínica Dental Sonrisa",
    subtitulo: "Asistente virtual",
    color: "#2563EB",
    whatsapp: "593987654321",
    bienvenida: "¡Hola! Soy el asistente de Clínica Dental Sonrisa 😁 ¿Tienes dudas o quieres agendar tu cita?",
    chips: ["¿Qué tratamientos hacen?", "¿Cuánto cuesta una limpieza?", "Quiero una cita"],
    agendarActivo: true,
    info: `
      NEGOCIO: Clínica Dental Sonrisa.
      HORARIOS: Lun-Vie 9:00–19:00; Sáb 9:00–14:00.
      SERVICIOS: Limpieza dental $25; Resina (calza) desde $30; Ortodoncia (brackets) desde $600;
        Blanqueamiento $120; Extracción desde $40; Valoración inicial gratis.
      CONTACTO: WhatsApp 098 765 4321.
    `
  }
};

/* ================= 1) Servir el widget universal ================= */
app.get("/widget.js", (req, res) => {
  res.type("application/javascript");
  res.sendFile(path.join(__dirname, "widget.js"));
});

/* ============ 2) Config pública de un cliente (sin secretos) ============ */
app.get("/config", (req, res) => {
  const c = CLIENTES[req.query.cliente];
  if (!c) return res.status(404).json({ error: "cliente no encontrado" });
  const { info, ...publico } = c;
  res.json(publico);
});

/* ============ 3) Chat: aquí se usa la API KEY en secreto ============ */
app.post("/chat", async (req, res) => {
  // 🔎 DIAGNÓSTICO: qué llegó exactamente desde el widget
  console.log("➡️  POST /chat recibido. body =", JSON.stringify(req.body));

  // Aceptamos tanto "messages" (array) como "message" (texto suelto),
  // por si el widget envía uno u otro. Así no falla por el nombre del campo.
  let { cliente, messages, message } = req.body || {};
  if (!messages && message) {
    messages = [{ role: "user", content: String(message) }];
  }

  const c = CLIENTES[cliente];
  if (!c) {
    console.log("⚠️  Cliente no encontrado:", cliente);
    return res.status(404).json({ error: "cliente no encontrado" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    console.log("⚠️  No llegaron mensajes válidos. messages =", JSON.stringify(messages));
    return res.status(400).json({ text: "DEBUG: el widget no envió ningún mensaje (revisa que mande 'messages' o 'message')." });
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

    // 🔎 DIAGNÓSTICO: si la API respondió con error, lo mostramos entero
    if (!r.ok || data.error) {
      console.error("❌ ERROR de la API de Anthropic. status =", r.status);
      console.error("❌ Respuesta completa:", JSON.stringify(data));
      // Mientras depuramos, devolvemos el error real al bot para verlo en pantalla:
      const msg = data.error ? (data.error.message || data.error.type) : ("HTTP " + r.status);
      return res.status(200).json({ text: "DEBUG (error de la IA): " + msg });
    }

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");

    if (!text) {
      console.error("⚠️  La API respondió OK pero sin texto. Respuesta:", JSON.stringify(data));
    }

    res.json({ text: text || "Disculpa, no pude procesar eso." });
  } catch (e) {
    console.error("💥 Excepción al contactar la IA:", e);
    res.status(500).json({ text: "DEBUG (excepción): " + e.message });
  }
});

// Construye la "personalidad" + conocimiento del bot para cada cliente
function construirSistema(c) {
  return `Eres el asistente virtual de atención al cliente de "${c.negocio}".
PERSONALIDAD: cálido, cercano y natural, como una persona real amable. Respuestas BREVES y claras.
IDIOMA: responde en el mismo idioma en que te escriban. Si el cliente da su nombre, recuérdalo y úsalo.
Usa ÚNICAMENTE la información de abajo. Si preguntan algo que no está, dilo con honestidad y ofrece el WhatsApp. Nunca inventes precios ni horarios.
--- INFORMACIÓN DEL NEGOCIO ---
${c.info}
--- FIN ---
${c.agendarActivo ? `AGENDAR CITAS: pide de a poco (uno por mensaje): 1) nombre, 2) servicio, 3) día, 4) hora. Cuando tengas los cuatro, confirma y AL FINAL agrega EXACTAMENTE una línea:
[CITA]{"nombre":"...","servicio":"...","dia":"...","hora":"..."}[/CITA]
` : ""}EMOCIÓN: termina SIEMPRE tu mensaje con una etiqueta oculta de tu estado de ánimo, en una línea aparte y con este formato exacto: [M:feliz] · [M:neutral] · [M:triste] · [M:enojado] · [M:sorprendido] · [M:confundido]. Usa "feliz" al saludar o dar buenas noticias, "confundido" si no entiendes, "triste" si no puedes ayudar, "sorprendido" ante algo inesperado. Nunca expliques la etiqueta.`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // 🔎 DIAGNÓSTICO al arrancar: ¿existe la API key? (sin revelarla entera)
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) {
    console.log("🚨 ATENCIÓN: la variable ANTHROPIC_API_KEY NO está definida.");
  } else {
    console.log("🔑 API key detectada. Longitud:", k.length, "| empieza con:", k.slice(0, 12) + "...");
  }
  console.log("Backend del chatbot en marcha, puerto " + PORT);
});
