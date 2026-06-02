// views_monitor.jsx — long-term agent monitoring: rubric performance over time
const { useState: useMoS } = React;

// ---- 13 weeks of eval history (offline batch + online sampled), with deploy events ----
const MO_WEEKS = (function () {
  const labels = ["Feb 26", "Mar 5", "Mar 12", "Mar 19", "Mar 26", "Apr 2", "Apr 9", "Apr 16", "Apr 23", "Apr 30", "May 7", "May 14", "May 21", "May 28"];
  // hand-shaped overall story: steady climb → v1.3 jump → regression → v1.4 recovery
  const overall = [0.69, 0.70, 0.705, 0.72, 0.73, 0.745, 0.76, 0.775, 0.82, 0.815, 0.74, 0.79, 0.835, 0.842];
  const mk = (offs, jitter) => overall.map((v, i) => Math.max(0.4, Math.min(0.98, v + offs + Math.sin(i * 1.7) * jitter)));
  return labels.map((label, i) => ({
    label,
    overall: overall[i],
    faithfulness: Math.min(0.99, overall[i] + 0.05 + Math.sin(i) * 0.01),
    relevanceRaw: Math.min(5, 3.2 + overall[i] * 2.1),           // 1–5
    precision: Math.max(0.4, overall[i] - 0.04 + Math.cos(i) * 0.015),
    completeness: Math.max(0.4, Math.min(1, overall[i] + 0.02)), // pass-rate
    online: Math.max(0.4, overall[i] - 0.035 - (i > 9 ? 0.01 : 0)), // live sampled, tracks below offline
    volume: 40 + Math.round(Math.abs(Math.sin(i * 0.9)) * 70) + i * 3,
  })).map((w) => ({ ...w, relevance: (w.relevanceRaw - 1) / 4 }));
})();
const MO_DEPLOYS = [
  { i: 2, version: "v1.1", note: "legacy baseline" },
  { i: 5, version: "v1.2", note: "baseline-v1 prompt" },
  { i: 8, version: "v1.3", note: "+ cohere rerank" },
  { i: 10, version: "v1.3.1", note: "cot-v3 prompt (bad)", bad: true },
  { i: 11, version: "v1.4", note: "+ reflection, memory" },
];
const MO_SERIES = [
  { key: "overall", name: "Overall", color: "var(--accent)", bold: true, on: true },
  { key: "faithfulness", name: "Faithfulness", color: "oklch(0.62 0.15 155)", on: false },
  { key: "relevance", name: "Relevance", color: "oklch(0.66 0.14 200)", on: false },
  { key: "precision", name: "Precision", color: "oklch(0.7 0.15 75)", on: false },
  { key: "completeness", name: "Completeness", color: "oklch(0.62 0.18 25)", on: false },
  { key: "online", name: "Online (live)", color: "var(--text-faint)", dashed: true, on: true },
];

function MonitorChart({ active, target = 0.8 }) {
  const [hover, setHover] = useMoS(null);
  const W = 920, H = 320, mL = 40, mR = 16, mT = 18, mB = 30;
  const iW = W - mL - mR, iH = H - mT - mB;
  const yMin = 0.55, yMax = 0.95;
  const X = (i) => mL + (i / (MO_WEEKS.length - 1)) * iW;
  const Y = (v) => mT + iH - ((v - yMin) / (yMax - yMin)) * iH;
  const grid = [0.6, 0.7, 0.8, 0.9];
  const series = MO_SERIES.filter((s) => active.includes(s.key));
  const pathFor = (key) => MO_WEEKS.map((w, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(w[key]).toFixed(1)).join(" ");
  const fmtAt = (w, key) => key === "relevance" ? w.relevanceRaw.toFixed(1) + "/5" : key === "completeness" ? (w.completeness * 100).toFixed(0) + "%" : w[key].toFixed(3);

  return <div style={{ position: "relative" }}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} onMouseLeave={() => setHover(null)}>
      <defs><linearGradient id="moFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.14" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
      {/* y grid */}
      {grid.map((g) => <g key={g}>
        <line x1={mL} x2={W - mR} y1={Y(g)} y2={Y(g)} stroke="var(--border)" strokeWidth="1" strokeDasharray={g === target ? "0" : "3 4"} opacity={g === target ? 0.9 : 1} />
        <text x={mL - 8} y={Y(g) + 3.5} textAnchor="end" fontSize="10" fill="var(--text-faint)" fontFamily="var(--font-mono)">{g.toFixed(2)}</text>
      </g>)}
      {/* target label */}
      <text x={W - mR} y={Y(target) - 5} textAnchor="end" fontSize="9.5" fill="var(--text-3)" fontFamily="var(--font-mono)">target {target.toFixed(2)}</text>
      {/* deploy markers */}
      {MO_DEPLOYS.map((d) => <g key={d.version}>
        <line x1={X(d.i)} x2={X(d.i)} y1={mT} y2={mT + iH} stroke={d.bad ? "var(--neg)" : "var(--border-strong)"} strokeWidth="1.2" strokeDasharray="2 3" opacity={d.bad ? 0.7 : 0.55} />
        <g transform={`translate(${X(d.i)},${mT - 4})`}>
          <rect x={-17} y={-13} width="34" height="15" rx="4" fill={d.bad ? "var(--neg)" : "var(--surface-3)"} />
          <text x="0" y="-2.5" textAnchor="middle" fontSize="9" fontWeight="700" fill={d.bad ? "white" : "var(--text-2)"} fontFamily="var(--font-mono)">{d.version}</text>
        </g>
      </g>)}
      {/* overall area fill */}
      {active.includes("overall") && <path d={pathFor("overall") + ` L${X(MO_WEEKS.length - 1)} ${mT + iH} L${mL} ${mT + iH} Z`} fill="url(#moFill)" />}
      {/* series lines */}
      {series.map((s) => <path key={s.key} d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth={s.bold ? 2.4 : 1.7} strokeDasharray={s.dashed ? "4 4" : "0"} strokeLinecap="round" strokeLinejoin="round" opacity={s.dashed ? 0.8 : 1} />)}
      {/* points on overall */}
      {active.includes("overall") && MO_WEEKS.map((w, i) => <circle key={i} cx={X(i)} cy={Y(w.overall)} r={hover === i ? 4.5 : 2.6} fill={hover === i ? "var(--accent)" : "var(--surface)"} stroke="var(--accent)" strokeWidth="2" />)}
      {/* hover crosshair + hit areas */}
      {hover != null && <line x1={X(hover)} x2={X(hover)} y1={mT} y2={mT + iH} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />}
      {MO_WEEKS.map((w, i) => <rect key={"h" + i} x={X(i) - iW / (MO_WEEKS.length - 1) / 2} y={mT} width={iW / (MO_WEEKS.length - 1)} height={iH} fill="transparent" onMouseEnter={() => setHover(i)} />)}
      {/* x labels (every other) */}
      {MO_WEEKS.map((w, i) => i % 2 === 0 && <text key={"x" + i} x={X(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="var(--text-faint)">{w.label}</text>)}
    </svg>
    {hover != null && <div style={{ position: "absolute", left: `${(X(hover) / W) * 100}%`, top: 0, transform: `translateX(${hover > MO_WEEKS.length - 4 ? "-105%" : "8px"})`, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-md)", padding: "9px 11px", pointerEvents: "none", minWidth: 150, zIndex: 5 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700 }}>{MO_WEEKS[hover].label}</span><span className="mono faint" style={{ fontSize: 10.5 }}>{MO_WEEKS[hover].volume} runs</span></div>
      {series.map((s) => <div key={s.key} className="row gap-2" style={{ justifyContent: "space-between", fontSize: 11.5, marginBottom: 2 }}>
        <span className="row gap-1" style={{ color: "var(--text-2)" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />{s.name}</span>
        <span className="mono" style={{ fontWeight: 600 }}>{fmtAt(MO_WEEKS[hover], s.key)}</span>
      </div>)}
    </div>}
  </div>;
}

function MonitorView({ go, push }) {
  const [active, setActive] = useMoS(["overall", "online"]);
  const [range, setRange] = useMoS("13w");
  const cur = MO_WEEKS[MO_WEEKS.length - 1];
  const prev4 = MO_WEEKS[MO_WEEKS.length - 5];
  const delta30 = cur.overall - prev4.overall;
  const gap = cur.overall - cur.online;
  const toggle = (k) => setActive((a) => a.includes(k) ? a.filter((x) => x !== k) : [...a, k]);

  // auto-detected regressions
  const alerts = [];
  for (let i = 1; i < MO_WEEKS.length; i++) {
    const d = MO_WEEKS[i].overall - MO_WEEKS[i - 1].overall;
    if (d < -0.03) { const dep = MO_DEPLOYS.find((x) => x.i === i); alerts.push({ i, d, week: MO_WEEKS[i].label, dep }); }
  }

  return <div className="col gap-5">
    <PageHead title="Agent monitoring" sub="Long-term eval quality for Support Copilot — offline batch scores and live online sampling, tracked against your target."
      crumbs={[{ label: DB.PROJECT.name }, { label: "Monitoring" }]}
      actions={<><Segment size="sm" value={range} onChange={setRange} options={[{ value: "13w", label: "13w" }, { value: "30d", label: "30d" }]} /><Btn variant="default" icon="download">Export</Btn></>} />

    {/* stat tiles */}
    <div className="row gap-4 wrap">
      {[["Overall (current)", cur.overall.toFixed(3), <Delta value={delta30} pp suffix="pp" key="d" />, "vs 4 wks ago"],
        ["Online ↔ offline gap", gap.toFixed(3), <Badge tone={gap > 0.05 ? "warn" : "pos"} key="g">{gap > 0.05 ? "watch" : "healthy"}</Badge>, "live below batch"],
        ["Weeks above target", MO_WEEKS.filter((w) => w.overall >= 0.8).length + "/" + MO_WEEKS.length, null, "≥ 0.80"],
        ["Regressions caught", String(alerts.length), <Badge tone="neg" key="a" dot>auto</Badge>, "this quarter"]].map(([l, v, badge, sub], i) =>
        <Card key={i} pad={16} style={{ flex: 1, minWidth: 170 }}>
          <div className="row" style={{ justifyContent: "space-between" }}><span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{l}</span>{badge}</div>
          <div className="row gap-2" style={{ alignItems: "baseline", marginTop: 9 }}><span className="mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" }}>{v}</span><span className="faint" style={{ fontSize: 11.5 }}>{sub}</span></div>
        </Card>)}
    </div>

    {/* main chart */}
    <Card>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <div><h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Rubric performance over time</h3><p className="faint" style={{ fontSize: 12, marginTop: 2 }}>Weighted overall + per-dimension · deploys marked on the timeline</p></div>
      </div>
      {/* legend / series toggles */}
      <div className="row gap-2 wrap" style={{ margin: "10px 0 14px" }}>
        {MO_SERIES.map((s) => { const on = active.includes(s.key); return <button key={s.key} onClick={() => toggle(s.key)} className="row gap-2" style={{ padding: "4px 10px", borderRadius: 99, border: `1px solid ${on ? "var(--border-strong)" : "var(--border)"}`, background: on ? "var(--surface-2)" : "transparent", opacity: on ? 1 : 0.5 }}>
          <span style={{ width: 12, height: on ? 3 : 2, borderRadius: 2, background: s.color, display: "inline-block", borderBottom: s.dashed ? "0" : "0" }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</span>
        </button>; })}
      </div>
      <MonitorChart active={active} />
    </Card>

    <div className="row gap-5" style={{ alignItems: "flex-start" }}>
      {/* regressions / alerts */}
      <Card style={{ flex: 1 }} pad={0}>
        <div className="row gap-2" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          {window.Icons.alert({ size: 16, style: { color: "var(--neg)" } })}<h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Detected regressions</h3><Badge tone="neg">{alerts.length}</Badge>
        </div>
        {alerts.map((a, i) => <div key={i} className="row gap-3" style={{ padding: "12px 18px", borderBottom: i < alerts.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--neg)", marginTop: 5, flexShrink: 0 }} />
          <div className="grow">
            <div className="row gap-2"><span style={{ fontSize: 13, fontWeight: 600 }}>Overall dropped {(Math.abs(a.d) * 100).toFixed(1)}pp</span><span className="faint mono" style={{ fontSize: 11 }}>· week of {a.week}</span></div>
            <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{a.dep ? <>Coincides with deploy <b className="mono" style={{ color: "var(--text-2)" }}>{a.dep.version}</b> — {a.dep.note}.</> : "No deploy that week — likely a data-distribution shift in production."}</div>
          </div>
          <Btn size="sm" variant="default" icon="layers" onClick={() => go({ view: "compare", a: "exp_7a2f", b: "exp_9c41" })}>Diff</Btn>
        </div>)}
      </Card>
      {/* per-dimension sparklines */}
      <Card style={{ width: 320, flexShrink: 0 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>By dimension · 13w</h3>
        <div className="col gap-3">
          {[["faithfulness", "Faithfulness"], ["relevance", "Relevance"], ["precision", "Precision"], ["completeness", "Completeness"]].map(([k, n]) => {
            const series = MO_WEEKS.map((w) => w[k]); const last = series[series.length - 1]; const first = series[series.length - 5];
            return <div key={k} className="row gap-3" style={{ alignItems: "center" }}>
              <span style={{ width: 92, fontSize: 12.5 }}>{n}</span>
              <div className="grow"><Sparkline data={series} w={120} h={28} color={scoreColor(last)} /></div>
              <Delta value={last - first} pp suffix="" />
            </div>;
          })}
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <Btn size="sm" variant="soft" full icon="bell" onClick={() => push("Alert rule saved: overall < 0.78 → Slack #evals", "pos")}>Set up an alert</Btn>
        </div>
      </Card>
    </div>
  </div>;
}

window.MonitorView = MonitorView;
