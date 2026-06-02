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
    const chaps = [[0, "▸ Full"], [1, "1 · Onboarding"], [3, "2 · Daily monitor"], [8, "3 · Daily review"]];
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

  // ---------------- scripts (simplified: onboarding → daily monitor) ----------------
  function scene1() {
    return [
      { chapter: "Onboarding", cap: "全新客户:从一个空账号开始。", run: () => sleep(2200) },
      { chapter: "Onboarding", cap: "创建组织,首个用户成为 Admin。", run: () => actClick(T("Create org", { tag: "button" })) },
      { chapter: "Onboarding", cap: "继续。", run: () => actClick(T("Create org & continue", { contains: true, tag: "button" })) },
      { chapter: "Describe", cap: "用大白话描述这个 chat agent 做什么。", run: () => actSpot(() => document.querySelector("textarea"), 2800) },
      { chapter: "Describe", cap: "下一步。", run: () => actClick(T("Continue", { contains: true, tag: "button" })) },
      { chapter: "Bring labeled data", cap: "第三种方式:我自己手动标过一批 chat 样本和分数。", run: () => actClick(T("I have a labeled set", { contains: true, tag: "button" }), { after: 1100 }) },
      { chapter: "Bring labeled data", cap: "上传我标好的 labeled.csv(input + output + 分数)。", run: () => actClick(T("Drop", { contains: true, tag: "button" })) },
      { chapter: "Bring labeled data", cap: "120 条人工标注样本已读入,列结构自动识别。", run: () => actSpot(T("120 labeled examples", { contains: true }), 2600) },
      { chapter: "Bring labeled data", cap: "继续。", run: () => actClick(T("Continue", { contains: true, tag: "button" })) },
      { chapter: "First eval", cap: "agent 接下来会:推导 rubric → 生成 golden → 每日跑 → 监控。", run: () => sleep(2800) },
      { chapter: "First eval", cap: "开始构建。", run: () => actClick(T("Build my first eval", { contains: true, tag: "button" })) },
    ];
  }
  function scene2() {
    return [
      { chapter: "Generate rubric", cap: "Copilot 从我的标注里反推出评分标准——什么分开了高分与低分。", run: async () => {
          const running = await poll(() => findText("inferred from your labels", { contains: true }) || findText("Approve", { tag: "button" }), 6000);
          await sleep(600);
        } },
      { chapter: "Generate rubric", cap: "查看推导出的 rubric。", run: () => actClick(T("inferred from your labels", { contains: true }), { optional: true }) },
      { chapter: "Generate rubric", cap: "批准 rubric。", run: () => actClick(T("Approve", { tag: "button" })) },
      { chapter: "Generate golden", cap: "下一步:把这 120 条标注变成 golden 数据集——全是人工 ground truth。", run: () => actClick(T("Golden dataset — from your labels", { contains: true }), { optional: true }) },
      { chapter: "Generate golden", cap: "批准 golden 数据集。", run: () => actClick(T("Approve", { tag: "button" })) },
      { chapter: "Daily run", cap: "基于这套固定 rubric,自动跑「今天」的评估…", run: () => poll(T("Today's run", { contains: true }), 12000).then(() => sleep(800)) },
      { chapter: "Daily run", cap: "今日结果按每个 rubric 维度打分,并和我的标注对齐(0.89)。", run: () => actSpot(T("Today's run", { contains: true }), 3600) },
    ];
  }
  function scene3() {
    return [
      { chapter: "Daily monitor", cap: "最后一页:基于这套固定 rubric,持续对比每天的运行结果。", run: async () => {
          const open = await poll(T("Rubric performance over time", { contains: true }), 2500);
          if (!open) await askComposer("show me performance over time");
          await sleep(600);
        } },
      { chapter: "Daily monitor", cap: "每个 rubric 维度的时间曲线——离线批量 + 在线采样,部署点标在轴上。", run: () => actSpot(T("Rubric performance over time", { contains: true }), 3800) },
      { chapter: "Daily monitor", cap: "可叠加任意维度查看。", run: () => actClick(T("Faithfulness", { tag: "button" }), { optional: true, after: 1100 }) },
      { chapter: "Daily monitor", cap: "跌破阈值会自动抓成回归并定位到具体部署。", run: () => actSpot(T("Detected regressions", { contains: true }), 3400) },
      { chapter: "Daily monitor", cap: "设个告警:总分跌破阈值就通知。", run: () => actClick(T("Set up an alert", { contains: true, tag: "button" }), { optional: true }) },
      { chapter: "Done", cap: "完整闭环:我的标注 → rubric + golden → 每日跑 → 持续对比同一把尺。", run: () => sleep(3000) },
    ];
  }
  function buildScript(scene) {
    if (scene === 1) return [...sceneT1(), ...sceneT2(), ...sceneT3()]; // onboarding = prod-trace flow
    if (scene === 2) return scene2();
    if (scene === 3) return scene3();
    if (scene === 7) return [...sceneT1(), ...sceneT2(), ...sceneT3()]; // full trace-upload flow
    if (scene === 8) return sceneReview(); // returning customer · daily prod-log review
    return [...sceneT1(), ...sceneT2(), ...sceneT3()]; // full = prod-trace flow
  }

  // ---- returning customer: log in → review prod logs → rubric suggestions → flag for review ----
  function sceneReview() {
    return [
      { chapter: "Daily review", cap: "老客户登录,开始每日例行检查。", run: () => sleep(2200) },
      { chapter: "Dashboard", cap: "先问一句:这周整体怎么样?", run: () => askComposer("show me this week's dashboard") },
      { chapter: "Dashboard", cap: "最近的 dashboard:质量分趋势、leaderboard、待办。", run: () => actSpot(T("Quality score trend", { contains: true }), 3600) },
      { chapter: "Prod logs", cap: "再看过去一周的生产日志。", run: () => askComposer("review last week's prod logs") },
      { chapter: "Prod logs", cap: "让 Triage 分析整体日志。", run: () => actClick(T("Analyze all logs", { contains: true, tag: "button" }), { optional: true, after: 1100 }) },
      { chapter: "Prod logs", cap: "整体日志分析:主题分布 + 分数分布,大部分健康。", run: () => actSpot(T("Overall log analysis", { contains: true }), 3400) },
      { chapter: "Rubric suggestions", cap: "根据这周日志,哪些评分标准需要改或新增?", run: () => askComposer("suggest rubric updates from these logs") },
      { chapter: "Rubric suggestions", cap: "agent 给出 3 条建议:新增退款合规、新增延迟检查、收紧 groundedness。", run: () => actSpot(T("Suggested updates from this week's logs", { contains: true }), 3800) },
      { chapter: "Rubric suggestions", cap: "采纳「新增退款合规」这条。", run: () => actClick(T("Add", { tag: "button" }), { optional: true }) },
      { chapter: "Flag for review", cap: "还有哪些日志需要人工复核?", run: () => askComposer("show me the logs flagged for a human") },
      { chapter: "Flag for review", cap: "Triage 已按复核价值排好序——判官-人工分歧、政策敏感最优先。", run: () => actSpot(T("Worth a human's review", { contains: true }), 3600) },
      { chapter: "Flag for review", cap: "一键送去人工复核队列。", run: () => actClick(T("Review", { tag: "button" }), { optional: true }) },
      { chapter: "Done", cap: "每日例行:看趋势 → 审日志 → 调 rubric → 派人复核。", run: () => sleep(2800) },
    ];
  }

  // ---- trace-upload-only variant (onboard via traces → build eval → report) ----
  function sceneT1() {
    return [
      { chapter: "Onboarding", cap: "全新客户:从一个空账号开始。", run: () => sleep(2200) },
      { chapter: "Onboarding", cap: "创建组织,首个用户成为 Admin。", run: () => actClick(T("Create org", { tag: "button" })) },
      { chapter: "Onboarding", cap: "继续。", run: () => actClick(T("Create org & continue", { contains: true, tag: "button" })) },
      { chapter: "Describe", cap: "用大白话描述这个 agent 做什么。", run: () => actSpot(() => document.querySelector("textarea"), 2800) },
      { chapter: "Describe", cap: "下一步。", run: () => actClick(T("Continue", { contains: true, tag: "button" })) },
      { chapter: "Upload traces", cap: "我有历史 trace——直接导入一包。", run: () => actClick(T("I have sample traces", { contains: true, tag: "button" }), { after: 1100 }) },
      { chapter: "Upload traces", cap: "上传 traces.zip。", run: () => actClick(T("Drop", { contains: true, tag: "button" })) },
      { chapter: "Upload traces", cap: "512 条 trace 已解析,schema 自动识别。", run: () => actSpot(T("512 traces parsed", { contains: true }), 2600) },
      { chapter: "Upload traces", cap: "继续。", run: () => actClick(T("Continue", { contains: true, tag: "button" })) },
      { chapter: "First eval", cap: "agent 接下来会:分析 traces → 生成 rubric set → 创建数据集 → baseline → 报告。", run: () => sleep(2800) },
      { chapter: "First eval", cap: "开始构建。", run: () => actClick(T("Build my first eval", { contains: true, tag: "button" })) },
    ];
  }
  function sceneT2() {
    return [
      { chapter: "Build eval", cap: "Copilot 自动接管,逐步产出提案,每步等我审批。", run: () => poll(() => findText("Looks right", { tag: "button" }) || findText("Analyzed all 512 logs", { contains: true }), 6000).then(() => sleep(500)) },
      { chapter: "Analyze logs", cap: "① 先分析整体日志——主题分布、分数分布、延迟,不只看失败。", run: () => actClick(T("Analyzed all 512 logs", { contains: true }), { optional: true }) },
      { chapter: "Analyze logs", cap: "确认分析。", run: () => actClick(T("Looks right", { tag: "button" })) },
      { chapter: "Rubric", cap: "② 从整体日志反推出评分标准——覆盖度、有用性、语气。", run: () => actClick(() => findText("Rubric — from your logs", { contains: true }), { optional: true }) },
      { chapter: "Rubric", cap: "批准 rubric。", run: () => actClick(T("Approve", { tag: "button" })) },
      { chapter: "Dataset", cap: "③ 基于这套 rubric 生成 golden 数据集。", run: () => actClick(() => findText("Dataset — Support QA v1", { contains: true }), { optional: true }) },
      { chapter: "Dataset", cap: "批准数据集。", run: () => actClick(T("Approve", { tag: "button" })) },
      { chapter: "Baseline", cap: "④ 自动跑 baseline,正在打分…", run: () => poll(T("Top gaps, ranked by impact", { contains: true }), 22000) },
    ];
  }
  function sceneT3() {
    return [
      { chapter: "Report", cap: "报告自动生成。", run: async () => {
          await poll(T("Top gaps, ranked by impact", { contains: true }), 14000);
          const main = document.querySelector("main");
          if (!main || !main.innerText.includes("Score by rubric dimension")) await actClick(T("results & recommendations", { contains: true }), { optional: true });
          await sleep(700);
        } },
      { chapter: "Report", cap: "总分,以及判官一致性与通过率。", run: () => actSpot(T("Weighted overall", { contains: true }), 2800) },
      { chapter: "Report", cap: "逐 rubric 维度看哪强哪弱。", run: () => actSpot(T("Score by rubric dimension", { contains: true }), 2600) },
      { chapter: "Report", cap: "按影响排序的修复建议。", run: () => actSpot(T("Top gaps, ranked by impact", { contains: true }), 3000) },
      { chapter: "Daily monitor", cap: "这不是一次性的——之后每天基于同一套 rubric 持续跑。", run: () => askComposer("show me performance over time") },
      { chapter: "Daily monitor", cap: "总体趋势曲线:overall 分数随时间变化,部署点标在轴上。", run: () => actSpot(T("Rubric performance over time", { contains: true }), 3800) },
      { chapter: "Daily monitor", cap: "跌破阈值会自动抓成回归并定位到具体部署。", run: () => actSpot(T("Detected regressions", { contains: true }), 3200) },
      { chapter: "Done", cap: "从上传一包 trace,到每日持续监控——闭环完成。", run: () => sleep(2800) },
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
    capScene.textContent = "Demo complete"; capText.textContent = "点 ↻ 重播本场景,或选上方章节。";
  }

  // ---------------- boot / scene control ----------------
  function preconditions(scene) {
    // scenes that begin at signup and walk the whole onboarding
    if (scene === 0 || scene === 1 || scene === 7) { localStorage.setItem("ae_authed", "0"); localStorage.setItem("ae_onboarded", "0"); }
    else { localStorage.setItem("ae_authed", "1"); localStorage.setItem("ae_onboarded", "1"); }
  }
  function startScene(scene) {
    preconditions(scene);
    sessionStorage.setItem("ae_demo", JSON.stringify({ scene, run: true }));
    location.reload();
  }
  function exitDemo() {
    sessionStorage.setItem("ae_demo", JSON.stringify({ run: false }));
    localStorage.setItem("ae_authed", "1"); localStorage.setItem("ae_onboarded", "1");
    location.reload();
  }
  function showLauncher() {
    buildHost();
    host.querySelector(".aed-bar").style.display = "none";
    const b = document.createElement("button"); b.className = "aed-launch";
    b.innerHTML = "▶ Play demo"; b.onclick = () => startScene(0);
    host.appendChild(b);
  }

  function boot() {
    let demo = null; try { demo = JSON.parse(sessionStorage.getItem("ae_demo") || "null"); } catch {}
    const requested = (typeof window.DEMO_SCENE === "number") ? window.DEMO_SCENE
      : (location.hash.match(/scene=(\d)/) ? +location.hash.match(/scene=(\d)/)[1] : null);
    // honor a chip click / in-progress run first, so chapter navigation works in exports
    if (demo && demo.run) { buildHost(); host.querySelector(".aed-bar").style.display = "flex"; setTimeout(() => runScript(demo.scene || 0), 900); }
    else if (demo && demo.run === false) { showLauncher(); }              // exited → idle launcher
    else if (requested != null) { startScene(requested); }                // first load of an export file
    else { showLauncher(); }                                               // dev / normal use
  }

  window.AEDemo = { start: startScene, exit: exitDemo };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 400));
  else setTimeout(boot, 400);
})();
