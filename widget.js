/* ==================================================================
   widget.js · WIDGET UNIVERSAL con ROBOT ANIMADO (diseño Claude Design)
   Robot espacial con 10 estados de ánimo + integración con tu backend.
   Se pega con:
     <script src="https://TU-BACKEND.com/widget.js" data-cliente="ID"></script>
   ================================================================== */
(function () {
  const me = document.currentScript;
  const CLIENTE = me.getAttribute("data-cliente") || "demo";
  const BACKEND = new URL(me.src).origin;
  const SID = "w" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); // id del visitante
  if (!document.getElementById("cbw-font")) {
    const l = document.createElement("link"); l.id = "cbw-font"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }
  fetch(`${BACKEND}/config?cliente=${encodeURIComponent(CLIENTE)}`)
    .then(r => r.json()).then(build)
    .catch(() => build({ negocio: "Asistente", subtitulo: "en línea",
      bienvenida: "¡Hola! ¿En qué te ayudo?", chips: [], whatsapp: "",
      bubble: "¡Hola! ¿Tienes alguna pregunta? 👋" }));
  const FLOAT = "cbFloat 3.6s ease-in-out infinite";
  const MOODS = {
    idle:      { ry:13, shift:"translate(0,0)",  mouth:"M92 122 q8 5 16 0",    mo:.5,  tint:"#8A70F8", anim:FLOAT, eye:"cbBlink 5.4s ease-in-out infinite" },
    greeting:  { ry:13, shift:"translate(0,0)",  mouth:"M88 120 q12 11 24 0",  mo:.9,  tint:"#8A70F8", anim:"cbFloatFast 2.4s ease-in-out infinite", g2:"cbGreet 2.4s ease-in-out infinite", eye:"cbBlink 3.2s ease-in-out infinite" },
    happy:     { ry:4,  shift:"translate(0,0)",  mouth:"M86 119 q14 14 28 0",  mo:.95, tint:"#5BE7F0", anim:"cbHop 1.05s cubic-bezier(.3,.7,.4,1) infinite", g2:"cbSquash 1.05s ease-in-out infinite", cheeks:.4 },
    thinking:  { ry:12, shift:"translate(7,-5)", mouth:"M94 123 q6 3 12 0",    mo:.4,  tint:"#8A70F8", anim:"cbFloat 4.4s ease-in-out infinite", g2:"cbTiltSoft 3.6s ease-in-out infinite", dots:true, eye:"cbScan 3.4s ease-in-out infinite" },
    loading:   { ry:11, shift:"translate(6,-4)", mouth:"M94 123 q6 3 12 0",    mo:.4,  tint:"#3DDCE8", anim:"cbFloatFast 1.5s ease-in-out infinite", g2:"cbBreathe 1.5s ease-in-out infinite", ring:true },
    listening: { ry:12, shift:"translate(0,3)",  mouth:"M94 123 q6 4 12 0",    mo:.55, tint:"#8A70F8", anim:"cbNod 2s ease-in-out infinite", g2:"cbLean 4s ease-in-out infinite", eye:"cbBlink 4s ease-in-out infinite" },
    angry:     { ry:7,  shift:"translate(0,2)",  mouth:"M88 129 q12 -11 24 0", mo:.9,  tint:"#F2547D", anim:"cbShake .42s ease-in-out infinite", g2:"cbFume 1.6s ease-in-out infinite", brows:["M68 95 L88 103","M132 95 L112 103"] },
    sad:       { ry:11, shift:"translate(0,4)",  mouth:"M89 128 q11 -8 22 0",  mo:.7,  tint:"#5C7DF0", anim:"cbSag 5.2s ease-in-out infinite", g2:"cbTiltSad 5.2s ease-in-out infinite", brows:["M68 103 L88 96","M132 103 L112 96"], eye:"cbBlink 6.5s ease-in-out infinite" },
    surprised: { ry:16, shift:"translate(0,-1)", mouth:"M95 122 a5.5 5.5 0 1 0 10 0 a5.5 5.5 0 1 0 -10 0", mo:.9, tint:"#3DDCE8", anim:"cbJolt 1.8s cubic-bezier(.2,1.4,.4,1) infinite", g2:"cbStretch 1.8s ease-out infinite", brows:["M68 92 L88 88","M132 92 L112 88"] },
    confused:  { ry:12, shift:"translate(-4,0)", mouth:"M90 124 q6 6 11 0 q5 -6 11 0", mo:.7, tint:"#8A70F8", anim:"cbFloat 4s ease-in-out infinite", g2:"cbTilt 3s ease-in-out infinite", eye:"cbScan 4.2s ease-in-out infinite", brows:["M68 100 L88 93","M132 96 L112 96"] }
  };
  const MOODMAP = { feliz:"happy", neutral:"idle", triste:"sad", enojado:"angry", sorprendido:"surprised", confundido:"confused" };
  const puff = (x,y,r,d) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0" style="animation:cbSteam 1.6s ${d}s ease-out infinite;transform-origin:${x}px ${y}px"/>`;
  const spark = (x,y,s,d) => `<path d="M${x} ${y-s} L${x+s*.32} ${y-s*.32} L${x+s} ${y} L${x+s*.32} ${y+s*.32} L${x} ${y+s} L${x-s*.32} ${y+s*.32} L${x-s} ${y} L${x-s*.32} ${y-s*.32} Z" fill="#FFE9A8" style="animation:cbSparkle 1.9s ${d}s ease-in-out infinite;transform-origin:${x}px ${y}px"/>`;
  const ring = (d,t) => `<circle cx="100" cy="110" r="64" fill="none" stroke="${t}" stroke-width="2.5" opacity="0" style="animation:cbRing 2.4s ${d}s ease-out infinite;transform-origin:100px 110px"/>`;
  function fx(mood, tint) {
    if (mood === "greeting") return `<g transform="translate(176,124) rotate(8) scale(1.15)"><g style="animation:cbWaveHand 1.2s ease-in-out infinite;transform-origin:0px 24px"><rect x="-7" y="10" width="14" height="20" rx="7" fill="#5B3AD9"/><rect x="-17.25" y="7" width="8.5" height="36" rx="4.25" fill="#7E63F4"/><rect x="-8.55" y="13" width="8.5" height="42" rx="4.25" fill="#7E63F4"/><rect x="0.05" y="12" width="8.5" height="41" rx="4.25" fill="#7E63F4"/><rect x="8.75" y="6" width="8.5" height="35" rx="4.25" fill="#7E63F4"/><rect x="-27" y="-4" width="9" height="21" rx="4.5" fill="#7E63F4" transform="rotate(-52 -22 6)"/><rect x="-18" y="-12" width="36" height="28" rx="11" fill="#8E76F9"/><rect x="-13" y="-7" width="17" height="7" rx="3.5" fill="#fff" opacity=".22"/></g></g>`;
    if (mood === "angry") return puff(48,62,7,0)+puff(152,66,6,.5)+puff(38,92,5,1);
    if (mood === "happy") return spark(40,66,8,0)+spark(162,78,6.5,.55)+spark(150,44,5,1.1);
    if (mood === "listening") return ring(0,tint)+ring(.8,tint)+ring(1.6,tint);
    if (mood === "sad") return `<ellipse cx="120" cy="126" rx="4" ry="6" fill="#7FD9FF" opacity="0" style="animation:cbTear 2.6s ease-in infinite"/>`;
    if (mood === "confused") return `<text x="150" y="52" font-size="34" font-weight="800" fill="${tint}" opacity="0" style="font-family:'Plus Jakarta Sans',sans-serif;animation:cbQmark 2.6s ease-out infinite">?</text>`;
    if (mood === "surprised") return `<path d="M52 46 L44 34" stroke="${tint}" stroke-width="3.5" stroke-linecap="round" opacity=".75" style="animation:cbSparkle 1.4s ease-in-out infinite"/><path d="M148 46 L156 34" stroke="${tint}" stroke-width="3.5" stroke-linecap="round" opacity=".75" style="animation:cbSparkle 1.4s .2s ease-in-out infinite"/><path d="M100 34 L100 20" stroke="${tint}" stroke-width="3.5" stroke-linecap="round" opacity=".75" style="animation:cbSparkle 1.4s .1s ease-in-out infinite"/>`;
    return "";
  }
  function robotSVG(mood) {
    const F = MOODS[mood] || MOODS.idle, tint = F.tint, ry = F.ry;
    const eyeFill = (F.brows && (mood==="angry"||mood==="sad")) ? tint : "url(#wcore)";
    const brows = F.brows || ["M68 95 L88 103","M132 95 L112 103"];
    const hi = mood==="happy"?107:103;
    return `<svg viewBox="0 0 200 236" width="100%" style="display:block;overflow:visible">
    <defs>
      <radialGradient id="whead" cx="32%" cy="20%" r="88%"><stop offset="0%" stop-color="#CFC4FF"/><stop offset="40%" stop-color="#8E76F9"/><stop offset="100%" stop-color="#4520C6"/></radialGradient>
      <radialGradient id="wpod" cx="34%" cy="24%" r="85%"><stop offset="0%" stop-color="#B9AAFF"/><stop offset="100%" stop-color="#5330DB"/></radialGradient>
      <radialGradient id="wcore" cx="34%" cy="28%" r="80%"><stop offset="0%" stop-color="#E4FDFF"/><stop offset="50%" stop-color="#5BE7F0"/><stop offset="100%" stop-color="#209FE0"/></radialGradient>
      <linearGradient id="wvisor" x1="0.1" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#3A2180"/><stop offset="100%" stop-color="#140939"/></linearGradient>
      <filter id="wsoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <ellipse cx="100" cy="226" rx="46" ry="8" fill="#4C31D6" filter="url(#wsoft)" style="animation:cbShadow 3.6s ease-in-out infinite;transform-origin:100px 226px"/>
    <g style="animation:${F.anim};transform-origin:100px 120px"><g style="animation:${F.g2||"none"};transform-origin:100px 150px">
      ${fx(mood,tint)}
      <g style="opacity:${F.dots?1:0};transition:opacity .35s"><circle cx="34" cy="44" r="4" fill="#A78BFA" style="animation:cbDot 1.3s infinite"/><circle cx="46" cy="30" r="5.5" fill="#A78BFA" style="animation:cbDot 1.3s .18s infinite"/><circle cx="62" cy="16" r="7.5" fill="#A78BFA" style="animation:cbDot 1.3s .36s infinite"/></g>
      <circle cx="100" cy="106" r="76" fill="none" stroke="#3DDCE8" stroke-width="5" stroke-linecap="round" stroke-dasharray="62 420" style="opacity:${F.ring?1:0};transition:opacity .3s;animation:cbSpin 1.1s linear infinite;transform-origin:100px 106px"/>
      <path d="M100 52 V34" stroke="#8C7AF7" stroke-width="6" stroke-linecap="round"/>
      <circle cx="100" cy="24" r="12" fill="${tint}" opacity=".3" style="animation:cbGlow 2s ease-in-out infinite;transform-origin:100px 24px"/><circle cx="100" cy="24" r="7" fill="url(#wcore)"/>
      <ellipse cx="22" cy="124" rx="15" ry="20" fill="url(#wpod)" style="animation:cbPodL 3s ease-in-out infinite;transform-origin:22px 124px"/>
      ${mood==="greeting"?"":`<ellipse cx="178" cy="124" rx="15" ry="20" fill="url(#wpod)" style="animation:cbPodR 3.2s ease-in-out infinite;transform-origin:178px 108px"/>`}
      <ellipse cx="100" cy="112" rx="66" ry="58" fill="${tint}" opacity=".24" filter="url(#wsoft)"/>
      <rect x="36" y="52" width="128" height="112" rx="56" fill="url(#whead)"/><rect x="36.8" y="52.8" width="126.4" height="110.4" rx="55" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/>
      <ellipse cx="100" cy="112" rx="62" ry="54" fill="none" stroke="#5BE7F0" stroke-opacity=".16" stroke-width="3"/>
      <ellipse cx="72" cy="78" rx="22" ry="12" fill="#fff" opacity=".24" transform="rotate(-24 72 78)"/><ellipse cx="63" cy="73" rx="7" ry="3.6" fill="#fff" opacity=".55" transform="rotate(-24 63 73)"/>
      <rect x="52" y="80" width="96" height="58" rx="29" fill="#2A1560" opacity=".5"/><rect x="54" y="82" width="92" height="54" rx="27" fill="url(#wvisor)"/><rect x="54.7" y="82.7" width="90.6" height="52.6" rx="26.3" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.4"/><ellipse cx="100" cy="91" rx="38" ry="7" fill="#fff" opacity=".08"/>
      <g transform="${F.shift}" style="transition:transform .35s"><g style="animation:${F.eye||"cbBlink 5.4s ease-in-out infinite"};transform-origin:100px 109px">
        <ellipse cx="80" cy="109" rx="12" ry="${ry+5}" fill="${tint}" opacity=".3" filter="url(#wsoft)"/><ellipse cx="120" cy="109" rx="12" ry="${ry+5}" fill="${tint}" opacity=".3" filter="url(#wsoft)"/>
        <ellipse cx="80" cy="109" rx="${mood==="confused"?6.5:8}" ry="${ry}" fill="${eyeFill}"/><ellipse cx="120" cy="109" rx="8" ry="${mood==="confused"?ry+3:ry}" fill="${eyeFill}"/>
        <ellipse cx="77" cy="${hi}" rx="2.6" ry="2.2" fill="#fff" opacity=".85"/><ellipse cx="117" cy="${hi}" rx="2.6" ry="2.2" fill="#fff" opacity=".85"/>
      </g></g>
      <g style="opacity:${F.brows?1:0};transition:opacity .3s"><path d="${brows[0]}" stroke="${tint}" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="${brows[1]}" stroke="${tint}" stroke-width="4.5" stroke-linecap="round" fill="none"/></g>
      <path d="${F.mouth}" stroke="${tint}" stroke-width="4" stroke-linecap="round" fill="none" opacity="${F.mo}"/>
      <ellipse cx="58" cy="150" rx="9" ry="5" fill="${tint}" opacity="${F.cheeks||.16}"/><ellipse cx="142" cy="150" rx="9" ry="5" fill="${tint}" opacity="${F.cheeks||.16}"/>
      <g><rect x="93" y="158" width="14" height="14" rx="7" fill="#5330DB" opacity=".85"/>
        <ellipse cx="69" cy="180" rx="10" ry="12.5" fill="url(#wpod)" style="animation:cbPodL 3.4s ease-in-out infinite;transform-origin:69px 176px"/><ellipse cx="131" cy="180" rx="10" ry="12.5" fill="url(#wpod)" style="animation:cbPodR 3.6s ease-in-out infinite;transform-origin:131px 176px"/>
        <rect x="70" y="164" width="60" height="48" rx="26" fill="url(#whead)"/><rect x="70.8" y="164.8" width="58.4" height="46.4" rx="25" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.4"/><ellipse cx="86" cy="175" rx="11" ry="6" fill="#fff" opacity=".2" transform="rotate(-22 86 175)"/>
        <path d="M78 200 q22 12 44 0" fill="none" stroke="#5BE7F0" stroke-opacity=".22" stroke-width="3" stroke-linecap="round"/>
        <circle cx="100" cy="186" r="15" fill="#3DDCE8" opacity=".35" filter="url(#wsoft)" style="animation:cbGlow 2.4s ease-in-out infinite;transform-origin:100px 186px"/><circle cx="100" cy="186" r="12" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.4"/><circle cx="100" cy="186" r="8" fill="url(#wcore)"/><circle cx="97" cy="183" r="2.2" fill="#fff" opacity=".8"/>
        <circle cx="52" cy="202" r="9" fill="url(#wpod)" style="animation:cbPodL 2.6s ease-in-out infinite;transform-origin:52px 202px"/><circle cx="49.5" cy="199" r="2.6" fill="#fff" opacity=".45"/>
        ${mood==="greeting"?"":`<circle cx="148" cy="202" r="9" fill="url(#wpod)" style="animation:cbPodR 2.9s ease-in-out infinite;transform-origin:148px 202px"/><circle cx="145.5" cy="199" r="2.6" fill="#fff" opacity=".45"/>`}
        <ellipse cx="100" cy="216" rx="19" ry="6" fill="#3DDCE8" opacity=".4" filter="url(#wsoft)" style="animation:cbGlow 2s ease-in-out infinite;transform-origin:100px 216px"/>
      </g>
    </g></g></svg>`;
  }
  function build(CONF) {
    const chips = Array.isArray(CONF.chips) ? CONF.chips : String(CONF.chips||"").split(",").map(s=>s.trim()).filter(Boolean);
    const bubbleText = CONF.bubble || "¡Hola! ¿Tienes alguna pregunta? Estoy aquí para ayudarte 👋";
    const waLink = t => `https://wa.me/${CONF.whatsapp}?text=${encodeURIComponent(t||("Hola, escribo desde la web de "+CONF.negocio))}`;
    const winH = () => Math.round(Math.min(580, Math.max(360, window.innerHeight - 150)));
    const root = document.createElement("div"); root.id = "cbw"; document.body.appendChild(root);
    root.innerHTML = `<style>
      @keyframes cbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
      @keyframes cbFloatFast{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @keyframes cbPodL{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-6px) rotate(-6deg)}}
      @keyframes cbPodR{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(6deg)}}
      @keyframes cbShadow{0%,100%{transform:scale(1);opacity:.2}50%{transform:scale(.86);opacity:.12}}
      @keyframes cbSpin{to{transform:rotate(360deg)}}
      @keyframes cbGlow{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.9;transform:scale(1.18)}}
      @keyframes cbDot{0%,80%,100%{transform:translateY(0);opacity:.45}40%{transform:translateY(-6px);opacity:1}}
      @keyframes cbWaveHand{0%,100%{transform:rotate(-17deg)}25%{transform:rotate(15deg)}50%{transform:rotate(-15deg)}75%{transform:rotate(17deg)}}
      @keyframes cbGreet{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
      @keyframes cbRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes cbShake{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-3px,-1px) rotate(-2.5deg)}75%{transform:translate(3px,1px) rotate(2.5deg)}}
      @keyframes cbFume{0%,100%{transform:scale(1,1)}45%{transform:scale(1.05,.96)}}
      @keyframes cbHop{0%,100%{transform:translateY(0)}30%{transform:translateY(-16px)}55%{transform:translateY(0)}70%{transform:translateY(-4px)}85%{transform:translateY(0)}}
      @keyframes cbSquash{0%,100%{transform:scale(1,1)}28%{transform:scale(.94,1.07)}56%{transform:scale(1.08,.92)}78%{transform:scale(.98,1.02)}}
      @keyframes cbBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
      @keyframes cbStretch{0%{transform:scale(1.1,.9)}25%{transform:scale(.94,1.09)}60%,100%{transform:scale(1,1)}}
      @keyframes cbJolt{0%{transform:translateY(0)}12%{transform:translateY(-18px)}30%{transform:translateY(0)}40%{transform:translateY(-5px)}52%,100%{transform:translateY(0)}}
      @keyframes cbSag{0%,100%{transform:translateY(4px)}50%{transform:translateY(10px)}}
      @keyframes cbTiltSad{0%,100%{transform:rotate(4deg)}50%{transform:rotate(7deg)}}
      @keyframes cbTiltSoft{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
      @keyframes cbLean{0%,100%{transform:rotate(-2deg) translateX(-2px)}50%{transform:rotate(2deg) translateX(2px)}}
      @keyframes cbScan{0%,100%{transform:translateX(-4px)}25%{transform:translateX(5px)}60%{transform:translateX(-2px)}}
      @keyframes cbSteam{0%{opacity:0;transform:translateY(0) scale(.4)}25%{opacity:.55}100%{opacity:0;transform:translateY(-26px) scale(1.5)}}
      @keyframes cbSparkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}45%{opacity:.95;transform:scale(1) rotate(35deg)}}
      @keyframes cbRing{0%{opacity:.5;transform:scale(.55)}100%{opacity:0;transform:scale(1.15)}}
      @keyframes cbTear{0%,55%{opacity:0;transform:translateY(0)}65%{opacity:.9}100%{opacity:0;transform:translateY(34px)}}
      @keyframes cbQmark{0%{opacity:0;transform:translateY(6px) scale(.6)}30%{opacity:.9;transform:translateY(-4px) scale(1)}75%{opacity:.9}100%{opacity:0;transform:translateY(-16px) scale(1)}}
      @keyframes cbNod{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(3px) rotate(1.5deg)}}
      @keyframes cbTilt{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(4deg)}}
      @keyframes cbBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
      @keyframes cbBubbleIn{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}
      #cbw *{box-sizing:border-box;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
      #cbw{position:fixed;right:26px;bottom:22px;z-index:2147483000;width:380px;max-width:calc(100vw - 40px);display:flex;flex-direction:column;align-items:flex-end;pointer-events:none}
      #cbw-win{pointer-events:none;width:100%;height:0;background:#fff;border-radius:26px;overflow:hidden;border:1px solid rgba(255,255,255,.6);box-shadow:0 2px 8px rgba(43,22,120,.08),0 18px 40px rgba(43,22,120,.16),0 44px 90px rgba(43,22,120,.22);display:flex;flex-direction:column;transform-origin:bottom right;transition:opacity .24s ease,transform .28s cubic-bezier(.2,.9,.25,1),height .28s cubic-bezier(.2,.9,.25,1);opacity:0;transform:translateY(14px) scale(.94);margin-bottom:-12px}
      #cbw.on #cbw-win{pointer-events:auto;opacity:1;transform:none;margin-bottom:2px}
      #cbw-hd{position:relative;background:radial-gradient(130% 150% at 14% -20%,rgba(255,255,255,.32),rgba(255,255,255,0) 58%),linear-gradient(135deg,#7C5CFA 0%,#5B3EE0 52%,#3F22BE 100%);padding:14px 18px 14px 84px;height:64px;flex-shrink:0;display:flex;align-items:center;gap:12px;color:#fff}
      #cbw-hd .t{font-size:15.5px;font-weight:800;letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #cbw-hd .s{font-size:11.5px;opacity:.85;display:flex;align-items:center;gap:6px;font-weight:600;margin-top:2px}
      #cbw-hd .p{width:7px;height:7px;border-radius:50%;background:#4ADE80;box-shadow:0 0 0 3px rgba(74,222,128,.25)}
      #cbw-x{margin-left:auto;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.18);color:#fff;width:32px;height:32px;border-radius:11px;cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      #cbw-m{flex:1;min-height:0;overflow-y:auto;padding:20px 18px;display:flex;flex-direction:column;gap:10px;background:radial-gradient(90% 50% at 50% 0%,#FFF 0%,#FAF8FF 45%,#F4F1FE 100%)}
      .cbw-u{align-self:flex-end;max-width:80%;background:linear-gradient(135deg,#8161FB,#4C2CD4);color:#fff;padding:11px 16px;border-radius:20px 20px 6px 20px;font-size:14px;line-height:1.55;white-space:pre-wrap;animation:cbRise .25s ease;box-shadow:0 8px 18px rgba(76,49,214,.26)}
      .cbw-a{align-self:flex-start;max-width:86%;background:#fff;border:1px solid #EFEBFD;color:#2E2657;padding:11px 16px;border-radius:20px 20px 20px 6px;font-size:14px;line-height:1.55;white-space:pre-wrap;animation:cbRise .25s ease;box-shadow:0 8px 20px rgba(43,22,120,.07)}
      .cbw-cita{align-self:flex-start;background:#F1FBF6;border:1px solid #B6ECCF;border-radius:16px;padding:12px 15px;font-size:13px;color:#0f7a48;max-width:90%}
      .cbw-cita a{display:inline-block;margin-top:9px;background:linear-gradient(135deg,#7C5CFA,#4C31D6);color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:8px 13px;border-radius:9px}
      .cbw-typ{align-self:flex-start;background:#fff;border:1px solid #EBE6FB;padding:13px 16px;border-radius:18px;border-bottom-left-radius:6px;display:flex;gap:5px}
      .cbw-typ span{width:7px;height:7px;border-radius:50%;background:#A78BFA;animation:cbDot 1.2s infinite}
      .cbw-typ span:nth-child(2){animation-delay:.15s}.cbw-typ span:nth-child(3){animation-delay:.3s}
      #cbw-c{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 12px;background:#F5F3FF;flex-shrink:0}
      .cbw-chip{background:#fff;border:1px solid #E3DDF8;color:#5B3EE0;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;cursor:pointer}
      .cbw-chip:hover{background:#6C4BF6;color:#fff;border-color:#6C4BF6}
      .cbw-chip.wa{color:#16a34a;border-color:#bbf7d0}.cbw-chip.wa:hover{background:#16a34a;color:#fff}
      #cbw-e{display:flex;align-items:flex-end;gap:10px;padding:12px 14px;background:#fff;border-top:1px solid #F1EDFD;flex-shrink:0}
      #cbw-i{flex:1;border:1px solid #E8E3F9;border-radius:21px;padding:12px 16px;font-size:14px;line-height:1.4;outline:none;resize:none;max-height:96px;background:#F9F7FF;color:#241B4D}
      #cbw-i:focus{border-color:#8161FB;background:#fff;box-shadow:0 0 0 3px rgba(129,97,251,.15)}
      #cbw-snd{width:44px;height:44px;border-radius:50%;border:none;background:linear-gradient(135deg,#7C5CFA,#4C31D6);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 18px rgba(76,49,214,.3)}
      #cbw-pie{text-align:center;font-size:11px;color:#A79FC8;padding:0 0 10px;background:#fff;font-weight:500}
      #cbw-bub{position:absolute;right:8px;bottom:126px;z-index:2;width:192px;background:#fff;border:1px solid #ECE7FB;border-radius:18px;padding:13px 16px;box-shadow:0 14px 34px rgba(43,22,120,.14);animation:cbBubbleIn .4s ease both;pointer-events:none;transition:opacity .25s,transform .25s}
      #cbw.on #cbw-bub{opacity:0;transform:translateY(6px) scale(.96);visibility:hidden;pointer-events:none}
      #cbw-bub .tip{position:absolute;right:26px;bottom:-7px;width:14px;height:14px;background:#fff;transform:rotate(45deg);border-right:1px solid #ECE7FB;border-bottom:1px solid #ECE7FB}
      #cbw-bot{position:absolute;z-index:3;background:none;border:none;padding:0;cursor:pointer;pointer-events:auto;right:2px;bottom:0;width:132px;filter:drop-shadow(0 20px 28px rgba(76,49,214,.32));transition:right .5s cubic-bezier(.34,1.1,.4,1),bottom .5s cubic-bezier(.34,1.1,.4,1),width .5s cubic-bezier(.34,1.1,.4,1),filter .4s}
    </style>
    <div id="cbw-win">
      <div id="cbw-hd"><div style="min-width:0"><div class="t">${esc(CONF.negocio)}</div><div class="s"><span class="p"></span>${esc(CONF.subtitulo||"Asistente virtual · en línea")}</div></div><button id="cbw-x" aria-label="Cerrar">×</button><div style="position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.35),rgba(255,255,255,0))"></div></div>
      <div id="cbw-m"></div>
      <div id="cbw-c"></div>
      <div id="cbw-e"><textarea id="cbw-i" rows="1" placeholder="Escribe tu mensaje..."></textarea><button id="cbw-snd" aria-label="Enviar"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg></button></div>
      <div id="cbw-pie">Asistente con IA · ${esc(CONF.negocio)}</div>
    </div>
    <div id="cbw-bub"><div style="font-size:13.5px;line-height:1.45;color:#3B3268;font-weight:600">${esc(bubbleText)}</div><div class="tip"></div></div>
    <button id="cbw-bot" aria-label="Abrir chat">${robotSVG("idle")}</button>`;
    const $ = s => root.querySelector(s);
    const bot=$("#cbw-bot"), win=$("#cbw-win"), m=$("#cbw-m"), inp=$("#cbw-i"), snd=$("#cbw-snd"), chipBox=$("#cbw-c");
    const hist=[]; let open=false, greeted=false, mood="idle", busy=false, moodTimer=null;
    let humanoAviso=false, lastPoll=new Date().toISOString();
    function setMood(x){ mood=x; bot.innerHTML=robotSVG(x); }
    function reposBot(){ if(open){ const H=winH(); bot.style.right="calc(100% - 80px)"; bot.style.bottom=(H-96)+"px"; bot.style.width="60px"; bot.style.filter="drop-shadow(0 8px 14px rgba(20,8,70,.38))"; }
      else { bot.style.right="2px"; bot.style.bottom="0"; bot.style.width="132px"; bot.style.filter="drop-shadow(0 20px 28px rgba(76,49,214,.32))"; } }
    function setH(){ win.style.height=(open?winH():0)+"px"; }
    window.addEventListener("resize",()=>{ if(open){setH();reposBot();} });
    bot.onclick=()=>open?cerrar():abrir(); $("#cbw-x").onclick=cerrar;
    function abrir(){ open=true; root.classList.add("on"); setH(); reposBot();
      if(!greeted){ greeted=true; setMood("happy"); setTimeout(()=>typeBot(`${saludoHora()} ${CONF.bienvenida||""}`),350); } inp.focus(); }
    function cerrar(){ open=false; root.classList.remove("on"); setH(); reposBot(); setMood("idle"); }
    setTimeout(()=>{ if(!open){ setMood("greeting"); setTimeout(()=>{ if(!open)setMood("idle"); },2600);} },900);
    function pintarChips(){ chipBox.innerHTML=""; if(open&&hist.length===0){ chips.forEach(t=>{const c=el("cbw-chip",t);c.onclick=()=>{chipBox.innerHTML="";enviar(t);};chipBox.appendChild(c);});
      if(CONF.whatsapp){const w=el("cbw-chip wa","💬 Hablar con un asesor");w.onclick=()=>window.open(waLink(),"_blank");chipBox.appendChild(w);} } }
    function el(c,t){const d=document.createElement("div");d.className=c;if(t)d.textContent=t;return d;}
    function user(t){const d=el("cbw-u",t);m.appendChild(d);sc();}
    function typeBot(t){ const d=el("cbw-a","");m.appendChild(d);const p=t.split(" ");let i=0;(function tk(){if(i<p.length){d.textContent+=(i?" ":"")+p[i++];sc();setTimeout(tk,20+Math.random()*26);}else{pintarChips();}})(); }
    function cita(dt){const g="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(`${dt.servicio} — ${CONF.negocio}`)+"&details="+encodeURIComponent(`Cita de ${dt.nombre}\nServicio: ${dt.servicio}\nDía: ${dt.dia} · Hora: ${dt.hora}`);const d=el("cbw-cita");d.innerHTML=`<b>✅ Cita registrada</b><br>Cliente: ${esc(dt.nombre)}<br>Servicio: ${esc(dt.servicio)}<br>Día: ${esc(dt.dia)} · Hora: ${esc(dt.hora)}<br><a href="${g}" target="_blank">📅 Agregar a Google Calendar</a>`;m.appendChild(d);sc();}
    function typ(on){let e=$("#cbw-typ");if(on&&!e){e=el("cbw-typ");e.id="cbw-typ";e.innerHTML="<span></span><span></span><span></span>";m.appendChild(e);sc();}if(!on&&e)e.remove();}
    function sc(){m.scrollTop=m.scrollHeight;}
    inp.addEventListener("input",()=>{inp.style.height="auto";inp.style.height=Math.min(inp.scrollHeight,96)+"px";
      if(inp.value&&mood==="idle")setMood("listening"); if(!inp.value&&mood==="listening")setMood("idle");});
    inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar(inp.value);}});
    snd.onclick=()=>enviar(inp.value);
    async function enviar(t){ t=(t||"").trim(); if(!t||busy)return; chipBox.innerHTML=""; user(t); inp.value=""; inp.style.height="auto";
      hist.push({role:"user",content:t}); busy=true; setMood("thinking"); typ(true);
      const lt=setTimeout(()=>setMood("loading"),1500);
      try{
        const r=await fetch(`${BACKEND}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cliente:CLIENTE,messages:hist,sid:SID})});
        const data=await r.json();
        if(data.humano){ // un asesor humano tomó la conversación
          clearTimeout(lt); busy=false; typ(false); setMood("idle");
          if(!humanoAviso){ humanoAviso=true; typeBot("Un asesor de nuestro equipo continuará esta conversación en un momento 👤"); }
          return;
        }
        let out=(data.text||"Disculpa, no te entendí. ¿Puedes repetir? 🙏").trim();
        hist.push({role:"assistant",content:out});
        const mt=out.match(/\[M:\s*([a-zá-úñ]+)\s*\]/i); if(mt)out=out.replace(/\[M:[^\]]*\]/gi,"").trim();
        let c=null; const cm=out.match(/\[CITA\]([\s\S]*?)\[\/CITA\]/); if(cm){try{c=JSON.parse(cm[1]);}catch(_){}; out=out.replace(/\[CITA\][\s\S]*?\[\/CITA\]/,"").trim();}
        clearTimeout(lt); busy=false; typ(false);
        setMood(MOODMAP[(mt&&mt[1].toLowerCase())]||"happy");
        if(out)typeBot(out); if(c)setTimeout(()=>cita(c),450);
        if(moodTimer)clearTimeout(moodTimer); moodTimer=setTimeout(()=>{ if(!busy)setMood("idle"); },2600);
      }catch(_){ clearTimeout(lt); busy=false; typ(false); setMood("sad"); typeBot("⚠️ Se cortó la conexión. Intenta de nuevo, por favor."); }
    }

    // 👤 Bandeja en vivo: cada 5s revisa si un asesor humano escribió algo
    setInterval(async ()=>{
      if(!open) return;
      try{
        const r = await fetch(`${BACKEND}/chat/nuevos?cliente=${encodeURIComponent(CLIENTE)}&sid=${SID}&desde=${encodeURIComponent(lastPoll)}`);
        const d = await r.json();
        (d.mensajes||[]).forEach(msj=>{
          lastPoll = msj.creado_en;
          const b = el("cbw-a","👤 "+msj.texto);
          b.style.background = "#F0FDF4"; b.style.borderColor = "#BBF7D0";
          m.appendChild(b); sc();
          hist.push({role:"assistant", content: msj.texto});
        });
        if(d.pausado===false && humanoAviso){ humanoAviso=false; } // el bot volvió
      }catch(_){}
    }, 5000);
  }
  function saludoHora(){ const h=new Date().getHours(); return h<12?"¡Buenos días! ☀️":h<19?"¡Buenas tardes! 👋":"¡Buenas noches! 🌙"; }
  function esc(s){return String(s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
})();
