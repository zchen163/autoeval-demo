// views_data.jsx — Datasets (versioning, export) + Rubrics
const { useState: useDtS } = React;

function DatasetsList({ go, push }) {
  const db = useDB();
  const [showNew, setShowNew] = useDtS(false);
  const [dsName, setDsName] = useDtS("");
  const [dsSource, setDsSource] = useDtS("Hand-curated");
  const create = () => { const d = Store.addDataset({ name: dsName || "Untitled dataset", source: dsSource }); setShowNew(false); setDsName(""); push("Dataset created", "pos"); go({ view: "datasets", id: d.id }); };
  return <div className="col gap-5">
    <PageHead title="Datasets" sub="Versioned eval-record collections. Build manually, write via SDK, or let the Dataset Agent mine + synthesize."
      crumbs={[{ label: DB.PROJECT.name }, { label: "Datasets" }]}
      actions={<><Btn variant="soft" icon="bolt" onClick={() => go({ view: "copilot" })}>Dataset Agent</Btn><Btn variant="primary" icon="plus" onClick={() => setShowNew(true)}>New dataset</Btn></>} />
    <div className="row gap-4 wrap">
      {db.DATASETS.map((d) => {
        const count = d.records.length || d.recordCount;
        return <Card key={d.id} pad={0} style={{ width: "calc(33.333% - 11px)", minWidth: 260, cursor: "pointer", transition: "border-color .14s, box-shadow .14s" }}
          onClick={() => go({ view: "datasets", id: d.id })}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
          <div style={{ padding: 16 }}>
            <div className="row gap-2" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>{window.Icons.dataset({ size: 18 })}</div>
              <Badge tone="neutral">{d.version}</Badge>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.name}</div>
            <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>{d.source}</div>
          </div>
          <div className="row" style={{ justifyContent: "space-between", padding: "11px 16px", borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
            <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{count} <span className="faint">records</span></span>
            <span className="mono faint" style={{ fontSize: 11.5 }}>{d.updated}</span>
          </div>
        </Card>;
      })}
    </div>
    <Modal open={showNew} onClose={() => setShowNew(false)} title="New dataset" sub="Create empty, or write records via the SDK"
      footer={<><Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn><Btn variant="primary" disabled={!dsName.trim()} onClick={create}>Create</Btn></>}>
      <Field label="Name"><Input value={dsName} onChange={(e) => setDsName(e.target.value)} placeholder="e.g. Support QA — Golden" autoFocus /></Field>
      <Field label="Source"><Select value={dsSource} onChange={(e) => setDsSource(e.target.value)} options={["Hand-curated", "SDK online trace sampling", "Imported JSON / CSV"]} /></Field>
      <div className="col gap-2" style={{ padding: "12px 14px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Or write remotely via SDK</span>
        <code className="mono" style={{ fontSize: 11.5, color: "var(--accent-text)", lineHeight: 1.6, display: "block" }}>client.datasets.insert(<br />&nbsp;&nbsp;"<span style={{ color: "var(--text-2)" }}>support-qa-golden</span>",<br />&nbsp;&nbsp;records=[...])</code>
      </div>
    </Modal>
  </div>;
}

function DatasetDetail({ id, go, push }) {
  const db = useDB();
  const d = db.DATASETS.find((x) => x.id === id);
  const [tab, setTab] = useDtS("records");
  const [showAdd, setShowAdd] = useDtS(false);
  const [rec, setRec] = useDtS({ input: "", expected: "", topic: "General" });
  if (!d) return <Empty title="Dataset not found" />;
  const hasRecords = d.records.length > 0;
  const addRec = () => { Store.addRecord(d.id, rec); setRec({ input: "", expected: "", topic: "General" }); setShowAdd(false); push("Record added", "pos"); };
  const canManage = d.source !== "SDK online trace sampling";
  return <div className="col gap-5">
    <PageHead title={d.name}
      crumbs={[{ label: "Datasets", onClick: () => go({ view: "datasets" }) }, { label: d.name }]}
      actions={<>{canManage && <Btn variant="default" icon="layers" onClick={() => { Store.snapshotVersion(d.id, "Manual snapshot"); push("Saved version " + d.version, "pos"); }}>Snapshot</Btn>}{canManage && <Btn variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Add record</Btn>}<Btn variant="default" icon="download" onClick={() => push("Exported records.json", "pos")}>Export</Btn></>}
      tabs={[{ id: "records", label: "Records", count: d.records.length || d.recordCount }, { id: "versions", label: "Versions", count: d.versions.length }, { id: "summary", label: "Summary" }]} tab={tab} onTab={setTab} />

    <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add record" sub={"to " + d.name} width={520}
      footer={<><Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn><Btn variant="primary" disabled={!rec.input.trim() || !rec.expected.trim()} onClick={addRec}>Add record</Btn></>}>
      <Field label="Input"><Input value={rec.input} onChange={(e) => setRec((r) => ({ ...r, input: e.target.value }))} placeholder="The user's question…" autoFocus /></Field>
      <Field label="Expected output (reference)"><textarea value={rec.expected} onChange={(e) => setRec((r) => ({ ...r, expected: e.target.value }))} rows={3} placeholder="The correct answer the agent should give." style={{ padding: "9px 11px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--surface)", outline: "none", fontSize: 13, resize: "vertical", lineHeight: 1.5, fontFamily: "var(--font-sans)", width: "100%" }} /></Field>
      <Field label="Topic"><Input value={rec.topic} onChange={(e) => setRec((r) => ({ ...r, topic: e.target.value }))} placeholder="e.g. Billing" /></Field>
    </Modal>

    {tab === "records" && (hasRecords ? <Card pad={0}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {["Record", "Input", "Expected output", "Provenance", "Topic", ""].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{h}</th>)}
        </tr></thead>
        <tbody>{d.records.map((r) => <tr key={r.id} style={{ transition: "background .12s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)" }} className="mono faint">{r.id}</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", fontSize: 13, maxWidth: 260 }}>{r.input}</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-2)", maxWidth: 360 }}>{r.expected}</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>{r.provenance ? <ProvBadge kind={r.provenance} sm /> : null}</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)" }}><Topic name={r.topic} /></td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", width: 40 }}>{canManage && <button onClick={() => { Store.removeRecord(d.id, r.id); push("Record removed", "neg"); }} title="Remove" style={{ color: "var(--text-faint)", display: "flex" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--neg)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-faint)"}>{window.Icons.trash({ size: 14 })}</button>}</td>
        </tr>)}</tbody>
      </table>
    </Card> : (canManage ? <Card><Empty icon="dataset" title="No records yet" sub="Add eval records by hand, or write them via the SDK." action={<Btn variant="primary" icon="plus" onClick={() => setShowAdd(true)}>Add first record</Btn>} /></Card> : <Card><Empty icon="trace" title="Records live in the SDK pipeline" sub={`${d.recordCount} records were written remotely via the SDK and sampled from production traces.`} /></Card>))}

    {tab === "versions" && <Card pad={0}>
      {d.versions.map((v, i) => <div key={v.v} className="row gap-3" style={{ padding: "14px 18px", borderBottom: i < d.versions.length - 1 ? "1px solid var(--border)" : "none", justifyContent: "space-between" }}>
        <div className="row gap-3">
          <div className="col" style={{ alignItems: "center", width: 40 }}>
            <Badge tone={i === 0 ? "accent" : "neutral"}>{v.v}</Badge>
            {i === 0 && <span className="faint" style={{ fontSize: 9.5, marginTop: 3, fontWeight: 700, textTransform: "uppercase" }}>current</span>}
          </div>
          <div><div style={{ fontSize: 13.5, fontWeight: 500 }}>{v.note}</div><div className="faint mono" style={{ fontSize: 11.5, marginTop: 2 }}>{v.records} records · {v.author} · {v.date}</div></div>
        </div>
        <div className="row gap-2">{i !== 0 && <Btn size="sm" variant="ghost">Restore</Btn>}<Btn size="sm" variant="default">View diff</Btn></div>
      </div>)}
    </Card>}

    {tab === "summary" && <div className="row gap-4 wrap">
      <Card style={{ flex: 1, minWidth: 200 }}><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Total records</div><div className="mono" style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{d.records.length || d.recordCount}</div></Card>
      {d.provenanceMix && <Card style={{ flex: 1, minWidth: 220 }}>
        <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>Provenance</div>
        <div className="col gap-2">
          {Object.entries(d.provenanceMix).map(([k, n]) => <div key={k} className="row gap-2" style={{ justifyContent: "space-between" }}><ProvBadge kind={k} sm /><span className="mono faint" style={{ fontSize: 12 }}>{n}</span></div>)}
        </div>
        <p className="faint" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.45 }}>Synthetic records were generated with a different model family than the agent under test, and are flagged so they can be analyzed separately.</p>
      </Card>}
      <Card style={{ flex: 2, minWidth: 280 }}>
        <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>Topic distribution</div>
        {hasRecords ? Object.entries(d.records.reduce((a, r) => { a[r.topic] = (a[r.topic] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([t, n]) => {
          const pct = (n / d.records.length) * 100;
          return <div key={t} className="row gap-3" style={{ marginBottom: 9 }}>
            <span style={{ width: 70, fontSize: 12.5 }}>{t}</span>
            <div style={{ flex: 1, height: 8, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99 }} /></div>
            <span className="mono faint" style={{ fontSize: 12, width: 24, textAlign: "right" }}>{n}</span>
          </div>;
        }) : <span className="faint" style={{ fontSize: 13 }}>Summary computed nightly for SDK datasets.</span>}
      </Card>
    </div>}
  </div>;
}

function DatasetsView(props) {
  if (props.route.id) return <DatasetDetail id={props.route.id} {...props} />;
  return <DatasetsList {...props} />;
}

// ---------------- Rubrics ----------------
function typeBadge(type) {
  const m = { "0-1": ["accent", "0 – 1"], "1-5": ["accent", "1 – 5"], "pass/fail": ["neutral", "pass / fail"] };
  const [tone, l] = m[type] || ["neutral", type];
  return <Badge tone={tone}>{l}</Badge>;
}
function RubricsView({ go, push }) {
  const db = useDB();
  const [active, setActive] = useDtS(DB.RUBRICS[0].id);
  const [editing, setEditing] = useDtS(null); // null=closed, 'new', or rubric obj
  const [agentFlow, setAgentFlow] = useDtS(false);
  const [suggApplied, setSuggApplied] = useDtS([]);
  const r = db.RUBRICS.find((x) => x.id === active) || db.RUBRICS[0];

  // agent suggestions derived from this week's prod logs
  const SUGG = [
    { id: "sg1", kind: "add", name: "Refund-policy compliance", type: "pass/fail", why: "12 new logs this week gave refund guidance without the approved disclaimer — a pattern your current rubric doesn't score.", evidence: "12 logs · Billing" },
    { id: "sg2", kind: "modify", name: "Groundedness", why: "Groundedness drifted down 6pp on API questions; tighten the wording to require a cited source on every factual claim.", evidence: "API cluster · −6pp" },
    { id: "sg3", kind: "add", name: "Latency within budget", type: "pass/fail", why: "p90 latency crept to 2.3s; add a pass/fail so slow responses are caught by the eval, not just dashboards.", evidence: "latency dist." },
  ];
  const openSugg = SUGG.filter((s) => !suggApplied.includes(s.id));
  const applySugg = (s) => {
    setSuggApplied((a) => [...a, s.id]);
    const target = db.RUBRICS.find((x) => x.id === "rub_rag") || db.RUBRICS[0];
    if (s.kind === "add") { Store.saveRubricCriteria(target.id, [...target.criteria, { key: "sg_" + s.id, name: s.name, type: s.type, desc: s.why, weight: 0.15 }]); setActive(target.id); push("Added “" + s.name + "” to " + target.name, "pos"); }
    else { Store.updateRubric(target.id, {}); setActive(target.id); push("Updated “" + s.name + "” wording", "pos"); }
  };

  const onSave = (data) => {
    if (editing === "new") { const nr = Store.addRubric({ name: data.name }); Store.saveRubricCriteria(nr.id, data.criteria); setActive(nr.id); push("Rubric created", "pos"); }
    else { Store.updateRubric(editing.id, { name: data.name }); Store.saveRubricCriteria(editing.id, data.criteria); push("Rubric saved", "pos"); }
    setEditing(null);
  };
  const onAgentCreate = (data) => { const nr = Store.addRubric({ name: data.name }); Store.saveRubricCriteria(nr.id, data.criteria); setActive(nr.id); };
  const onDelete = () => {
    if (db.RUBRICS.length <= 1) { push("Keep at least one rubric", "neg"); return; }
    const id = r.id; Store.deleteRubric(id); setActive(db.RUBRICS.find((x) => x.id !== id).id); push("Rubric deleted", "neg");
  };

  return <div className="col gap-5">
    <PageHead title="Rubrics" sub="Scoring standards per project, shared by judge and human reviewers. Write them by hand, or let the Rubric Agent discover criteria from real failures."
      crumbs={[{ label: DB.PROJECT.name }, { label: "Rubrics" }]}
      actions={<><Btn variant="soft" icon="bolt" onClick={() => setAgentFlow(true)}>Rubric Agent</Btn><Btn variant="primary" icon="plus" onClick={() => setEditing("new")}>New rubric</Btn></>} />

    {/* agent suggestions from this week's prod logs */}
    {openSugg.length > 0 && <Card pad={0} style={{ borderColor: "var(--accent-soft-border)" }}>
      <div className="row gap-2" style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
        <div className="row gap-2"><AgentAvatar id="rubric" size={22} /><span style={{ fontSize: 13.5, fontWeight: 700 }}>Suggested updates from this week's logs</span><Badge tone="accent">{openSugg.length}</Badge></div>
        <span className="faint" style={{ fontSize: 11.5 }}>based on 73 sampled logs · past 7 days</span>
      </div>
      <div className="col">{openSugg.map((s, i) => <div key={s.id} className="row gap-3" style={{ padding: "12px 16px", borderBottom: i < openSugg.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
        <Badge tone={s.kind === "add" ? "pos" : "warn"} style={{ flexShrink: 0, marginTop: 1 }}>{s.kind === "add" ? "+ add" : "modify"}</Badge>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row gap-2"><span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</span>{s.type && <Badge tone="neutral">{s.type}</Badge>}<span className="mono faint" style={{ fontSize: 10.5, marginLeft: "auto" }}>{s.evidence}</span></div>
          <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>{s.why}</div>
        </div>
        <div className="row gap-2" style={{ flexShrink: 0 }}><Btn size="sm" variant="ghost" onClick={() => setSuggApplied((a) => [...a, s.id])}>Dismiss</Btn><Btn size="sm" variant="primary" icon="check" onClick={() => applySugg(s)}>{s.kind === "add" ? "Add" : "Apply"}</Btn></div>
      </div>)}</div>
    </Card>}
    <div className="row gap-5" style={{ alignItems: "flex-start" }}>
      <div className="col gap-2" style={{ width: 240, flexShrink: 0 }}>
        {db.RUBRICS.map((rb) => <button key={rb.id} onClick={() => setActive(rb.id)} style={{
          textAlign: "left", padding: "12px 14px", borderRadius: "var(--r-md)", border: `1px solid ${active === rb.id ? "var(--accent-soft-border)" : "var(--border)"}`,
          background: active === rb.id ? "var(--accent-soft)" : "var(--surface)", transition: "all .13s",
        }}>
          <div className="row gap-2"><span style={{ color: active === rb.id ? "var(--accent-text)" : "var(--text-3)" }}>{window.Icons.ruler({ size: 16 })}</span><span style={{ fontSize: 13.5, fontWeight: 600 }}>{rb.name}</span></div>
          <div className="faint mono" style={{ fontSize: 11, marginTop: 4 }}>{rb.criteria.length} dims · upd {rb.updated}</div>
        </button>)}
      </div>
      <Card style={{ flex: 1 }} pad={0}>
        <div className="row" style={{ justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div><h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{r.name}</h3><p className="faint" style={{ fontSize: 12, marginTop: 2 }}>Used by judge + human review · {r.id}</p></div>
          <div className="row gap-2"><Btn size="sm" variant="danger" icon="trash" onClick={onDelete}>Delete</Btn><Btn size="sm" variant="default" icon="sliders" onClick={() => setEditing(r)}>Edit</Btn></div>
        </div>
        {r.id === "rub_rag" && <div className="row gap-2" style={{ padding: "9px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
          <AgentAvatar id="rubric" size={20} /><span className="muted">Drafted by Rubric Agent from failure clusters · <b style={{ color: "var(--text-2)" }}>approved by Mei Lin</b> on 2026-05-26</span>
          <AutonomyBadge level="draft" />
        </div>}
        {r.criteria.map((c, i) => <div key={c.key} className="row gap-4" style={{ padding: "16px 20px", borderBottom: i < r.criteria.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="row gap-2" style={{ marginBottom: 4 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>{typeBadge(c.type)}</div>
            <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{c.desc}</p>
          </div>
          <div className="col" style={{ alignItems: "flex-end", width: 90 }}>
            <span className="faint" style={{ fontSize: 11 }}>weight</span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{(c.weight * 100).toFixed(0)}%</span>
          </div>
        </div>)}
      </Card>
    </div>
    <RubricEditor open={!!editing} rubric={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={onSave} push={push} />
    <RubricAgentFlow open={agentFlow} onClose={() => setAgentFlow(false)} onCreate={onAgentCreate} push={push} />
  </div>;
}

window.DatasetsView = DatasetsView;
window.RubricsView = RubricsView;
