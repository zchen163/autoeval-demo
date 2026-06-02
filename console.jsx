// console.jsx — AI-native shell pieces: icon rail, canvas header, canvas home, ⌘K palette
const { useState: useCnS, useEffect: useCnE, useRef: useCnR } = React;

// ---- destinations reachable by asking or ⌘K ----
const DESTS = [
  { view: "dashboard", label: "Project overview", icon: "dashboard", hint: "trends, leaderboard" },
  { view: "monitor", label: "Agent monitoring", icon: "trace", hint: "rubric score over time" },
  { view: "experiments", label: "Experiments", icon: "flask", hint: "all runs" },
  { view: "compare", a: "exp_7a2f", b: "exp_9c41", label: "Compare v1.2 → v1.3", icon: "layers", hint: "diff & regressions" },
  { view: "datasets", id: "ds_golden", label: "Support QA — Golden", icon: "dataset", hint: "16 records · provenance" },
  { view: "rubrics", label: "Rubric", icon: "ruler", hint: "scoring criteria" },
  { view: "judge", label: "Judge & calibration", icon: "scale", hint: "agreement, panel" },
  { view: "review", label: "Review queue", icon: "review", hint: "triaged by signal" },
  { view: "traces", label: "Online traces", icon: "trace", hint: "prod logs, root-cause" },
  { view: "agentruns", label: "Agent activity", icon: "layers", hint: "audit log" },
  { view: "report", label: "Results report", icon: "dashboard", hint: "first-eval summary" },
  { view: "keys", label: "API keys", icon: "key", hint: "platform + provider" },
  { view: "settings", label: "Org & members", icon: "users", hint: "roles, invites" },
];

function IconRail({ theme, toggleTheme, onHome, onNew, onSignOut, active }) {
  const Item = ({ icon, title, onClick, on }) => (
    <button onClick={onClick} title={title} style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: on ? "var(--accent-text)" : "var(--text-3)", background: on ? "var(--accent-soft)" : "transparent", transition: "all .13s" }}
      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--surface-3)"; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>{window.Icons[icon]({ size: 19 })}</button>
  );
  return <div className="col" style={{ width: 56, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--surface)", alignItems: "center", padding: "12px 0", gap: 4 }}>
    <button onClick={onHome} title="Home" style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>{window.Icons.logo({ size: 19 })}</button>
    <Item icon="plus" title="New session" onClick={onNew} />
    <Item icon="bolt" title="Agent home" onClick={onHome} on={active} />
    <div style={{ flex: 1 }} />
    <Item icon="bell" title="Notifications" onClick={() => {}} />
    <button onClick={toggleTheme} title="Theme" style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{theme === "light" ? window.Icons.moon({ size: 18 }) : window.Icons.sun({ size: 18 })}</button>
    <button onClick={onSignOut} title="Sign out / restart demo" style={{ display: "flex", border: "none", background: "none", padding: 0, cursor: "pointer" }}><Avatar m={DB.ME} size={30} /></button>
  </div>;
}

function CanvasHeader({ route, onOpenPalette, onClose, onPin }) {
  const titleMap = {
    dashboard: "Project overview", experiments: "Experiments", compare: "Experiment diff", datasets: "Datasets",
    rubrics: "Rubric", judge: "Judge & calibration", review: "Review queue", traces: "Online traces", monitor: "Agent monitoring",
    agentruns: "Agent activity", keys: "API keys", settings: "Organization", report: "Results & recommendations",
  };
  return <div className="row" style={{ justifyContent: "space-between", padding: "11px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
    <div className="row gap-2" style={{ fontSize: 12.5, color: "var(--text-3)" }}>
      <span className="row gap-1" style={{ color: "var(--accent-text)" }}>{window.Icons.bolt({ size: 14 })}<span style={{ fontWeight: 600 }}>opened by AutoEval</span></span>
      {window.Icons.chevRight({ size: 13, style: { opacity: 0.5 } })}
      <span style={{ color: "var(--text)", fontWeight: 600 }}>{titleMap[route.view] || route.view}</span>
    </div>
    <div className="row gap-2">
      <button onClick={onOpenPalette} className="row gap-2" style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--text-3)", fontSize: 12 }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--text-faint)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}>
        {window.Icons.search({ size: 13 })}<span>Ask or jump</span><kbd className="mono" style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "var(--surface-3)", border: "1px solid var(--border)" }}>⌘K</kbd>
      </button>
      <button onClick={onClose} title="Close canvas" style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", border: "1px solid var(--border)" }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{window.Icons.x({ size: 16 })}</button>
    </div>
  </div>;
}

function CanvasHome({ openCanvas, onOpenPalette }) {
  const exps = DB.EXPERIMENTS.filter((e) => e.status === "complete");
  return <div style={{ height: "100%", overflowY: "auto" }}>
    <div className="col" style={{ maxWidth: 760, margin: "0 auto", padding: "56px 32px", gap: 28 }}>
      <div className="col gap-2">
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>Workspace</h1>
        <p className="muted" style={{ fontSize: 14 }}>Artifacts the agent opens appear here. Drive everything from the conversation, or jump straight in.</p>
      </div>
      <button onClick={onOpenPalette} className="row gap-3" style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-3)", boxShadow: "var(--shadow-sm)" }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--text-faint)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}>
        {window.Icons.search({ size: 17 })}<span className="grow" style={{ textAlign: "left", fontSize: 13.5 }}>Ask the agent, or jump to anything…</span>
        <kbd className="mono" style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: "var(--surface-3)", border: "1px solid var(--border)" }}>⌘K</kbd>
      </button>
      <div className="col gap-3">
        <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent experiments</div>
        <div className="row gap-3 wrap">
          {exps.slice(0, 3).map((e) => <button key={e.id} onClick={() => openCanvas({ view: "experiments", id: e.id }, true)} className="col gap-2" style={{ flex: 1, minWidth: 200, textAlign: "left", padding: 16, borderRadius: "var(--r-lg)", border: "1px solid var(--border)", background: "var(--surface)", transition: "border-color .13s" }}
            onMouseEnter={(ev) => ev.currentTarget.style.borderColor = "var(--border-strong)"} onMouseLeave={(ev) => ev.currentTarget.style.borderColor = "var(--border)"}>
            <div className="row gap-2" style={{ justifyContent: "space-between" }}>{window.Icons.flask({ size: 16, style: { color: "var(--text-3)" } })}<ScoreBar value={e.summary.overall} w={40} /></div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
            <div className="faint mono" style={{ fontSize: 11 }}>{e.version} · {e.date.split(" ")[0]}</div>
          </button>)}
        </div>
      </div>
      <div className="col gap-3">
        <div className="faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Jump to</div>
        <div className="row gap-2 wrap">
          {DESTS.filter((d) => ["dashboard", "compare", "datasets", "judge", "review", "traces", "agentruns"].includes(d.view)).map((d) => <button key={d.label} onClick={() => openCanvas(d, true)} className="row gap-2" style={{ padding: "9px 13px", borderRadius: 99, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12.5, fontWeight: 500 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-soft-border)"; e.currentTarget.style.background = "var(--accent-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}>
            {window.Icons[d.icon]({ size: 14, style: { color: "var(--text-3)" } })}{d.label}</button>)}
        </div>
      </div>
    </div>
  </div>;
}

function CommandPalette({ open, onClose, openCanvas, onAsk }) {
  const [q, setQ] = useCnS("");
  const inputRef = useCnR(null);
  useCnE(() => { if (open) { setQ(""); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  useCnE(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  const matches = q ? DESTS.filter((d) => (d.label + " " + d.hint + " " + d.view).toLowerCase().includes(q.toLowerCase())) : DESTS;
  const askable = q.trim().length > 0;
  return <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(3px)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12vh 20px", animation: "fadeIn .14s" }}>
    <div onMouseDown={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", width: 560, maxWidth: "100%", boxShadow: "var(--shadow-lg)", overflow: "hidden", animation: "scaleIn .18s cubic-bezier(.22,1,.36,1)" }}>
      <div className="row gap-3" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        {window.Icons.bolt({ size: 18, style: { color: "var(--accent-text)", flexShrink: 0 } })}
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { if (matches.length && !askable) { openCanvas(matches[0], true); onClose(); } else if (askable) { onAsk(q); onClose(); } } }}
          placeholder="Ask the agent, or jump to an artifact…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15 }} />
        <kbd className="mono" style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-3)" }}>esc</kbd>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto", padding: 7 }}>
        {askable && <button onClick={() => { onAsk(q); onClose(); }} className="row gap-3" style={{ width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: "var(--r-md)", background: "var(--accent-soft)", marginBottom: 4 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{window.Icons.send({ size: 15 })}</span>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Ask AutoEval</div><div className="faint" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>“{q}”</div></div>
        </button>}
        {!askable && <div className="faint" style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 10px 4px" }}>Jump to artifact</div>}
        {matches.map((d) => <button key={d.label} onClick={() => { openCanvas(d, true); onClose(); }} className="row gap-3" style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: "var(--r-md)", transition: "background .1s" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-3)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{window.Icons[d.icon]({ size: 15 })}</span>
          <div className="grow" style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</div><div className="faint" style={{ fontSize: 11.5 }}>{d.hint}</div></div>
          {window.Icons.arrowRight({ size: 14, style: { color: "var(--text-faint)" } })}
        </button>)}
        {askable && matches.length === 0 && <div className="faint" style={{ fontSize: 12, padding: "10px 12px" }}>No artifact matches — press Enter to ask the agent.</div>}
      </div>
    </div>
  </div>;
}

window.IconRail = IconRail;
window.CanvasHeader = CanvasHeader;
window.CanvasHome = CanvasHome;
window.CommandPalette = CommandPalette;
