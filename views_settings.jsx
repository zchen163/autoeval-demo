// views_settings.jsx — API Keys, Org & Members, Auth
const { useState: useSS } = React;

// ---------------- Auth ----------------
function AuthView({ onAuth, theme, toggleTheme }) {
  const [mode, setMode] = useSS("login");
  const [email, setEmail] = useSS("mei@northwind.ai");
  const [pw, setPw] = useSS("••••••••••");
  return <div style={{ height: "100%", display: "flex", background: "var(--bg)" }}>
    {/* left brand panel */}
    <div className="col" style={{ width: "46%", padding: 48, justifyContent: "space-between", background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
      <div className="row gap-2"><div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>{window.Icons.logo({ size: 19 })}</div><span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.03em" }}>AutoEval</span></div>
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1 }}>Evaluate your LLM apps with confidence.</h1>
        <p className="muted" style={{ fontSize: 15, marginTop: 16, lineHeight: 1.6 }}>Manage datasets and experiments, run offline and online evals, and close the loop between human review and LLM-as-judge.</p>
        <div className="col gap-3" style={{ marginTop: 28 }}>
          {[["flask", "Compare models, prompts & configs side-by-side"], ["review", "Human review calibrates your automated judge"], ["trace", "Stream production traces in via the SDK"]].map(([ic, t]) =>
            <div key={t} className="row gap-3"><span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{window.Icons[ic]({ size: 16 })}</span><span style={{ fontSize: 13.5, color: "var(--text-2)" }}>{t}</span></div>)}
        </div>
      </div>
      <span className="faint" style={{ fontSize: 12 }}>© 2026 Northwind AI · SOC 2 Type II</span>
    </div>
    {/* right form */}
    <div className="col" style={{ flex: 1, justifyContent: "center", alignItems: "center", position: "relative" }}>
      <button onClick={toggleTheme} style={{ position: "absolute", top: 24, right: 24, width: 34, height: 34, borderRadius: "var(--r-md)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}>{theme === "light" ? window.Icons.moon({ size: 16 }) : window.Icons.sun({ size: 16 })}</button>
      <div style={{ width: 360 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{mode === "login" ? "Sign in" : mode === "signup" ? "Create your org" : "Reset password"}</h2>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 26 }}>{mode === "login" ? "Welcome back. Email login only." : mode === "signup" ? "First user becomes the org Admin." : "We'll email you a reset link."}</p>
        {mode === "signup" && <Field label="Company / Organization"><Input placeholder="Acme Inc." defaultValue="Northwind AI" /></Field>}
        <Field label="Work email"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Field>
        {mode !== "forgot" && <Field label="Password"><Input value={pw} onChange={(e) => setPw(e.target.value)} type="password" /></Field>}
        <Btn variant="primary" full size="lg" style={{ marginTop: 6 }} onClick={() => onAuth(mode === "signup")}>{mode === "login" ? "Sign in" : mode === "signup" ? "Create org & continue" : "Send reset link"}</Btn>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 18, fontSize: 13 }}>
          {mode === "login" ? <>
            <button className="muted" onClick={() => setMode("signup")} style={{ fontWeight: 600 }}>Create org</button>
            <button style={{ color: "var(--accent-text)", fontWeight: 600 }} onClick={() => setMode("forgot")}>Forgot password?</button>
          </> : <button style={{ color: "var(--accent-text)", fontWeight: 600 }} onClick={() => setMode("login")}>← Back to sign in</button>}
        </div>
      </div>
    </div>
  </div>;
}

// ---------------- API Keys ----------------
function NewKeyModal({ open, onClose, onCreate }) {
  const [step, setStep] = useSS("form");
  const [name, setName] = useSS("");
  const fullKey = "ne_live_" + Math.random().toString(36).slice(2, 10) + "9f2c4a8e1b6d3057fa";
  const [copied, setCopied] = useSS(false);
  const close = () => { setStep("form"); setName(""); setCopied(false); onClose(); };
  return <Modal open={open} onClose={close} title={step === "form" ? "Create API key" : "Save your API key"} width={500}
    footer={step === "form"
      ? <><Btn variant="ghost" onClick={close}>Cancel</Btn><Btn variant="primary" disabled={!name} onClick={() => { setStep("reveal"); onCreate(name); }}>Create key</Btn></>
      : <Btn variant="primary" onClick={close}>I've saved it — done</Btn>}>
    {step === "form" ? <>
      <Field label="Key name" hint="A label to recognize where this key is used."><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. prod-ingest" autoFocus /></Field>
      <Field label="Scope"><Select options={[{ value: "ingest", label: "Ingest only — write traces & datasets" }, { value: "full", label: "Full — run evals + ingest" }]} /></Field>
      <div className="row gap-2" style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--warn-soft)", border: "1px solid transparent", fontSize: 12.5 }}>
        {window.Icons.alert({ size: 15, style: { color: "var(--warn)", flexShrink: 0, marginTop: 1 } })}<span style={{ color: "var(--text-2)" }}>The full key is shown <b>only once</b>, right after creation. It's encrypted at rest and can't be retrieved again — only revoked.</span>
      </div>
    </> : <>
      <div className="row gap-2" style={{ padding: "11px 13px", borderRadius: "var(--r-md)", background: "var(--neg-soft)", border: "1px solid transparent", fontSize: 12.5, marginBottom: 14 }}>
        {window.Icons.eyeOff({ size: 16, style: { color: "var(--neg)", flexShrink: 0, marginTop: 1 } })}<span style={{ color: "var(--text-2)" }}>Copy this now. For security, <b>you won't be able to see it again.</b> If lost, revoke and create a new one.</span>
      </div>
      <div className="row gap-2" style={{ padding: "12px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--bg-inset)" }}>
        <code className="mono" style={{ fontSize: 12.5, flex: 1, wordBreak: "break-all", color: "var(--text)" }}>{fullKey}</code>
        <Btn size="sm" variant={copied ? "soft" : "default"} icon={copied ? "check" : "copy"} onClick={() => { navigator.clipboard?.writeText(fullKey); setCopied(true); }}>{copied ? "Copied" : "Copy"}</Btn>
      </div>
    </>}
  </Modal>;
}

function KeysView({ push }) {
  const db = useDB();
  const keys = db.API_KEYS;
  const [showNew, setShowNew] = useSS(false);
  const isAdmin = DB.ME.role === "Admin";
  const providerKeys = [
    { provider: "OpenAI", family: "OpenAI", use: "Judge (gpt-4o)", status: "set", hue: 155 },
    { provider: "Anthropic", family: "Anthropic", use: "Judge panel (claude-3.5)", status: "set", hue: 35 },
    { provider: "Google", family: "Google", use: "Judge panel (gemini-1.5)", status: "missing", hue: 230 },
  ];
  return <div className="col gap-5">
    <PageHead title="API keys" sub="Platform keys authenticate the SDK and eval runner. Provider keys run the eval itself (the tested agent + judges)."
      crumbs={[{ label: DB.ORG.name }, { label: "API keys" }]}
      actions={isAdmin ? <Btn variant="primary" icon="plus" onClick={() => setShowNew(true)}>Create key</Btn> : null} />

    {/* billing boundary explainer */}
    <div className="row gap-3" style={{ padding: "12px 15px", borderRadius: "var(--r-lg)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      {window.Icons.info({ size: 17, style: { color: "var(--accent-text)", flexShrink: 0, marginTop: 1 } })}
      <div style={{ fontSize: 12.5, lineHeight: 1.55 }}><b>Who pays for what.</b> The Eval Agents (AutoEval, Rubric, Dataset, Triage) think on the <b>platform model — we cover that</b>, no key needed. The eval they orchestrate — your agent's generation + the judges' scoring — runs on <b>your provider keys below</b>.</div>
    </div>
    {!isAdmin && <div className="row gap-2" style={{ padding: "10px 14px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12.5 }}>{window.Icons.info({ size: 15, style: { color: "var(--text-3)" } })}<span className="muted">Only Admins can create or revoke keys. You can view the masked list.</span></div>}

    <div className="col gap-2">
      <h3 style={{ fontSize: 14, fontWeight: 700 }}>Platform keys <span className="faint" style={{ fontWeight: 400, fontSize: 12.5 }}>· SDK ingest + eval runner · shown once at creation</span></h3>
    </div>
    <Card pad={0}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {["Name", "Key", "Scope", "Created by", "Last used", ""].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{h}</th>)}
        </tr></thead>
        <tbody>{keys.map((k, i) => <tr key={k.id}>
          <td style={{ padding: "13px 16px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none", fontWeight: 600, fontSize: 13.5 }}><div className="row gap-2">{window.Icons.key({ size: 15, style: { color: "var(--text-3)" } })}{k.name}</div></td>
          <td style={{ padding: "13px 16px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none" }}><span className="mono" style={{ fontSize: 12.5, color: "var(--text-2)" }}>{k.prefix}<span className="faint">••••••••••••</span></span></td>
          <td style={{ padding: "13px 16px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none" }}><Badge tone={k.scope === "full" ? "accent" : "neutral"}>{k.scope}</Badge></td>
          <td style={{ padding: "13px 16px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none" }} className="muted">{k.creator}</td>
          <td style={{ padding: "13px 16px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none", fontSize: 12 }} className="mono faint">{k.lastUsed}</td>
          <td style={{ padding: "13px 16px", borderBottom: i < keys.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right" }}>
            {isAdmin && <Btn size="sm" variant="danger" onClick={() => { Store.revokeKey(k.id); push("Key revoked", "neg"); }}>Revoke</Btn>}
          </td>
        </tr>)}</tbody>
      </table>
    </Card>
    <NewKeyModal open={showNew} onClose={() => setShowNew(false)} onCreate={(name) => Store.addKey({ name, prefix: "ne_live_" + Math.random().toString(36).slice(2, 6) })} />

    <div className="col gap-2" style={{ marginTop: 6 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700 }}>Provider keys <span className="faint" style={{ fontWeight: 400, fontSize: 12.5 }}>· run the tested agent + judges · billed to you</span></h3>
    </div>
    <Card pad={0}>
      {providerKeys.map((p, i) => <div key={p.provider} className="row gap-3" style={{ padding: "13px 16px", borderBottom: i < providerKeys.length - 1 ? "1px solid var(--border)" : "none", justifyContent: "space-between" }}>
        <div className="row gap-3"><span style={{ width: 9, height: 9, borderRadius: 99, background: `oklch(0.6 0.15 ${p.hue})` }} /><div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.provider}</div><div className="faint" style={{ fontSize: 11.5, marginTop: 1 }}>{p.use}</div></div></div>
        {p.status === "set"
          ? <div className="row gap-3"><span className="mono faint" style={{ fontSize: 12 }}>sk-•••••••••••</span><Badge tone="pos" dot>connected</Badge></div>
          : <div className="row gap-3"><Badge tone="warn" dot>not set</Badge>{isAdmin && <Btn size="sm" variant="soft" onClick={() => push("Add Google key to enable the 3rd panel judge", "neutral")}>Add key</Btn>}</div>}
      </div>)}
      <div className="row gap-2" style={{ padding: "10px 16px", background: "var(--warn-soft)", fontSize: 12 }}>{window.Icons.alert({ size: 14, style: { color: "var(--warn)", flexShrink: 0 } })}<span style={{ color: "var(--text-2)" }}>Your judge panel includes <b>gemini-1.5-pro</b> but no Google key is set — that judge is paused until you add one.</span></div>
    </Card>
  </div>;
}

// ---------------- Org & Members ----------------
function SettingsView({ push }) {
  const db = useDB();
  const members = db.MEMBERS;
  const [showInvite, setShowInvite] = useSS(false);
  const [email, setEmail] = useSS("");
  const [role, setRole] = useSS("Member");
  const isAdmin = DB.ME.role === "Admin";
  return <div className="col gap-5">
    <PageHead title="Organization" sub="Members can only see data within this organization. The data isolation boundary is the org."
      crumbs={[{ label: DB.ORG.name }, { label: "Members" }]}
      actions={isAdmin ? <Btn variant="primary" icon="plus" onClick={() => setShowInvite(true)}>Invite member</Btn> : null} />

    <div className="row gap-4 wrap">
      <Card style={{ flex: 1, minWidth: 200 }}><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Organization</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{DB.ORG.name}</div><div className="faint mono" style={{ fontSize: 11.5, marginTop: 2 }}>{DB.ORG.id}</div></Card>
      <Card style={{ flex: 1, minWidth: 200 }}><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Plan</div><div className="row gap-2" style={{ marginTop: 6, alignItems: "baseline" }}><span style={{ fontSize: 18, fontWeight: 700 }}>{DB.ORG.plan}</span><Badge tone="accent">100 free traces/mo</Badge></div></Card>
      <Card style={{ flex: 1, minWidth: 200 }}><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Members</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{members.filter((m) => m.status === "active").length} active</div><div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{members.filter((m) => m.status === "invited").length} invited</div></Card>
    </div>

    <Card pad={0}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {["Member", "Email", "Role", "Status", "Joined", ""].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{h}</th>)}
        </tr></thead>
        <tbody>{members.map((m, i) => <tr key={m.id}>
          <td style={{ padding: "12px 16px", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none" }}><div className="row gap-2"><Avatar m={m} size={28} /><span style={{ fontWeight: 600, fontSize: 13.5 }}>{m.name}{m.id === DB.ME.id && <span className="faint" style={{ fontWeight: 400 }}> (you)</span>}</span></div></td>
          <td style={{ padding: "12px 16px", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none", fontSize: 12.5 }} className="mono muted">{m.email}</td>
          <td style={{ padding: "12px 16px", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none" }}>
            {isAdmin && m.id !== DB.ME.id ? <Select value={m.role} onChange={(e) => { Store.setMemberRole(m.id, e.target.value); push("Role updated", "pos"); }} options={["Admin", "Member"]} style={{ width: 110, height: 30 }} /> : <Badge tone={m.role === "Admin" ? "accent" : "neutral"}>{m.role}</Badge>}
          </td>
          <td style={{ padding: "12px 16px", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none" }}><StatusBadge status={m.status} /></td>
          <td style={{ padding: "12px 16px", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none", fontSize: 12 }} className="mono faint">{m.joined}</td>
          <td style={{ padding: "12px 16px", borderBottom: i < members.length - 1 ? "1px solid var(--border)" : "none", textAlign: "right" }}>{isAdmin && m.id !== DB.ME.id && <Btn size="sm" variant="danger" onClick={() => { Store.removeMember(m.id); push("Member removed", "neg"); }}>Remove</Btn>}</td>
        </tr>)}</tbody>
      </table>
    </Card>

    <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite member" sub="They'll get an email invite to join this org."
      footer={<><Btn variant="ghost" onClick={() => setShowInvite(false)}>Cancel</Btn><Btn variant="primary" disabled={!email.includes("@")} onClick={() => { Store.addMember({ name: email.split("@")[0], email, role, initials: email.slice(0, 2).toUpperCase() }); setShowInvite(false); setEmail(""); push("Invite sent", "pos"); }}>Send invite</Btn></>}>
      <Field label="Email address"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@northwind.ai" type="email" autoFocus /></Field>
      <Field label="Role"><Select value={role} onChange={(e) => setRole(e.target.value)} options={["Member", "Admin"]} /></Field>
    </Modal>
  </div>;
}

window.AuthView = AuthView;
window.KeysView = KeysView;
window.SettingsView = SettingsView;
