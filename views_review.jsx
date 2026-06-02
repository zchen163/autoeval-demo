// views_review.jsx — Human Review Queue + Online Traces
const { useState: useRS } = React;

function PriorityDot({ p }) {
  const c = p === "high" ? "var(--neg)" : p === "med" ? "var(--warn)" : "var(--text-faint)";
  return <span title={p + " priority"} style={{ width: 7, height: 7, borderRadius: 99, background: c, flexShrink: 0 }} />;
}

// interactive scoring control for one rubric dimension
function ScoreControl({ crit, value, onChange }) {
  if (crit.type === "pass/fail") {
    return <div className="row gap-2">
      {[["pass", true], ["fail", false]].map(([l, v]) => <button key={l} onClick={() => onChange(v)} style={{
        flex: 1, height: 34, borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600, transition: "all .13s",
        border: `1px solid ${value === v ? (v ? "var(--pos)" : "var(--neg)") : "var(--border-strong)"}`,
        background: value === v ? (v ? "var(--pos-soft)" : "var(--neg-soft)") : "var(--surface)",
        color: value === v ? (v ? "var(--pos)" : "var(--neg)") : "var(--text-2)",
      }}>{l}</button>)}
    </div>;
  }
  if (crit.type === "1-5") {
    return <div className="row gap-2">
      {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => onChange(n)} style={{
        flex: 1, height: 34, borderRadius: "var(--r-md)", fontSize: 13.5, fontWeight: 700, fontFamily: "var(--font-mono)", transition: "all .13s",
        border: `1px solid ${value === n ? "var(--accent)" : "var(--border-strong)"}`,
        background: value === n ? "var(--accent)" : "var(--surface)", color: value === n ? "white" : "var(--text-2)",
      }}>{n}</button>)}
    </div>;
  }
  // 0-1 slider
  return <div className="row gap-3">
    <input type="range" min="0" max="1" step="0.05" value={value} onChange={(e) => onChange(+e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
    <span className="mono" style={{ fontSize: 14, fontWeight: 700, width: 42, textAlign: "right", color: scoreColor(value) }}>{value.toFixed(2)}</span>
  </div>;
}

function ReviewPanel({ item, onSubmit, push }) {
  const initial = {};
  DB.RUBRIC.criteria.forEach((c) => { initial[c.key] = item.status === "done" ? (item.savedScores || { faithfulness: 0.85, relevance: 4, precision: 0.8, completeness: true })[c.key] : (c.type === "1-5" ? 3 : c.type === "pass/fail" ? true : 0.7); });
  const [scores, setScores] = useRS(initial);
  const [comment, setComment] = useRS(item.status === "done" ? "Answer was accurate and well-grounded. Good golden candidate." : "");
  const [golden, setGolden] = useRS(item.goldenFlag || false);
  const trace = DB.TRACES.find((t) => t.id === item.source);
  const rec = DB.DATASET_RECORDS.find((r) => r.id === item.source);
  const output = trace ? (trace.overall > 0.6 ? rec?.expected || "Here's how to do that…" : "I'm not able to find that in our docs, but you can contact billing@northwind for a refund within 14 days.") : (rec?.expected || "");
  const m = DB.MEMBERS.find((x) => x.id === item.assignee);

  return <Card pad={0} style={{ flex: 1 }}>
    <div className="row" style={{ justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
      <div className="row gap-3">
        <PriorityDot p={item.priority} />
        <div><div style={{ fontSize: 15, fontWeight: 600 }}>{item.q}</div><div className="row gap-2 faint mono" style={{ fontSize: 11.5, marginTop: 3 }}><Topic name={item.topic} /><span>· from {item.srcType} {item.source}</span></div></div>
      </div>
      <StatusBadge status={item.status} />
    </div>
    {DB.TRIAGE[item.id] && <div className="row gap-2" style={{ padding: "9px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
      {window.Icons.trace({ size: 14, style: { color: `oklch(0.6 0.15 35)`, flexShrink: 0 } })}
      <span className="muted"><b style={{ color: "var(--text-2)" }}>Triage:</b> {DB.TRIAGE[item.id].reason}</span>
      {DB.TRIAGE[item.id].cluster && <Badge tone="neutral" style={{ marginLeft: "auto" }}>{DB.CLUSTERS.find((c) => c.id === DB.TRIAGE[item.id].cluster)?.label.split(" — ")[0]}</Badge>}
    </div>}
    <div className="row" style={{ alignItems: "stretch" }}>
      {/* left: context */}
      <div className="col gap-3" style={{ flex: 1, padding: 20, borderRight: "1px solid var(--border)" }}>
        <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Model output</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, padding: "12px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>{output}</div></div>
        {rec && <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Retrieved context</div>
          <div className="col gap-1">{rec.chunks.map((c) => <span key={c} className="mono row gap-2" style={{ fontSize: 11.5, color: "var(--text-2)" }}>{window.Icons.doc({ size: 12, style: { color: "var(--text-faint)" } })}{c}</span>)}</div></div>}
        {trace && <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Judge pre-score</div>
          <div className="row gap-3 wrap">{DB.RUBRIC.criteria.map((c) => <span key={c.key} className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{c.name.split(" ")[0]}: <b style={{ color: scoreColor(norm(c.key, trace.scores[c.key])) }}>{fmtScore(c.key, trace.scores[c.key])}</b></span>)}</div></div>}
      </div>
      {/* right: scoring form */}
      <div className="col gap-4" style={{ width: 340, flexShrink: 0, padding: 20 }}>
        <div className="row gap-2" style={{ fontSize: 12 }}><span className="faint">Reviewer</span><Avatar m={m} size={20} /><span style={{ fontWeight: 600 }}>{m?.name}</span></div>
        {DB.RUBRIC.criteria.map((c) => <div key={c.key} className="col gap-2">
          <div className="row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</span><span className="faint mono" style={{ fontSize: 10.5 }}>{c.type}</span></div>
          <ScoreControl crit={c} value={scores[c.key]} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
        </div>)}
        <div className="col gap-2">
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Comment</span>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Notes for the team…" rows={3} style={{ padding: "9px 11px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--surface)", outline: "none", fontSize: 13, resize: "vertical", lineHeight: 1.5 }} />
        </div>
        <label className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", border: `1px solid ${golden ? "var(--accent-soft-border)" : "var(--border)"}`, background: golden ? "var(--accent-soft)" : "var(--surface)", cursor: "pointer" }}>
          <input type="checkbox" checked={golden} onChange={(e) => setGolden(e.target.checked)} style={{ accentColor: "var(--accent)", width: 15, height: 15 }} />
          <div className="col"><span style={{ fontSize: 12.5, fontWeight: 600 }}>Mark as golden case</span><span className="faint" style={{ fontSize: 11 }}>Store as a correct reference for judge calibration</span></div>
        </label>
        <Btn variant="primary" full icon="check" onClick={() => { onSubmit(item.id, golden); push(golden ? "Saved + stored as golden case" : "Review submitted", "pos"); }}>{item.status === "done" ? "Update review" : "Submit review"}</Btn>
      </div>
    </div>
  </Card>;
}

function ReviewView({ push }) {
  const [items, setItems] = useRS(DB.REVIEW_ITems);
  const [selId, setSel] = useRS(DB.REVIEW_ITems.find((r) => r.status !== "done")?.id || DB.REVIEW_ITems[0].id);
  const [f, setF] = useRS("all");
  const sel = items.find((x) => x.id === selId);
  const submit = (id, golden) => setItems((arr) => arr.map((x) => x.id === id ? { ...x, status: "done", goldenFlag: golden } : x));

  const counts = { all: items.length, todo: items.filter((i) => i.status === "todo").length, in_progress: items.filter((i) => i.status === "in_progress").length, done: items.filter((i) => i.status === "done").length };
  const sig = (it) => (DB.TRIAGE[it.id]?.signal ?? 0);
  const list = items.filter((i) => f === "all" || i.status === f).sort((a, b) => (a.status === "done") - (b.status === "done") || sig(b) - sig(a));

  return <div className="col gap-5">
    <PageHead title="Review queue" sub="Score samples by the project rubric. The Triage Agent pre-scores and ranks by signal, so you review the high-signal cases first — not 500 at random."
      crumbs={[{ label: DB.PROJECT.name }, { label: "Review queue" }]} />
    <div className="row gap-2" style={{ padding: "11px 14px", borderRadius: "var(--r-lg)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <AgentAvatar id="triage" size={26} />
      <span style={{ fontSize: 12.5 }} className="muted"><b style={{ color: "var(--text)" }}>Triage Agent</b> ranked {items.filter((i) => i.status !== "done").length} open items by signal. Judge-panel disagreements and policy-violation clusters float to the top.</span>
      <AutonomyBadge level="auto" />
    </div>
    <div className="row gap-5" style={{ alignItems: "flex-start" }}>
      <div className="col gap-2" style={{ width: 320, flexShrink: 0 }}>
        <Segment size="sm" value={f} onChange={setF} options={[{ value: "all", label: `All ${counts.all}` }, { value: "todo", label: `To do ${counts.todo}` }, { value: "done", label: `Done ${counts.done}` }]} />
        <div className="col gap-2" style={{ marginTop: 4 }}>
          {list.map((it) => {
            const m = DB.MEMBERS.find((x) => x.id === it.assignee);
            const act = it.id === selId;
            return <button key={it.id} onClick={() => setSel(it.id)} style={{
              textAlign: "left", padding: "11px 13px", borderRadius: "var(--r-md)", transition: "all .13s",
              border: `1px solid ${act ? "var(--accent-soft-border)" : "var(--border)"}`, background: act ? "var(--accent-soft)" : "var(--surface)",
            }}>
              <div className="row gap-2" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <div className="row gap-2" style={{ minWidth: 0 }}><PriorityDot p={it.priority} /><span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.q}</span></div>
              </div>
              {DB.TRIAGE[it.id] && it.status !== "done" && <div className="row gap-2" style={{ marginBottom: 7 }}><span className="faint" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>signal</span><SignalMeter value={DB.TRIAGE[it.id].signal} w={44} /></div>}
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row gap-2"><Avatar m={m} size={18} /><Topic name={it.topic} /></div>
                {it.goldenFlag ? <Badge tone="accent" dot>golden</Badge> : <StatusBadge status={it.status} />}
              </div>
            </button>;
          })}
          {list.length === 0 && <Empty icon="check" title="Nothing here" sub="All caught up in this filter." />}
        </div>
      </div>
      {sel ? <ReviewPanel key={sel.id} item={sel} onSubmit={submit} push={push} /> : <Card style={{ flex: 1 }}><Empty title="Select an item" /></Card>}
    </div>
  </div>;
}

// ---------------- Online traces ----------------
function TraceWaterfall({ t }) {
  const total = t.lat;
  let acc = 0;
  return <div className="col gap-1" style={{ marginTop: 4 }}>
    {t.spans.map((s, i) => {
      const left = (acc / total) * 100; acc += s.ms;
      const w = (s.ms / total) * 100;
      const cols = ["oklch(0.62 0.13 265)", "oklch(0.66 0.14 200)", "oklch(0.62 0.15 155)"];
      return <div key={i} className="row gap-3" style={{ fontSize: 12 }}>
        <span className="mono" style={{ width: 80, color: "var(--text-2)" }}>{s.name}</span>
        <div style={{ flex: 1, position: "relative", height: 18 }}>
          <div style={{ position: "absolute", left: `${left}%`, width: `${w}%`, height: 14, top: 2, background: cols[i], borderRadius: 4, minWidth: 4 }} />
        </div>
        <span className="mono faint" style={{ width: 120, textAlign: "right", fontSize: 11 }}>{s.meta}</span>
        <span className="mono" style={{ width: 52, textAlign: "right", fontWeight: 600 }}>{s.ms}ms</span>
      </div>;
    })}
  </div>;
}

// map a natural-language question → filter + spoken answer (Triage Agent)
function queryTraces(q, traces) {
  const t = q.toLowerCase().trim();
  if (!t) return null;
  const has = (...ks) => ks.some((k) => t.includes(k));
  if (has("loop", "looping", "stuck", "retry", "repeats")) {
    const r = traces.filter((x) => x.loop);
    return { rows: r, answer: `Found ${r.length} traces where the agent looped on the retrieve/search tool (3–4 identical calls) before generating. Avg latency ${Math.round(r.reduce((s, x) => s + x.lat, 0) / (r.length || 1))}ms — all flagged, all scored low.`, chips: ["retrieve called ≥3×", "high latency", "low faithfulness"] };
  }
  if (has("refund", "money back", "charge")) {
    const r = traces.filter((x) => /refund|invoice|charge|money/.test(x.q.toLowerCase()) || x.topic === "Billing");
    return { rows: r, answer: `${r.length} billing/refund traces. ${r.filter((x) => x.overall < 0.6).length} are failing — the agent gives refund guidance without confirming the order number first.`, chips: ["topic: Billing", "policy violation"] };
  }
  if (has("fail", "failing", "low score", "bad", "worst", "below")) {
    const r = traces.filter((x) => x.sampled && x.overall < 0.6).sort((a, b) => a.overall - b.overall);
    return { rows: r, answer: `${r.length} sampled traces scored below 0.60. Lowest is “${r[0]?.q}” at ${r[0]?.overall.toFixed(2)}.`, chips: ["overall < 0.60", "sorted worst-first"] };
  }
  if (has("api", "graphql", "endpoint", "rate")) {
    const r = traces.filter((x) => x.topic === "API");
    return { rows: r, answer: `${r.length} API traces. The agent over-claims capabilities not present in retrieved docs (e.g. GraphQL support).`, chips: ["topic: API", "out-of-scope claims"] };
  }
  if (has("flag", "review", "attention")) {
    const r = traces.filter((x) => x.flag);
    return { rows: r, answer: `${r.length} traces are flagged for review — judge-panel disagreement or a policy-violation cluster.`, chips: ["flagged"] };
  }
  // fallback: keyword match on the question text
  const r = traces.filter((x) => x.q.toLowerCase().includes(t));
  return { rows: r, answer: r.length ? `${r.length} traces match “${q}”.` : `No traces match “${q}”. Try “loops on search”, “refund failures”, or “lowest scoring”.`, chips: [] };
}

const TRACE_SUGGESTIONS = ["Find traces where the agent loops on the search tool", "Show refund failures", "Lowest-scoring sampled traces", "API out-of-scope claims"];
const CLUSTER_TOPICS = { cl_refund: ["Billing"], cl_api: ["API"], cl_multi: ["Product", "Account"], cl_admin: ["Admin"], cl_tone: ["Billing", "Product"] };

// ---- review-signal model: why is a prod log worth a human's eyes? ----
function reviewSignal(t) {
  if (!t.sampled) return { signal: 0, reasons: [] };
  let s = 0; const reasons = [];
  const add = (v, label, tone, detail) => { s += v; reasons.push({ label, tone, detail }); };
  // judge–human disagreement (the highest-value signal: where the judge is least trustworthy)
  const dis = DB.CALIBRATION.disagreements.find((d) => t.q.toLowerCase().includes(d.q.toLowerCase().slice(0, 12)));
  if (dis) add(0.4, "judge–human gap", "neg", `human ${dis.human.toFixed(2)} vs judge ${dis.judge.toFixed(2)}`);
  // judge uncertainty: scored right at the pass/fail boundary
  if (t.overall >= 0.55 && t.overall <= 0.72) add(0.22, "judge uncertain", "warn", "scored near the decision boundary");
  // outright failure
  if (t.overall < 0.5) add(0.28, "scored failing", "neg", `overall ${t.overall.toFixed(2)}`);
  // behavioural anomaly
  if (t.loop) add(0.3, "tool loop", "warn", "retrieve called 3–4× identically");
  // policy-sensitive surface area
  if (t.topic === "Billing" || t.topic === "Admin") add(0.16, "policy-sensitive", "accent", t.topic.toLowerCase() + " action");
  // novelty — input unlike anything in the golden set
  if (/graphql|sla|delete my whole/i.test(t.q)) add(0.2, "novel pattern", "accent", "input unlike golden set");
  // latency outlier
  if (t.lat > 3500) add(0.12, "latency outlier", "warn", t.lat + "ms");
  return { signal: Math.min(1, s), reasons };
}

// review-detail modal: see the log, score it against the rubric, confirm the flag
function TraceReviewModal({ trace, reasons, onClose, onSubmit }) {
  const init = {}; DB.RUBRIC.criteria.forEach((c) => { init[c.key] = trace ? trace.scores[c.key] : (c.type === "1-5" ? 3 : c.type === "pass/fail" ? true : 0.7); });
  const [scores, setScores] = useRS(init);
  const [flagOk, setFlagOk] = useRS(null); // true=correctly flagged, false=false positive
  const [comment, setComment] = useRS("");
  if (!trace) return null;
  const rec = DB.DATASET_RECORDS.find((r) => r.q && trace.q.includes(r.q.slice(0, 14)));
  const output = trace.overall > 0.6 ? "Yes — here's how to do that. You can manage it under Settings, and changes apply immediately."
    : "I'm not able to find that in our docs, but you can contact billing@northwind.ai for a refund within 14 days of purchase.";
  const human = DB.RUBRIC.criteria.reduce((s, c) => s + norm(c.key, scores[c.key]) * c.weight, 0);
  return <Modal open={!!trace} onClose={onClose} title="Review log" sub={trace.id + " · score it against the rubric, then confirm the flag"} width={680}
    footer={<><span className="faint" style={{ fontSize: 12, marginRight: "auto" }}>{flagOk == null ? "Confirm whether the flag was right" : flagOk ? "Flag confirmed — routes to the queue" : "Marked false positive — improves triage"}</span><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" icon="check" disabled={flagOk == null} onClick={() => onSubmit(trace.id, { scores, flagOk, human: +human.toFixed(2) })}>Submit review</Btn></>}>
    {/* the log content */}
    <div className="col gap-3" style={{ marginBottom: 16 }}>
      <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>User question</div>
        <div className="row gap-2" style={{ fontSize: 13.5, fontWeight: 500 }}><Topic name={trace.topic} />{trace.q}</div></div>
      <div><div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Agent answer</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>{output}</div></div>
      <div className="row gap-3 wrap" style={{ alignItems: "center" }}>
        <span className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Why flagged</span>
        {reasons && reasons.map((r, j) => <span key={j} title={r.detail} style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: `var(--${r.tone === "accent" ? "accent" : r.tone}-soft)`, color: `var(--${r.tone === "accent" ? "accent-text" : r.tone})` }}>{r.label}</span>)}
        <span className="mono faint" style={{ fontSize: 11, marginLeft: "auto" }}>judge scored {trace.overall.toFixed(2)}</span>
      </div>
    </div>
    {/* score against the rubric */}
    <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Your scores · {DB.RUBRIC.name}</div>
    <div className="col gap-3" style={{ marginBottom: 16 }}>
      {DB.RUBRIC.criteria.map((c) => <div key={c.key} className="col gap-2">
        <div className="row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</span><span className="faint mono" style={{ fontSize: 10.5 }}>{c.type}</span></div>
        <ScoreControl crit={c} value={scores[c.key]} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
      </div>)}
      <div className="row gap-2" style={{ paddingTop: 4 }}><span className="faint" style={{ fontSize: 12 }}>Your weighted score</span><span className="mono" style={{ fontSize: 13, fontWeight: 700, marginLeft: "auto", color: scoreColor(human) }}>{human.toFixed(2)}</span><span className="faint mono" style={{ fontSize: 11 }}>vs judge {trace.overall.toFixed(2)}</span></div>
    </div>
    {/* confirm the flag */}
    <div style={{ padding: "12px 14px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Was this log correctly flagged for review?</div>
      <div className="row gap-2">
        {[["yes", true, "Yes — needs attention", "pos"], ["no", false, "No — false positive", "neg"]].map(([k, v, l, tone]) =>
          <button key={k} onClick={() => setFlagOk(v)} style={{ flex: 1, height: 38, borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600, border: `1px solid ${flagOk === v ? `var(--${tone})` : "var(--border-strong)"}`, background: flagOk === v ? `var(--${tone}-soft)` : "var(--surface)", color: flagOk === v ? `var(--${tone})` : "var(--text-2)" }}>{l}</button>)}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional note for the team…" rows={2} style={{ width: "100%", marginTop: 9, padding: "8px 10px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--surface)", outline: "none", fontSize: 12.5, resize: "vertical", lineHeight: 1.5, fontFamily: "var(--font-sans)" }} />
    </div>
  </Modal>;
}

function TracesView({ push }) {
  const [open, setOpen] = useRS(null);
  const [draft, setDraft] = useRS("");
  const [query, setQuery] = useRS(null);      // {rows, answer, chips, q}
  const [asking, setAsking] = useRS(false);
  const [analyzing, setAnalyzing] = useRS(false);
  const [analyzed, setAnalyzed] = useRS(false);
  const [cluster, setCluster] = useRS(null);
  const [captured, setCaptured] = useRS([]);
  const [rubricFlow, setRubricFlow] = useRS(false);
  const [reviewing, setReviewing] = useRS(null); // {trace, reasons}
  const used = DB.ORG.traceUsed, quota = DB.ORG.traceQuota;

  // overall log distribution (whole sampled set, not just failures)
  const topicDist = (() => { const m = {}; DB.TRACES.forEach((t) => { m[t.topic] = (m[t.topic] || 0) + 1; }); const extra = { Billing: 19, Account: 13, Product: 11, API: 6, Admin: 4 }; Object.entries(extra).forEach(([k, v]) => m[k] = (m[k] || 0) + v); const tot = Object.values(m).reduce((a, b) => a + b, 0); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k, v, pct: v / tot })); })();
  const scoreHist = [["0.0–0.4", 6, "neg"], ["0.4–0.6", 11, "warn"], ["0.6–0.8", 28, "warn"], ["0.8–1.0", 28, "pos"]];

  const ask = (text) => {
    const q = (text ?? draft).trim(); if (!q) return;
    setDraft(q); setCluster(null); setAsking(true); setQuery(null); setOpen(null);
    setTimeout(() => { setAsking(false); setQuery({ ...queryTraces(q, DB.TRACES), q }); }, 950);
  };
  const analyze = () => {
    setAnalyzing(true); setAnalyzed(false);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); push("Triage Agent clustered 5 failure modes", "pos"); }, 1900);
  };
  const capture = (id, kind) => { setCaptured((c) => [...c, id]); push(kind === "review" ? "Sent to review queue" : "Captured to golden dataset", "pos"); };
  const submitReview = (id, res) => { setCaptured((c) => [...c, id]); setReviewing(null); push(res.flagOk ? "Reviewed — flag confirmed, sent to queue" : "Reviewed — marked false positive", res.flagOk ? "pos" : "neg"); };

  // proactive: rank every sampled trace by review-signal, surface the high-signal ones
  const ranked = DB.TRACES.map((t) => ({ t, ...reviewSignal(t) })).filter((x) => x.signal >= 0.4).sort((a, b) => b.signal - a.signal);
  const worth = ranked.filter((x) => !captured.includes(x.t.id));
  const tagTone = { neg: "neg", warn: "warn", accent: "accent" };

  // active rows
  let rows = DB.TRACES;
  if (query) rows = query.rows;
  else if (cluster) { const tps = CLUSTER_TOPICS[cluster] || []; rows = DB.TRACES.filter((x) => tps.includes(x.topic)); }
  const clearFilter = () => { setQuery(null); setCluster(null); setDraft(""); };

  return <div className="col gap-5">
    <PageHead title="Online traces" sub="Production traces ingested via the SDK. Analyze the whole log distribution, ask in natural language, and turn what you learn into a rubric or a review queue."
      crumbs={[{ label: DB.PROJECT.name }, { label: "Online traces" }]}
      actions={<Btn variant={analyzed ? "default" : "primary"} icon="bolt" onClick={analyze}>{analyzed ? "Re-analyze" : "Analyze all logs"}</Btn>} />

    {/* NL query */}
    <div className="col gap-2">
      <div className="row gap-2" style={{ padding: "6px 6px 6px 14px", borderRadius: "var(--r-lg)", border: "1px solid var(--border-strong)", background: "var(--surface)" }}>
        <AgentAvatar id="triage" size={26} />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about your production logs…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13 }} />
        {(query || cluster) && <Btn size="sm" variant="ghost" icon="x" onClick={clearFilter}>Clear</Btn>}
        <Btn size="sm" variant="primary" icon="search" onClick={() => ask()}>Ask</Btn>
      </div>
      {!query && !asking && <div className="row gap-2 wrap">{TRACE_SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="faint" style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)" }}>{s}</button>)}</div>}
    </div>

    {asking && <Card><div className="row gap-2"><Spinner size={16} /><span className="faint" style={{ fontSize: 13 }}>Triage Agent scanning traces…</span></div></Card>}

    {/* PROACTIVE: high-signal logs worth a human's review */}
    {!query && !asking && <Card pad={0} style={{ borderColor: "var(--accent-soft-border)" }}>
      <div className="row gap-3" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
        <div className="row gap-3 grow" style={{ minWidth: 0 }}>
          <AgentAvatar id="triage" size={30} />
          <div style={{ minWidth: 0 }}><div className="row gap-2"><span style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: "nowrap" }}>Worth a human's review</span><Badge tone="accent">{worth.length}</Badge></div>
            <div className="faint" style={{ fontSize: 12, marginTop: 1 }}>Triage ranked {DB.ORG.traceUsed} sampled logs by signal — review these, not 500 at random.</div></div>
        </div>
        <Btn size="sm" variant="primary" icon="review" onClick={() => { worth.forEach((w) => setCaptured((c) => [...c, w.t.id])); push(`Sent ${worth.length} high-signal logs to review`, "pos"); }}>Send all to review</Btn>
      </div>
      {worth.length === 0 ? <div style={{ padding: 14 }}><Empty icon="check" title="Queue is clear" sub="Every high-signal log has been routed to review." /></div>
        : <div className="col">{worth.map(({ t, signal, reasons }, i) => (
          <div key={t.id} className="row gap-3" style={{ padding: "12px 18px", borderBottom: i < worth.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: 92, flexShrink: 0 }}><SignalMeter value={signal} w={52} /></div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row gap-2" style={{ minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.q}</span><Topic name={t.topic} /></div>
              <div className="row gap-2 wrap" style={{ marginTop: 5 }}>{reasons.map((r, j) => <span key={j} title={r.detail} className="row gap-1" style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: `var(--${tagTone[r.tone]}-soft)`, color: `var(--${r.tone === "accent" ? "accent-text" : r.tone})` }}>{r.label}</span>)}</div>
            </div>
            <div className="row gap-2" style={{ flexShrink: 0 }}>
              <Btn size="sm" variant="ghost" onClick={() => { setOpen(t.id); }}>Open trace</Btn>
              <Btn size="sm" variant="soft" icon="review" onClick={() => setReviewing({ trace: t, reasons })}>Review</Btn>
            </div>
          </div>))}</div>}
      <div className="row gap-2" style={{ padding: "9px 18px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 11.5 }}>
        {window.Icons.info({ size: 13, style: { color: "var(--text-3)", flexShrink: 0 } })}
        <span className="muted">Ranked by: <b>judge–human gap</b> (judge least reliable), <b>judge uncertainty</b>, failures, tool loops, policy-sensitive actions, and novel inputs.</span>
      </div>
    </Card>}

    {query && <Card style={{ borderColor: "var(--accent-soft-border)", background: "var(--accent-soft)" }}>
      <div className="row gap-3" style={{ alignItems: "flex-start" }}>
        <AgentAvatar id="triage" size={28} />
        <div className="grow">
          <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--text)" }}>{query.answer}</div>
          {query.chips.length > 0 && <div className="row gap-2 wrap" style={{ marginTop: 9 }}>{query.chips.map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}<span className="faint mono" style={{ fontSize: 11, alignSelf: "center" }}>· {query.rows.length} match{query.rows.length !== 1 ? "es" : ""}</span></div>}
        </div>
      </div>
    </Card>}

    {/* Triage clustering panel */}
    {analyzing && <Card><div className="row gap-2"><Spinner size={16} /><span className="faint" style={{ fontSize: 13 }}>Analyzing all {DB.ORG.traceUsed} sampled traces…</span></div></Card>}

    {/* OVERALL log analysis — the whole distribution, not just failures */}
    {analyzed && !query && <Card pad={0}>
      <div className="row" style={{ justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
        <div className="row gap-2"><AgentAvatar id="triage" size={22} /><span style={{ fontSize: 13.5, fontWeight: 700 }}>Overall log analysis</span><Badge tone="accent">{DB.ORG.traceUsed} logs</Badge></div>
        <Btn size="sm" variant="soft" icon="ruler" onClick={() => setRubricFlow(true)}>Generate rubric from these logs</Btn>
      </div>
      <div className="row gap-5" style={{ padding: "16px 18px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>What users ask about</div>
          <div className="col gap-2">{topicDist.map((d) => <div key={d.k} className="row gap-3" style={{ alignItems: "center" }}>
            <span style={{ width: 64, fontSize: 12 }}>{d.k}</span>
            <div className="grow" style={{ height: 9, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${d.pct * 100}%`, background: "var(--accent)", borderRadius: 99 }} /></div>
            <span className="mono faint" style={{ fontSize: 11, width: 34, textAlign: "right" }}>{(d.pct * 100).toFixed(0)}%</span>
          </div>)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Quality distribution</div>
          <div className="row gap-2" style={{ alignItems: "flex-end", height: 78, marginBottom: 6 }}>{scoreHist.map(([lbl, n, tone]) => <div key={lbl} className="col" style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <span className="mono" style={{ fontSize: 10.5, color: `var(--${tone})`, fontWeight: 600 }}>{n}</span>
            <div style={{ width: "70%", height: `${(n / 28) * 56 + 6}px`, background: `var(--${tone})`, borderRadius: 4, opacity: 0.85 }} />
            <span className="faint mono" style={{ fontSize: 9 }}>{lbl}</span>
          </div>)}</div>
          <div className="row gap-3" style={{ marginTop: 10, fontSize: 11.5 }}><span className="muted">Median <b className="mono" style={{ color: "var(--text)" }}>0.78</b></span><span className="muted">p90 latency <b className="mono" style={{ color: "var(--text)" }}>2.3s</b></span><span className="muted">{Math.round(0.77 * 73)} healthy</span></div>
        </div>
      </div>
      <div className="row gap-2" style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 12 }}>
        {window.Icons.info({ size: 13, style: { color: "var(--text-3)", flexShrink: 0 } })}
        <span className="muted">Most traffic is healthy — but a rubric built from this <b>whole distribution</b> (coverage, helpfulness, tone) catches drift the failure-only view misses.</span>
      </div>
    </Card>}

    {analyzed && !query && <Card pad={0}>
      <div className="row" style={{ justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
        <div className="row gap-2"><AgentAvatar id="triage" size={22} /><span style={{ fontSize: 13.5, fontWeight: 700 }}>Failure clusters</span><Badge tone="neutral">{DB.CLUSTERS.length}</Badge></div>
        {cluster && <Btn size="sm" variant="ghost" icon="x" onClick={() => setCluster(null)}>Show all traces</Btn>}
      </div>
      <div className="row gap-2 wrap" style={{ padding: 14 }}>
        {DB.CLUSTERS.map((c) => <button key={c.id} onClick={() => { setCluster(cluster === c.id ? null : c.id); setQuery(null); }} style={{ textAlign: "left", flex: "1 1 calc(50% - 5px)", minWidth: 230, padding: "11px 13px", borderRadius: "var(--r-md)", border: `1px solid ${cluster === c.id ? "var(--accent)" : "var(--border)"}`, background: cluster === c.id ? "var(--accent-soft)" : "var(--surface)", transition: "all .13s" }}>
          <div className="row gap-2" style={{ justifyContent: "space-between", marginBottom: 5 }}><span className="row gap-2" style={{ minWidth: 0 }}><SevDot sev={c.sev} /><span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span></span></div>
          <div className="row gap-2"><Badge tone="neutral">{c.count} traces</Badge><Badge tone={c.failRate > 0.5 ? "neg" : c.failRate > 0.3 ? "warn" : "neutral"}>{(c.failRate * 100).toFixed(0)}% fail</Badge></div>
          <div className="faint" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>{c.why}</div>
        </button>)}
      </div>
    </Card>}

    <Card pad={0}>
      <div className="row gap-3" style={{ padding: "14px 18px", justifyContent: "space-between" }}>
        <div className="row gap-3">
          {window.Icons.bolt({ size: 18, style: { color: "var(--accent)" } })}
          <div><div style={{ fontSize: 13.5, fontWeight: 600 }}>Free online-trace quota</div><div className="faint" style={{ fontSize: 12 }}>This org's plan: {DB.ORG.plan}. Ingestion stops at the cap.</div></div>
        </div>
        <div className="row gap-3">
          <div style={{ width: 160, height: 8, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden", alignSelf: "center" }}><div style={{ height: "100%", width: `${(used / quota) * 100}%`, background: used / quota > 0.9 ? "var(--neg)" : "var(--accent)", borderRadius: 99 }} /></div>
          <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{used}<span className="faint" style={{ fontWeight: 400 }}>/{quota}</span></span>
        </div>
      </div>
    </Card>

    <Card pad={0}>
      {(query || cluster) && <div className="row gap-2" style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 12 }}>
        {window.Icons.filter({ size: 13, style: { color: "var(--text-3)" } })}<span className="muted">Showing <b>{rows.length}</b> of {DB.TRACES.length} traces{cluster ? " · " + DB.CLUSTERS.find((c) => c.id === cluster)?.label.split(" — ")[0] : ""}</span>
        <button onClick={clearFilter} className="faint" style={{ fontSize: 11.5, marginLeft: "auto", fontWeight: 600 }}>clear</button>
      </div>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {["", "Question", "Topic", "Sampled", "Overall", "Latency", "Time", ""].map((h, i) => <th key={i} style={{ textAlign: i === 4 || i === 5 ? "right" : "left", padding: "10px 14px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((t) => <React.Fragment key={t.id}>
          <tr onClick={() => setOpen(open === t.id ? null : t.id)} style={{ cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = open === t.id ? "var(--surface-2)" : "transparent"}>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", width: 22, color: "var(--text-faint)" }}>{open === t.id ? window.Icons.chevDown({ size: 14 }) : window.Icons.chevRight({ size: 14 })}</td>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", maxWidth: 320 }}><div className="row gap-2"><span style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.q}</span>{t.loop && <Badge tone="warn" dot>loop</Badge>}{t.flag && <Badge tone="neg" dot>flagged</Badge>}</div><div className="mono faint" style={{ fontSize: 10.5, marginTop: 2 }}>{t.id}</div></td>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)" }}><Topic name={t.topic} /></td>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>{t.sampled ? <Badge tone="accent" dot>sampled</Badge> : <span className="faint" style={{ fontSize: 12 }}>—</span>}</td>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>{t.sampled ? <div className="row" style={{ justifyContent: "flex-end" }}><ScoreBar value={t.overall} w={44} /></div> : <span className="faint mono" style={{ fontSize: 12 }}>not scored</span>}</td>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }} className="mono faint">{t.lat}ms</td>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", fontSize: 11 }} className="mono faint">{t.t.split(" ")[1]}</td>
            <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--text-faint)" }}>{window.Icons.chevRight({ size: 14 })}</td>
          </tr>
          {open === t.id && <tr><td colSpan={8} style={{ padding: "16px 20px 18px 50px", borderBottom: "1px solid var(--border)", background: "var(--bg-inset)" }}>
            <div className="row gap-2" style={{ marginBottom: 10 }}><span className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Span timeline</span><span className="mono faint" style={{ fontSize: 11 }}>total {t.lat}ms</span></div>
            <TraceWaterfall t={t} />
            {(t.flag || t.loop) && <div className="row gap-2" style={{ marginTop: 12, padding: "10px 12px", background: "var(--neg-soft)", borderRadius: "var(--r-md)" }}>
              {window.Icons.trace({ size: 15, style: { color: "var(--neg)", flexShrink: 0, marginTop: 1 } })}
              <div style={{ fontSize: 12, lineHeight: 1.5 }}><b>Root cause (Triage Agent):</b> <span className="muted">{t.loop ? <>the <span className="mono">retrieve</span> span fired <b>{t.spans.filter((s) => s.name === "retrieve").length}× with the same query</b> — the agent looped instead of re-formulating, then fell back to a weak answer. Fix upstream: add a query-rewrite + max-retry guard.</> : <>the <span className="mono">retrieve</span> span returned an off-topic chunk, so <span className="mono">generate</span> answered from weak context. Failure originates upstream, not in generation.</>}</span></div>
            </div>}
            {t.sampled && <div className="row gap-3 wrap" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", alignItems: "center" }}>
              <span className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Eval scores</span>
              {DB.RUBRIC.criteria.map((c) => <span key={c.key} className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{c.name.split(" ")[0]}: <b style={{ color: scoreColor(norm(c.key, t.scores[c.key])) }}>{fmtScore(c.key, t.scores[c.key])}</b></span>)}
              <div className="row gap-2" style={{ marginLeft: "auto" }}>
                {captured.includes(t.id) ? <Badge tone="pos" dot>captured</Badge> : <>
                  <Btn size="sm" variant="default" icon="dataset" onClick={() => capture(t.id, "dataset")}>Add to dataset</Btn>
                  <Btn size="sm" variant="soft" icon="review" onClick={() => setReviewing({ trace: t, reasons: reviewSignal(t).reasons })}>Send to review</Btn>
                </>}
              </div>
            </div>}
          </td></tr>}
        </React.Fragment>)}
        {rows.length === 0 && <tr><td colSpan={8}><Empty icon="search" title="No traces match" sub="Try a different query or clear the filter." /></td></tr>}
        </tbody>
      </table>
    </Card>
    <RubricAgentFlow open={rubricFlow} onClose={() => setRubricFlow(false)} presetSource="logs" onCreate={(data) => { const nr = Store.addRubric({ name: data.name }); Store.saveRubricCriteria(nr.id, data.criteria); }} push={push} />
    <TraceReviewModal trace={reviewing && reviewing.trace} reasons={reviewing && reviewing.reasons} onClose={() => setReviewing(null)} onSubmit={submitReview} />
  </div>;
}

window.ReviewView = ReviewView;
window.TracesView = TracesView;
