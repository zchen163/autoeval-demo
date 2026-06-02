// views_rubric_edit.jsx — rubric create + criteria editor (real mutations via Store)
const { useState: useReS } = React;

const CRIT_TYPES = [
  { value: "0-1", label: "0 – 1 score" },
  { value: "1-5", label: "1 – 5 scale" },
  { value: "pass/fail", label: "pass / fail" },
];

function WeightBar({ value }) {
  return <div style={{ width: "100%", height: 5, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.min(100, value * 100)}%`, background: "var(--accent)", borderRadius: 99, transition: "width .2s" }} />
  </div>;
}

// Full-screen-ish editor modal. `rubric` null = create mode.
function RubricEditor({ open, rubric, onClose, onSave, push }) {
  const [name, setName] = useReS("");
  const [crits, setCrits] = useReS([]);

  React.useEffect(() => {
    if (!open) return;
    setName(rubric ? rubric.name : "");
    setCrits(rubric ? rubric.criteria.map((c) => ({ ...c })) : [{ key: "c_" + Math.random().toString(36).slice(2, 6), name: "", type: "1-5", desc: "", weight: 1 }]);
  }, [open, rubric]);

  const rawSum = crits.reduce((s, c) => s + (+c.weight || 0), 0) || 1;
  const pct = (w) => (+w || 0) / rawSum;

  const setCrit = (i, patch) => setCrits((cs) => cs.map((c, j) => j === i ? { ...c, ...patch } : c));
  const addCrit = () => setCrits((cs) => [...cs, { key: "c_" + Math.random().toString(36).slice(2, 6), name: "", type: "1-5", desc: "", weight: 1 }]);
  const removeCrit = (i) => setCrits((cs) => cs.filter((_, j) => j !== i));

  const valid = name.trim() && crits.length > 0 && crits.every((c) => c.name.trim());

  return <Modal open={open} onClose={onClose} title={rubric ? "Edit rubric" : "New rubric"} sub={rubric ? rubric.id : "Define the dimensions the judge and reviewers will score on"} width={680}
    footer={<>
      <span className="faint" style={{ fontSize: 12, marginRight: "auto" }}>{crits.length} dimension{crits.length !== 1 ? "s" : ""} · weights auto-normalize to 100%</span>
      <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      <Btn variant="primary" icon="check" disabled={!valid} onClick={() => onSave({ name: name.trim(), criteria: crits.map((c) => ({ ...c, name: c.name.trim(), weight: +pct(c.weight).toFixed(2) })) })}>{rubric ? "Save changes" : "Create rubric"}</Btn>
    </>}>
    <Field label="Rubric name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. RAG Answer Quality" autoFocus /></Field>

    <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Criteria</span>
      <Btn size="sm" variant="default" icon="plus" onClick={addCrit}>Add criterion</Btn>
    </div>

    <div className="col gap-3">
      {crits.map((c, i) => <div key={c.key} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 13, background: "var(--surface-2)" }}>
        <div className="row gap-2" style={{ marginBottom: 9 }}>
          <span className="mono faint" style={{ fontSize: 11, width: 18 }}>{i + 1}</span>
          <input value={c.name} onChange={(e) => setCrit(i, { name: e.target.value })} placeholder="Criterion name" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13.5, fontWeight: 600 }} />
          <div style={{ width: 130 }}><Select value={c.type} onChange={(e) => setCrit(i, { type: e.target.value })} options={CRIT_TYPES} style={{ height: 30, fontSize: 12 }} /></div>
          <button onClick={() => removeCrit(i)} disabled={crits.length === 1} title="Remove" style={{ width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: crits.length === 1 ? "var(--text-faint)" : "var(--neg)", opacity: crits.length === 1 ? 0.4 : 1, cursor: crits.length === 1 ? "not-allowed" : "pointer" }}>{window.Icons.trash({ size: 15 })}</button>
        </div>
        <textarea value={c.desc} onChange={(e) => setCrit(i, { desc: e.target.value })} placeholder="What does this dimension measure? Be specific about good vs. bad." rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", outline: "none", fontSize: 12.5, resize: "vertical", lineHeight: 1.5, fontFamily: "var(--font-sans)" }} />
        <div className="row gap-3" style={{ marginTop: 9, alignItems: "center" }}>
          <span className="faint" style={{ fontSize: 11, width: 44 }}>weight</span>
          <input type="range" min="0" max="3" step="0.5" value={c.weight} onChange={(e) => setCrit(i, { weight: +e.target.value })} style={{ flex: 1, accentColor: "var(--accent)" }} />
          <div style={{ width: 90 }}><WeightBar value={pct(c.weight)} /></div>
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, width: 38, textAlign: "right" }}>{(pct(c.weight) * 100).toFixed(0)}%</span>
        </div>
      </div>)}
    </div>
  </Modal>;
}

window.RubricEditor = RubricEditor;
window.CRIT_TYPES = CRIT_TYPES;

// ---- Auto Rubric: agent discovers criteria from failures, you approve ----
const DISCOVERED = [
  { key: "dc1", name: "Order-number confirmation", type: "pass/fail", weight: 1.4, desc: "Confirms the order ID before taking any account action.", cluster: "cl_refund", conf: 0.93 },
  { key: "dc2", name: "Scope adherence", type: "0-1", weight: 1.2, desc: "Only claims capabilities present in retrieved context; refuses out-of-scope asks.", cluster: "cl_api", conf: 0.88 },
  { key: "dc3", name: "Multi-turn memory", type: "1-5", weight: 1.0, desc: "Carries earlier entities (workspace, order) across turns.", cluster: "cl_multi", conf: 0.81 },
  { key: "dc4", name: "Destructive-action guarding", type: "pass/fail", weight: 1.0, desc: "Surfaces irreversible-action warnings before destructive steps.", cluster: "cl_admin", conf: 0.79 },
  { key: "dc5", name: "Concision", type: "1-5", weight: 0.6, desc: "Matches brand voice; no tangents on simple asks.", cluster: "cl_tone", conf: 0.72 },
];
// ---- discovered from the WHOLE log distribution (not just failures): what the agent is expected to do well ----
const DISCOVERED_OVERALL = [
  { key: "do1", name: "Answer helpfulness", type: "1-5", weight: 1.3, desc: "Resolves the user's actual question across the most common intents (billing, account, product).", topics: "all 73 logs", conf: 0.9 },
  { key: "do2", name: "Groundedness", type: "0-1", weight: 1.2, desc: "Claims are supported by retrieved context, on every request — not only the failing ones.", topics: "all 73 logs", conf: 0.87 },
  { key: "do3", name: "Coverage of top intents", type: "0-1", weight: 1.0, desc: "Handles the head of the distribution: Billing (31%), Account (22%), Product (19%).", topics: "intent histogram", conf: 0.85 },
  { key: "do4", name: "Tone & brand voice", type: "1-5", weight: 0.9, desc: "Consistent, friendly, concise across all conversations.", topics: "all 73 logs", conf: 0.82 },
  { key: "do5", name: "Latency within budget", type: "pass/fail", weight: 0.7, desc: "Responds under the 2.5s p90 target seen across normal traffic.", topics: "latency dist.", conf: 0.8 },
];

function RubricAgentFlow({ open, onClose, onCreate, push, presetSource }) {
  const [stage, setStage] = useReS("intent"); // intent | working | review
  const [intent, setIntent] = useReS("Score my support agent on order, refund and tracking — focus on what actually fails in prod.");
  const [source, setSource] = useReS(presetSource || "clusters");
  const overall = source === "logs";
  const CRITS = overall ? DISCOVERED_OVERALL : DISCOVERED;
  const [picked, setPicked] = useReS(DISCOVERED.map((c) => c.key));

  React.useEffect(() => { if (open) { setStage("intent"); const s = presetSource || "clusters"; setSource(s); setPicked((s === "logs" ? DISCOVERED_OVERALL : DISCOVERED).map((c) => c.key)); if (s === "logs") setIntent("Score my support agent on what it does across all production traffic — coverage, helpfulness and tone, not just failures."); } }, [open, presetSource]);
  React.useEffect(() => { setPicked(CRITS.map((c) => c.key)); }, [source]);

  const discover = () => { setStage("working"); setTimeout(() => setStage("review"), 2100); };
  const chosen = CRITS.filter((c) => picked.includes(c.key));
  const rawSum = chosen.reduce((s, c) => s + c.weight, 0) || 1;

  const create = () => {
    const criteria = chosen.map((c) => ({ key: c.key, name: c.name, type: c.type, desc: c.desc, weight: +(c.weight / rawSum).toFixed(2) }));
    onCreate({ name: overall ? "Agent Quality — from prod logs" : "RAG Answer Quality (auto)", criteria });
    push("Rubric created from " + chosen.length + " discovered criteria", "pos");
    onClose();
  };

  return <Modal open={open} onClose={onClose} title="Rubric Agent" sub={overall ? "Builds a rubric from your whole log distribution — you approve" : "Discovers scoring criteria from your real failures — you approve"} width={620}
    footer={stage === "review"
      ? <><span className="faint" style={{ fontSize: 12, marginRight: "auto" }}>{chosen.length} criteria · weights normalize to 100%</span><Btn variant="ghost" onClick={() => setStage("intent")}>Back</Btn><Btn variant="primary" icon="check" disabled={!chosen.length} onClick={create}>Create rubric</Btn></>
      : stage === "intent" ? <><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" icon="bolt" onClick={discover}>Discover criteria</Btn></> : null}>

    {stage === "intent" && <>
      <Field label="What should a good answer look like?" hint="Plain language — the agent turns this plus your log data into measurable criteria.">
        <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={3} style={{ padding: "10px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--surface)", outline: "none", fontSize: 13, resize: "vertical", lineHeight: 1.5, fontFamily: "var(--font-sans)" }} />
      </Field>
      <Field label="Discover from">
        <div className="row gap-2">
          {[["logs", "trace", "All production logs", "whole distribution, not just fails"], ["clusters", "alert", "Failure clusters", "what's going wrong"], ["desc", "doc", "My description", "no logs needed"]].map(([id, ic, t, d]) =>
            <button key={id} onClick={() => setSource(id)} style={{ flex: 1, textAlign: "left", padding: 12, borderRadius: "var(--r-md)", border: `1.5px solid ${source === id ? "var(--accent)" : "var(--border)"}`, background: source === id ? "var(--accent-soft)" : "var(--surface)" }}>
              <div className="row gap-2" style={{ marginBottom: 5 }}>{window.Icons[ic]({ size: 15, style: { color: source === id ? "var(--accent-text)" : "var(--text-3)" } })}<span style={{ fontSize: 12.5, fontWeight: 600 }}>{t}</span></div>
              <div className="faint" style={{ fontSize: 11 }}>{d}</div>
            </button>)}
        </div>
      </Field>
    </>}

    {stage === "working" && <div className="col" style={{ alignItems: "center", padding: "28px 0", gap: 14 }}>
      <Spinner size={26} />
      <div className="col gap-1" style={{ alignItems: "center" }}>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Reading {overall ? "all 73 sampled logs" : source === "clusters" ? "5 failure clusters" : "your description"}…</span>
        <span className="faint" style={{ fontSize: 12 }}>{overall ? "Modeling what good behavior looks like across normal traffic" : "Turning recurring failures into measurable criteria"}</span>
      </div>
    </div>}

    {stage === "review" && <>
      <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--accent-soft)", border: "1px solid var(--accent-soft-border)", marginBottom: 14, fontSize: 12.5 }}>
        {window.Icons.bolt({ size: 15, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 1 } })}
        <span className="muted">Found <b style={{ color: "var(--text)" }}>{CRITS.length} candidate criteria</b>{overall ? <>, covering what the agent does across <b style={{ color: "var(--text)" }}>all</b> production traffic — not just the failures.</> : <>, each traced to a real failure mode.</>} Uncheck any you don't want, then create.</span>
      </div>
      <div className="col gap-2">
        {CRITS.map((c) => { const on = picked.includes(c.key); const cl = c.cluster && DB.CLUSTERS.find((x) => x.id === c.cluster);
          return <div key={c.key} className="row gap-3" style={{ padding: "11px 13px", border: `1px solid ${on ? "var(--border-strong)" : "var(--border)"}`, borderRadius: "var(--r-md)", background: on ? "var(--surface)" : "var(--surface-2)", opacity: on ? 1 : 0.6, alignItems: "flex-start" }}>
            <button onClick={() => setPicked((p) => on ? p.filter((x) => x !== c.key) : [...p, c.key])} style={{ marginTop: 1, width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${on ? "var(--accent)" : "var(--border-strong)"}`, background: on ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{on && window.Icons.check({ size: 12, sw: 3 })}</button>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row gap-2" style={{ marginBottom: 3 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span><Badge tone="neutral">{c.type}</Badge><span className="mono faint" style={{ fontSize: 10.5, marginLeft: "auto" }}>conf {c.conf.toFixed(2)}</span></div>
              <div className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>{c.desc}</div>
              <div className="row gap-2" style={{ marginTop: 6 }}>{cl ? <><SevDot sev={cl.sev} /><span className="faint" style={{ fontSize: 11 }}>from <b style={{ color: "var(--text-2)" }}>{cl.label.split(" — ")[0]}</b> · {cl.count} traces · {(cl.failRate * 100).toFixed(0)}% fail</span></> : <span className="faint row gap-1" style={{ fontSize: 11 }}>{window.Icons.trace({ size: 11 })}from <b style={{ color: "var(--text-2)" }}>{c.topics}</b></span>}</div>
            </div>
          </div>; })}
      </div>
    </>}
  </Modal>;
}

window.RubricAgentFlow = RubricAgentFlow;
