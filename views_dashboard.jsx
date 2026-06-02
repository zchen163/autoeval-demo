// views_dashboard.jsx
const { useState: useDS } = React;

// area line chart with axis + hover
function LineChart({ data, h = 200, labels }) {
  const [hover, setHover] = useDS(null);
  const w = 640, padL = 8, padR = 8, padT = 14, padB = 4;
  const min = 0.5, max = 0.95;
  const rng = max - min;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const X = (i) => padL + (i / (data.length - 1)) * innerW;
  const Y = (v) => padT + innerH - ((v - min) / rng) * innerH;
  const pts = data.map((d, i) => [X(i), Y(d)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${X(data.length - 1)} ${padT + innerH} L${padL} ${padT + innerH} Z`;
  const grid = [0.6, 0.7, 0.8, 0.9];
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} onMouseLeave={() => setHover(null)} style={{ display: "block", overflow: "visible" }}>
        <defs><linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
        {grid.map((g) => <g key={g}>
          <line x1={padL} x2={w - padR} y1={Y(g)} y2={Y(g)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" />
          <text x={w - padR} y={Y(g) - 4} textAnchor="end" fontSize="10" fill="var(--text-faint)" fontFamily="var(--font-mono)">{g.toFixed(2)}</text>
        </g>)}
        <path d={area} fill="url(#dashFill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 4.5 : 2.8} fill={hover === i ? "var(--accent)" : "var(--surface)"} stroke="var(--accent)" strokeWidth="2" />)}
        {pts.map((p, i) => <rect key={"h" + i} x={p[0] - innerW / (data.length - 1) / 2} y={0} width={innerW / (data.length - 1)} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />)}
        {hover != null && <line x1={pts[hover][0]} x2={pts[hover][0]} y1={padT} y2={padT + innerH} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />}
      </svg>
      {hover != null && <div style={{ position: "absolute", left: `${(pts[hover][0] / w) * 100}%`, top: 0, transform: "translateX(-50%)", background: "var(--text)", color: "var(--bg)", padding: "4px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", pointerEvents: "none" }} className="mono">{data[hover].toFixed(3)}</div>}
      <div className="row" style={{ justifyContent: "space-between", marginTop: 6, padding: "0 4px" }}>
        {labels.map((l, i) => <span key={i} className="faint" style={{ fontSize: 10.5 }}>{l}</span>)}
      </div>
    </div>
  );
}

function KPI({ label, value, sub, trend, tone }) {
  return (
    <Card pad={16} style={{ flex: 1 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
        {trend != null && <Delta value={trend} pp suffix="pp" />}
      </div>
      <div className="row" style={{ gap: 8, alignItems: "baseline", marginTop: 10 }}>
        <span className="mono" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: tone || "var(--text)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {sub && <span className="faint" style={{ fontSize: 12.5 }}>{sub}</span>}
      </div>
    </Card>
  );
}

function DashboardView({ go }) {
  const exps = DB.EXPERIMENTS.filter((e) => e.status === "complete");
  const ranked = [...exps].sort((a, b) => b.summary.overall - a.summary.overall);
  const best = ranked[0];
  const baseline = DB.expById("exp_7a2f");
  const flagged = DB.TRACES.filter((t) => t.flag).length;

  return (
    <div className="col gap-6">
      <PageHead title="Support Copilot" sub={DB.PROJECT.description}
        crumbs={[{ label: DB.ORG.name }, { label: "Support Copilot" }]}
        actions={<>
          <Btn variant="default" icon="download">Export</Btn>
          <Btn variant="primary" icon="play" onClick={() => go({ view: "experiments", create: true })}>Run experiment</Btn>
        </>} />

      <div className="row gap-4">
        <KPI label="Avg quality score" value={best.summary.overall.toFixed(3)} sub="best config" trend={0.043} tone="var(--text)" />
        <KPI label="Experiments" value={DB.EXPERIMENTS.length} sub={`${exps.length} complete`} />
        <KPI label="Online traces (mo.)" value={`${DB.ORG.traceUsed}`} sub={`/ ${DB.ORG.traceQuota} free`} trend={null} />
        <KPI label="Flagged for review" value={flagged + 2} sub="needs human" tone={flagged ? "var(--warn)" : undefined} />
      </div>

      <div className="row gap-5" style={{ alignItems: "stretch" }}>
        <Card style={{ flex: "1 1 0", minWidth: 0 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
            <div><h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Quality score trend</h3><p className="faint" style={{ fontSize: 12, marginTop: 2 }}>Weighted overall · last 8 experiments</p></div>
            <Segment size="sm" options={[{ value: "8", label: "8 runs" }, { value: "30", label: "30d" }]} value="8" onChange={() => { }} />
          </div>
          <div style={{ marginTop: 14 }}>
            <LineChart data={DB.SCORE_TREND} labels={["Apr 12", "", "Apr 30", "", "May 8", "", "May 19", "May 28"]} />
          </div>
        </Card>

        <Card style={{ width: 300, flexShrink: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Best config</h3>
          <p className="faint" style={{ fontSize: 12, marginBottom: 16 }}>Top of leaderboard</p>
          <div className="col" style={{ alignItems: "center", gap: 12 }}>
            <Ring value={best.summary.overall} size={92} stroke={8} label="overall" />
            <div className="mono" style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{best.name}</div>
          </div>
          <div className="col gap-2" style={{ marginTop: 18 }}>
            {DB.RUBRIC.criteria.map((c) => <div key={c.key} className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 12.5 }}>{c.name}</span>
              <ScoreBar value={best.summary[c.key]} fmtKey={c.key} w={42} />
            </div>)}
          </div>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card pad={0}>
        <div className="row" style={{ justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
          <div className="row gap-2">{window.Icons.trophy({ size: 17, style: { color: "var(--accent)" } })}<h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Leaderboard</h3></div>
          <Select options={[{ value: "overall", label: "Rank by: Overall" }, { value: "faith", label: "Rank by: Faithfulness" }]} style={{ width: 200, height: 32 }} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {["", "Experiment", "Agent", "Overall", "Faithful", "Relevance", "Precision", "Cost", ""].map((h, i) =>
              <th key={i} style={{ textAlign: i >= 3 && i <= 7 ? "right" : "left", padding: "9px 14px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {ranked.map((e, i) => (
              <tr key={e.id} onClick={() => go({ view: "experiments", id: e.id })} style={{ cursor: "pointer", transition: "background .12s" }}
                onMouseEnter={(ev) => ev.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", width: 30 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--text-faint)" }}>{i + 1}</span>
                </td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", fontWeight: 600, fontSize: 13.5 }}>{e.name}</td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none" }}><span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{e.version}</span></td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right" }}><div className="row" style={{ justifyContent: "flex-end" }}><ScoreBar value={e.summary.overall} w={44} /></div></td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right" }} className="mono">{e.summary.faithfulness.toFixed(2)}</td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right" }} className="mono">{e.summary.relevance.toFixed(1)}</td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right" }} className="mono">{e.summary.precision.toFixed(2)}</td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right" }} className="mono faint">${e.cost.toFixed(2)}</td>
                <td style={{ padding: "11px 14px", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right", color: "var(--text-faint)" }}>{window.Icons.chevRight({ size: 15 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="row gap-5" style={{ alignItems: "stretch" }}>
        <Card style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Online quality</h3>
            <Btn size="sm" variant="ghost" iconR="arrowRight" onClick={() => go({ view: "traces" })}>View traces</Btn>
          </div>
          <div className="col gap-3">
            {DB.TRACES.slice(0, 4).map((t) => (
              <div key={t.id} className="row gap-3" style={{ justifyContent: "space-between" }}>
                <div className="row gap-2" style={{ minWidth: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: scoreColor(t.overall), flexShrink: 0 }} />
                  <span style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}>{t.q}</span>
                </div>
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: scoreColor(t.overall) }}>{t.overall.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Review queue</h3>
            <Btn size="sm" variant="ghost" iconR="arrowRight" onClick={() => go({ view: "review" })}>Open queue</Btn>
          </div>
          <div className="col gap-3">
            {DB.REVIEW_ITems.filter((r) => r.status !== "done").slice(0, 4).map((r) => {
              const m = DB.MEMBERS.find((x) => x.id === r.assignee);
              return <div key={r.id} className="row gap-3" style={{ justifyContent: "space-between" }}>
                <div className="row gap-2" style={{ minWidth: 0 }}>
                  <Avatar m={m} size={22} />
                  <span style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{r.q}</span>
                </div>
                <StatusBadge status={r.status} />
              </div>;
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

window.DashboardView = DashboardView;
