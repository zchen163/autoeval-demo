// views_experiments.jsx
const { useState: useXS } = React;

function ConfigChip({ k, v }) {
  return <span className="row gap-1" style={{ fontSize: 12, padding: "3px 9px", borderRadius: 99, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
    <span className="faint" style={{ fontSize: 11 }}>{k}</span>
    <span className="mono" style={{ fontWeight: 600 }}>{v}</span>
  </span>;
}

function RunModal({ open, onClose, onRun }) {
  const [ver, setVer] = useXS("v1.4");
  const [dataset, setDataset] = useXS("ds_golden");
  const PROMPTS = { "v1.4": "reflect-v1", "v1.3": "baseline-v1", "v1.2": "baseline-v1" };
  const RERANK = { "v1.4": "cohere-rerank-v2", "v1.3": "cohere-rerank-v2", "v1.2": "none" };
  const TOOLS = { "v1.4": "doc-search, memory", "v1.3": "doc-search", "v1.2": "doc-search" };
  const BIAS = { "v1.4": 0.13, "v1.3": 0.09, "v1.2": 0.0 };
  const submit = () => onRun({
    name: ver + " · " + PROMPTS[ver] + (RERANK[ver] !== "none" ? " + rerank" : ""),
    version: ver, prompt: PROMPTS[ver], rerank: RERANK[ver], tools: TOOLS[ver], bias: BIAS[ver],
    dataset, datasetVersion: dataset === "ds_golden" ? "v3" : "v2",
  });
  return <Modal open={open} onClose={onClose} title="Run experiment" sub="Connects directly to the agent and scores its responses over a dataset version" width={520}
    footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" icon="play" onClick={submit}>Run eval</Btn></>}>
    <Field label="Dataset"><Select value={dataset} onChange={(e) => setDataset(e.target.value)} options={[{ value: "ds_golden", label: "Support QA — Golden · v3 (16 records)" }, { value: "ds_edge", label: "Edge cases — adversarial · v2" }]} /></Field>
    <div className="row gap-3">
      <div style={{ flex: 2 }}><Field label="Agent endpoint"><Select options={[{ value: "prod", label: "support-copilot · production" }, { value: "staging", label: "support-copilot · staging" }, { value: "custom", label: "Custom URL…" }]} /></Field></div>
      <div style={{ flex: 1 }}><Field label="Version"><Select value={ver} onChange={(e) => setVer(e.target.value)} options={["v1.4", "v1.3", "v1.2"]} /></Field></div>
    </div>
    <Field label="Agent config snapshot" hint="Captured from the agent at run time and pinned to this experiment for reproducibility.">
      <div className="row gap-2 wrap" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        {[["prompt", PROMPTS[ver]], ["rerank", RERANK[ver]], ["top_k", "8"], ["tools", TOOLS[ver]]].map(([k, v]) =>
          <span key={k} className="row gap-1" style={{ fontSize: 11.5 }}><span className="faint">{k}</span><span className="mono" style={{ fontWeight: 600 }}>{v}</span></span>)}
      </div>
    </Field>
    <Field label="Scorers" hint="LLM-as-judge runs automatically; human review can be queued after.">
      <div className="col gap-2">
        {[["LLM-as-judge (gpt-4o)", true], ["RAG Answer Quality rubric", true], ["Queue for human review", false]].map(([l, on]) =>
          <label key={l} className="row gap-2" style={{ padding: "8px 11px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", cursor: "pointer", background: on ? "var(--accent-soft)" : "var(--surface)" }}>
            <input type="checkbox" defaultChecked={on} style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
          </label>)}
      </div>
    </Field>
    <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12.5 }}>
      {window.Icons.info({ size: 15, style: { color: "var(--text-3)", flexShrink: 0 } })}
      <span className="muted">Uses the org's <b>ci-eval-runner</b> API key. Estimated cost <span className="mono">~$2.80</span>.</span>
    </div>
  </Modal>;
}

function ExperimentsList({ go, route, push }) {
  const db = useDB();
  const [sel, setSel] = useXS([]);
  const [q, setQ] = useXS("");
  const [status, setStatus] = useXS("all");
  const [showRun, setShowRun] = useXS(route.create || false);

  const runExperiment = (cfg) => {
    setShowRun(false);
    const e = Store.addExperiment(cfg);
    push("Experiment queued — running eval", "pos");
    // animate progress, then complete with real generated scores
    let p = 0.05;
    const iv = setInterval(() => { p = Math.min(0.95, p + 0.13 + Math.random() * 0.1); Store.setProgress(e.id, p); }, 600);
    setTimeout(() => { clearInterval(iv); Store.completeExperiment(e.id, cfg); push("Eval complete — " + cfg.name, "pos"); }, 4200);
  };

  const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : [s[1], id]);
  let rows = db.EXPERIMENTS.filter((e) => (status === "all" || e.status === status) && e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="col gap-5">
      <PageHead title="Experiments" sub="Each run connects directly to an agent version and scores its answers against the project rubric."
        crumbs={[{ label: DB.PROJECT.name }, { label: "Experiments" }]}
        actions={<Btn variant="primary" icon="play" onClick={() => setShowRun(true)}>Run experiment</Btn>} />

      <div className="row gap-3" style={{ justifyContent: "space-between" }}>
        <div className="row gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search experiments…" />
          <Segment size="sm" options={[{ value: "all", label: "All" }, { value: "complete", label: "Complete" }, { value: "running", label: "Running" }]} value={status} onChange={setStatus} />
        </div>
        {sel.length === 2
          ? <Btn variant="primary" icon="layers" onClick={() => go({ view: "compare", a: sel[0], b: sel[1] })}>Compare 2 selected</Btn>
          : <span className="faint" style={{ fontSize: 12.5 }}>{sel.length === 1 ? "Select 1 more to compare" : "Select 2 rows to compare"}</span>}
      </div>

      <Card pad={0}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {["", "Experiment", "Status", "Overall", "Records", "Dataset", "Run", ""].map((h, i) =>
              <th key={i} style={{ textAlign: i === 3 ? "left" : i === 4 ? "right" : "left", padding: "10px 14px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((e, i) => {
              const checked = sel.includes(e.id);
              return <tr key={e.id} style={{ cursor: "pointer", background: checked ? "var(--accent-soft)" : "transparent", transition: "background .12s" }}
                onMouseEnter={(ev) => { if (!checked) ev.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={(ev) => { if (!checked) ev.currentTarget.style.background = "transparent"; }}>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", width: 20 }} onClick={(ev) => { ev.stopPropagation(); e.status === "complete" && toggle(e.id); }}>
                  {e.status === "complete" && <span style={{ width: 17, height: 17, borderRadius: 5, border: `1.5px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`, background: checked ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>{checked && window.Icons.check({ size: 12, sw: 3 })}</span>}
                </td>
                <td onClick={() => go({ view: "experiments", id: e.id })} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.name}</div>
                  <div className="mono faint" style={{ fontSize: 11, marginTop: 2 }}>{e.id} · {e.by}</div>
                </td>
                <td onClick={() => go({ view: "experiments", id: e.id })} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                  {e.status === "running" ? <div className="col gap-1"><StatusBadge status="running" /><div style={{ width: 80, height: 4, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${e.progress * 100}%`, background: "var(--accent)" }} /></div></div> : <StatusBadge status={e.status} />}
                </td>
                <td onClick={() => go({ view: "experiments", id: e.id })} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>{e.summary ? <ScoreBar value={e.summary.overall} w={50} /> : <span className="faint mono" style={{ fontSize: 12 }}>—</span>}</td>
                <td onClick={() => go({ view: "experiments", id: e.id })} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }} className="mono">{e.records}</td>
                <td onClick={() => go({ view: "experiments", id: e.id })} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}><span className="mono" style={{ fontSize: 12 }}>Golden <span className="faint">{e.datasetVersion}</span></span></td>
                <td onClick={() => go({ view: "experiments", id: e.id })} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }} className="mono faint">{e.date.split(" ")[0]}</td>
                <td onClick={() => go({ view: "experiments", id: e.id })} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-faint)" }}>{window.Icons.chevRight({ size: 15 })}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </Card>
      <RunModal open={showRun} onClose={() => setShowRun(false)} onRun={runExperiment} />
    </div>
  );
}

function MetricTile({ name, value, fmtKey, sub }) {
  const n = fmtKey ? norm(fmtKey, value) : value;
  return <div style={{ flex: 1, padding: "14px 16px", borderRight: "1px solid var(--border)" }}>
    <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
    <div className="row gap-2" style={{ alignItems: "baseline", marginTop: 8 }}>
      <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: scoreColor(n), fontVariantNumeric: "tabular-nums" }}>{fmtKey ? fmtScore(fmtKey, value) : value.toFixed(3)}</span>
      {sub && <span className="faint" style={{ fontSize: 11.5 }}>{sub}</span>}
    </div>
    <div style={{ height: 4, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden", marginTop: 8 }}><div style={{ height: "100%", width: `${n * 100}%`, background: scoreColor(n), borderRadius: 99 }} /></div>
  </div>;
}

function ResultRow({ r, expanded, onToggle }) {
  const rec = DB.DATASET_RECORDS.find((x) => x.id === r.recId);
  return <>
    <tr onClick={onToggle} style={{ cursor: "pointer", transition: "background .12s" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = expanded ? "var(--surface-2)" : "transparent"}>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", width: 22, color: "var(--text-faint)" }}>{expanded ? window.Icons.chevDown({ size: 14 }) : window.Icons.chevRight({ size: 14 })}</td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", maxWidth: 340 }}>
        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.input}</div>
        <div style={{ marginTop: 3 }}><Topic name={r.topic} /></div>
      </td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}><div className="row" style={{ justifyContent: "flex-end" }}><ScoreBar value={r.overall} w={44} /></div></td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }} className="mono">{r.scores.faithfulness.toFixed(2)}</td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }} className="mono">{r.scores.relevance.toFixed(1)}</td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }} className="mono">{r.scores.precision.toFixed(2)}</td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>{r.scores.completeness ? <Badge tone="pos">pass</Badge> : <Badge tone="neg">fail</Badge>}</td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }} className="mono faint">{r.latency}ms</td>
    </tr>
    {expanded && <tr><td colSpan={8} style={{ padding: 0, borderBottom: "1px solid var(--border)", background: "var(--bg-inset)" }}>
      <div className="row gap-4" style={{ padding: "16px 20px 18px 50px", alignItems: "stretch" }}>
        <div className="col gap-3" style={{ flex: 1 }}>
          <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Model output</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>{r.output}</div></div>
          <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Expected (reference)</div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.55, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>{rec.expected}</div></div>
        </div>
        <div className="col gap-3" style={{ width: 300, flexShrink: 0 }}>
          <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Judge rationale</div>
            <div className="row gap-2" style={{ fontSize: 12.5, lineHeight: 1.5, padding: "10px 12px", background: "var(--accent-soft)", border: "1px solid var(--accent-soft-border)", borderRadius: "var(--r-md)", color: "var(--text-2)" }}>
              {window.Icons.bolt({ size: 14, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 2 } })}<span>{r.rationale}</span></div></div>
          <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Retrieved chunks</div>
            <div className="col gap-1">{rec.chunks.map((c) => <span key={c} className="mono row gap-2" style={{ fontSize: 11.5, color: "var(--text-2)" }}>{window.Icons.doc({ size: 12, style: { color: "var(--text-faint)" } })}{c}</span>)}</div></div>
        </div>
      </div>
    </td></tr>}
  </>;
}

function ExperimentDetail({ id, go, push }) {
  const db = useDB();
  const e = db.expById(id);
  const [exp, setExp] = useXS(null);
  const [topic, setTopic] = useXS("all");
  const [sort, setSort] = useXS("score-asc");
  if (!e) return <Empty title="Experiment not found" />;

  const reRun = () => {
    const cfg = { name: e.version + " · re-run", version: e.version, prompt: e.prompt, rerank: e.rerank, tools: e.tools, bias: e.bias, dataset: e.dataset, datasetVersion: e.datasetVersion };
    const ne = Store.addExperiment(cfg);
    push("Re-running " + e.version + "…", "pos");
    let p = 0.05; const iv = setInterval(() => { p = Math.min(0.95, p + 0.14); Store.setProgress(ne.id, p); }, 600);
    setTimeout(() => { clearInterval(iv); Store.completeExperiment(ne.id, cfg); push("Re-run complete", "pos"); go({ view: "experiments", id: ne.id }); }, 4000);
    go({ view: "experiments", id: ne.id });
  };
  if (e.status === "running") {
    return <div className="col gap-5">
      <PageHead title={e.name} crumbs={[{ label: "Experiments", onClick: () => go({ view: "experiments" }) }, { label: e.name }]} />
      <Card><div className="col" style={{ alignItems: "center", padding: "40px", gap: 14 }}>
        <Spinner size={28} /><div style={{ fontSize: 15, fontWeight: 600 }}>Running eval — {Math.round(e.progress * 16)}/16 records scored</div>
        <div style={{ width: 280, height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${e.progress * 100}%`, background: "var(--accent)", transition: "width .4s" }} /></div>
        <span className="faint" style={{ fontSize: 12.5 }}>Started {e.date} · using ci-eval-runner key</span>
      </div></Card>
    </div>;
  }
  const topics = ["all", ...new Set(e.results.map((r) => r.topic))];
  let results = e.results.filter((r) => topic === "all" || r.topic === topic);
  results.sort((a, b) => sort === "score-asc" ? a.overall - b.overall : sort === "score-desc" ? b.overall - a.overall : 0);

  return <div className="col gap-5">
    <PageHead title={e.name}
      crumbs={[{ label: "Experiments", onClick: () => go({ view: "experiments" }) }, { label: e.name }]}
      sub={null}
      actions={<><Btn variant="default" icon="download">Export</Btn><Btn variant="default" icon="layers" onClick={() => go({ view: "compare", a: "exp_7a2f", b: e.id })}>Compare</Btn><Btn variant="primary" icon="play" onClick={reRun}>Re-run</Btn></>} />

    <div className="row gap-2 wrap">
      <ConfigChip k="agent" v={e.agent} /><ConfigChip k="version" v={e.version} /><ConfigChip k="prompt" v={e.prompt} /><ConfigChip k="rerank" v={e.rerank} /><ConfigChip k="tools" v={e.tools} />
      <ConfigChip k="dataset" v={"Golden " + e.datasetVersion} /><ConfigChip k="rubric" v="RAG Answer Quality" />
      <span className="row gap-1" style={{ fontSize: 12, padding: "3px 9px", borderRadius: 99, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>{window.Icons.clock({ size: 12 })} {e.dur} · ${e.cost.toFixed(2)}</span>
    </div>

    <Card pad={0}>
      <div className="row" style={{ alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "16px 20px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16 }}>
          <Ring value={e.summary.overall} size={66} stroke={7} />
          <div><div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Weighted overall</div><div className="mono" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em" }}>{e.summary.overall.toFixed(3)}</div></div>
        </div>
        <MetricTile name="Faithfulness" value={e.summary.faithfulness} fmtKey="faithfulness" />
        <MetricTile name="Answer relevance" value={e.summary.relevance} fmtKey="relevance" sub="/ 5" />
        <MetricTile name="Context precision" value={e.summary.precision} fmtKey="precision" />
        <div style={{ flex: 1, padding: "14px 16px" }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Completeness</div>
          <div className="row gap-2" style={{ alignItems: "baseline", marginTop: 8 }}><span className="mono" style={{ fontSize: 22, fontWeight: 700, color: scoreColor(e.summary.completeness) }}>{(e.summary.completeness * 100).toFixed(0)}%</span><span className="faint" style={{ fontSize: 11.5 }}>pass</span></div>
          <div style={{ height: 4, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden", marginTop: 8 }}><div style={{ height: "100%", width: `${e.summary.completeness * 100}%`, background: scoreColor(e.summary.completeness), borderRadius: 99 }} /></div>
        </div>
      </div>
    </Card>

    <div className="row gap-3" style={{ justifyContent: "space-between" }}>
      <div className="row gap-2">
        <Segment size="sm" options={topics.map((t) => ({ value: t, label: t === "all" ? "All topics" : t }))} value={topic} onChange={setTopic} />
      </div>
      <Select value={sort} onChange={(ev) => setSort(ev.target.value)} options={[{ value: "score-asc", label: "Lowest score first" }, { value: "score-desc", label: "Highest score first" }, { value: "none", label: "Record order" }]} style={{ width: 180, height: 32 }} />
    </div>

    <Card pad={0}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {["", "Input", "Overall", "Faithful", "Relev.", "Prec.", "Complete", "Latency"].map((h, i) =>
            <th key={i} style={{ textAlign: i >= 2 && i <= 5 ? "right" : i === 6 || i === 7 ? "center" : "left", padding: "10px 14px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{h}</th>)}
        </tr></thead>
        <tbody>{results.map((r) => <ResultRow key={r.recId} r={r} expanded={exp === r.recId} onToggle={() => setExp(exp === r.recId ? null : r.recId)} />)}</tbody>
      </table>
    </Card>
  </div>;
}

function ExperimentsView(props) {
  if (props.route.id) return <ExperimentDetail id={props.route.id} {...props} />;
  return <ExperimentsList {...props} />;
}
window.ExperimentsView = ExperimentsView;
