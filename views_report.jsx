// views_report.jsx — "Summarize & recommend": the first-eval results report (canvas artifact)
function ReportRec({ n, title, fix, cluster, sev, go }) {
  const cl = DB.CLUSTERS.find((c) => c.id === cluster);
  return <div className="row gap-3" style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)", alignItems: "flex-start" }}>
    <span className="mono" style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: sev === "high" ? "var(--neg-soft)" : "var(--warn-soft)", color: sev === "high" ? "var(--neg)" : "var(--warn)" }}>{n}</span>
    <div className="grow" style={{ minWidth: 0 }}>
      <div className="row gap-2" style={{ marginBottom: 3 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</span><SevDot sev={sev} /></div>
      <div className="row gap-2" style={{ fontSize: 12.5, color: "var(--text-2)" }}>{window.Icons.arrowRight({ size: 13, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 2 } })}<span>{fix}</span></div>
      {cl && <div className="row gap-2" style={{ marginTop: 7 }}><Badge tone="neutral">{cl.count} traces</Badge><Badge tone={cl.failRate > 0.5 ? "neg" : "warn"}>{(cl.failRate * 100).toFixed(0)}% fail</Badge><button onClick={() => go({ view: "traces" })} className="faint row gap-1" style={{ fontSize: 11, marginLeft: 2 }}>view traces{window.Icons.arrowRight({ size: 11 })}</button></div>}
    </div>
  </div>;
}

function ReportView({ go }) {
  const e = DB.expById("exp_7a2f");
  const recs = [
    { title: "Order-number confirmation fails on 61% of refunds", fix: "Add a confirm-order step before any refund tool call.", cluster: "cl_refund", sev: "high" },
    { title: "Out-of-scope API capability claims", fix: "Tighten retrieval and add refusal examples to the prompt.", cluster: "cl_api", sev: "high" },
    { title: "Multi-turn context dropped after 3 turns", fix: "Persist entities across turns in the agent's memory.", cluster: "cl_multi", sev: "med" },
  ];
  return <div className="col gap-5">
    <PageHead title="First eval — results & recommendations"
      crumbs={[{ label: DB.PROJECT.name }, { label: "Results report" }]}
      sub="Baseline scored. Here's where the agent stands and what to fix first."
      actions={<><Btn variant="default" icon="download">Export</Btn><Btn variant="primary" icon="layers" onClick={() => go({ view: "compare", a: "exp_7a2f", b: "exp_9c41" })}>Compare to v1.3</Btn></>} />

    {/* headline */}
    <Card pad={0}>
      <div className="row" style={{ alignItems: "stretch" }}>
        <div className="row gap-4" style={{ flex: 1, padding: "18px 22px", borderRight: "1px solid var(--border)", alignItems: "center" }}>
          <Ring value={e.summary.overall} size={72} stroke={7} />
          <div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Weighted overall</div><div className="mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>{e.summary.overall.toFixed(3)}</div><div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>baseline · {e.name}</div></div>
        </div>
        {[["Dataset", "Support QA v1", "16 records"], ["Judge agreement", "0.88", "cross-family ✓"], ["Records passing", `${Math.round(e.summary.completeness * 100)}%`, "completeness"]].map(([l, v, s], i) => <div key={i} style={{ flex: 1, padding: "18px 20px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
          <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{l}</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{v}</div>
          <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{s}</div>
        </div>)}
      </div>
    </Card>

    {/* dimension breakdown */}
    <Card>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Score by rubric dimension</h3>
      <p className="faint" style={{ fontSize: 12, marginBottom: 16 }}>Where the agent is strong vs. weak across the discovered rubric.</p>
      <div className="col gap-3">
        {DB.RUBRIC.criteria.map((c) => <div key={c.key} className="row gap-3" style={{ alignItems: "center" }}>
          <span style={{ width: 160, fontSize: 13, fontWeight: 500 }}>{c.name}</span>
          <div style={{ flex: 1, height: 7, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${norm(c.key, e.summary[c.key]) * 100}%`, background: scoreColor(norm(c.key, e.summary[c.key])), borderRadius: 99, transition: "width .6s" }} /></div>
          <span className="mono" style={{ width: 46, textAlign: "right", fontSize: 13, fontWeight: 600, color: scoreColor(norm(c.key, e.summary[c.key])) }}>{fmtScore(c.key, e.summary[c.key])}</span>
        </div>)}
      </div>
    </Card>

    {/* recommendations */}
    <div>
      <div className="row gap-2" style={{ marginBottom: 12 }}><h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Top gaps, ranked by impact</h3><Badge tone="neg">{recs.filter((r) => r.sev === "high").length} high</Badge></div>
      <div className="col gap-3">{recs.map((r, i) => <ReportRec key={i} n={i + 1} {...r} go={go} />)}</div>
    </div>

    {/* what the agents did */}
    <Card style={{ background: "var(--surface-2)" }}>
      <div className="row gap-3" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row gap-3"><AgentAvatar id="copilot" size={32} /><div><div style={{ fontSize: 13.5, fontWeight: 600 }}>This eval was built by the agents — fully auditable.</div><div className="faint" style={{ fontSize: 12, marginTop: 2 }}>Triage → Dataset → Rubric → Judge calibration → baseline run. Each artifact is versioned and reversible.</div></div></div>
        <Btn size="sm" variant="default" icon="layers" onClick={() => go({ view: "agentruns" })}>Agent activity</Btn>
      </div>
    </Card>
  </div>;
}

window.ReportView = ReportView;
