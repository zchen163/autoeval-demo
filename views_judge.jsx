// views_judge.jsx — Judge & calibration + Agent activity (runs audit)
const { useState: useJS } = React;

function FamilyTag({ family }) {
  const hue = { OpenAI: 155, Anthropic: 35, Google: 230 }[family] || 265;
  return <span className="row gap-1" style={{ fontSize: 11, fontWeight: 600, color: `oklch(0.55 0.14 ${hue})` }}><span style={{ width: 7, height: 7, borderRadius: 99, background: `oklch(0.6 0.15 ${hue})` }} />{family}</span>;
}

function JudgeView({ push }) {
  const cal = DB.CALIBRATION;
  const [panel, setPanel] = useJS(["j_oai", "j_anth"]);
  const togglePanel = (id) => setPanel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const sameFamily = panel.some((id) => DB.JUDGES.find((j) => j.id === id).family === cal.testedFamily);

  return <div className="col gap-5">
    <PageHead title="Judge & calibration" sub="LLM-as-judge is calibrated against a human golden set before it scores at scale. Truth always comes from humans, never the agent."
      crumbs={[{ label: DB.PROJECT.name }, { label: "Judge & calibration" }]}
      actions={<Btn variant="primary" icon="bolt" onClick={() => push("Rubric Agent re-calibrating…", "neutral")}>Re-calibrate</Btn>} />

    {/* cross-family explainer */}
    <div className="row gap-3" style={{ padding: "12px 15px", borderRadius: "var(--r-lg)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      {window.Icons.info({ size: 17, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 1 } })}
      <div style={{ fontSize: 12.5, lineHeight: 1.55 }}><b>Generation ≠ judging.</b> The agent under test runs on an <b>{cal.testedFamily}</b> model, so judges default to a different family to avoid self-preference bias and shared blind spots. A cross-family judge isn't automatically more accurate — it just fails differently. Its trust comes only from agreement with human golden labels.</div>
    </div>

    {/* judge panel config */}
    <Card pad={0}>
      <div className="row" style={{ justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
        <div><h3 style={{ fontSize: 15, fontWeight: 700 }}>Judge panel</h3><p className="faint" style={{ fontSize: 12, marginTop: 2 }}>2–3 different families. Disagreements route to human review.</p></div>
        <Badge tone={panel.length > 1 ? "accent" : "warn"}>{panel.length} judge{panel.length > 1 ? "s" : ""} · {panel.length > 1 ? "panel" : "single"}</Badge>
      </div>
      {sameFamily && <div className="row gap-2" style={{ padding: "10px 18px", background: "var(--warn-soft)", fontSize: 12.5, color: "var(--text-2)" }}>{window.Icons.alert({ size: 15, style: { color: "var(--warn)", flexShrink: 0 } })}<span>A selected judge shares the <b>{cal.testedFamily}</b> family with the agent under test — self-preference bias risk. Prefer a different family.</span></div>}
      {DB.JUDGES.map((j, i) => {
        const on = panel.includes(j.id);
        const calibrated = j.status === "calibrated";
        return <div key={j.id} className="row gap-3" style={{ padding: "13px 18px", borderBottom: i < DB.JUDGES.length - 1 ? "1px solid var(--border)" : "none", justifyContent: "space-between", opacity: calibrated ? 1 : 0.85 }}>
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <button onClick={() => calibrated && togglePanel(j.id)} disabled={!calibrated} style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${on ? "var(--accent)" : "var(--border-strong)"}`, background: on ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, cursor: calibrated ? "pointer" : "not-allowed" }}>{on && window.Icons.check({ size: 12, sw: 3 })}</button>
            <div>
              <div className="row gap-2"><span className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>{j.name}</span><FamilyTag family={j.family} />{j.family === cal.testedFamily && <Badge tone="warn">same family</Badge>}</div>
              <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{j.note}</div>
            </div>
          </div>
          <div className="row gap-4" style={{ flexShrink: 0 }}>
            <div className="col" style={{ alignItems: "flex-end" }}><span className="faint" style={{ fontSize: 10.5 }}>agreement</span><span className="mono" style={{ fontSize: 14, fontWeight: 700, color: j.agreement >= cal.threshold ? "var(--pos)" : "var(--neg)" }}>{j.agreement.toFixed(2)}</span></div>
            {calibrated ? <Badge tone="pos" dot>calibrated</Badge> : <Badge tone="neg" dot>below {cal.threshold.toFixed(2)}</Badge>}
          </div>
        </div>;
      })}
      <div className="row" style={{ justifyContent: "space-between", padding: "12px 18px", background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
        <span className="faint" style={{ fontSize: 11.5 }}>{window.Icons.key({ size: 13, style: { display: "inline", verticalAlign: -2, marginRight: 4 } })}Panel scoring runs on your API keys — needs a key per provider. Cost ≈ {panel.length}× single judge.</span>
        <Btn size="sm" variant="primary" onClick={() => push("Panel saved", "pos")}>Save panel</Btn>
      </div>
    </Card>

    {/* calibration history + disagreements */}
    <div className="row gap-5" style={{ alignItems: "flex-start" }}>
      <Card style={{ flex: 1 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Calibration history</h3>
          <Badge tone="neutral">{cal.goldenCount} golden labels</Badge>
        </div>
        <p className="faint" style={{ fontSize: 12, marginBottom: 16 }}>Agreement with human, per round. Threshold {cal.threshold.toFixed(2)}.</p>
        <div className="col gap-3">
          {cal.rounds.map((r) => <div key={r.round}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 12.5 }}><span className="mono faint">R{r.round}</span> · {r.change}</span></div>
            <div className="col gap-1">
              {["j_oai", "j_anth", "j_goog"].map((jid) => { const v = r.agreement[jid]; const j = DB.JUDGES.find((x) => x.id === jid); return <div key={jid} className="row gap-2" style={{ fontSize: 11 }}>
                <span className="mono" style={{ width: 56, color: "var(--text-3)" }}>{j.name.split("-")[0]}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden", position: "relative" }}><div style={{ height: "100%", width: `${v * 100}%`, background: v >= cal.threshold ? "var(--pos)" : "var(--warn)", borderRadius: 99 }} /><div style={{ position: "absolute", left: `${cal.threshold * 100}%`, top: -2, bottom: -2, width: 1.5, background: "var(--text-faint)" }} /></div>
                <span className="mono" style={{ width: 32, textAlign: "right", fontWeight: 600, color: v >= cal.threshold ? "var(--pos)" : "var(--text-2)" }}>{v.toFixed(2)}</span>
              </div>; })}
            </div>
          </div>)}
        </div>
      </Card>
      <Card style={{ flex: 1 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Human ↔ judge disagreements</h3>
        <p className="faint" style={{ fontSize: 12, marginBottom: 14 }}>Auto-routed to the review queue. These define where the judge is still wrong.</p>
        <div className="col gap-2">
          {cal.disagreements.map((d) => <div key={d.rec} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 6 }}>{d.q}</div>
            <div className="row gap-3" style={{ marginBottom: 6 }}>
              <span className="row gap-1" style={{ fontSize: 11.5 }}><Avatar m={DB.ME} size={16} /><span className="mono" style={{ fontWeight: 600 }}>{d.human.toFixed(2)}</span></span>
              <span className="faint" style={{ fontSize: 11 }}>vs</span>
              <span className="row gap-1" style={{ fontSize: 11.5 }}>{window.Icons.bolt({ size: 12, style: { color: "var(--accent-text)" } })}<span className="mono" style={{ fontWeight: 600, color: "var(--neg)" }}>{d.judge.toFixed(2)}</span></span>
              <span className="mono faint" style={{ fontSize: 10.5, marginLeft: "auto" }}>Δ {Math.abs(d.human - d.judge).toFixed(2)}</span>
            </div>
            <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.45 }}>{d.note}</div>
          </div>)}
        </div>
      </Card>
    </div>
  </div>;
}

// ---------------- Agent activity (runs audit) ----------------
function AgentRunsView({ go }) {
  const [open, setOpen] = useJS(DB.AGENT_RUNS[0].id);
  return <div className="col gap-5">
    <PageHead title="Agent activity" sub="Every agent run is auditable: what it read, which tools it called, what it produced. Artifacts that define correctness can be rolled back."
      crumbs={[{ label: DB.ORG.name }, { label: "Agent activity" }]}
      actions={<Btn variant="default" icon="filter">Filter</Btn>} />
    <Card pad={0}>
      {DB.AGENT_RUNS.map((r, i) => {
        const a = DB.AGENTS[r.agent];
        const isOpen = open === r.id;
        return <div key={r.id} style={{ borderBottom: i < DB.AGENT_RUNS.length - 1 ? "1px solid var(--border)" : "none" }}>
          <div onClick={() => setOpen(isOpen ? null : r.id)} className="row gap-3" style={{ padding: "13px 16px", cursor: "pointer", justifyContent: "space-between" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div className="row gap-3" style={{ minWidth: 0 }}>
              <span style={{ color: "var(--text-faint)" }}>{isOpen ? window.Icons.chevDown({ size: 14 }) : window.Icons.chevRight({ size: 14 })}</span>
              <AgentAvatar id={r.agent} size={30} />
              <div style={{ minWidth: 0 }}><div className="row gap-2"><span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.title}</span></div><div className="faint mono" style={{ fontSize: 11, marginTop: 2 }}>{a.name} · {r.by} · {r.date}</div></div>
            </div>
            <div className="row gap-3" style={{ flexShrink: 0 }}>
              <AutonomyBadge level={r.autonomy} />
              <span className="mono faint" style={{ fontSize: 11.5 }}>${r.cost.toFixed(2)}</span>
              {r.status === "approved" ? <Badge tone="pos" dot>approved</Badge> : <Badge tone="neutral" dot>{r.status}</Badge>}
            </div>
          </div>
          {isOpen && <div style={{ padding: "4px 16px 16px 58px", background: "var(--bg-inset)" }}>
            <div className="row gap-6 wrap" style={{ paddingTop: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="faint" style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Tools invoked</div>
                <div className="col gap-1">{r.tools.map((t) => <span key={t} className="row gap-2" style={{ fontSize: 12 }}>{window.Icons.check({ size: 12, style: { color: "var(--pos)" } })}<span className="mono" style={{ color: "var(--text-2)" }}>{t}()</span></span>)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="faint" style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Data read · tenant-scoped</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{r.reads}</div>
                <div className="faint" style={{ fontSize: 11, marginTop: 8 }}>Ran on platform model · cost on platform budget</div>
              </div>
              <div className="col gap-2" style={{ justifyContent: "flex-end" }}>
                {r.status === "approved" && <Btn size="sm" variant="default" icon="refresh">Roll back</Btn>}
                <Btn size="sm" variant="ghost" onClick={() => go({ view: "copilot" })}>Open session</Btn>
              </div>
            </div>
          </div>}
        </div>;
      })}
    </Card>
  </div>;
}

window.JudgeView = JudgeView;
window.AgentRunsView = AgentRunsView;
