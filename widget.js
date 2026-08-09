/* ==================================================================
   widget.js  ·  WIDGET UNIVERSAL (Nivel 2)
   Se pega en CUALQUIER web con una sola línea:
     <script src="https://TU-BACKEND.com/widget.js" data-cliente="taller123"></script>
   El widget:
     1) lee el data-cliente del <script>
     2) pide su configuración al backend (nombre, color, etc.)
     3) manda los mensajes al backend /chat (donde vive tu API key en secreto)
   NO contiene ninguna clave. NO se edita por cliente.
   ================================================================== */
(function () {
  // 1) Identidad: de qué cliente es y dónde está el backend
  const me = document.currentScript;
  const CLIENTE = me.getAttribute("data-cliente") || "demo";
  const BACKEND = new URL(me.src).origin;          // ej: https://tu-backend.com

  const historial = [];
  let CONF = null;

  // 2) Cargar la configuración de ESTE cliente desde el backend
  fetch(`${BACKEND}/config?cliente=${encodeURIComponent(CLIENTE)}`)
    .then(r => r.json())
    .then(cfg => { CONF = cfg; construir(); })
    .catch(() => { CONF = { negocio: "Asistente", color: "#0F766E", subtitulo: "En línea",
                            bienvenida: "¡Hola! ¿En qué te ayudo?", chips: [], whatsapp: "" }; construir(); });

  function construir() {
    const root = document.createElement("div");
    root.id = "cbw-root"; document.body.appendChild(root);
    const primario = CONF.color || "#0F766E";
    const osc = sombra(primario);
    const inicial = (CONF.negocio || "A").trim()[0].toUpperCase();
    const h = new Date().getHours();
    const saludo = h < 12 ? "¡Buenos días! ☀️" : h < 19 ? "¡Buenas tardes! 👋" : "¡Buenas noches! 🌙";
    const waLink = t => `https://wa.me/${CONF.whatsapp}?text=${encodeURIComponent(t || ("Hola, escribo desde la web de " + CONF.negocio))}`;

    root.innerHTML = `
      <style>
        #cbw-root, #cbw-root *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
        #cbw-b{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:62px;height:62px;border:none;border-radius:50%;cursor:pointer;background:${primario};color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;transition:transform .2s}
        #cbw-b:hover{transform:scale(1.06)}
        #cbw-b svg{width:28px;height:28px}
        #cbw-w{position:fixed;right:22px;bottom:96px;z-index:2147483000;width:380px;max-width:calc(100vw - 32px);height:580px;max-height:calc(100vh - 130px);background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(2,6,23,.28);display:none;flex-direction:column;opacity:0;transform:translateY(16px) scale(.98);transition:.22s cubic-bezier(.2,.8,.2,1)}
        #cbw-w.on{display:flex;opacity:1;transform:none}
        #cbw-h{background:linear-gradient(135deg,${primario},${osc});color:#fff;padding:15px 16px;display:flex;align-items:center;gap:11px}
        #cbw-h .av{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px}
        #cbw-h .t{font-size:15px;font-weight:700}#cbw-h .s{font-size:12px;opacity:.9;display:flex;align-items:center;gap:5px}
        #cbw-h .p{width:8px;height:8px;border-radius:50%;background:#4ade80}
        #cbw-x{margin-left:auto;background:none;border:none;color:#fff;cursor:pointer;opacity:.85}
        #cbw-m{flex:1;overflow-y:auto;padding:18px 16px;background:#fbfcfd;display:flex;flex-direction:column;gap:12px}
        .cbw-msg{max-width:82%;padding:11px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
        .cbw-bot{background:#F1F5F9;color:#0f172a;align-self:flex-start;border-bottom-left-radius:5px}
        .cbw-user{background:${primario};color:#fff;align-self:flex-end;border-bottom-right-radius:5px}
        .cbw-cita{align-self:flex-start;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:12px 14px;font-size:13px;color:#065f46;max-width:92%}
        .cbw-cita a{display:inline-block;margin-top:9px;background:${primario};color:#fff;text-decoration:none;font-size:12px;font-weight:600;padding:7px 12px;border-radius:8px}
        #cbw-c{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 6px}
        .cbw-chip{background:#fff;border:1px solid #e2e8f0;color:${primario};font-size:13px;padding:7px 12px;border-radius:20px;cursor:pointer}
        .cbw-chip:hover{background:${primario};color:#fff}
        .cbw-chip.wa{color:#16a34a;border-color:#bbf7d0}.cbw-chip.wa:hover{background:#16a34a;color:#fff}
        .cbw-typ{align-self:flex-start;background:#F1F5F9;padding:12px 14px;border-radius:16px;display:flex;gap:4px}
        .cbw-typ span{width:7px;height:7px;background:#94a3b8;border-radius:50%;animation:cbwr 1.2s infinite}
        .cbw-typ span:nth-child(2){animation-delay:.15s}.cbw-typ span:nth-child(3){animation-delay:.3s}
        @keyframes cbwr{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        #cbw-e{display:flex;align-items:center;gap:8px;padding:12px 14px;border-top:1px solid #eef2f6;background:#fff}
        #cbw-i{flex:1;border:1px solid #e2e8f0;border-radius:22px;padding:11px 15px;font-size:14px;outline:none;resize:none;max-height:90px;font-family:inherit}
        #cbw-i:focus{border-color:${primario}}
        #cbw-send{width:42px;height:42px;border-radius:50%;border:none;background:${primario};color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
        #cbw-pie{text-align:center;font-size:11px;color:#94a3b8;padding:0 0 8px}
      </style>
      <button id="cbw-b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
      <div id="cbw-w">
        <div id="cbw-h"><div class="av">${inicial}</div><div><div class="t">${esc(CONF.negocio)}</div><div class="s"><span class="p"></span>${esc(CONF.subtitulo||"En línea")}</div></div><button id="cbw-x"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
        <div id="cbw-m"></div><div id="cbw-c"></div>
        <div id="cbw-e"><textarea id="cbw-i" rows="1" placeholder="Escribe tu mensaje..."></textarea><button id="cbw-send"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button></div>
        <div id="cbw-pie">Asistente con IA</div>
      </div>`;

    const $ = s => root.querySelector(s);
    const b=$("#cbw-b"), w=$("#cbw-w"), m=$("#cbw-m"), inp=$("#cbw-i"), snd=$("#cbw-send"), chips=$("#cbw-c");
    let abierto=false, primera=true;
    b.onclick=()=>abierto?cerrar():abrir(); $("#cbw-x").onclick=cerrar;
    function abrir(){ w.classList.add("on"); abierto=true; if(primera){primera=false; bot(`${saludo} ${CONF.bienvenida||""}`); pintarChips();} inp.focus(); }
    function cerrar(){ w.classList.remove("on"); abierto=false; }
    function pintarChips(){ chips.innerHTML=""; (CONF.chips||[]).forEach(t=>{const c=el("cbw-chip",t);c.onclick=()=>{chips.innerHTML="";mandar(t);};chips.appendChild(c);});
      if(CONF.whatsapp){const wa=el("cbw-chip wa","💬 Hablar con un asesor");wa.onclick=()=>window.open(waLink(),"_blank");chips.appendChild(wa);} }
    function el(c,t){const d=document.createElement("div");d.className=c;if(t)d.textContent=t;return d;}
    function user(t){const d=el("cbw-msg cbw-user",t);m.appendChild(d);sc();}
    function bot(t){const d=el("cbw-msg cbw-bot","");m.appendChild(d);const p=t.split(" ");let i=0;(function tk(){if(i<p.length){d.textContent+=(i?" ":"")+p[i++];sc();setTimeout(tk,22+Math.random()*28);}})();}
    function cita(dt){const d=el("cbw-cita");const g="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(`${dt.servicio} — ${CONF.negocio}`)+"&details="+encodeURIComponent(`Cita de ${dt.nombre}\nServicio: ${dt.servicio}\nDía: ${dt.dia} · Hora: ${dt.hora}`);d.innerHTML=`<b>✅ Cita registrada</b><br>Cliente: ${esc(dt.nombre)}<br>Servicio: ${esc(dt.servicio)}<br>Día: ${esc(dt.dia)} · Hora: ${esc(dt.hora)}<br><a href="${g}" target="_blank">📅 Agregar a Google Calendar</a>`;m.appendChild(d);sc();}
    function typ(on){let e=$("#cbw-typ");if(on&&!e){e=el("cbw-typ");e.id="cbw-typ";e.innerHTML="<span></span><span></span><span></span>";m.appendChild(e);sc();}if(!on&&e)e.remove();}
    function sc(){m.scrollTop=m.scrollHeight;}
    inp.addEventListener("input",()=>{inp.style.height="auto";inp.style.height=Math.min(inp.scrollHeight,90)+"px";});
    inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();mandar(inp.value);}});
    snd.onclick=()=>mandar(inp.value);

    async function mandar(t){ t=(t||"").trim(); if(!t)return; chips.innerHTML=""; user(t); inp.value=""; inp.style.height="auto";
      historial.push({role:"user",content:t}); snd.disabled=true; typ(true);
      try{
        const r=await fetch(`${BACKEND}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({cliente:CLIENTE, messages:historial})});
        const data=await r.json(); let out=(data.text||"Disculpa, no te entendí. ¿Puedes repetir? 🙏").trim();
        historial.push({role:"assistant",content:out});
        let c=null; const mm=out.match(/\[CITA\]([\s\S]*?)\[\/CITA\]/); if(mm){try{c=JSON.parse(mm[1]);}catch(_){} out=out.replace(/\[CITA\][\s\S]*?\[\/CITA\]/,"").trim();}
        typ(false); if(out)bot(out); if(c)setTimeout(()=>cita(c),400);
      }catch(_){ typ(false); bot("⚠️ Se cortó la conexión. Intenta de nuevo, por favor."); }
      finally{ snd.disabled=false; inp.focus(); }
    }
  }

  function esc(s){return String(s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
  function sombra(hex){try{const n=parseInt(hex.slice(1),16);let r=Math.max(0,(n>>16)-25),g=Math.max(0,((n>>8)&255)-25),b=Math.max(0,(n&255)-25);return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}catch(_){return hex;}}
})();
