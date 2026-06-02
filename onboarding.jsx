// onboarding.jsx — new-customer onboarding (cold start → first eval, agent-led)
const { useState: useObS, useEffect: useObE } = React;

const AGENT_TYPES = [
  { id: "support", name: "Support agent", desc: "RAG + tools over your help docs", icon: "review", placeholder: "A customer-support copilot for our SaaS. It answers questions about orders, refunds and shipment tracking by retrieving from our help center, and can call order_lookup and issue_refund tools." },
  { id: "rag", name: "RAG Q&A", desc: "Retrieval-augmented question answering", icon: "dataset", placeholder: "A documentation Q&A bot. Given a question, it retrieves passages from our docs and answers with citations." },
  { id: "code", name: "Code agent", desc: "Multi-step plan → edit → test", icon: "doc", placeholder: "A coding agent that takes a GitHub issue, plans a fix, edits files, and runs the test suite until it passes." },
  { id: "other", name: "Something else", desc: "Describe it in your own words", icon: "bolt", placeholder: "Describe its purpose, target users, typical inputs, the tools or knowledge sources it can call, and what distinguishes a strong response from a weak one." },
];

const SAMPLE_TRACE = `{
  "input": "Where is my order #1042?",
  "output": "Your order #1042 shipped on May 24 and is...",
  "context": ["help/shipping#tracking", "orders/1042"],
  "tools": [
    { "name": "order_lookup", "args": { "id": "1042" } }
  ],
  "metadata": { "intent": "tracking", "user_tier": "pro" }
}`;

function OnboardingFlow({ onComplete, theme, toggleTheme }) {
  const [step, setStep] = useObS(0);
  const [type, setType] = useObS("support");
  const [agentName, setAgentName] = useObS("Support Copilot");
  const [desc, setDesc] = useObS(AGENT_TYPES[0].placeholder);
  const [tracePath, setTracePath] = useObS(null); // 'traces' | 'describe' | 'labeled'
  const [upload, setUpload] = useObS("idle"); // idle | parsing | done
  const [labeledUp, setLabeledUp] = useObS("idle"); // idle | parsing | done
  const [format, setFormat] = useObS(SAMPLE_TRACE);
  const [copied, setCopied] = useObS(false);
  const [invites, setInvites] = useObS(["raj@northwind.ai"]);
  const [inviteDraft, setInviteDraft] = useObS("");
  const labels = ["Describe", "Traces", "First eval"];
  const key = "ne_live_" + "a91c7f3b2d80" + "9f4e1b6d3057";

  useObE(() => { if (upload === "parsing") { const t = setTimeout(() => setUpload("done"), 2200); return () => clearTimeout(t); } }, [upload]);
  useObE(() => { if (labeledUp === "parsing") { const t = setTimeout(() => setLabeledUp("done"), 2200); return () => clearTimeout(t); } }, [labeledUp]);

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const pickType = (t) => { setType(t.id); if (desc === AGENT_TYPES.find((x) => x.id === type)?.placeholder || !desc) setDesc(t.placeholder); };

  const canContinue = step === 0 ? agentName && desc.trim().length > 10
    : step === 1 ? (tracePath === "traces" ? upload === "done" : tracePath === "describe" ? format.trim().length > 10 : tracePath === "labeled" ? labeledUp === "done" : false)
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
          {labels.map((l, i) => <div key={l} className="row gap-2" style={{ fontSize: 12.5, color: i === step ? "var(--text)" : i < step ? "var(--text-2)" : "var(--text-faint)", fontWeight: i === step ? 600 : 500 }}>
            <span style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: i < step ? "var(--pos)" : i === step ? "var(--accent)" : "var(--surface-3)", color: i <= step ? "white" : "var(--text-3)" }} className="mono">{i < step ? window.Icons.check({ size: 11, sw: 3 }) : i + 1}</span>
            {l}
          </div>)}
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

        {/* STEP 1 — traces: two paths */}
        {step === 1 && <div className="col gap-5 view-enter">
          <div><div className="row gap-2" style={{ marginBottom: 8 }}><AgentAvatar id="copilot" size={24} /><span className="faint" style={{ fontSize: 12.5 }}>Eval Copilot</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Get your first traces in</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>I work best starting from real sample traces. If you don't have any yet, I'll bootstrap from your description — I just need the trace shape.</p></div>

          <div className="row gap-3">
            {[["traces", "review", "I have sample traces", "Upload a .zip from your logs, or live-connect the SDK"],
              ["labeled", "doc", "I have a labeled set", "Inputs, outputs + my own scores — chat agent"],
              ["describe", "bolt", "No traces yet", "Bootstrap from my description + a trace format"]].map(([id, ic, t, d]) =>
              <button key={id} onClick={() => setTracePath(id)} style={{ flex: 1, textAlign: "left", padding: 15, borderRadius: "var(--r-lg)", border: `1.5px solid ${tracePath === id ? "var(--accent)" : "var(--border)"}`, background: tracePath === id ? "var(--accent-soft)" : "var(--surface)", transition: "all .13s" }}>
                <div className="row gap-2" style={{ marginBottom: 8 }}><span style={{ width: 30, height: 30, borderRadius: 8, background: tracePath === id ? "var(--accent)" : "var(--surface-3)", color: tracePath === id ? "white" : "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{window.Icons[ic]({ size: 16 })}</span>{tracePath === id && <span style={{ marginLeft: "auto", color: "var(--accent)" }}>{window.Icons.check({ size: 17, sw: 2.4 })}</span>}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</div><div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{d}</div>
              </button>)}
          </div>

          {/* path A: upload */}
          {tracePath === "traces" && <div className="col gap-3 view-enter">
            {upload === "done"
              ? <div className="row gap-2" style={{ padding: "13px 15px", borderRadius: "var(--r-md)", background: "var(--pos-soft)", border: "1px solid transparent" }}>{window.Icons.check({ size: 18, style: { color: "var(--pos)" } })}<div className="grow"><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>traces.zip — 512 traces parsed</div><div className="faint" style={{ fontSize: 11.5, marginTop: 1 }}>schema detected: input · output · context · tools · metadata</div></div></div>
              : <button onClick={() => setUpload("parsing")} disabled={upload === "parsing"} style={{ padding: "26px 20px", borderRadius: "var(--r-lg)", border: "1.5px dashed var(--border-strong)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .13s" }}
                  onMouseEnter={(e) => { if (upload === "idle") { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; } }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.background = "var(--surface)"; }}>
                  {upload === "parsing" ? <><Spinner size={20} /><span style={{ fontSize: 13, fontWeight: 600 }}>Parsing traces.zip…</span></> : <>{window.Icons.download({ size: 22, style: { color: "var(--text-3)" } })}<span style={{ fontSize: 13.5, fontWeight: 600 }}>Drop <span className="mono">traces.zip</span> here, or browse</span><span className="faint" style={{ fontSize: 12 }}>JSONL / zip exported from your logs · max 50 MB</span></>}
                </button>}
            <div className="row gap-2" style={{ fontSize: 12 }} ><span className="faint">or</span><button className="row gap-1" style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-text)" }} onClick={() => setUpload("done")}>{window.Icons.bolt({ size: 13 })} live-connect the SDK & capture 512 now</button></div>
          </div>}

          {/* path B: describe + format */}
          {tracePath === "describe" && <div className="col gap-3 view-enter">
            <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12.5 }}>
              {window.Icons.info({ size: 15, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 1 } })}<span className="muted">I'll <b>synthesize</b> a starter dataset and rubric from your description. Give me one example trace so I know the exact shape your agent emits — I'll match it.</span>
            </div>
            <div className="col gap-2">
              <div className="row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 600 }}>Trace format <span className="faint" style={{ fontWeight: 400 }}>· edit or paste a fake trace</span></span><span className="mono faint" style={{ fontSize: 11 }}>JSON</span></div>
              <textarea value={format} onChange={(e) => setFormat(e.target.value)} rows={11} spellCheck={false} style={{ padding: "12px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--bg-inset)", outline: "none", fontSize: 12, resize: "vertical", lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--text)", tabSize: 2 }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.boxShadow = "none"; }} />
              <span className="row gap-1 faint" style={{ fontSize: 11.5 }}>{window.Icons.check({ size: 13, style: { color: "var(--pos)" } })} Looks valid — fields: input, output, context, tools, metadata.</span>
            </div>
          </div>}

          {/* path C: bring your own labeled dataset + results */}
          {tracePath === "labeled" && <div className="col gap-3 view-enter">
            <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12.5 }}>
              {window.Icons.info({ size: 15, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 1 } })}<span className="muted">Upload chat examples you've already <b>scored by hand</b> (input, agent output, your label). I'll infer the rubric from what separates your good vs. bad scores, and turn them into your golden set.</span>
            </div>
            {labeledUp === "done"
              ? <div className="row gap-2" style={{ padding: "13px 15px", borderRadius: "var(--r-md)", background: "var(--pos-soft)", border: "1px solid transparent" }}>{window.Icons.check({ size: 18, style: { color: "var(--pos)" } })}<div className="grow"><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>chat_labeled.csv — 120 labeled examples</div><div className="faint" style={{ fontSize: 11.5, marginTop: 1 }}>columns detected: input · output · score (1–5) · note</div></div></div>
              : <button onClick={() => setLabeledUp("parsing")} disabled={labeledUp === "parsing"} style={{ padding: "26px 20px", borderRadius: "var(--r-lg)", border: "1.5px dashed var(--border-strong)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .13s" }}
                  onMouseEnter={(e) => { if (labeledUp === "idle") { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; } }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.background = "var(--surface)"; }}>
                  {labeledUp === "parsing" ? <><Spinner size={20} /><span style={{ fontSize: 13, fontWeight: 600 }}>Reading labels & scores…</span></> : <>{window.Icons.doc({ size: 22, style: { color: "var(--text-3)" } })}<span style={{ fontSize: 13.5, fontWeight: 600 }}>Drop <span className="mono">labeled.csv</span> / <span className="mono">.jsonl</span> here, or browse</span><span className="faint" style={{ fontSize: 12 }}>inputs + outputs + your scores · the more the sharper the rubric</span></>}
                </button>}
            {labeledUp === "done" && <div className="row gap-2" style={{ fontSize: 11.5 }} ><span className="faint">Next, I'll</span><span className="row gap-1" style={{ fontWeight: 600, color: "var(--accent-text)" }}>{window.Icons.bolt({ size: 13 })} infer a rubric → build your golden set → run today's eval</span></div>}
          </div>}
        </div>}

        {/* STEP 2 — first eval */}
        {step === 2 && <div className="col gap-5 view-enter">
          <div><div className="row gap-2" style={{ marginBottom: 8 }}><AgentAvatar id="copilot" size={24} /><span className="faint" style={{ fontSize: 12.5 }}>Eval Copilot</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Ready to build your first eval</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{tracePath === "labeled" ? "You brought labeled examples — I'll infer the rubric from your scores, build the golden set, run today's eval, and keep comparing every day against it." : tracePath === "describe" ? "No traces yet — I'll synthesize a starter eval from your description and trace format, then refine with real traffic later." : "I'll run this end-to-end on your 512 traces — pausing for your approval at every step that defines correctness."}</p></div>
          <div className="col gap-2" style={{ padding: "8px 4px" }}>
            {(tracePath === "labeled"
              ? [["ruler", "Infer a rubric from your labeled scores"], ["dataset", "Build a golden dataset from your labeled examples"], ["flask", "Run today's eval, scored per rubric dimension"], ["trace", "Open the continuous monitor — compare every day"]]
              : tracePath === "describe"
              ? [["dataset", "Synthesize a starter dataset from your description + format"], ["ruler", "Auto-generate a rubric set from your description"], ["dataset", "Create the evaluation dataset"], ["flask", "Run baseline evaluation"], ["dashboard", "Review report & recommendations"]]
              : [["trace", "Analyze traces & extract behaviors"], ["ruler", "Auto-generate a rubric set from the logs"], ["dataset", "Create the evaluation dataset"], ["flask", "Run baseline evaluation"], ["dashboard", "Review report & recommendations"]]
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

        {/* nav */}
        <div className="row gap-2" style={{ justifyContent: "space-between", marginTop: 4 }}>
          {step > 0 ? <Btn variant="ghost" icon="chevLeft" onClick={back}>Back</Btn> : <span />}
          {step < 2 && <div className="row gap-2">
            {step === 1 && <Btn variant="ghost" onClick={() => { setTracePath("describe"); next(); }}>Skip</Btn>}
            <Btn variant="primary" iconR="arrowRight" disabled={!canContinue} onClick={next}>Continue</Btn>
          </div>}
          {step === 2 && <Btn variant="primary" size="lg" icon="bolt" onClick={() => onComplete(tracePath || "describe")}>Build my first eval</Btn>}
        </div>
      </div>
    </div>
  </div>;
}

window.OnboardingFlow = OnboardingFlow;
