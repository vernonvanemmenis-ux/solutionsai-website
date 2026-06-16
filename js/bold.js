/* SolutionsAI Bold — vanilla JS ports of the design components
   - Globe: interactive canvas globe with continents, cities, travelling streaks
   - SearchPill: focus/submit interactive demo capsule
   Ported from Globe.dc.html and SearchPill.dc.html in the Claude Design handoff. */

(function () {
  'use strict';

  // ───────── GLOBE ─────────
  function initGlobe() {
    const wrap = document.getElementById('bold-globe');
    if (!wrap) return;
    const cv = wrap.querySelector('canvas');
    const glow = wrap.querySelector('.bold-globe-glow');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const PI = Math.PI;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, R = 0, cx = 0, cy = 0, dotS = 1.2;

    let rotY = -0.3, tilt = -0.42, vel = 0, dragging = false, lastX = 0, lastY = 0;
    let mx = -1e4, my = -1e4, hover = 0;
    let hot = false;

    // continent outlines
    const NA = [[-168,65],[-165,60],[-155,58],[-138,59],[-130,55],[-124,48],[-124,40],[-120,34],[-112,30],[-105,23],[-97,16],[-92,15],[-88,16],[-83,10],[-80,9],[-82,22],[-80,25],[-81,30],[-76,35],[-70,42],[-66,45],[-60,47],[-53,48],[-56,53],[-64,60],[-78,63],[-85,70],[-95,69],[-110,69],[-125,71],[-140,70],[-156,71]];
    const GR = [[-45,60],[-30,60],[-20,70],[-22,78],[-40,83],[-58,82],[-55,76],[-50,68]];
    const SA = [[-81,6],[-78,0],[-80,-4],[-75,-14],[-71,-18],[-70,-23],[-71,-30],[-73,-37],[-74,-44],[-72,-50],[-68,-55],[-65,-55],[-64,-42],[-58,-38],[-57,-34],[-48,-25],[-40,-20],[-35,-8],[-35,-5],[-44,-2],[-50,0],[-52,4],[-60,8],[-62,10],[-72,11],[-78,8]];
    const AF = [[-17,15],[-16,21],[-10,28],[-5,32],[10,37],[11,33],[20,32],[25,32],[32,31],[35,28],[43,12],[51,12],[42,-1],[40,-10],[40,-17],[35,-22],[32,-28],[26,-34],[20,-35],[18,-34],[12,-17],[9,-1],[9,4],[5,5],[-4,5],[-8,4],[-13,8]];
    const EU = [[-10,36],[-9,43],[-2,49],[0,51],[4,58],[8,58],[6,62],[12,65],[24,71],[30,70],[28,60],[30,55],[24,57],[20,54],[12,54],[12,45],[18,42],[23,38],[15,38],[14,41],[8,44],[3,43],[-2,37],[-9,37]];
    const AS = [[26,40],[30,45],[37,45],[40,40],[50,40],[48,30],[57,25],[67,25],[70,20],[77,8],[80,8],[80,15],[90,22],[92,21],[98,8],[104,1],[104,10],[109,11],[108,18],[110,21],[122,30],[122,37],[126,34],[130,42],[135,48],[142,46],[143,53],[155,52],[160,60],[170,66],[180,66],[178,69],[160,70],[140,73],[110,74],[100,77],[90,76],[70,73],[60,71],[55,68],[60,55],[55,50],[48,46],[40,46],[35,44],[28,42]];
    const AU = [[113,-22],[114,-34],[121,-34],[129,-32],[138,-35],[140,-38],[147,-38],[150,-37],[153,-28],[146,-19],[142,-11],[136,-12],[130,-12],[126,-14],[122,-18]];
    const CONT = [NA, GR, SA, AF, EU, AS, AU];

    const pip = (lon, lat, poly) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
      }
      return inside;
    };
    const llv = (la, lo) => { const p = la*PI/180, l = lo*PI/180; return { x: Math.cos(p)*Math.sin(l), y: Math.sin(p), z: Math.cos(p)*Math.cos(l) }; };
    const rot = (v) => {
      const x = v.x*Math.cos(rotY) + v.z*Math.sin(rotY);
      const z = -v.x*Math.sin(rotY) + v.z*Math.cos(rotY);
      const y = v.y;
      const y2 = y*Math.cos(tilt) - z*Math.sin(tilt);
      const z2 = y*Math.sin(tilt) + z*Math.cos(tilt);
      return { x: x, y: y2, z: z2 };
    };
    const slerp = (a, b, t) => {
      let d = Math.max(-1, Math.min(1, a.x*b.x + a.y*b.y + a.z*b.z));
      const o = Math.acos(d); if (o < 1e-4) return a;
      const s = Math.sin(o), w1 = Math.sin((1-t)*o)/s, w2 = Math.sin(t*o)/s;
      return { x: a.x*w1 + b.x*w2, y: a.y*w1 + b.y*w2, z: a.z*w1 + b.z*w2 };
    };

    const land = [];
    for (let lat = -78; lat <= 82; lat += 1.8) {
      for (let lon = -180; lon <= 180; lon += 1.8) {
        for (let k = 0; k < CONT.length; k++) { if (pip(lon, lat, CONT[k])) { land.push(llv(lat, lon)); break; } }
      }
    }

    const cities = [
      { n: 'JOHANNESBURG', lat: -26.2, lon: 28.0 },
      { n: 'CAPE TOWN', lat: -33.9, lon: 18.4 },
      { n: 'LAGOS', lat: 6.5, lon: 3.4 },
      { n: 'NAIROBI', lat: -1.29, lon: 36.8 },
      { n: 'LONDON', lat: 51.5, lon: -0.1 },
      { n: 'NEW YORK', lat: 40.7, lon: -74 },
      { n: 'SAN FRANCISCO', lat: 37.77, lon: -122.4 },
      { n: 'SÃO PAULO', lat: -23.5, lon: -46.6 },
      { n: 'DUBAI', lat: 25.2, lon: 55.3 },
      { n: 'MUMBAI', lat: 19.07, lon: 72.8 },
      { n: 'SINGAPORE', lat: 1.35, lon: 103.8 },
      { n: 'TOKYO', lat: 35.7, lon: 139.7 },
      { n: 'SYDNEY', lat: -33.9, lon: 151.2 },
      { n: 'BERLIN', lat: 52.5, lon: 13.4 },
      { n: 'PARIS', lat: 48.85, lon: 2.35 },
      { n: 'HONG KONG', lat: 22.3, lon: 114.2 },
    ];
    const cv2 = cities.map(c => llv(c.lat, c.lon));

    const streaks = [];
    const MAX_STREAKS = 6;
    let spawnT = 0;
    const mkStreak = () => {
      let i = Math.floor(Math.random() * cities.length), j = Math.floor(Math.random() * cities.length), g = 0;
      while (j === i && g++ < 12) j = Math.floor(Math.random() * cities.length);
      const a = cv2[i], b = cv2[j], seg = 56, base = [];
      for (let s = 0; s <= seg; s++) { const tt = s / seg; const p = slerp(a, b, tt); const h = 1 + 0.26 * Math.sin(PI * tt); base.push({ x: p.x*h, y: p.y*h, z: p.z*h }); }
      return { base: base, seg: seg, head: 0, speed: 0.42 + Math.random() * 0.34, tail: 0.3 };
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W*dpr; cv.height = H*dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.45; cx = W/2; cy = H/2;
      dotS = Math.max(1.0, R * 0.0058);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('pointerdown', (e) => { dragging = true; vel = 0; const p = pt(e); lastX = p.x; lastY = p.y; try { cv.setPointerCapture(e.pointerId); } catch (err) {} });
    cv.addEventListener('pointermove', (e) => {
      const p = pt(e); mx = p.x; my = p.y;
      if (dragging) {
        const dx = p.x - lastX, dy = p.y - lastY;
        rotY += dx * 0.007;
        tilt = Math.max(-1.2, Math.min(0.65, tilt + dy * 0.006));
        vel = dx * 0.007;
        lastX = p.x; lastY = p.y;
      }
    });
    cv.addEventListener('pointerenter', () => { hot = true; });
    cv.addEventListener('pointerleave', () => { hot = false; mx = -1e4; my = -1e4; });
    window.addEventListener('pointerup', () => { dragging = false; });

    let last = performance.now();
    const SPOT = () => R * 0.07;

    // theme detection — reads <html data-theme> each frame so the toggle is live
    const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

    const draw = (now) => {
      const dt = now - last; last = now;
      if (!dragging) { rotY += 0.00015 * dt + vel; vel *= 0.95; }
      const target = hot ? 1 : 0;
      hover += (target - hover) * 0.08;
      if (glow) glow.style.opacity = (1 + hover * 0.9).toFixed(2);

      ctx.clearRect(0, 0, W, H);
      const L = isLight();
      const spot = SPOT(), spot2 = spot * spot;
      const lift = 0.74 + 0.30 * hover;

      // sphere body radial gradient (theme-tuned)
      const grd = ctx.createRadialGradient(cx - R*0.3, cy - R*0.35, R*0.1, cx, cy, R);
      if (L) {
        grd.addColorStop(0, 'rgba(120,170,240,' + (0.32 + 0.16*hover).toFixed(3) + ')');
        grd.addColorStop(0.7, 'rgba(80,130,210,0.16)');
        grd.addColorStop(1, 'rgba(50,100,180,0.04)');
      } else {
        grd.addColorStop(0, 'rgba(30,60,120,' + (0.22 + 0.12*hover).toFixed(3) + ')');
        grd.addColorStop(0.7, 'rgba(12,24,52,0.18)');
        grd.addColorStop(1, 'rgba(8,14,28,0)');
      }
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*PI); ctx.fillStyle = grd; ctx.fill();

      // lat/lon graticule
      ctx.lineWidth = 1;
      const poly = (pts) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i+1];
          if (a.z > 0 && b.z > 0) {
            const baseA = (0.04 + 0.06 * ((a.z + b.z) / 2)) * lift;
            // ~3x stronger in light mode so the grid is actually visible
            ctx.strokeStyle = L
              ? 'rgba(37,99,176,' + (baseA * 3.0).toFixed(3) + ')'
              : 'rgba(61,139,255,' + baseA.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(cx + a.x*R, cy - a.y*R); ctx.lineTo(cx + b.x*R, cy - b.y*R); ctx.stroke();
          }
        }
      };
      for (let lat = -60; lat <= 60; lat += 30) { const pts = []; for (let lo = -180; lo <= 180; lo += 9) pts.push(rot(llv(lat, lo))); poly(pts); }
      for (let lo = -180; lo < 180; lo += 30) { const pts = []; for (let la = -85; la <= 85; la += 9) pts.push(rot(llv(la, lo))); poly(pts); }

      // continents (dotted land) — dark dots in light mode, light dots in dark mode
      for (let i = 0; i < land.length; i++) {
        const p = rot(land[i]);
        if (p.z > 0.04) {
          const x = cx + p.x*R, y = cy - p.y*R;
          let a = (0.15 + 0.30 * p.z) * lift;
          let bright = 0;
          if (hot) {
            const ddx = x - mx, ddy = y - my, d2 = ddx*ddx + ddy*ddy;
            if (d2 < spot2) { bright = Math.pow(1 - Math.sqrt(d2) / spot, 0.7); a += bright * 2.2; }
          }
          if (a > 1) a = 1;
          if (L) {
            // darker land dots with hover spotlight pushing toward bright accent blue
            const ra = Math.max(0, 30 - bright*15);
            const ga = Math.max(0, 60 - bright*10);
            const ba = Math.min(255, 130 + bright*120);
            ctx.fillStyle = 'rgba(' + Math.round(ra) + ',' + Math.round(ga) + ',' + Math.round(ba) + ',' + Math.min(1, a*1.6).toFixed(3) + ')';
            if (bright > 0.15) { ctx.shadowColor = 'rgba(61,139,255,' + (0.7*bright).toFixed(3) + ')'; ctx.shadowBlur = 6 * bright; }
          } else {
            ctx.fillStyle = 'rgba(' + Math.round(150 + bright*105) + ',' + Math.round(200 + bright*55) + ',255,' + a.toFixed(3) + ')';
            if (bright > 0.15) { ctx.shadowColor = 'rgba(150,200,255,' + (0.8*bright).toFixed(3) + ')'; ctx.shadowBlur = 6 * bright; }
          }
          const s = dotS * (1 + bright * 1.8);
          ctx.fillRect(x - s/2, y - s/2, s, s);
          ctx.shadowBlur = 0;
        }
      }

      // rim
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*PI);
      ctx.strokeStyle = L
        ? 'rgba(37,99,176,' + (0.42 + 0.30*hover).toFixed(3) + ')'
        : 'rgba(61,139,255,' + (0.22 + 0.25*hover).toFixed(3) + ')';
      ctx.lineWidth = 1; ctx.stroke();

      // travelling connection streaks
      spawnT -= dt;
      if (streaks.length < MAX_STREAKS && spawnT <= 0) { streaks.push(mkStreak()); spawnT = 320 + Math.random() * 680; }
      for (let si = streaks.length - 1; si >= 0; si--) {
        const st = streaks[si];
        st.head += st.speed * dt / 1000;
        if (st.head - st.tail > 1) { streaks.splice(si, 1); continue; }
        const seg = st.seg, h0 = Math.max(0, st.head - st.tail), h1 = Math.min(1, st.head);
        const i0 = Math.floor(h0 * seg), i1 = Math.min(seg, Math.ceil(h1 * seg));
        for (let i = i0; i < i1; i++) {
          const p = rot(st.base[i]), q = rot(st.base[i + 1]);
          if (p.z > 0 && q.z > 0) {
            const fade = Math.max(0, Math.min(1, ((i / seg) - h0) / st.tail));
            const a = fade * 0.9 * lift * (0.5 + 0.5 * ((p.z + q.z) / 2));
            ctx.strokeStyle = L
              ? 'rgba(37,99,176,' + Math.min(1, a*1.4).toFixed(3) + ')'
              : 'rgba(130,185,255,' + a.toFixed(3) + ')';
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(cx + p.x*R, cy - p.y*R); ctx.lineTo(cx + q.x*R, cy - q.y*R); ctx.stroke();
          }
        }
        if (st.head <= 1) {
          const hp = rot(st.base[Math.min(seg, Math.round(st.head * seg))]);
          if (hp.z > 0) {
            const x = cx + hp.x*R, y = cy - hp.y*R;
            ctx.beginPath(); ctx.arc(x, y, 2.1, 0, 2*PI);
            ctx.fillStyle = L
              ? 'rgba(11,17,32,' + (0.85 * lift).toFixed(3) + ')'
              : 'rgba(225,238,255,' + (0.85 * lift).toFixed(3) + ')';
            ctx.shadowColor = L ? 'rgba(37,99,176,0.95)' : 'rgba(130,185,255,0.95)';
            ctx.shadowBlur = 9; ctx.fill(); ctx.shadowBlur = 0;
          }
        }
      }

      // city markers
      cv2.forEach((v, i) => {
        const p = rot(v);
        if (p.z > 0) {
          const x = cx + p.x*R, y = cy - p.y*R, a = (0.35 + 0.6*p.z) * lift;
          ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 2*PI);
          if (L) {
            // warm orange dot for visibility against light bg
            ctx.fillStyle = 'rgba(217,119,6,' + Math.min(1, a*1.2).toFixed(3) + ')';
            ctx.shadowColor = 'rgba(245,158,11,0.85)';
          } else {
            ctx.fillStyle = 'rgba(255,243,224,' + Math.min(1, a).toFixed(3) + ')';
            ctx.shadowColor = 'rgba(255,226,176,0.85)';
          }
          ctx.shadowBlur = 11; ctx.fill(); ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(x, y, 5 + 1.5*Math.sin(now*0.004 + i), 0, 2*PI);
          ctx.strokeStyle = L
            ? 'rgba(37,99,176,' + (0.45*a).toFixed(3) + ')'
            : 'rgba(61,139,255,' + (0.32*a).toFixed(3) + ')';
          ctx.lineWidth = 1; ctx.stroke();
          if (p.z > 0.5 && hover > 0.25) {
            ctx.font = '600 9px "JetBrains Mono", monospace';
            ctx.fillStyle = L
              ? 'rgba(11,17,32,' + Math.min(1, (hover - 0.2) * a * 1.3).toFixed(3) + ')'
              : 'rgba(255,243,224,' + Math.min(1, (hover - 0.2) * a * 1.3).toFixed(3) + ')';
            ctx.fillText(cities[i].n, x + 8, y + 3);
          }
        }
      });

      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // ───────── SEARCH PILL ─────────
  function initSearchPill() {
    const wrap = document.getElementById('bold-search');
    if (!wrap) return;
    const input = wrap.querySelector('input');
    const submitBtn = wrap.querySelector('.bold-search-submit');
    const chips = wrap.querySelector('.bold-search-chips');
    const responsePanel = wrap.querySelector('.bold-search-response');
    const thinkingEl = wrap.querySelector('.bold-search-thinking');
    const answerEl = wrap.querySelector('.bold-search-answer');
    const resetBtn = wrap.querySelector('.bold-search-reset');
    if (!input || !chips || !responsePanel) return;

    let blurT = null, ansT = null;
    let phase = 'idle';

    const setPhase = (p) => {
      phase = p;
      chips.style.display = (phase === 'idle' && document.activeElement === input) ? 'flex' : 'none';
      responsePanel.style.display = (phase === 'idle') ? 'none' : 'block';
      if (thinkingEl) thinkingEl.style.display = (phase === 'thinking') ? 'flex' : 'none';
      if (answerEl) answerEl.style.display = (phase === 'answered') ? 'block' : 'none';
    };

    // Keyword-routed responses. Each topic has match keywords + a tailored
    // answer. We score against the user's question, pick the best match, and
    // fall back to a generic answer only if nothing scores.
    const TOPICS = [
      {
        key: 'invoice',
        kw: ['invoice','invoicing','bill','billing','accounts payable','ap','accounts receivable','ar','receipt','receipts','expense','expenses','accounting','bookkeep','xero','quickbooks','sage'],
        ans: 'Invoice and AP work is one of the highest-ROI places to put AI to work. Typical build: an agent reads the incoming PDF, extracts vendor / line items / VAT / due date, validates against your PO, and writes the result straight into Xero / Sage / QuickBooks. Errors flag for a human; everything else clears in seconds. We usually ship the first version in 2–3 weeks and have it processing 80–90% of invoices unattended within a month. Book a strategy call and we’ll size yours.'
      },
      {
        key: 'voice',
        kw: ['voice','call','calls','phone','phones','telephone','booking','book','appointment','appointments','schedule','reservation','reception','receptionist','call center','call centre','ivr','answering','vapi','elevenlabs','outbound','inbound','reminder','reminders'],
        ans: 'Voice agents are surprisingly good now. We build inbound agents that handle bookings, FAQs, and triage 24/7, and outbound agents for reminders, lead qualification, and re-engagement — all wired into your calendar and CRM so they actually create appointments, not just transcripts. Most clients sound the first version into production in 3–4 weeks. Book a strategy call and we’ll talk through your specific call flows.'
      },
      {
        key: 'support',
        kw: ['support','customer support','helpdesk','help desk','tickets','ticketing','chat','chatbot','live chat','crm','zendesk','intercom','freshdesk','escalation','refund','refunds','returns','order tracking','customer service'],
        ans: 'Customer support is where the AI adoption gap shows up first. We build a chat agent that handles the 60–80% of tickets that are repetitive (order status, returns, refunds, FAQ), escalates the rest to humans with full context, and writes summaries back into your CRM (Zendesk, Intercom, Freshdesk, HubSpot). The result: faster response times, higher CSAT, and a support team that only handles the work humans should be handling. Book a strategy call and we’ll map your ticket categories.'
      },
      {
        key: 'data',
        kw: ['data','analytics','dashboard','dashboards','report','reports','reporting','kpi','kpis','metric','metrics','bi','business intelligence','etl','warehouse','tableau','power bi','looker','predictive','forecast','forecasting'],
        ans: 'AI on top of your data only works if the data is reachable. We start by mapping where your business data actually lives (your ops tools, your CRM, your spreadsheets), wire the pipes, and then build the AI layer on top — automated dashboards that explain themselves, KPI agents that flag anomalies before a human notices, or predictive models on top of your sales pipeline. Most reporting work that consumes a full FTE today can be reduced to a Slack message. Book a strategy call and we’ll scope it.'
      },
      {
        key: 'training',
        kw: ['training','train','learn','learning','workshop','workshops','upskill','upskilling','enable','enablement','team','team training','fluency','chatgpt','claude','copilot','prompt','prompts','prompt engineering','champion','champions','curriculum','course','onboarding','bootcamp'],
        ans: 'Training is often the unlock — 86% of employees have or could easily acquire AI skills, but only ~25% use them daily. We close that gap with AI Workshops, prompt engineering bootcamps, executive briefings, and internal AI Champion programs tailored to your industry. Most teams leave the first workshop with three concrete workflows they can act on the same week. Book a strategy call and we’ll scope a programme.'
      },
      {
        key: 'start',
        kw: ['start','begin','first','where','what','new to','don\'t know','dont know','no idea','help','how do i','where do i','overwhelmed','confused','lost'],
        ans: 'Honestly — most clients start with an AI Workshop. One short session to align your team on what AI can and can\'t do, look at your actual workflows, and leave with the two or three opportunities that are worth building first. From there it\'s a Blueprint (2–6 weeks, board-ready business case) and then the first build. No commitment to the bigger steps; the Workshop pays for itself in clarity. Book a strategy call and we\'ll set one up.'
      },
      {
        key: 'agent',
        kw: ['agent','agents','automation','automate','workflow','workflows','multi-agent','autonomous','ai agent'],
        ans: 'Agents are our home base. We build custom AI agents that run inside your stack (Slack, your CRM, your ops tools), handle specific workflows end-to-end, and escalate cleanly when they hit something they shouldn\'t decide. Most useful where you have a process that\'s repeatable but currently consumes someone\'s full attention — lead qualification, document processing, ops triage, scheduling, internal Q&A. Most first builds ship in 2–4 weeks. Book a strategy call and we\'ll pick the right one to start.'
      },
      {
        key: 'app',
        kw: ['app','application','custom app','web app','mobile','platform','software','build me','tool','portal','internal tool'],
        ans: 'When the off-the-shelf option doesn\'t fit, we build the application around your operations rather than the other way around. Web apps, mobile apps, internal tools, customer portals — all with AI baked in where it earns its keep. Typical project: 6–12 weeks from kickoff to production. Book a strategy call and we\'ll talk through scope.'
      },
      {
        key: 'cost',
        kw: ['cost','costs','price','pricing','how much','expensive','budget','quote','quotation','rand','dollar','dollars'],
        ans: 'Depends on scope. An AI Workshop is a few thousand Rand. An AI Blueprint (2–6 weeks, board-ready business case) typically runs R150K–R400K. Custom AI Projects are scoped per engagement. Long-term Technology Partnerships are retainer-based and tied to outcomes. The cheapest mistake we see clients make is building before they\'ve scoped — the Blueprint avoids that. Book a strategy call and we\'ll size yours in 30 minutes.'
      },
      {
        key: 'time',
        kw: ['how long','time','timeline','duration','weeks','months','when','fast','quick','soon','urgent'],
        ans: 'A Workshop is delivered in a week. A Blueprint runs 2–6 weeks. A focused Custom AI Project — one workflow, deployed and adopted — typically takes 6–12 weeks from kickoff to production. A Technology Partnership is ongoing with monthly shipping milestones. The biggest predictor of speed is how clean your existing data and processes already are. Book a strategy call and we can give you a real timeline against your scope.'
      },
      {
        key: 'industry',
        kw: ['industry','industries','sector','vertical','niche','manufacturing','retail','logistics','legal','medical','health','healthcare','finance','financial','insurance','real estate','property','dental','hospitality','restaurant','e-commerce','ecommerce','saas','b2b','b2c'],
        ans: 'We\'re industry-agnostic — but only because we niche by process, not by sector. The same back-office automation pattern that worked for a logistics firm in Joburg works for a property manager in Cape Town once the underlying workflow is mapped. We\'re happy to share what\'s worked in your sector on a call. Book a strategy call and we\'ll talk through it.'
      },
      {
        key: 'where',
        kw: ['where','location','based','johannesburg','joburg','jhb','cape town','pretoria','durban','south africa','remote','global','international','africa'],
        ans: 'Based in Johannesburg, serving teams across South Africa and remote-first worldwide. Workshops, diagnostics, and project delivery happen over video calls and shared tooling — we have clients across SA and internationally. In-person workshops happen anywhere in Gauteng or we fly in when it\'s warranted. Book a strategy call to talk through your setup.'
      },
    ];

    const craft = (q) => {
      const clean = q.replace(/\s+/g, ' ').trim();
      const short = clean.length > 90 ? clean.slice(0, 88) + '…' : clean;
      const lq = clean.toLowerCase();
      let best = null, bestScore = 0;
      for (const t of TOPICS) {
        let score = 0;
        for (const k of t.kw) {
          if (lq.indexOf(k) !== -1) score += (k.length > 6 ? 2 : 1);
        }
        if (score > bestScore) { bestScore = score; best = t; }
      }
      if (best) {
        return 'On "' + short + '" — ' + best.ans;
      }
      return 'On "' + short + '" — here’s how we\'d move: we map the workflow, pinpoint the highest-ROI steps, then ship a custom AI agent wired into your existing tools. Most builds go live in 2–3 weeks. Book a strategy call and we’ll scope it together.';
    };

    const submit = () => {
      const q = (input.value || '').trim();
      if (!q) { input.focus(); return; }
      clearTimeout(ansT);
      setPhase('thinking');
      ansT = setTimeout(() => {
        if (answerEl) answerEl.querySelector('.bold-search-answer-text').textContent = craft(q);
        setPhase('answered');
      }, 1150);
    };

    input.addEventListener('focus', () => {
      clearTimeout(blurT);
      if (phase === 'idle') chips.style.display = 'flex';
    });
    input.addEventListener('blur', () => {
      blurT = setTimeout(() => {
        if (phase === 'idle') chips.style.display = 'none';
      }, 160);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

    if (submitBtn) submitBtn.addEventListener('click', submit);

    const pick = (text) => { input.value = text; input.focus(); submit(); };
    chips.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', () => pick(b.textContent.trim()));
    });

    if (resetBtn) resetBtn.addEventListener('click', () => {
      clearTimeout(ansT);
      input.value = '';
      setPhase('idle');
      input.focus();
    });

    setPhase('idle');
  }

  // ───────── LOGO SWAP ON THEME CHANGE ─────────
  // Swap the nav + footer logo to a light-bg variant when the user flips to
  // light mode (the dark-bg logo has white text and goes invisible on white).
  function initLogoSwap() {
    const LOGO_DARK = 'assets/logo-dark-bg.png';   // blue icon + white text (for dark bg)
    const LOGO_LIGHT = 'assets/logo-primary.png';  // blue icon + dark text (for light bg)
    const targets = document.querySelectorAll('.nav-logo-img, .footer-logo-img');
    if (!targets.length) return;
    const apply = () => {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const src = light ? LOGO_LIGHT : LOGO_DARK;
      targets.forEach((img) => {
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      });
    };
    apply();
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.attributeName === 'data-theme') { apply(); break; }
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initGlobe(); initSearchPill(); initLogoSwap(); });
  } else {
    initGlobe(); initSearchPill(); initLogoSwap();
  }
})();
