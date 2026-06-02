// agents_data.jsx — agent-native layer added on top of DB (PRD v0.2)
(function () {
  const DB = window.DB;

  // ---- Agent identities ----
  const AGENTS = {
    copilot: { id: "copilot", name: "Eval Copilot", role: "Orchestrator", icon: "bolt", hue: 265, blurb: "Understands intent, orchestrates the expert agents + primitives." },
    rubric: { id: "rubric", name: "Rubric Agent", role: "Criteria", icon: "ruler", hue: 200, blurb: "Drafts & refines rubrics; discovers criteria from real failures." },
    dataset: { id: "dataset", name: "Dataset Agent", role: "Data", icon: "dataset", hue: 155, blurb: "Synthesizes + mines datasets with provenance." },
    triage: { id: "triage", name: "Triage Agent", role: "Logs", icon: "trace", hue: 35, blurb: "Clusters prod logs, pre-scores, routes the high-signal 2% to humans." },
  };

  // ---- Autonomy levels ----
  const AUTONOMY = {
    suggest: { id: "suggest", label: "Suggest", desc: "Agent advises, human executes", tone: "neutral" },
    draft: { id: "draft", label: "Draft → review", desc: "Agent drafts, human approves/edits", tone: "accent" },
    auto: { id: "auto", label: "Auto + review", desc: "Agent runs, output reviewable & reversible", tone: "warn" },
  };

  // ---- Failure clusters (Triage Agent output over prod traces) ----
  const CLUSTERS = [
    { id: "cl_refund", label: "Refund — missing order-number confirmation", intent: "Refund", count: 38, failRate: 0.61, sev: "high", sample: "Can I get a refund for last month?", why: "Agent issues refund guidance without confirming the order ID first; violates support policy." },
    { id: "cl_api", label: "API — out-of-scope capability claims", intent: "API", count: 24, failRate: 0.42, sev: "high", sample: "Does the API support GraphQL?", why: "Hallucinated support for features not in retrieved docs." },
    { id: "cl_multi", label: "Multi-turn — context dropped after 3 turns", intent: "Mixed", count: 19, failRate: 0.37, sev: "med", sample: "…and what about the other workspace?", why: "Loses earlier entities in long conversations; answers the wrong workspace." },
    { id: "cl_admin", label: "Admin — destructive actions under-confirmed", intent: "Admin", count: 11, failRate: 0.29, sev: "med", sample: "How do I delete my whole workspace?", why: "Explains deletion without surfacing the irreversible-action warning." },
    { id: "cl_tone", label: "Tone — overly verbose on simple asks", intent: "Mixed", count: 27, failRate: 0.14, sev: "low", sample: "What's your uptime SLA?", why: "Adds tangential info on one-line questions." },
  ];

  // ---- Provenance for dataset records ----
  const PROVENANCE = {
    human: { label: "human", tone: "accent", icon: "user" },
    mined: { label: "mined-from-prod", tone: "warn", icon: "trace" },
    synthetic: { label: "synthetic", tone: "neutral", icon: "bolt" },
  };
  // assign provenance to golden dataset records deterministically
  const provOrder = ["human", "human", "mined", "synthetic", "human", "mined", "synthetic", "human", "mined", "synthetic", "human", "mined", "human", "synthetic", "mined", "human"];
  DB.DATASETS[0].records.forEach((r, i) => { r.provenance = provOrder[i % provOrder.length]; });
  DB.DATASETS[0].provenanceMix = { human: 7, mined: 5, synthetic: 4 };

  // ---- Judge panel + calibration ----
  const JUDGES = [
    { id: "j_oai", name: "gpt-4o", family: "OpenAI", agreement: 0.91, status: "calibrated", note: "Reference-based, rationale on" },
    { id: "j_anth", name: "claude-3.5-sonnet", family: "Anthropic", agreement: 0.88, status: "calibrated", note: "Cross-family vs tested agent" },
    { id: "j_goog", name: "gemini-1.5-pro", family: "Google", agreement: 0.74, status: "needs-work", note: "Below 0.80 threshold" },
  ];
  const CALIBRATION = {
    threshold: 0.80,
    goldenCount: 30,
    testedFamily: "OpenAI", // the agent under test uses an OpenAI model internally
    rounds: [
      { round: 1, change: "Initial judge prompt from rubric", agreement: { j_oai: 0.71, j_anth: 0.76, j_goog: 0.62 } },
      { round: 2, change: "Added 3 few-shot golden examples", agreement: { j_oai: 0.84, j_anth: 0.83, j_goog: 0.69 } },
      { round: 3, change: "Tightened faithfulness wording + reference-based", agreement: { j_oai: 0.91, j_anth: 0.88, j_goog: 0.74 } },
    ],
    disagreements: [
      { rec: "rec_004", q: "Why am I getting rate-limited on the API?", human: 0.45, judge: 0.78, note: "Judge over-credits a hallucinated retry detail" },
      { rec: "rec_013", q: "Why didn't my automation trigger?", human: 0.90, judge: 0.62, note: "Judge penalized correct but terse answer" },
      { rec: "rec_002", q: "Team vs Business plans?", human: 0.85, judge: 0.55, note: "Judge missed that all claims were grounded" },
    ],
  };

  // ---- triage pre-scores on review items (high signal first) ----
  const TRIAGE = {
    rv_001: { signal: 0.93, reason: "Judge panel disagreement + policy-violation cluster", cluster: "cl_refund" },
    rv_002: { signal: 0.88, reason: "Out-of-scope claim, low faithfulness", cluster: "cl_api" },
    rv_003: { signal: 0.71, reason: "Below faithfulness threshold", cluster: "cl_api" },
    rv_004: { signal: 0.66, reason: "Destructive action under-confirmed", cluster: "cl_admin" },
    rv_007: { signal: 0.58, reason: "Multi-turn context loss", cluster: "cl_multi" },
    rv_005: { signal: 0.22, reason: "Likely correct — low priority", cluster: null },
    rv_006: { signal: 0.18, reason: "Likely correct — low priority", cluster: null },
  };

  // ---- Agent run audit log ----
  const AGENT_RUNS = [
    { id: "ar_91", agent: "copilot", autonomy: "draft", title: "Build eval for Support Copilot", status: "done", date: "2026-05-28 08:31", by: "Mei Lin", cost: 0.42, tools: ["triage.cluster", "dataset.propose", "rubric.propose", "judge.calibrate", "experiment.run"], reads: "512 prod traces · golden v3" },
    { id: "ar_88", agent: "triage", autonomy: "auto", title: "Weekly failure clustering", status: "done", date: "2026-05-27 02:00", by: "schedule", cost: 0.09, tools: ["trace.query", "cluster"], reads: "73 sampled traces" },
    { id: "ar_85", agent: "rubric", autonomy: "draft", title: "Propose compliance-tone criterion", status: "approved", date: "2026-05-26 16:20", by: "Mei Lin", cost: 0.03, tools: ["rubric.discover"], reads: "38 refund-cluster traces" },
    { id: "ar_82", agent: "dataset", autonomy: "draft", title: "Mine + synthesize refund edge cases", status: "approved", date: "2026-05-26 15:55", by: "Mei Lin", cost: 0.07, tools: ["trace.sample", "dataset.synthesize"], reads: "38 traces → 9 records" },
    { id: "ar_79", agent: "triage", autonomy: "auto", title: "Root-cause: refund failures", status: "done", date: "2026-05-26 11:02", by: "Raj Patel", cost: 0.05, tools: ["trace.rootcause"], reads: "tr_8f19 span tree" },
  ];

  window.AGENTS = AGENTS;
  window.AUTONOMY = AUTONOMY;

  // extra traces so NL queries return meaningful results (incl. a tool-loop case)
  DB.TRACES.unshift(
    {
      id: "tr_9a07", q: "where's my refund, I've asked 3 times now", topic: "Billing", model: "gpt-4o", overall: 0.31, sampled: true, t: "2026-05-28 09:18:40", lat: 5120, flag: true, loop: true,
      spans: [
        { name: "retrieve", kind: "vector-search", ms: 280, meta: "top_k=8 · cosine" },
        { name: "retrieve", kind: "vector-search", ms: 300, meta: "retry · same query" },
        { name: "retrieve", kind: "vector-search", ms: 290, meta: "retry · same query" },
        { name: "retrieve", kind: "vector-search", ms: 310, meta: "retry · 4th call" },
        { name: "generate", kind: "gpt-4o", ms: 3640, meta: "1.4k in · 210 out tok" },
      ],
      scores: { faithfulness: 0.34, relevance: 2.1, precision: 0.29, completeness: false },
    },
    {
      id: "tr_9a02", q: "the search keeps looping and never answers my SSO question", topic: "Admin", model: "gpt-4o", overall: 0.38, sampled: true, t: "2026-05-28 09:16:12", lat: 4870, flag: true, loop: true,
      spans: [
        { name: "retrieve", kind: "vector-search", ms: 260, meta: "top_k=8" },
        { name: "retrieve", kind: "vector-search", ms: 270, meta: "retry · same query" },
        { name: "retrieve", kind: "vector-search", ms: 265, meta: "retry · same query" },
        { name: "generate", kind: "gpt-4o", ms: 4075, meta: "timeout fallback" },
      ],
      scores: { faithfulness: 0.41, relevance: 2.4, precision: 0.33, completeness: false },
    },
  );

  Object.assign(DB, { AGENTS, AUTONOMY, CLUSTERS, PROVENANCE, JUDGES, CALIBRATION, TRIAGE, AGENT_RUNS });
})();
