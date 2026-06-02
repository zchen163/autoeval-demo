// demo.jsx — self-running demo autopilot. Drives the REAL app: moves a cursor,
// spotlights the next control, shows a caption, clicks it. Records cleanly.
(function () {
  // ---------------- low-level helpers ----------------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const vis = (el) => el && el.offsetParent !== null && el.getClientRects().length > 0;
  function findText(txt, { contains = false, tag = null } = {}) {
    const sel = tag || "button, a, [role=button], div, span, h1, h2, h3";
    const nodes = [...document.querySelectorAll(sel)];
    // prefer the most specific (deepest / shortest text) match
    let best = null;
    for (const el of nodes) {
      if (!vis(el)) continue;
      const t = (el.textContent || "").trim();
      const ok = contains ? t.includes(txt) : t === txt;
      if (!ok) continue;
      if (!best || t.length < best.t.length) best = { el, t };
    }
    return best && best.el;
  }
  async function poll(fn, timeout = 16000, interval = 200) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { const v = fn(); if (v) return v; await sleep(interval); }
    return null;
  }
  function scrollInto(el) {
    let p = el.parentElement;
    while (p) {
      const s = getComputedStyle(p).overflowY;
      if ((s === "auto" || s === "scroll") && p.scrollHeight > p.clientHeight + 4) {
        const er = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
        if (er.top < pr.top + 40 || er.bottom > pr.bottom - 40) p.scrollTop += (er.top - pr.top) - pr.height / 2 + er.height / 2;
        break;
      }
      p = p.parentElement;
    }
  }

  // ---------------- host UI (cursor, spotlight, caption) ----------------
  let host, cursor, ring, capScene, capText, capIdx, playBtn, chapWrap;
  const state = { scene: 0, idx: 0, total: 0, paused: false, resumeFns: [], done: false };

  function buildHost() {
    if (host) return;
    host = document.createElement("div");
    host.id = "ae-demo-host";
    host.innerHTML = `
      <div class="aed-ring"></div>
      <div class="aed-cursor"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l6 16 2.5-6.5L19 9z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg></div>
      <div class="aed-bar">
        <div class="aed-chaps"></div>
        <div class="aed-main">
          <button class="aed-play" title="Play / Pause"></button>
          <div class="aed-txtwrap"><div class="aed-scene"></div><div class="aed-text"></div></div>
          <button class="aed-restart" title="Restart scene">↻</button>
          <button class="aed-exit" title="Exit demo">✕</button>
        </div>
      </div>`;
    const css = document.createElement("style");
    css.textContent = `
      #ae-demo-host{position:fixed;inset:0;z-index:99998;pointer-events:none;font-family:'Hanken Grotesk',system-ui,sans-serif}
      #ae-demo-host .aed-ring{position:fixed;border:2.5px solid #6366f1;border-radius:10px;box-shadow:0 0 0 9999px rgba(8,10,20,.46);transition:all .42s cubic-bezier(.22,1,.36,1);opacity:0;pointer-events:none}
      #ae-demo-host .aed-cursor{position:fixed;top:0;left:0;transition:transform .72s cubic-bezier(.5,0,.2,1);filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));z-index:99999;opacity:0}
      #ae-demo-host .aed-cursor.on{opacity:1}
      #ae-demo-host .aed-bar{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);pointer-events:auto;display:flex;flex-direction:column;gap:8px;align-items:center;width:min(680px,92vw)}
      #ae-demo-host .aed-chaps{display:flex;gap:6px}
      #ae-demo-host .aed-chap{font-size:11px;font-weight:700;letter-spacing:.02em;padding:5px 12px;border-radius:99px;background:rgba(20,22,34,.82);color:#aaa;border:1px solid rgba(255,255,255,.1);cursor:pointer;backdrop-filter:blur(8px)}
      #ae-demo-host .aed-chap.on{background:#6366f1;color:#fff;border-color:transparent}
      #ae-demo-host .aed-main{display:flex;align-items:center;gap:12px;background:#111322;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:11px 14px;box-shadow:0 12px 40px rgba(0,0,0,.45);width:100%}
      #ae-demo-host .aed-play,#ae-demo-host .aed-restart,#ae-demo-host .aed-exit{flex-shrink:0;width:34px;height:34px;border-radius:9px;border:none;background:rgba(255,255,255,.1);color:#fff;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center}
      #ae-demo-host .aed-play{background:#6366f1;font-size:13px}
      #ae-demo-host .aed-txtwrap{flex:1;min-width:0}
      #ae-demo-host .aed-scene{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8b8ff5}
      #ae-demo-host .aed-text{font-size:13.5px;line-height:1.4;margin-top:2px}
      #ae-demo-host .aed-launch{position:fixed;right:22px;bottom:22px;pointer-events:auto;background:#6366f1;color:#fff;border:none;border-radius:99px;padding:12px 18px;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 10px 30px rgba(79,70,229,.5);display:flex;gap:8px;align-items:center}
    `;
    document.head.appendChild(css);
    document.body.appendChild(host);
    cursor = host.querySelector(".aed-cursor"); ring = host.querySelector(".aed-ring");
    capScene = host.querySelector(".aed-scene"); capText = host.querySelector(".aed-text");
    playBtn = host.querySelector(".aed-play"); chapWrap = host.querySelector(".aed-chaps");
    playBtn.textContent = "❚❚";
    playBtn.onclick = togglePause;
    host.querySelector(".aed-restart").onclick = () => startScene(state.scene);
    host.querySelector(".aed-exit").onclick = exitDemo;
    const chaps = [[1, "A · Offline eval"], [8, "B · Online monitoring"]];
    chaps.forEach(([n, label]) => { const b = document.createElement("button"); b.className = "aed-chap"; b.dataset.scene = n; b.textContent = label; b.onclick = () => startScene(n); chapWrap.appendChild(b); });
  }
  function markChapter() { [...chapWrap.children].forEach((c) => c.classList.toggle("on", +c.dataset.scene === state.scene)); }

  function moveCursor(el) {
    const r = el.getBoundingClientRect();
    cursor.classList.add("on");
    cursor.style.transform = `translate(${r.left + r.width / 2}px,${r.top + r.height / 2}px)`;
  }
  function spot(el) {
    const r = el.getBoundingClientRect(); const pad = 6;
    ring.style.opacity = "1";
    ring.style.left = (r.left - pad) + "px"; ring.style.top = (r.top - pad) + "px";
    ring.style.width = (r.width + pad * 2) + "px"; ring.style.height = (r.height + pad * 2) + "px";
  }
  const clearSpot = () => { ring.style.opacity = "0"; };

  function setCaption(step) { capScene.textContent = step.chapter || ""; capText.textContent = step.cap || ""; }
  function togglePause() { state.paused = !state.paused; playBtn.textContent = state.paused ? "▶" : "❚❚"; if (!state.paused) { state.resumeFns.forEach((f) => f()); state.resumeFns = []; } }
  const waitResume = () => new Promise((r) => state.resumeFns.push(r));

  // ---------------- actions ----------------
  async function actClick(finder, { after = 950, optional = false } = {}) {
    const el = await poll(finder, optional ? 4000 : 16000);
    if (!el) return false;
    scrollInto(el); await sleep(180);
    moveCursor(el); await sleep(720); spot(el); await sleep(440);
    el.click(); await sleep(after); clearSpot();
    return true;
  }
  async function actSpot(finder, dur = 2600) {
    const el = await poll(finder, 8000);
    if (el) { scrollInto(el); await sleep(150); moveCursor(el); await sleep(600); spot(el); }
    await sleep(dur); clearSpot();
  }
  const T = (txt, opt) => () => findText(txt, opt);
  const findInput = (ph) => () => [...document.querySelectorAll("input,textarea")].find((i) => vis(i) && i.placeholder && i.placeholder.toLowerCase().includes(ph));
  async function actType(finder, text, { enter = true, after = 1100 } = {}) {
    const el = await poll(finder, 12000);
    if (!el) return false;
    scrollInto(el); await sleep(150); moveCursor(el); await sleep(500); spot(el); await sleep(300);
    const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    el.focus();
    // set value in chunks (whole words) — robust against React controlled inputs
    const setVal = (v) => { setter.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
    const words = text.split(" ");
    let acc = "";
    for (let i = 0; i < words.length; i++) { acc += (i ? " " : "") + words[i]; setVal(acc); await sleep(90); }
    setVal(text); await sleep(420);
    if (enter) el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, which: 13, bubbles: true }));
    await sleep(after); clearSpot();
    return true;
  }
  const askComposer = (text) => actType(findInput("tell the agent"), text);

  // ---------------- scripts ----------------
  function buildScript(scene) {
    if (scene === 1) return [...sceneT1(), ...sceneT2(), ...sceneT3()]; // A · Offline eval
    if (scene === 8) return sceneReview();                              // B · Online monitoring
    return [...sceneT1(), ...sceneT2(), ...sceneT3()];                  // default = Offline
  }

  // ---- returning customer: log in → review prod logs → rubric suggestions → flag for review ----
  function sceneReview() {
    return [
      { chapter: "Daily review", cap: "Returning customer signs in to start the daily check-in.", run: () => sleep(2200) },
      { chapter: "Dashboard", cap: "Ask first — how's this week overall?", run: () => askComposer("show me this week's dashboard") },
      { chapter: "Dashboard", cap: "Recent dashboard — quality score trend, leaderboard, to-dos.", run: () => actSpot(T("Quality score trend", { contains: true }), 3600) },
      { chapter: "Monitor", cap: "Now drill into the continuous rubric monitor.", run: () => askComposer("show me performance over time") },
      { chapter: "Monitor", cap: "Time series per rubric dimension — deployment points marked on the axis.", run: () => actSpot(T("Rubric performance over time", { contains: true }), 3600) },
      { chapter: "Monitor", cap: "Regressions auto-captured and localized to the deploy that broke them.", run: () => actSpot(T("Detected regressions", { contains: true }), 3200) },
      { chapter: "Prod logs", cap: "Now review last week's production logs.", run: () => askComposer("review last week's prod logs") },
      { chapter: "Prod logs", cap: "Have Triage analyze the logs as a whole.", run: () => actClick(T("Analyze all logs", { contains: true, tag: "button" }), { optional: true, after: 1100 }) },
      { chapter: "Prod logs", cap: "Overall log analysis — topic distribution + score distribution; most are healthy.", run: () => actSpot(T("Overall log analysis", { contains: true }), 3400) },
      { chapter: "Rubric suggestions", cap: "Based on this week's logs, which rubric criteria need to change or be added?", run: () => askComposer("suggest rubric updates from these logs") },
      { chapter: "Rubric suggestions", cap: "The agent suggests 3 updates: add refund-compliance, add latency check, tighten groundedness.", run: () => actSpot(T("Suggested updates from this week's logs", { contains: true }), 3800) },
      { chapter: "Rubric suggestions", cap: "Adopt the “add refund-compliance” suggestion.", run: () => actClick(T("Add", { tag: "button" }), { optional: true }) },
      { chapter: "Flag for review", cap: "Which other logs need a human review?", run: () => askComposer("show me the logs flagged for a human") },
      { chapter: "Flag for review", cap: "Triage has ranked them by review value — judge-vs-human disagreements and policy-sensitive cases first.", run: () => actSpot(T("Worth a human's review", { contains: true }), 3600) },
      { chapter: "Flag for review", cap: "Send to the human-review queue with one click.", run: () => actClick(T("Review", { tag: "button" }), { optional: true }) },
      { chapter: "Done", cap: "Daily routine: check trends → review logs → tune rubric → assign humans.", run: () => sleep(2800) },
    ];
  }

  // ---- trace-upload-only variant (onboard via traces → build eval → report) ----
  function sceneT1() {
    return [
      { chapter: "Sign in", cap: "Sign in to AutoEval.", run: () => actClick(T("Sign in", { tag: "button" })) },
      { chapter: "Describe", cap: "Describe in plain English what this agent does.", run: () => actSpot(() => document.querySelector("textarea"), 2800) },
      { chapter: "Describe", cap: "Next.", run: () => actClick(T("Continue", { contains: true, tag: "button" })) },
      { chapter: "Dataset", cap: "A trace is the agent's actual behavior on one input.", run: () => actClick(T("What's a trace?", { contains: true }), { optional: true, after: 1500 }) },
      { chapter: "Dataset", cap: "For this demo, start from production traces — we'll curate a dataset.", run: () => actClick(T("Production traces only", { contains: true, tag: "button" }), { after: 1100 }) },
      { chapter: "Dataset", cap: "Upload traces.zip.", run: () => actClick(T("Drop", { contains: true, tag: "button" })) },
      { chapter: "Dataset", cap: "512 traces parsed; schema auto-detected.", run: () => actSpot(T("512 traces parsed", { contains: true }), 2600) },
      { chapter: "Dataset", cap: "Continue.", run: () => actClick(T("Continue", { contains: true, tag: "button" })) },
      { chapter: "First eval", cap: "Next the agent will: analyze traces → generate rubric set → create dataset → baseline → report.", run: () => sleep(2800) },
      { chapter: "First eval", cap: "Start building.", run: () => actClick(T("Build my first eval", { contains: true, tag: "button" })) },
    ];
  }
  function sceneT2() {
    return [
      { chapter: "Build eval", cap: "Copilot takes over, producing proposals step by step, awaiting my approval at each one.", run: () => poll(() => findText("Looks right", { tag: "button" }) || findText("Analyzed all 512 logs", { contains: true }), 6000).then(() => sleep(500)) },
      { chapter: "Analyze logs", cap: "① Analyze logs as a whole first — topic distribution, score distribution, latency — not just failures.", run: () => actClick(T("Analyzed all 512 logs", { contains: true }), { optional: true }) },
      { chapter: "Analyze logs", cap: "Confirm the analysis.", run: () => actClick(T("Looks right", { tag: "button" })) },
      { chapter: "Rubric", cap: "② Infer rubric criteria from the logs — coverage, helpfulness, tone.", run: () => actClick(() => findText("Rubric — from your logs", { contains: true }), { optional: true }) },
      { chapter: "Rubric", cap: "Approve the rubric.", run: () => actClick(T("Approve", { tag: "button" })) },
      { chapter: "Dataset", cap: "③ Generate a golden dataset based on this rubric.", run: () => actClick(() => findText("Dataset — Support QA v1", { contains: true }), { optional: true }) },
      { chapter: "Dataset", cap: "Approve the dataset.", run: () => actClick(T("Approve", { tag: "button" })) },
      { chapter: "Baseline", cap: "④ Run baseline automatically — scoring in progress…", run: () => poll(T("Top gaps, ranked by impact", { contains: true }), 22000) },
    ];
  }
  function sceneT3() {
    return [
      { chapter: "Report", cap: "Report generated automatically.", run: async () => {
          await poll(T("Top gaps, ranked by impact", { contains: true }), 14000);
          const main = document.querySelector("main");
          if (!main || !main.innerText.includes("Score by rubric dimension")) await actClick(T("results & recommendations", { contains: true }), { optional: true });
          await sleep(700);
        } },
      { chapter: "Report", cap: "Overall score, plus judge agreement and pass rate.", run: () => actSpot(T("Weighted overall", { contains: true }), 2800) },
      { chapter: "Report", cap: "Per-rubric dimension breakdown — strong vs. weak.", run: () => actSpot(T("Score by rubric dimension", { contains: true }), 2600) },
      { chapter: "Report", cap: "Fix suggestions ranked by impact.", run: () => actSpot(T("Top gaps, ranked by impact", { contains: true }), 3000) },
      { chapter: "Done", cap: "Offline eval is live — calibrated rubric, golden dataset, judge, and a baseline report.", run: () => sleep(2800) },
    ];
  }

  // ---------------- engine ----------------
  async function runScript(scene) {
    state.scene = scene; state.done = false; markChapter();
    const steps = buildScript(scene); state.total = steps.length;
    for (let i = 0; i < steps.length; i++) {
      state.idx = i;
      if (state.paused) await waitResume();
      setCaption(steps[i]);
      try { await steps[i].run(); } catch (e) { /* keep going */ }
    }
    state.done = true; clearSpot(); cursor.classList.remove("on");
    capScene.textContent = "Demo complete"; capText.textContent = "Click ↻ to replay this scene, or pick a chapter above.";
  }

  // ---------------- boot / scene control ----------------
  function preconditions(scene) {
    // Offline eval (scene 1) starts at the Sign-in screen for a webpage feel;
    // other scenes drop straight into an authed, onboarded session.
    if (scene === 1) {
      localStorage.setItem("ae_authed", "0");
      localStorage.setItem("ae_onboarded", "0");
    } else {
      localStorage.setItem("ae_authed", "1");
      localStorage.setItem("ae_onboarded", "1");
    }
  }
  function startScene(scene) {
    preconditions(scene);
    location.hash = "play=" + scene;     // one-shot trigger; boot() clears it after read
    location.reload();
  }
  function exitDemo() {
    localStorage.setItem("ae_authed", "1"); localStorage.setItem("ae_onboarded", "1");
    history.replaceState(null, "", location.pathname + location.search);
    location.reload();
  }
  function showLauncher() {
    buildHost();
    host.querySelector(".aed-bar").style.display = "none";
    const b = document.createElement("button"); b.className = "aed-launch";
    b.innerHTML = "▶ Play demo"; b.onclick = () => startScene(1);
    host.appendChild(b);
  }

  function boot() {
    // one-shot #play=N trigger written by startScene — read, clear, run
    const playMatch = location.hash.match(/play=(\d)/);
    if (playMatch) {
      history.replaceState(null, "", location.pathname + location.search);
      const sceneNum = +playMatch[1];
      buildHost();
      host.querySelector(".aed-bar").style.display = "flex";
      setTimeout(() => runScript(sceneNum), 900);
      return;
    }
    // deep-link via #scene=N or window.DEMO_SCENE → kick off the scene
    const requested = (typeof window.DEMO_SCENE === "number") ? window.DEMO_SCENE
      : (location.hash.match(/scene=(\d)/) ? +location.hash.match(/scene=(\d)/)[1] : null);
    if (requested != null) { startScene(requested); return; }
    // default: idle launcher, no autoplay
    showLauncher();
  }

  window.AEDemo = { start: startScene, exit: exitDemo };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 400));
  else setTimeout(boot, 400);
})();
