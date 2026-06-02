// agents.jsx — shared agent UI: identities, autonomy, proposal cards, run audit
const { useState: useAS } = React;

function AgentAvatar({ id, size = 26 }) {
  const a = DB.AGENTS[id];
  if (!a) return null;
  return <span title={a.name} style={{
    width: size, height: size, borderRadius: 8, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: `oklch(0.55 0.15 ${a.hue} / 0.16)`, color: `oklch(0.55 0.16 ${a.hue})`, border: `1px solid oklch(0.55 0.15 ${a.hue} / 0.3)`,
  }}>{window.Icons[a.icon]({ size: size * 0.6 })}</span>;
}

function AutonomyBadge({ level, withDesc }) {
  const a = DB.AUTONOMY[level];
  if (!a) return null;
  return <span className="row gap-1" title={a.desc} style={{
    fontSize: 10.5, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 5,
    background: a.tone === "accent" ? "var(--accent-soft)" : a.tone === "warn" ? "var(--warn-soft)" : "var(--surface-3)",
    color: a.tone === "accent" ? "var(--accent-text)" : a.tone === "warn" ? "var(--warn)" : "var(--text-3)",
    border: "1px solid transparent",
  }}>{window.Icons.sliders({ size: 11 })}{a.label}{withDesc && <span style={{ fontWeight: 500, textTransform: "none", opacity: 0.8, marginLeft: 2 }}>· {a.desc}</span>}</span>;
}

function ProvBadge({ kind, sm }) {
  const p = DB.PROVENANCE[kind];
  if (!p) return null;
  return <Badge tone={p.tone} style={sm ? { height: 18, fontSize: 10.5, padding: "0 6px" } : undefined}>{window.Icons[p.icon]({ size: sm ? 10 : 11 })}{p.label}</Badge>;
}

// "依据 / evidence" disclosure — every proposal must show its basis
function Evidence({ children, label = "Why this proposal" }) {
  const [open, setOpen] = useAS(false);
  return <div style={{ marginTop: 10 }}>
    <button onClick={() => setOpen(!open)} className="row gap-1" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)" }}>
      {open ? window.Icons.chevDown({ size: 13 }) : window.Icons.chevRight({ size: 13 })}{label}
    </button>
    {open && <div style={{ marginTop: 6, padding: "9px 11px", background: "var(--bg-inset)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>{children}</div>}
  </div>;
}

// Agent run audit (tools called, data read) — collapsible
function RunTrace({ run, defaultOpen }) {
  const [open, setOpen] = useAS(defaultOpen || false);
  return <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--surface-2)" }}>
    <button onClick={() => setOpen(!open)} className="row gap-2" style={{ width: "100%", padding: "8px 11px", justifyContent: "space-between" }}>
      <span className="row gap-2" style={{ fontSize: 11.5, color: "var(--text-2)", fontWeight: 600 }}>{window.Icons.layers({ size: 13, style: { color: "var(--text-3)" } })}Agent run · {run.tools.length} tool calls</span>
      <span className="row gap-2"><span className="mono faint" style={{ fontSize: 10.5 }}>${run.cost.toFixed(2)} · platform model</span>{open ? window.Icons.chevDown({ size: 13, style: { color: "var(--text-3)" } }) : window.Icons.chevRight({ size: 13, style: { color: "var(--text-3)" } })}</span>
    </button>
    {open && <div style={{ padding: "0 11px 11px" }}>
      <div className="faint" style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0 6px" }}>Tools invoked</div>
      <div className="col gap-1">{run.tools.map((t, i) => <div key={i} className="row gap-2" style={{ fontSize: 11.5 }}>{window.Icons.check({ size: 12, style: { color: "var(--pos)" } })}<span className="mono" style={{ color: "var(--text-2)" }}>{t}()</span></div>)}</div>
      <div className="faint" style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "9px 0 4px" }}>Data read</div>
      <div className="mono" style={{ fontSize: 11.5, color: "var(--text-2)" }}>{run.reads}</div>
    </div>}
  </div>;
}

// Generic proposal card wrapper — header w/ agent + autonomy + approve/edit gate
function Proposal({ agent, autonomy = "draft", title, sub, children, evidence, run, onApprove, onEdit, approved, gate = true, approveLabel = "Approve", footerNote, onOpen }) {
  return <div style={{ border: `1px solid ${approved ? "var(--pos)" : "var(--accent-soft-border)"}`, borderRadius: "var(--r-lg)", background: "var(--surface)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
    <div className="row gap-3" onClick={onOpen} style={{ padding: "13px 15px", borderBottom: "1px solid var(--border)", justifyContent: "space-between", background: approved ? "var(--pos-soft)" : "transparent", cursor: onOpen ? "pointer" : "default", transition: "background .12s" }}
      onMouseEnter={(e) => { if (onOpen && !approved) e.currentTarget.style.background = "var(--surface-2)"; }} onMouseLeave={(e) => { if (onOpen) e.currentTarget.style.background = approved ? "var(--pos-soft)" : "transparent"; }}>
      <div className="row gap-3" style={{ minWidth: 0 }}>
        <AgentAvatar id={agent} size={30} />
        <div style={{ minWidth: 0 }}>
          <div className="row gap-2"><span style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</span>{approved && <Badge tone="pos" dot>approved</Badge>}</div>
          {sub && <div className="faint" style={{ fontSize: 11.5, marginTop: 1 }}>{DB.AGENTS[agent].name}{sub ? " · " + sub : ""}</div>}
        </div>
      </div>
      <div className="row gap-2" style={{ flexShrink: 0 }}>
        {!approved && <AutonomyBadge level={autonomy} />}
        {onOpen && <span className="row gap-1 faint" title="Open in canvas" style={{ fontSize: 11, fontWeight: 600 }}>open{window.Icons.external({ size: 13 })}</span>}
      </div>
    </div>
    <div style={{ padding: "14px 15px" }}>
      {children}
      {evidence && <Evidence>{evidence}</Evidence>}
      {run && <div style={{ marginTop: 10 }}><RunTrace run={run} /></div>}
    </div>
    {gate && <div className="row gap-2" style={{ padding: "11px 15px", borderTop: "1px solid var(--border)", background: "var(--surface-2)", justifyContent: "space-between" }}>
      <span className="row gap-1 faint" style={{ fontSize: 11.5 }}>{approved ? window.Icons.check({ size: 13, style: { color: "var(--pos)" } }) : window.Icons.alert({ size: 13, style: { color: "var(--warn)" } })}{approved ? "Applied to project" : (footerNote || "Awaiting your approval — defines correctness")}</span>
      {!approved && <div className="row gap-2">{onEdit && <Btn size="sm" variant="default" icon="sliders" onClick={onEdit}>Edit</Btn>}<Btn size="sm" variant="primary" icon="check" onClick={onApprove}>{approveLabel}</Btn></div>}
    </div>}
  </div>;
}

function SevDot({ sev }) {
  const c = sev === "high" ? "var(--neg)" : sev === "med" ? "var(--warn)" : "var(--text-faint)";
  return <span style={{ width: 7, height: 7, borderRadius: 99, background: c, flexShrink: 0 }} />;
}

// signal meter for triage
function SignalMeter({ value, w = 50 }) {
  const c = value > 0.7 ? "var(--neg)" : value > 0.4 ? "var(--warn)" : "var(--text-faint)";
  return <span className="row gap-2" style={{ minWidth: w + 36 }}>
    <span style={{ width: w, height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${value * 100}%`, background: c, borderRadius: 99 }} /></span>
    <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: c }}>{value.toFixed(2)}</span>
  </span>;
}

Object.assign(window, { AgentAvatar, AutonomyBadge, ProvBadge, Evidence, RunTrace, Proposal, SevDot, SignalMeter });
