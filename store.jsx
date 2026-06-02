// store.jsx — tiny reactive layer over window.DB so create/edit/update flows reflect live
(function () {
  const subs = new Set();
  let version = 0;
  const notify = () => { version++; subs.forEach((fn) => fn(version)); };

  // unique-ish id helper
  const uid = (p) => p + Math.random().toString(36).slice(2, 6);

  const Store = {
    get version() { return version; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    notify,

    // ---------- Datasets ----------
    addDataset({ name, source }) {
      const d = {
        id: uid("ds_"), name: name || "Untitled dataset", version: "v1",
        versions: [{ v: "v1", date: "2026-05-30", records: 0, note: "Created", author: DB.ME.name }],
        records: [], recordCount: 0, source: source || "Hand-curated", updated: "2026-05-30",
      };
      DB.DATASETS.unshift(d); notify(); return d;
    },
    addRecord(dsId, rec) {
      const d = DB.DATASETS.find((x) => x.id === dsId); if (!d) return;
      d.records.push({ id: uid("rec_"), provenance: "human", topic: "General", ...rec });
      d.recordCount = d.records.length; notify();
    },
    removeRecord(dsId, recId) {
      const d = DB.DATASETS.find((x) => x.id === dsId); if (!d) return;
      d.records = d.records.filter((r) => r.id !== recId); d.recordCount = d.records.length; notify();
    },
    snapshotVersion(dsId, note) {
      const d = DB.DATASETS.find((x) => x.id === dsId); if (!d) return;
      const nextN = d.versions.length + 1; const v = "v" + nextN;
      d.versions.unshift({ v, date: "2026-05-30", records: d.records.length || d.recordCount, note: note || "Snapshot", author: DB.ME.name });
      d.version = v; d.updated = "2026-05-30"; notify();
    },

    // ---------- Rubrics ----------
    addRubric({ name }) {
      const r = { id: uid("rub_"), name: name || "Untitled rubric", updated: "2026-05-30",
        criteria: [{ key: uid("c_"), name: "New criterion", type: "1-5", desc: "Describe what this measures.", weight: 1 }] };
      Store.normalizeWeights(r); DB.RUBRICS.push(r); notify(); return r;
    },
    updateRubric(id, patch) {
      const r = DB.RUBRICS.find((x) => x.id === id); if (!r) return;
      Object.assign(r, patch); r.updated = "2026-05-30"; notify();
    },
    saveRubricCriteria(id, criteria) {
      const r = DB.RUBRICS.find((x) => x.id === id); if (!r) return;
      r.criteria = criteria; r.updated = "2026-05-30"; Store.normalizeWeights(r); notify();
    },
    deleteRubric(id) {
      const i = DB.RUBRICS.findIndex((x) => x.id === id); if (i < 0) return;
      DB.RUBRICS.splice(i, 1); notify();
    },
    normalizeWeights(r) {
      const sum = r.criteria.reduce((s, c) => s + (+c.weight || 0), 0) || 1;
      r.criteria.forEach((c) => { c.weight = +((+c.weight || 0) / sum).toFixed(2); });
    },

    // ---------- Experiments ----------
    addExperiment(def) {
      const e = DB.makeExperiment({ status: "running", progress: 0.05, date: "2026-05-30 10:00", ...def, id: uid("exp_") });
      DB.EXPERIMENTS.unshift(e); notify(); return e;
    },
    // flip a running experiment to complete with real generated scores
    completeExperiment(id, def) {
      const i = DB.EXPERIMENTS.findIndex((x) => x.id === id); if (i < 0) return;
      const prev = DB.EXPERIMENTS[i];
      DB.EXPERIMENTS[i] = DB.makeExperiment({ ...prev, ...def, id, status: "complete", progress: 1, dur: prev.dur });
      notify();
    },
    setProgress(id, p) {
      const e = DB.EXPERIMENTS.find((x) => x.id === id); if (!e) return;
      e.progress = p; notify();
    },

    // ---------- Members / keys ----------
    addMember(m) { DB.MEMBERS.push({ id: uid("u_"), status: "invited", role: "Member", joined: "2026-05-30", hue: 300, ...m }); notify(); },
    removeMember(id) { const i = DB.MEMBERS.findIndex((x) => x.id === id); if (i >= 0) { DB.MEMBERS.splice(i, 1); notify(); } },
    setMemberRole(id, role) { const m = DB.MEMBERS.find((x) => x.id === id); if (m) { m.role = role; notify(); } },
    addKey(k) { DB.API_KEYS.unshift({ id: uid("k_"), created: "2026-05-30", lastUsed: "never", creator: DB.ME.name, scope: "ingest", ...k }); notify(); },
    revokeKey(id) { const i = DB.API_KEYS.findIndex((x) => x.id === id); if (i >= 0) { DB.API_KEYS.splice(i, 1); notify(); } },
  };

  // hook: subscribe a component to store changes
  function useDB() {
    const [, force] = React.useState(0);
    React.useEffect(() => Store.subscribe(() => force((n) => n + 1)), []);
    return window.DB;
  }

  window.Store = Store;
  window.useDB = useDB;
})();
