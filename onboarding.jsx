// onboarding.jsx — new-customer onboarding (cold start → first eval, agent-led)
const { useState: useObS, useEffect: useObE } = React;

const AGENT_TYPES = [
  { id: "support", name: "Conversational assistant", desc: "Chatbots, support copilots, internal helpdesks", icon: "review", placeholder: "A customer-support copilot for our SaaS. It answers questions about orders, refunds and shipment tracking by retrieving from our help center, and can call order_lookup and issue_refund tools." },
  { id: "rag", name: "Knowledge Q&A", desc: "RAG over docs or a knowledge base, with citations", icon: "dataset", placeholder: "A documentation Q&A bot. Given a question, it retrieves passages from our docs and answers with citations." },
  { id: "code", name: "Coding agent", desc: "IDE assistants, PR-fix bots, codegen", icon: "doc", placeholder: "A coding agent that takes a GitHub issue, plans a fix, edits files, and runs the test suite until it passes." },
  { id: "other", name: "Something else", desc: "Describe it in your own words", icon: "bolt", placeholder: "Describe its purpose, target users, typical inputs, the tools or knowledge sources it can call, and what distinguishes a strong response from a weak one." },
];

function OnboardingFlow({ onComplete, theme, toggleTheme }) {
  const [step, setStep] = useObS(0);
  const [type, setType] = useObS("support");
  const [agentName, setAgentName] = useObS("Support Copilot");
  const [desc, setDesc] = useObS(AGENT_TYPES[0].placeholder);
  const [tracePath, setTracePath] = useObS("labeled"); // 'labeled' | 'unlabeled' | 'traces'
  const [upload, setUpload] = useObS("idle"); // idle | parsing | done — used by Production traces tab
  const [dsUp, setDsUp] = useObS("idle"); // idle | parsing | done — used by Labeled/Unlabeled tabs (dataset csv)
  const [endpoint, setEndpoint] = useObS("https://api.support-copilot.example/v1/chat");
  const [useMockEndpoint, setUseMockEndpoint] = useObS(true);
  const [invites, setInvites] = useObS(["raj@northwind.ai"]);
  const [inviteDraft, setInviteDraft] = useObS("");
  const labels = ["Describe", "Dataset", "First eval", "Optimization"];
  const key = "ne_live_" + "a91c7f3b2d80" + "9f4e1b6d3057";

  useObE(() => { if (upload === "parsing") { const t = setTimeout(() => setUpload("done"), 2200); return () => clearTimeout(t); } }, [upload]);
  useObE(() => { if (dsUp === "parsing") { const t = setTimeout(() => setDsUp("done"), 2200); return () => clearTimeout(t); } }, [dsUp]);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const pickType = (t) => { setType(t.id); if (desc === AGENT_TYPES.find((x) => x.id === type)?.placeholder || !desc) setDesc(t.placeholder); };

  const endpointOk = useMockEndpoint || endpoint.trim().length > 8;
  const canContinue = step === 0 ? agentName && desc.trim().length > 10
    : step === 1 ? (tracePath === "traces" ? upload === "done"
        : (tracePath === "labeled" || tracePath === "unlabeled") ? (dsUp === "done" && endpointOk)
        : false)
    : true;

  return <div style={{ height: "100%", display: "flex", background: "var(--bg)" }}>
    {/* brand rail */}
    <div className="col" style={{ width: 300, flexShrink: 0, padding: 36, justifyContent: "space-between", background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
      <div className="row gap-2"><div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>{window.Icons.logo({ size: 19 })}</div><span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.03em" }}>AutoEval</span></div>
      <div className="col gap-4">
        <AgentAvatar id="copilot" size={40} />
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2 }}>Let's set up your first eval.</h2>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.6 }}>Tell me what your agent does and point me at your data. I'll draft a dataset and rubric, calibrate a judge, and run a baseline — you just review and approve.</p>
        </div>
        <div className="col gap-2" style={{ marginTop: 6 }}>
          {labels.map((l, i) => {
            const clickable = i === 3; // only Optimization is freely jumpable; previous 3 steps untouched
            const inner = <>
              <span style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: i < step ? "var(--pos)" : i === step ? "var(--accent)" : "var(--surface-3)", color: i <= step ? "white" : "var(--text-3)" }} className="mono">{i < step ? window.Icons.check({ size: 11, sw: 3 }) : i + 1}</span>
              {l}
            </>;
            const sharedStyle = { fontSize: 12.5, color: i === step ? "var(--text)" : i < step ? "var(--text-2)" : "var(--text-faint)", fontWeight: i === step ? 600 : 500 };
            return clickable
              ? <button key={l} onClick={() => setStep(i)} className="row gap-2" style={{ ...sharedStyle, border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>{inner}</button>
              : <div key={l} className="row gap-2" style={sharedStyle}>{inner}</div>;
          })}
        </div>
      </div>
      <div className="row gap-2"><span className="faint" style={{ fontSize: 12, flex: 1 }}>Northwind AI · Free plan</span>
        <button onClick={toggleTheme} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}>{theme === "light" ? window.Icons.moon({ size: 15 }) : window.Icons.sun({ size: 15 })}</button>
      </div>
    </div>

    {/* step content */}
    <div className="col" style={{ flex: 1, overflowY: "auto" }}>
      <div className="col" style={{ width: 580, maxWidth: "100%", margin: "0 auto", padding: "52px 32px", gap: 22, flex: 1, justifyContent: "center" }}>

        {/* STEP 0 — describe */}
        {step === 0 && <div className="col gap-5 view-enter">
          <div><div className="row gap-2" style={{ marginBottom: 8 }}><AgentAvatar id="copilot" size={24} /><span className="faint" style={{ fontSize: 12.5 }}>Eval Copilot</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Tell us about your agent</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>These details inform the dataset, rubric, and judge I'll draft for you.</p></div>
          <div className="col gap-2">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Agent type</span>
            <div className="row gap-3 wrap">
              {AGENT_TYPES.map((t) => <button key={t.id} onClick={() => pickType(t)} style={{ flex: "1 1 calc(50% - 6px)", minWidth: 200, textAlign: "left", padding: 15, borderRadius: "var(--r-lg)", border: `1.5px solid ${type === t.id ? "var(--accent)" : "var(--border)"}`, background: type === t.id ? "var(--accent-soft)" : "var(--surface)", transition: "all .13s" }}>
                <div className="row gap-2" style={{ marginBottom: 8 }}><span style={{ width: 30, height: 30, borderRadius: 8, background: type === t.id ? "var(--accent)" : "var(--surface-3)", color: type === t.id ? "white" : "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{window.Icons[t.icon]({ size: 16 })}</span>{type === t.id && <span style={{ marginLeft: "auto", color: "var(--accent)" }}>{window.Icons.check({ size: 17, sw: 2.4 })}</span>}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t.name}</div><div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{t.desc}</div>
              </button>)}
            </div>
          </div>
          <Field label="Agent name"><Input value={agentName} onChange={(e) => setAgentName(e.target.value)} /></Field>
          <div className="col gap-2">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Describe your agent</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Describe its purpose, target users, typical inputs, the tools or knowledge sources it can call, and what distinguishes a strong response from a weak one." style={{ padding: "11px 13px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--surface)", outline: "none", fontSize: 13.5, resize: "vertical", lineHeight: 1.55, fontFamily: "var(--font-sans)" }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.boxShadow = "none"; }} />
            <span className="row gap-1 faint" style={{ fontSize: 11.5 }}>{window.Icons.bolt({ size: 13, style: { color: "var(--accent-text)" } })} Cover purpose, target users, inputs, tools or knowledge sources, and what distinguishes a strong vs. weak answer.</span>
          </div>
        </div>}

        {/* STEP 1 — golden dataset + trace generation */}
        {step === 1 && <div className="col gap-5 view-enter">
          <div><div className="row gap-2" style={{ marginBottom: 8 }}><AgentAvatar id="copilot" size={24} /><span className="faint" style={{ fontSize: 12.5 }}>Eval Copilot</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Connect a golden dataset</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>A <b>golden dataset</b> is the set of inputs (and, ideally, <b>labels</b> — your ideal outputs or per-criterion scores) we'll evaluate your agent against. I'll call your agent on every input to capture <b>traces</b>, then score each trace against the rubric — that's how we find the gaps and target improvements.</p></div>

          <div style={{ padding: "14px 16px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="row gap-2" style={{ marginBottom: 8, alignItems: "center" }}>
              {window.Icons.trace({ size: 16, style: { color: "var(--accent-text)" } })}
              <span style={{ fontSize: 13, fontWeight: 700 }}>What's a trace?</span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "var(--accent-soft)", color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: "0.04em" }}>We generate this</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>A trace records what your agent did on one input — the output, the tools it called, the context it retrieved, and how long it took. I'll <b>generate one for every input</b> in your dataset by calling your agent's API.</p>
            <pre className="mono" style={{ padding: "12px 14px", borderRadius: 6, background: "var(--bg-inset)", border: "1px solid var(--border)", fontSize: 11.5, lineHeight: 1.7, overflowX: "auto", margin: 0, color: "var(--text)" }}>{`{
  "input":   "Where is my order #1042?",      // the user's question
  "output":  "Your order shipped May 24 …",   // what your agent answered
  "tools":   [{ "name": "order_lookup",       // tools your agent called
                "args": { "id": "1042" } }],
  "context": ["help/shipping#tracking"],      // what it retrieved
  "latency_ms": 870                            // how fast
}`}</pre>
          </div>

          {/* tab selector */}
          <div className="col gap-2">
            <span style={{ fontSize: 13, fontWeight: 600 }}>What do you have?</span>
            <div className="row gap-3">
              {[["labeled", "dataset", "Labeled goldens", "Inputs + ideal outputs (or scores)", "Recommended"],
                ["unlabeled", "doc", "Unlabeled goldens", "Inputs only — we'll auto-label the traces", null],
                ["traces", "trace", "Production traces only", "We'll curate a starter dataset for you", null]].map(([id, ic, t, d, badge]) =>
                <button key={id} onClick={() => setTracePath(id)} style={{ flex: 1, textAlign: "left", padding: 13, borderRadius: "var(--r-lg)", border: `1.5px solid ${tracePath === id ? "var(--accent)" : "var(--border)"}`, background: tracePath === id ? "var(--accent-soft)" : "var(--surface)", transition: "all .13s" }}>
                  <div className="row gap-2" style={{ marginBottom: 6 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 7, background: tracePath === id ? "var(--accent)" : "var(--surface-3)", color: tracePath === id ? "white" : "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{window.Icons[ic]({ size: 15 })}</span>
                    {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "var(--accent-soft)", color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{badge}</span>}
                    {tracePath === id && <span style={{ marginLeft: "auto", color: "var(--accent)" }}>{window.Icons.check({ size: 16, sw: 2.4 })}</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{d}</div>
                </button>)}
            </div>
          </div>

          {/* path A & B: dataset upload + agent endpoint */}
          {(tracePath === "labeled" || tracePath === "unlabeled") && <div className="col gap-3 view-enter">
            {dsUp === "done"
              ? <div className="row gap-2" style={{ padding: "13px 15px", borderRadius: "var(--r-md)", background: "var(--pos-soft)", border: "1px solid transparent" }}>{window.Icons.check({ size: 18, style: { color: "var(--pos)" } })}<div className="grow"><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{tracePath === "labeled" ? "support_qa_labeled.csv — 120 examples loaded" : "support_qa_inputs.csv — 120 inputs loaded"}</div><div className="faint" style={{ fontSize: 11.5, marginTop: 1 }}>columns detected: {tracePath === "labeled" ? "input · ideal_output · score (1–5)" : "input"}</div></div></div>
              : <button onClick={() => setDsUp("parsing")} disabled={dsUp === "parsing"} style={{ padding: "26px 20px", borderRadius: "var(--r-lg)", border: "1.5px dashed var(--border-strong)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .13s" }}
                  onMouseEnter={(e) => { if (dsUp === "idle") { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; } }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.background = "var(--surface)"; }}>
                  {dsUp === "parsing" ? <><Spinner size={20} /><span style={{ fontSize: 13, fontWeight: 600 }}>Reading dataset…</span></> : <>{window.Icons.dataset({ size: 22, style: { color: "var(--text-3)" } })}<span style={{ fontSize: 13.5, fontWeight: 600 }}>Drop <span className="mono">{tracePath === "labeled" ? "labeled.csv" : "inputs.csv"}</span> / <span className="mono">.jsonl</span> here, or browse</span><span className="faint" style={{ fontSize: 12, textAlign: "center" }}>{tracePath === "labeled" ? "input + ideal_output + (optional) per-criterion scores" : "just the inputs — we'll auto-label the resulting traces with a judge model"}</span></>}
                </button>}

            <div className="col gap-2">
              <span style={{ fontSize: 13, fontWeight: 600 }}>Agent endpoint</span>
              <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} disabled={useMockEndpoint} placeholder="https://api.your-agent.com/v1/chat" />
              <label className="row gap-2 faint" style={{ fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={useMockEndpoint} onChange={(e) => setUseMockEndpoint(e.target.checked)} style={{ cursor: "pointer" }} />
                <span>Use mock endpoint (Support Copilot v1.2) — handy for trying the platform out</span>
              </label>
            </div>

            {tracePath === "unlabeled" && <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12.5 }}>
              {window.Icons.info({ size: 15, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 1 } })}<span className="muted">After capturing traces, I'll <b>auto-label each one with a strong judge model</b>. You'll review the labels before they harden into your golden set — or hand them off to your team for human review.</span>
            </div>}
          </div>}

          {/* path C: production traces only */}
          {tracePath === "traces" && <div className="col gap-3 view-enter">
            <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12.5 }}>
              {window.Icons.info({ size: 15, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 1 } })}<span className="muted">No dataset yet — that's fine. I'll <b>work directly from your traces</b>: derive a rubric from the trace distribution, then score every trace against it.</span>
            </div>
            {upload === "done"
              ? <div className="row gap-2" style={{ padding: "13px 15px", borderRadius: "var(--r-md)", background: "var(--pos-soft)", border: "1px solid transparent" }}>{window.Icons.check({ size: 18, style: { color: "var(--pos)" } })}<div className="grow"><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>traces.zip — 512 traces parsed</div><div className="faint" style={{ fontSize: 11.5, marginTop: 1 }}>schema detected: input · output · context · tools · latency_ms</div></div></div>
              : <button onClick={() => setUpload("parsing")} disabled={upload === "parsing"} style={{ padding: "26px 20px", borderRadius: "var(--r-lg)", border: "1.5px dashed var(--border-strong)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .13s" }}
                  onMouseEnter={(e) => { if (upload === "idle") { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; } }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.background = "var(--surface)"; }}>
                  {upload === "parsing" ? <><Spinner size={20} /><span style={{ fontSize: 13, fontWeight: 600 }}>Parsing traces.zip…</span></> : <>{window.Icons.download({ size: 22, style: { color: "var(--text-3)" } })}<span style={{ fontSize: 13.5, fontWeight: 600 }}>Drop <span className="mono">traces.zip</span> here, or browse</span><span className="faint" style={{ fontSize: 12 }}>JSONL / zip exported from your logs · max 50 MB</span></>}
                </button>}
          </div>}
        </div>}

        {/* STEP 2 — first eval */}
        {step === 2 && <div className="col gap-5 view-enter">
          <div><div className="row gap-2" style={{ marginBottom: 8 }}><AgentAvatar id="copilot" size={24} /><span className="faint" style={{ fontSize: 12.5 }}>Eval Copilot</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Ready to build your first eval</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{tracePath === "labeled" ? "You brought labeled goldens — I'll run your agent on every input, score each trace against the rubric calibrated to your labels, and surface the gaps." : tracePath === "unlabeled" ? "You brought goldens without labels — I'll run your agent, auto-label each trace with a strong judge model (yours to review), then score against the rubric." : "You brought production traces — I'll analyze them, derive a rubric from the trace distribution, then score every trace against it."}</p></div>
          <div className="col gap-2" style={{ padding: "8px 4px" }}>
            {(tracePath === "labeled"
              ? [["trace", "Run your agent on every input — capture traces"], ["ruler", "Calibrate the rubric against your labels"], ["flask", "Score each trace and produce a baseline"], ["dashboard", "Review report & recommendations"]]
              : tracePath === "unlabeled"
              ? [["trace", "Run your agent on every input — capture traces"], ["ruler", "Derive a rubric from the resulting traces"], ["check", "Auto-label each trace with a judge model"], ["flask", "Score against the rubric and produce a baseline"], ["dashboard", "Review report & recommendations"]]
              : [["trace", "Analyze your traces — topics, distribution, behaviors"], ["ruler", "Derive a rubric from the trace distribution"], ["flask", "Score every trace against the rubric — baseline"], ["dashboard", "Review report & recommendations"]]
            ).map(([ic, l], i) => <div key={i} className="row gap-3" style={{ padding: "9px 11px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{window.Icons[ic]({ size: 15 })}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
              <span className="mono faint" style={{ fontSize: 11, marginLeft: "auto" }}>{i + 1}</span>
            </div>)}
          </div>
          <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12 }}>
            {window.Icons.info({ size: 15, style: { color: "var(--text-3)", flexShrink: 0 } })}<span className="muted">Copilot runs on the platform model — free. The baseline run uses your provider key.</span>
          </div>
        </div>}

        {/* STEP 3 — iterative optimization */}
        {step === 3 && <div className="col gap-5 view-enter">
          <div><div className="row gap-2" style={{ marginBottom: 8 }}><AgentAvatar id="copilot" size={24} /><span className="faint" style={{ fontSize: 12.5 }}>Eval Copilot</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Then iterate to improve</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55 }}>The first eval is just the baseline. You'll iterate from here: take a suggested fix from the report, re-run against the <b>same rubric and same dataset</b>, and compare. Same ruler every iteration — real, comparable progress.</p></div>
          <div className="col gap-2" style={{ padding: "8px 4px" }}>
            {[["dashboard", "Read the report — gaps ranked by impact, each with a fix"],
              ["ruler", "Apply a fix to your prompt, retrieval, or tools"],
              ["flask", "Re-run as a new experiment — same rubric, same dataset"],
              ["layers", "Compare to the previous run — what improved, what regressed"],
              ["trace", "Repeat — every iteration tracked against the fixed ruler"]
            ].map(([ic, l], i) => <div key={i} className="row gap-3" style={{ padding: "9px 11px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{window.Icons[ic]({ size: 15 })}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
              <span className="mono faint" style={{ fontSize: 11, marginLeft: "auto" }}>{i + 1}</span>
            </div>)}
          </div>
          <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12 }}>
            {window.Icons.info({ size: 15, style: { color: "var(--accent-text)", flexShrink: 0 } })}<span className="muted">Because the rubric and dataset stay fixed across runs, every score is directly comparable — no apples-to-oranges drift between iterations.</span>
          </div>
        </div>}

        {/* nav */}
        <div className="row gap-2" style={{ justifyContent: "space-between", marginTop: 4 }}>
          {step > 0 ? <Btn variant="ghost" icon="chevLeft" onClick={back}>Back</Btn> : <span />}
          {step < 2 && <Btn variant="primary" iconR="arrowRight" disabled={!canContinue} onClick={next}>Continue</Btn>}
          {step === 2 && <Btn variant="primary" size="lg" icon="bolt" onClick={() => onComplete(tracePath || "traces")}>Build my first eval</Btn>}
          {step === 3 && <Btn variant="ghost" icon="chevLeft" onClick={() => setStep(2)}>Back to first eval</Btn>}
        </div>
      </div>
    </div>
  </div>;
}

window.OnboardingFlow = OnboardingFlow;
