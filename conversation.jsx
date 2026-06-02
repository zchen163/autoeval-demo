// conversation.jsx — persistent agent spine (AI-native home).
// Drives everything: briefing, NL intents, the §6 orchestration. Opens artifacts in the canvas.
const { useState: useCvS, useEffect: useCvE, useRef: useCvR } = React;

const CV_FLOW = ["cluster", "dataset", "rubric", "calibrate", "baseline", "report"];

function CvThinking({ agent, label }) {
  return <div className="row gap-2" style={{ animation: "fadeIn .2s", alignItems: "flex-start" }}>
    <AgentAvatar id={agent} size={26} />
    <div className="row gap-2" style={{ padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, borderTopLeftRadius: 4 }}>
      <span className="row" style={{ gap: 3 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 99, background: "var(--text-faint)", animation: `blink 1.2s ${i * 0.18}s infinite` }} />)}</span>
      <span className="faint" style={{ fontSize: 12 }}>{label}</span>
    </div>
    <style>{`@keyframes blink{0%,60%,100%{opacity:.25}30%{opacity:1}}`}</style>
  </div>;
}
function CvUser({ children }) {
  return <div className="row gap-2" style={{ justifyContent: "flex-end", animation: "slideUp .22s" }}>
    <div style={{ maxWidth: "82%", padding: "9px 13px", background: "var(--accent)", color: "white", borderRadius: 13, borderBottomRightRadius: 4, fontSize: 13, lineHeight: 1.5 }}>{children}</div>
  </div>;
}
function CvBot({ children, agent = "copilot" }) {
  return <div className="row gap-2" style={{ animation: "slideUp .22s", alignItems: "flex-start" }}>
    <AgentAvatar id={agent} size={26} />
    <div style={{ flex: 1, minWidth: 0, paddingTop: 2, fontSize: 13, lineHeight: 1.55 }}>{children}</div>
  </div>;
}
// a compact "the agent opened X in the canvas" chip
function CanvasChip({ icon, label, onClick }) {
  return <button onClick={onClick} className="row gap-2" style={{ width: "100%", textAlign: "left", padding: "9px 11px", marginTop: 8, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", transition: "border-color .13s" }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-soft-border)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
    <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{window.Icons[icon]({ size: 15 })}</span>
    <span className="grow" style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
    <span className="faint row gap-1" style={{ fontSize: 11 }}>open{window.Icons.arrowRight({ size: 12 })}</span>
  </button>;
}

// natural-language intent → canvas route (+ optional spoken reply)
function routeIntent(text) {
  const t = text.toLowerCase();
  const has = (...ks) => ks.some((k) => t.includes(k));
  if (has("monitor", "over time", "trend over", "performance over", "long-term", "long term", "drift", "regress over", "history", "weekly")) return { route: { view: "monitor" }, say: "Here's the long-term monitor. Overall is at 0.842 and trending up, but note the dip in early May — a bad prompt deploy (v1.3.1) that v1.4 recovered." };
  if (has("compare", "vs", "regress", "diff")) return { route: { view: "compare", a: "exp_7a2f", b: "exp_9c41" }, say: "Opened the v1.2 → v1.3 diff. Net +4pp overall; the gains are in faithfulness, with two refund records regressing." };
  if (has("calibrat", "judge", "agreement", "panel")) return { route: { view: "judge" }, say: "Here's the judge calibration. The Anthropic judge is at 0.88 agreement with your golden set; Gemini is still below threshold." };
  if (has("suggest", "update rubric", "rubric need", "modify rubric", "change rubric", "improve rubric")) return { route: { view: "rubrics" }, say: "Based on this week's logs I have 3 rubric suggestions — a refund-policy compliance check and a latency check to add, and a groundedness wording to tighten. They're at the top of the rubric view for you to apply." };
  if (has("rubric", "criteria", "dimension")) return { route: { view: "rubrics" }, say: "Opened the RAG Answer Quality rubric — 4 dimensions, drafted from failure clusters and approved by Mei." };
  if (has("golden", "dataset", "records", "data")) return { route: { view: "datasets", id: "ds_golden" }, say: "Opened Support QA — Golden v3. 16 records: 7 human, 5 mined-from-prod, 4 synthetic." };
  if (has("review", "queue", "label", "score")) return { route: { view: "review" }, say: "Review queue is ranked by triage signal — the refund-policy case is highest." };
  if (has("trace", "log", "loop", "root", "span", "production", "prod")) return { route: { view: "traces" }, say: "Opened online traces. Two are flagged; I can root-cause any of them in the span tree." };
  if (has("agent activity", "audit", "agent run", "what did")) return { route: { view: "agentruns" }, say: "Here's the agent activity log — every run with the tools it called and data it read." };
  if (has("key", "billing", "provider", "cost")) return { route: { view: "keys" }, say: "API keys. Note your Gemini panel judge is paused — no Google key set." };
  if (has("member", "org", "team", "invite")) return { route: { view: "settings" }, say: "Org & members." };
  if (has("dashboard", "trend", "leaderboard", "rank", "overview", "this week")) return { route: { view: "dashboard" }, say: "Project overview. Best config is v1.3 + memory at 0.84; quality is trending up over the last 8 runs." };
  if (has("report", "results", "first eval", "recommendations")) return { route: { view: "report" }, say: "Here's the v1.2 baseline report — overall 0.712, top gaps ranked by impact with a suggested fix for each." };
  if (has("experiment", "run ", "baseline", "v1.")) return { route: { view: "experiments" }, say: "Opened experiments. Want me to run a new one or open a specific version?" };
  return null;
}

function narrateRoute(route) {
  if (route.view === "monitor") return "Opened the agent monitor. Overall rubric score is 0.842, up over the quarter — with one regression in early May (bad prompt deploy) that v1.4 recovered.";
  if (route.view === "report") return "Here's the full results report — overall 0.712, with the top gaps ranked by impact and a suggested fix for each.";
  if (route.view === "experiments" && route.id) { const e = DB.expById(route.id); return e ? `Opened ${e.name}. ${e.summary ? "Overall " + e.summary.overall.toFixed(3) + "." : "It's still running."}` : "Opened the experiment."; }
  const r = routeIntent(route.view === "datasets" ? "golden dataset" : route.view);
  return r ? r.say : "Opened it in the canvas.";
}

// orchestration step id → canvas route
function routeForStep(id) {
  return ({
    cluster: { view: "traces" }, dataset: { view: "datasets", id: "ds_golden" }, rubric: { view: "rubrics" },
    calibrate: { view: "judge" }, baseline: { view: "experiments", id: "exp_7a2f" }, report: { view: "report" },
    daily: { view: "report" }, monitor: { view: "monitor" },
  })[id];
}

function ConversationPane({ openCanvas, canvas, push, autostart, autostartPath }) {
  const [msgs, setMsgs] = useCvS([]);     // {kind:'user'|'bot'|'node', ...}
  const [shown, setShown] = useCvS([]);    // orchestration step ids
  const [thinking, setThinking] = useCvS(null);
  const [approved, setApproved] = useCvS({});
  const [removed, setRemoved] = useCvS([]);
  const [extraCrit, setExtraCrit] = useCvS(false);
  const [draft, setDraft] = useCvS("");
  const [orchestrating, setOrch] = useCvS(false);
  const [bootstrap, setBootstrap] = useCvS("traces"); // 'traces' | 'describe'
  const scrollRef = useCvR(null);

  useCvE(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, shown, thinking, approved, removed, extraCrit]);

  const reveal = (id, agent, label, delay = 1100) => {
    setThinking({ agent, label });
    setTimeout(() => { setThinking(null); setShown((s) => [...s, id]); }, delay);
  };
  const say = (node) => setMsgs((m) => [...m, { kind: "bot", node }]);

  // ---- flow definition (mode-driven) ----
  const labeledMode = bootstrap === "labeled";
  const describeMode = bootstrap === "describe";
  const flow = labeledMode ? ["rubric", "dataset", "daily", "monitor"]
    : describeMode ? ["dataset", "rubric", "baseline", "report"]
    : ["cluster", "rubric", "baseline", "report"];
  const planLabels = labeledMode
    ? ["Calibrate a rubric against your labels", "Confirm your golden dataset", "Call your agent and score each trace", "Open the continuous monitor"]
    : describeMode
    ? ["Synthesize a starter dataset from your description", "Discover a rubric", "Run a baseline", "Summarize & recommend"]
    : ["Analyze traces — topics, distribution, behaviors", "Derive a rubric from the trace distribution", "Score every trace against the rubric — baseline", "Review report & recommendations"];
  const STEP_META = {
    cluster: { agent: "triage", label: "Triage Agent analyzing all 512 traces & extracting behaviors…" },
    dataset: { agent: "dataset", label: labeledMode ? "Confirming your golden dataset…" : describeMode ? "Dataset Agent synthesizing starter cases…" : "Dataset Agent building the golden dataset…" },
    rubric: { agent: "rubric", label: labeledMode ? "Calibrating the rubric against your labels…" : "Rubric Agent reading your logs…" },
    calibrate: { agent: "rubric", label: "Calibrating judge vs human golden…" },
    baseline: { agent: "copilot", label: "Running baseline…" },
    report: { agent: "copilot", label: "Summarizing results…" },
    daily: { agent: "copilot", label: "Calling your agent on every input, scoring per rubric…" },
    monitor: { agent: "copilot", label: "Setting up the continuous monitor…" },
  };
  const nextOf = (id) => flow[flow.indexOf(id) + 1];
  const advanceFrom = (id) => { const n = nextOf(id); if (n) { const m = STEP_META[n]; reveal(n, m.agent, m.label); } };

  const startOrchestration = (auto, mode = "traces") => {
    setOrch(true);
    setBootstrap(mode);
    if (!auto) setMsgs((m) => [...m, { kind: "user", node: <>Build me an eval for my support agent — it handles <b>order</b>, <b>refund</b>, and <b>tracking</b>.</> }]);
    setTimeout(() => setShown((s) => [...s, "plan"]), 450);
    const first = mode === "labeled" ? "rubric" : mode === "describe" ? "dataset" : "cluster";
    const lbl = mode === "labeled" ? "Calibrating the rubric against your labels…" : mode === "describe" ? "Dataset Agent synthesizing starter cases from your description…" : "Triage Agent analyzing all 512 traces & extracting behaviors…";
    const ag = mode === "labeled" ? "rubric" : mode === "describe" ? "dataset" : "triage";
    setTimeout(() => reveal(first, ag, lbl, 1500), 1100);
  };

  // autostart the first-eval orchestration right after onboarding
  useCvE(() => {
    if (autostart) {
      const mode = autostartPath === "describe" ? "describe" : autostartPath === "labeled" ? "labeled" : "traces";
      setOrch(true); setBootstrap(mode);
      const greeting = mode === "labeled"
        ? <>Thanks, Mei. You uploaded a <b>golden dataset with 120 labeled examples</b> — inputs paired with ideal outputs and per-criterion scores. I'll <b>call your agent on every input</b> to capture traces, calibrate the rubric against your labels, then score each trace and surface the gaps. I'll pause for your approval at each step.</>
        : mode === "describe"
        ? <>Thanks, Mei. You don't have production traces yet, so I'll <b>synthesize a starter eval from your description</b> and the trace format you gave me — then we'll refine it with real traffic once it arrives. I'll pause for your approval at each step.</>
        : <>Thanks, Mei — I've received your first <b>512 traces</b> from Support Copilot. Let me build your first eval. I'll pause for your approval at each step.</>;
      const t = setTimeout(() => { setMsgs((m) => [...m, { kind: "bot", node: greeting }]); startOrchestration(true, mode); }, 700);
      return () => clearTimeout(t);
    }
  }, []);

  const approve = (id) => {
    setApproved((a) => ({ ...a, [id]: true }));
    push(id === "calibrate" ? "Judge approved for use" : "Approved — applied to project", "pos");
    if (nextOf(id)) advanceFrom(id);
  };

  // auto-advance baseline → next
  useCvE(() => {
    if (shown.includes("baseline") && !approved.baseline) {
      const t = setTimeout(() => { setApproved((a) => ({ ...a, baseline: true })); advanceFrom("baseline"); }, 2400);
      return () => clearTimeout(t);
    }
  }, [shown]);

  // auto-advance daily run → monitor (labeled path)
  useCvE(() => {
    if (shown.includes("daily") && !approved.daily) {
      const t = setTimeout(() => { setApproved((a) => ({ ...a, daily: true })); advanceFrom("daily"); }, 2600);
      return () => clearTimeout(t);
    }
  }, [shown]);

  // when the summary lands, surface the report in the canvas
  useCvE(() => { if (shown.includes("report")) openCanvas({ view: "report" }, false); }, [shown.includes("report")]);
  // when monitor step lands, open the continuous monitor
  useCvE(() => { if (shown.includes("monitor")) openCanvas({ view: "monitor" }, false); }, [shown.includes("monitor")]);

  // narrate canvas opens that originated outside the conversation (palette, rail, home)
  useCvE(() => {
    if (canvas && canvas.narrate && canvas.route) { setThinking({ agent: "copilot", label: "Reading…" }); const t = setTimeout(() => { setThinking(null); say(<>{narrateRoute(canvas.route)}</>); }, 650); return () => clearTimeout(t); }
  }, [canvas && canvas.seq]);

  // external ask (from ⌘K palette)
  useCvE(() => { if (canvas && canvas.ask) submit(canvas.ask); }, [canvas && canvas.askSeq]);

  const submit = (text) => {
    const q = (text ?? draft).trim();
    if (!q) return;
    setDraft("");
    if (!orchestrating && /\b(build|create|set ?up|make).*(eval|evaluation)\b/i.test(q)) { startOrchestration(); return; }
    setMsgs((m) => [...m, { kind: "user", node: q }]);
    const r = routeIntent(q);
    setThinking({ agent: "copilot", label: "Thinking…" });
    setTimeout(() => {
      setThinking(null);
      if (r) { openCanvas(r.route, false); say(<>{r.say}</>); }
      else say(<>I can mine logs, draft a dataset or rubric, calibrate the judge, run experiments, or open any artifact. Try “compare v1.2 and v1.3”, “show refund failures”, or “build me an eval”.</>);
    }, 750);
  };

  const goldenRecs = DB.DATASETS[0].records;
  const visibleRecs = goldenRecs.filter((r) => !removed.includes(r.id)).slice(0, 5);
  const stepState = (idx) => { const id = flow[idx]; if (approved[id] || (id === "report" && shown.includes("report")) || (id === "monitor" && shown.includes("monitor"))) return "done"; if (shown.includes(id)) return "active"; return "pending"; };

  const suggestions = orchestrating ? ["Why did v1.3 regress?", "Open the calibration", "What's flagged for review?"] : ["Build me an eval for my support agent", "What needs my attention?", "Compare v1.2 and v1.3", "Show refund failures"];

  return <div className="col" style={{ height: "100%" }}>
    {/* header */}
    <div className="row" style={{ justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
      <div className="row gap-2"><AgentAvatar id="copilot" size={28} /><div><div style={{ fontSize: 13.5, fontWeight: 700 }}>Eval Copilot</div><div className="faint" style={{ fontSize: 11 }}>Support Copilot · agent session</div></div></div>
      <AutonomyBadge level="draft" />
    </div>

    {/* thread */}
    <div ref={scrollRef} className="col gap-4" style={{ flex: 1, overflowY: "auto", padding: "18px 16px" }}>
      {/* greeting / briefing (only before orchestration & no msgs) */}
      {msgs.length === 0 && !orchestrating && <>
        <CvBot>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>Morning, Mei. Here's where Support Copilot stands.</div>
          <div className="col gap-2" style={{ marginTop: 10 }}>
            {[["alert", "neg", "3 judge–human disagreements need your call", { view: "judge" }],
              ["trace", "neg", "Overall dipped 7pp in early May — bad prompt deploy", { view: "monitor" }],
              ["flask", "accent", "v1.4 (rerank + reflection) is still running", { view: "experiments", id: "exp_f024" }]].map(([ic, tone, label, route], i) =>
              <button key={i} onClick={() => { openCanvas(route, true); }} className="row gap-2" style={{ width: "100%", textAlign: "left", padding: "9px 11px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: `var(--${tone})`, flexShrink: 0 }} />
                <span className="grow" style={{ fontSize: 12.5 }}>{label}</span>
                {window.Icons.arrowRight({ size: 13, style: { color: "var(--text-faint)" } })}
              </button>)}
          </div>
          <div style={{ marginTop: 12 }}>Want me to spin up a fresh eval, or dig into one of these?</div>
        </CvBot>
      </>}

      {msgs.map((m, i) => m.kind === "user" ? <CvUser key={i}>{m.node}</CvUser> : <CvBot key={i}>{m.node}</CvBot>)}

      {/* ---- orchestration ---- */}
      {shown.includes("plan") && <CvBot>
        Got it. Plan below — I'll pause for approval at every step that defines correctness.
        <div style={{ marginTop: 10, padding: "6px 6px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
          {planLabels.map((l, i) => { const st = stepState(i); const route = routeForStep(flow[i]);
            return <button key={i} onClick={() => openCanvas(route, false)} className="row gap-2 plan-row" style={{ width: "100%", textAlign: "left", padding: "6px 8px", cursor: "pointer", borderRadius: 6, transition: "background .12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.querySelector(".plan-open").style.opacity = 1; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector(".plan-open").style.opacity = 0; }}>
            <span style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 700, background: st === "done" ? "var(--pos)" : st === "active" ? "var(--accent)" : "var(--surface-3)", color: st === "pending" ? "var(--text-3)" : "white" }} className="mono">{st === "done" ? window.Icons.check({ size: 11, sw: 3 }) : i + 1}</span>
            <span className="grow" style={{ fontSize: 12, fontWeight: st === "active" ? 600 : 500, color: st === "pending" ? "var(--text-2)" : "var(--text)" }}>{l}</span>
            {st === "active" && <Badge tone="accent" dot>now</Badge>}
            <span className="plan-open faint row gap-1" style={{ fontSize: 10, fontWeight: 600, opacity: 0, transition: "opacity .12s" }}>open{window.Icons.external({ size: 11 })}</span>
          </button>; })}
        </div>
      </CvBot>}

      {shown.includes("cluster") && <Proposal agent="triage" autonomy="auto" title="Analyzed all 512 logs" sub="whole distribution" approved={approved.cluster} onOpen={() => openCanvas({ view: "traces" }, false)}
        evidence={<>Read the entire sampled log set, not just failures — topic mix, score distribution and latency. Most traffic is healthy; a handful of clusters need attention. User content treated strictly as data.</>}
        footerNote="Confirm the analysis" approveLabel="Looks right"
        onApprove={() => { approve("cluster"); openCanvas({ view: "traces" }, false); }}>
        <div className="row gap-2" style={{ marginBottom: 8, flexWrap: "wrap" }}>
          {[["Billing", 31], ["Account", 22], ["Product", 19], ["API", 16], ["Admin", 12]].map(([k, v]) => <span key={k} className="row gap-1" style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: "var(--surface-2)", border: "1px solid var(--border)" }}><span className="faint">{k}</span><b className="mono">{v}%</b></span>)}
        </div>
        <div className="row gap-3" style={{ fontSize: 11.5 }}><span className="muted">median <b className="mono" style={{ color: "var(--text)" }}>0.78</b></span><span className="muted">p90 <b className="mono" style={{ color: "var(--text)" }}>2.3s</b></span><span className="muted"><b className="mono" style={{ color: "var(--pos)" }}>77%</b> healthy</span><span className="muted"><b className="mono" style={{ color: "var(--warn)" }}>5</b> clusters need attention</span></div>
      </Proposal>}

      {shown.includes("dataset") && <Proposal agent="dataset" autonomy="draft" title={labeledMode ? "Golden dataset — from your labels" : describeMode ? "Starter dataset — synthesized" : `Evaluation dataset — created`} sub={labeledMode ? "120 labeled examples" : `${goldenRecs.length - removed.length} records`} approved={approved.dataset} onOpen={() => openCanvas({ view: "datasets", id: "ds_golden" }, false)}
        evidence={labeledMode
          ? <>Every example here comes from <b>the golden dataset you uploaded</b> — input paired with your ideal output and per-criterion scores. The judge will calibrate to these labels; this is your ground truth.</>
          : describeMode
          ? <>No production traces yet, so every record is <b>synthetic</b>, generated from your description + the trace format you provided, and clearly tagged. Once real traffic arrives I'll mine and replace these with grounded cases.</>
          : <>Mined from the clusters + synthetic boundary cases. Synthesis used a different model family than the agent under test. Each record tagged with provenance.</>}
        onEdit={() => push("Remove rows below", "neutral")} onApprove={() => approve("dataset")}>
        <div className="row gap-2" style={{ marginBottom: 8, flexWrap: "wrap" }}>{labeledMode
          ? <><ProvBadge kind="human" sm /><span className="mono faint" style={{ fontSize: 10.5 }}>120</span><span className="faint" style={{ fontSize: 11 }}>· all human-labeled, your scores attached</span></>
          : describeMode
          ? <><ProvBadge kind="synthetic" sm /><span className="mono faint" style={{ fontSize: 10.5 }}>16</span><span className="faint" style={{ fontSize: 11 }}>· from your description + trace format</span></>
          : <><ProvBadge kind="human" sm /><span className="mono faint" style={{ fontSize: 10.5 }}>7</span><ProvBadge kind="mined" sm /><span className="mono faint" style={{ fontSize: 10.5 }}>5</span><ProvBadge kind="synthetic" sm /><span className="mono faint" style={{ fontSize: 10.5 }}>4</span></>}</div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>{visibleRecs.map((r, i) => <div key={r.id} className="row gap-2" style={{ padding: "6px 8px", borderBottom: i < visibleRecs.length - 1 ? "1px solid var(--border)" : "none", justifyContent: "space-between" }}>
          <span className="row gap-2" style={{ minWidth: 0 }}><ProvBadge kind={labeledMode ? "human" : describeMode ? "synthetic" : r.provenance} sm /><span style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.input}</span></span>
          {labeledMode ? <span className="mono faint" style={{ fontSize: 10.5, flexShrink: 0 }}>your score {(0.6 + (i % 4) * 0.12).toFixed(1)}</span> : !approved.dataset && <button onClick={() => setRemoved((x) => [...x, r.id])} title="Remove" style={{ color: "var(--text-faint)", flexShrink: 0 }}>{window.Icons.trash({ size: 13 })}</button>}
        </div>)}</div>
        <button onClick={() => openCanvas({ view: "datasets", id: "ds_golden" }, false)} className="faint row gap-1" style={{ fontSize: 11, marginTop: 7 }}>open full dataset in canvas{window.Icons.arrowRight({ size: 11 })}</button>
      </Proposal>}

      {shown.includes("rubric") && <Proposal agent="rubric" autonomy="draft" title={labeledMode ? "Rubric — calibrated to your labels" : "Rubric set — from your logs"} sub={labeledMode ? "from your labels" : "from all traffic"} approved={approved.rubric} onOpen={() => openCanvas({ view: "rubrics" }, false)}
        evidence={labeledMode
          ? <>Derived from the criteria implicit in your <b>ideal outputs and per-criterion scores</b>. The judge uses this prompt to score every trace your agent generates — calibrated against the labels you provided.</>
          : <>Built from the <b>whole log distribution</b> — coverage of your top intents, helpfulness and tone — not just the failures. Becomes the judge's scoring prompt.</>}
        onEdit={() => { setExtraCrit(true); push("Added: Compliance phrasing", "pos"); }} approveLabel="Approve"
        onApprove={() => approve("rubric")}>
        <div className="col gap-1">{(labeledMode ? [["Helpfulness", "1-5"], ["Groundedness", "0-1"], ["Tone match", "1-5"], ["Safety", "pass/fail"]] : [["Intent recognition", "1-5"], ["Order-number confirmation", "pass/fail"], ["Tool-call correctness", "0-1"], ["Tone & concision", "1-5"]]).map(([n, t]) => <div key={n} className="row gap-2" style={{ padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, justifyContent: "space-between" }}><span style={{ fontSize: 11.5, fontWeight: 500 }}>{n}</span><Badge tone="neutral">{t}</Badge></div>)}
        {extraCrit && <div className="row gap-2" style={{ padding: "6px 8px", border: "1px solid var(--accent-soft-border)", borderRadius: 6, background: "var(--accent-soft)", justifyContent: "space-between", animation: "slideUp .2s" }}><span style={{ fontSize: 11.5, fontWeight: 500 }}>Compliance phrasing</span><Badge tone="accent">you added</Badge></div>}</div>
      </Proposal>}

      {shown.includes("calibrate") && <Proposal agent="rubric" autonomy="draft" title="Judge calibrated" sub="30 golden · cross-family" approved={approved.calibrate} onOpen={() => openCanvas({ view: "judge" }, false)}
        evidence={<>Truth comes from your human golden set, never the agent. Judge family (Anthropic) ≠ agent family (OpenAI). 3 rounds to clear the 0.80 threshold.</>}
        footerNote="Approving lets it score at scale" approveLabel="Approve judge"
        onApprove={() => { approve("calibrate"); openCanvas({ view: "judge" }, false); }}>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <div style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6 }}><div className="faint" style={{ fontSize: 10.5 }}>agreement</div><div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--pos)" }}>0.88</div></div>
          <div style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6 }}><div className="faint" style={{ fontSize: 10.5 }}>disagreements</div><div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>3 <span className="faint" style={{ fontSize: 11 }}>→ review</span></div></div>
        </div>
        <button onClick={() => openCanvas({ view: "judge" }, false)} className="faint row gap-1" style={{ fontSize: 11 }}>open calibration in canvas{window.Icons.arrowRight({ size: 11 })}</button>
      </Proposal>}

      {shown.includes("baseline") && (!approved.baseline ? <CvBot agent="copilot"><div className="row gap-2"><Spinner size={15} /><span style={{ fontSize: 12.5 }}>Running baseline — scoring 14/16 on your key…</span></div></CvBot>
        : <CvBot agent="copilot">Baseline scored <b className="mono">0.712</b>.<CanvasChip icon="flask" label="Baseline experiment — Support QA v1" onClick={() => openCanvas({ view: "experiments", id: "exp_7a2f" }, false)} /></CvBot>)}

      {/* labeled-path: today's run scored per rubric */}
      {shown.includes("daily") && (!approved.daily ? <CvBot agent="copilot"><div className="row gap-2"><Spinner size={15} /><span style={{ fontSize: 12.5 }}>Running today's eval — scoring every example against your rubric…</span></div></CvBot>
        : <Proposal agent="copilot" autonomy="auto" title="Today's run — scored per rubric" sub="120 examples · vs your golden labels" gate={false} onOpen={() => openCanvas({ view: "report" }, false)}>
          <div className="col gap-2">{[["Helpfulness", 0.86], ["Groundedness", 0.79], ["Tone match", 0.91], ["Safety", 0.97]].map(([n, v]) => <div key={n} className="row gap-3" style={{ alignItems: "center" }}>
            <span style={{ width: 92, fontSize: 11.5 }}>{n}</span>
            <div className="grow" style={{ height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${v * 100}%`, background: scoreColor(v), borderRadius: 99 }} /></div>
            <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, width: 32, textAlign: "right", color: scoreColor(v) }}>{v.toFixed(2)}</span>
          </div>)}</div>
          <div className="row gap-2" style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)" }}><span className="faint" style={{ fontSize: 11 }}>Agreement with your labels</span><span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--pos)", marginLeft: "auto" }}>0.89</span></div>
        </Proposal>)}

      {/* labeled-path: continuous monitor */}
      {shown.includes("monitor") && <CvBot>
        Your eval now runs <b>every day</b> against this fixed rubric. Here's the continuous view — each dimension tracked over time, with regressions flagged automatically.
        <CanvasChip icon="trace" label="Continuous monitor — rubric over time" onClick={() => openCanvas({ view: "monitor" }, false)} />
        <p className="faint" style={{ fontSize: 11, marginTop: 10 }}>That's the whole loop: your labels → rubric + golden set → a daily run you compare against the same bar.</p>
      </CvBot>}

      {shown.includes("report") && <CvBot>
        Done — your eval is live. Baseline <b className="mono">0.712</b>. Top gaps, ranked by impact:
        <CanvasChip icon="dashboard" label="First eval — results & recommendations" onClick={() => openCanvas({ view: "report" }, false)} />
        <div className="col gap-2" style={{ margin: "10px 0" }}>{[["Order-number confirmation fails on 61% of refunds", "confirm order before refund calls"], ["Out-of-scope API claims", "tighten retrieval + add refusals"], ["Multi-turn context dropped", "persist entities in memory"]].map(([f, r], i) => <div key={i} className="row gap-2" style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--surface)" }}><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--neg)", flexShrink: 0 }}>{i + 1}</span><div><div style={{ fontSize: 12, fontWeight: 600 }}>{f}</div><div className="faint" style={{ fontSize: 11, marginTop: 1 }}>→ {r}</div></div></div>)}</div>
        <div className="row gap-2 wrap"><Btn size="sm" variant="default" icon="layers" onClick={() => openCanvas({ view: "compare", a: "exp_7a2f", b: "exp_9c41" }, false)}>Compare to v1.3</Btn><Btn size="sm" variant="default" icon="trace" onClick={() => openCanvas({ view: "agentruns" }, false)}>Agent runs</Btn></div>
        <p className="faint" style={{ fontSize: 11, marginTop: 10 }}>A few prompts and a few approvals — that's the whole eval. Everything's auditable under Agent activity.</p>
      </CvBot>}

      {thinking && <CvThinking agent={thinking.agent} label={thinking.label} />}
    </div>

    {/* composer */}
    <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
      <div className="row gap-1 wrap" style={{ marginBottom: 8 }}>
        {suggestions.map((s) => <button key={s} onClick={() => submit(s)} className="faint" style={{ fontSize: 11, padding: "4px 9px", borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-soft-border)"; e.currentTarget.style.color = "var(--accent-text)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-3)"; }}>{s}</button>)}
      </div>
      <div className="row gap-2" style={{ padding: "5px 5px 5px 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface)" }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Tell the agent what you want to evaluate…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13 }} />
        <Btn variant="primary" icon="send" onClick={() => submit()} />
      </div>
      <p className="faint" style={{ fontSize: 10, textAlign: "center", marginTop: 6 }}>Copilot runs on the platform model. The eval it runs uses your provider keys.</p>
    </div>
  </div>;
}

window.ConversationPane = ConversationPane;
