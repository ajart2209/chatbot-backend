/* ==================================================================
   server.js  ·  BACKEND (Nivel 2)
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
   Para empezar es este objeto. Más adelante se reemplaza por una base
   real (Supabase/Firebase) o por el panel de administración (Nivel 3).
   Para dar de alta un cliente nuevo: agregas otra entrada aquí. Nada más.
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

  // ➕ Para un cliente nuevo, copia una entrada y cambia sus datos.
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
  const { info, ...publico } = c;          // NO enviamos la base de conocimiento al navegador
  res.json(publico);
});

/* ============ 3) Chat: aquí se usa la API KEY en secreto ============ */
app.post("/chat", async (req, res) => {
  const { cliente, messages } = req.body || {};
  const c = CLIENTES[cliente];
  if (!c) return res.status(404).json({ error: "cliente no encontrado" });

  const sistema = construirSistema(c);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,   // 🔑 tu clave, guardada en el servidor
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",        // Haiku = económico (verifica el nombre exacto del modelo)
        max_tokens: 1000,
        system: sistema,
        messages: messages || []
      })
    });
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    res.json({ text: text || "Disculpa, no pude procesar eso." });
  } catch (e) {
    res.status(500).json({ error: "fallo al contactar la IA" });
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
[CITA]{"nombre":"...","servicio":"...","dia":"...","hora":"..."}[/CITA]` : ""}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend del chatbot en marcha, puerto " + PORT));
