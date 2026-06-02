// views_compare.jsx — side-by-side experiment diff (primary flow)
const { useState: useCS } = React;

function ExpPicker({ value, onChange, color, label }) {
  const opts = DB.EXPERIMENTS.filter((e) => e.status === "complete");
  return <div className="col gap-2" style={{ flex: 1 }}>
    <div className="row gap-2"><span style={{ width: 9, height: 9, borderRadius: 3, background: color }} /><span className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span></div>
    <Select value={value} onChange={(e) => onChange(e.target.value)} options={opts.map((e) => ({ value: e.id, label: e.name }))} />
  </div>;
}

// diverging per-record delta bars
function DeltaDist({ a, b }) {
  const rows = a.results.map((ra) => {
    const rb = b.results.find((x) => x.recId === ra.recId);
    return { rec: ra.recId, input: ra.input, topic: ra.topic, d: rb.overall - ra.overall };
  }).sort((x, y) => x.d - y.d);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.d)), 0.05);
  return <div className="col" style={{ gap: 3 }}>
    {rows.map((r) => {
      const pct = (Math.abs(r.d) / maxAbs) * 50;
      const pos = r.d > 0.0005, neg = r.d < -0.0005;
      const col = pos ? "var(--pos)" : neg ? "var(--neg)" : "var(--text-faint)";
      return <div key={r.rec} className="row" style={{ height: 22, fontSize: 11.5 }} title={r.input}>
        <div style={{ width: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-2)", paddingRight: 10 }}>{r.input}</div>
        <div className="row" style={{ flex: 1, position: "relative", height: "100%" }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border-strong)" }} />
          <div style={{ position: "absolute", left: "50%", height: 12, top: 5, transform: neg ? "translateX(-100%)" : "none", width: `${pct}%`, background: col, borderRadius: 3, opacity: 0.85, transition: "width .5s" }} />
        </div>
        <div className="mono" style={{ width: 52, textAlign: "right", color: col, fontWeight: 600 }}>{pos ? "+" : ""}{r.d.toFixed(2)}</div>
      </div>;
    })}
  </div>;
}

function MetricCompare({ name, fmtKey, av, bv }) {
  const an = norm(fmtKey, av), bn = norm(fmtKey, bv);
  const d = bn - an;
  return <div className="row gap-3" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
    <div style={{ width: 130, fontSize: 13, fontWeight: 600 }}>{name}</div>
    <div className="row gap-2" style={{ flex: 1, justifyContent: "flex-end" }}>
      <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, width: 42, textAlign: "right", color: "var(--text-2)" }}>{fmtScore(fmtKey, av)}</span>
      <div style={{ width: 70, height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${an * 100}%`, background: "oklch(0.62 0.13 265)", borderRadius: 99 }} /></div>
    </div>
    <div style={{ width: 64, textAlign: "center" }}><Delta value={d} pp suffix="" /></div>
    <div className="row gap-2" style={{ flex: 1 }}>
      <div style={{ width: 70, height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${bn * 100}%`, background: "oklch(0.62 0.15 155)", borderRadius: 99 }} /></div>
      <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, width: 42, color: "var(--text-2)" }}>{fmtScore(fmtKey, bv)}</span>
    </div>
  </div>;
}

function DiffRow({ ra, rb, expanded, onToggle }) {
  const rec = DB.DATASET_RECORDS.find((x) => x.id === ra.recId);
  const d = rb.overall - ra.overall;
  const col = d > 0.0005 ? "var(--pos)" : d < -0.0005 ? "var(--neg)" : "var(--text-faint)";
  return <>
    <tr onClick={onToggle} style={{ cursor: "pointer" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = expanded ? "var(--surface-2)" : "transparent"}>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", width: 22, color: "var(--text-faint)" }}>{expanded ? window.Icons.chevDown({ size: 14 }) : window.Icons.chevRight({ size: 14 })}</td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", maxWidth: 320 }}>
        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ra.input}</div>
        <div style={{ marginTop: 3 }}><Topic name={ra.topic} /></div>
      </td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right" }} className="mono"><span style={{ color: "var(--text-2)" }}>{ra.overall.toFixed(2)}</span></td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "center", width: 40, color: "var(--text-faint)" }}>{window.Icons.arrowRight({ size: 13 })}</td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "left" }} className="mono"><span style={{ color: "var(--text)", fontWeight: 600 }}>{rb.overall.toFixed(2)}</span></td>
      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", width: 130 }}>
        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
          <div style={{ width: 50, height: 6, borderRadius: 99, background: "var(--surface-3)", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", left: d < 0 ? "auto" : "50%", right: d < 0 ? "50%" : "auto", height: "100%", width: `${Math.min(50, Math.abs(d) * 120)}%`, background: col }} /><div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "var(--border-strong)" }} /></div>
          <span className="mono" style={{ color: col, fontWeight: 600, fontSize: 12.5, width: 44, textAlign: "right" }}>{d > 0 ? "+" : ""}{d.toFixed(2)}</span>
        </div>
      </td>
    </tr>
    {expanded && <tr><td colSpan={6} style={{ padding: 0, borderBottom: "1px solid var(--border)", background: "var(--bg-inset)" }}>
      <div className="row gap-4" style={{ padding: "16px 20px 18px 50px", alignItems: "stretch" }}>
        {[["A", ra, "oklch(0.62 0.13 265)"], ["B", rb, "oklch(0.62 0.15 155)"]].map(([lbl, r, c]) => <div key={lbl} className="col gap-2" style={{ flex: 1 }}>
          <div className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} /><span className="faint" style={{ fontSize: 11, fontWeight: 700 }}>{lbl} OUTPUT</span><span className="mono" style={{ fontSize: 11, marginLeft: "auto", color: scoreColor(r.overall), fontWeight: 600 }}>{r.overall.toFixed(2)}</span></div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", minHeight: 60 }}>{r.output}</div>
          <div className="row gap-3 wrap" style={{ fontSize: 11 }}>
            {DB.RUBRIC.criteria.map((cr) => <span key={cr.key} className="mono" style={{ color: "var(--text-3)" }}>{cr.name.split(" ")[0]}: <b style={{ color: "var(--text)" }}>{fmtScore(cr.key, r.scores[cr.key])}</b></span>)}
          </div>
        </div>)}
      </div>
    </td></tr>}
  </>;
}

function CompareView({ route, go }) {
  const [aId, setA] = useCS(route.a || "exp_7a2f");
  const [bId, setB] = useCS(route.b || "exp_9c41");
  const [filter, setFilter] = useCS("all");
  const [exp, setExp] = useCS(null);
  const a = DB.expById(aId), b = DB.expById(bId);
  if (!a || !b) return <Empty title="Pick two experiments" />;

  const merged = a.results.map((ra) => ({ ra, rb: b.results.find((x) => x.recId === ra.recId) }));
  const improved = merged.filter((m) => m.rb.overall - m.ra.overall > 0.0005).length;
  const regressed = merged.filter((m) => m.ra.overall - m.rb.overall > 0.0005).length;
  const same = merged.length - improved - regressed;
  let rows = [...merged];
  if (filter === "improved") rows = rows.filter((m) => m.rb.overall - m.ra.overall > 0.0005);
  if (filter === "regressed") rows = rows.filter((m) => m.ra.overall - m.rb.overall > 0.0005);
  rows.sort((x, y) => (x.rb.overall - x.ra.overall) - (y.rb.overall - y.ra.overall));
  const overallD = b.summary.overall - a.summary.overall;

  return <div className="col gap-5">
    <PageHead title="Compare experiments"
      crumbs={[{ label: "Experiments", onClick: () => go({ view: "experiments" }) }, { label: "Compare" }]}
      actions={<Btn variant="default" icon="download">Export diff</Btn>} />

    {/* pickers */}
    <Card>
      <div className="row gap-4" style={{ alignItems: "flex-end" }}>
        <ExpPicker value={aId} onChange={setA} color="oklch(0.62 0.13 265)" label="Baseline (A)" />
        <button onClick={() => { setA(bId); setB(aId); }} title="Swap" style={{ marginBottom: 1, width: 38, height: 38, borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{window.Icons.refresh({ size: 16 })}</button>
        <ExpPicker value={bId} onChange={setB} color="oklch(0.62 0.15 155)" label="Candidate (B)" />
      </div>
    </Card>

    {/* headline */}
    <div className="row gap-5" style={{ alignItems: "stretch" }}>
      <Card style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 6 }}>
        <span className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall change</span>
        <div className="mono" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", color: overallD >= 0 ? "var(--pos)" : "var(--neg)" }}>{overallD >= 0 ? "+" : ""}{(overallD * 100).toFixed(1)}<span style={{ fontSize: 18 }}>pp</span></div>
        <div className="row gap-2 mono" style={{ fontSize: 12.5, color: "var(--text-2)" }}><span>{a.summary.overall.toFixed(3)}</span>{window.Icons.arrowRight({ size: 13 })}<span style={{ fontWeight: 700, color: "var(--text)" }}>{b.summary.overall.toFixed(3)}</span></div>
        <div className="row gap-3" style={{ marginTop: 10 }}>
          <span className="row gap-1" style={{ fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--pos)" }} /><b className="mono">{improved}</b> better</span>
          <span className="row gap-1" style={{ fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--neg)" }} /><b className="mono">{regressed}</b> worse</span>
          <span className="row gap-1" style={{ fontSize: 12, color: "var(--text-3)" }}><span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--text-faint)" }} /><b className="mono">{same}</b> same</span>
        </div>
      </Card>
      <Card style={{ flex: 1 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Metric breakdown</h3>
        <div className="row" style={{ justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
          <span className="row gap-1"><span style={{ width: 8, height: 8, borderRadius: 2, background: "oklch(0.62 0.13 265)" }} />A · {a.name}</span>
          <span className="row gap-1"><span style={{ width: 8, height: 8, borderRadius: 2, background: "oklch(0.62 0.15 155)" }} />B · {b.name}</span>
        </div>
        <div style={{ marginTop: 4 }}>
          {DB.RUBRIC.criteria.map((c) => <MetricCompare key={c.key} name={c.name} fmtKey={c.key} av={a.summary[c.key]} bv={b.summary[c.key]} />)}
        </div>
      </Card>
    </div>

    {/* per-record delta distribution */}
    <Card>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Per-record change</h3>
      <p className="faint" style={{ fontSize: 12, marginBottom: 16 }}>B minus A, sorted. Left = regression, right = improvement.</p>
      <DeltaDist a={a} b={b} />
    </Card>

    {/* diff table */}
    <div className="row gap-3" style={{ justifyContent: "space-between" }}>
      <Segment size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: `All ${merged.length}` }, { value: "regressed", label: `Regressions ${regressed}` }, { value: "improved", label: `Improvements ${improved}` }]} />
      {regressed > 0 && filter !== "improved" && <span className="row gap-1 faint" style={{ fontSize: 12 }}>{window.Icons.alert({ size: 13, style: { color: "var(--neg)" } })} {regressed} record{regressed > 1 ? "s" : ""} got worse in B</span>}
    </div>
    <Card pad={0}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}></th>
          <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "left", fontWeight: 600 }}>Input</th>
          <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600 }}>A</th>
          <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}></th>
          <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "left", fontWeight: 600 }}>B</th>
          <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600 }}>Δ overall</th>
        </tr></thead>
        <tbody>{rows.map((m) => <DiffRow key={m.ra.recId} ra={m.ra} rb={m.rb} expanded={exp === m.ra.recId} onToggle={() => setExp(exp === m.ra.recId ? null : m.ra.recId)} />)}</tbody>
      </table>
    </Card>
  </div>;
}
window.CompareView = CompareView;
