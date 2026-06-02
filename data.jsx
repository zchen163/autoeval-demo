// data.jsx — mock data for a RAG retrieval-QA evaluation scenario
// Scenario: "Support Copilot" — a RAG bot answering questions about a SaaS product ("Northwind")

// ---- seeded RNG so scores are stable across re-renders ----
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORG = {
  id: "org_nw1",
  name: "Northwind AI",
  plan: "Free",
  traceQuota: 100,
  traceUsed: 73,
};

const MEMBERS = [
  { id: "u_mei", name: "Mei Lin", email: "mei@northwind.ai", role: "Admin", initials: "ML", hue: 265, status: "active", joined: "2025-11-02" },
  { id: "u_raj", name: "Raj Patel", email: "raj@northwind.ai", role: "Member", initials: "RP", hue: 155, status: "active", joined: "2025-12-14" },
  { id: "u_sof", name: "Sofia Ortiz", email: "sofia@northwind.ai", role: "Member", initials: "SO", hue: 25, status: "active", joined: "2026-01-09" },
  { id: "u_dan", name: "Dan Kovač", email: "dan@northwind.ai", role: "Member", initials: "DK", hue: 75, status: "invited", joined: "2026-05-20" },
];
const ME = MEMBERS[0];

const PROJECT = {
  id: "prj_copilot",
  name: "Support Copilot",
  description: "RAG bot answering customer questions over Northwind's help-center docs.",
  defaultAgent: "support-copilot v1.3",
  defaultRubric: "rub_rag",
  sampleRate: 0.15,
};

// ---- Rubric (project-level) shared by judge + human review ----
const RUBRIC = {
  id: "rub_rag",
  name: "RAG Answer Quality",
  updated: "2026-04-18",
  criteria: [
    { key: "faithfulness", name: "Faithfulness", type: "0-1", desc: "Every claim is grounded in the retrieved context; no hallucination.", weight: 0.35 },
    { key: "relevance", name: "Answer Relevance", type: "1-5", desc: "Directly answers the user's actual question.", weight: 0.25 },
    { key: "precision", name: "Context Precision", type: "0-1", desc: "Retrieved chunks are on-topic; little irrelevant context.", weight: 0.2 },
    { key: "completeness", name: "Completeness", type: "pass/fail", desc: "Covers all parts the question asks for.", weight: 0.2 },
  ],
};
const RUBRIC_2 = {
  id: "rub_tone",
  name: "Tone & Safety",
  updated: "2026-03-02",
  criteria: [
    { key: "tone", name: "Brand Tone", type: "1-5", desc: "Matches Northwind's friendly, concise voice.", weight: 0.5 },
    { key: "safety", name: "Safety", type: "pass/fail", desc: "No PII leakage, no unsafe instructions.", weight: 0.5 },
  ],
};

// ---- Dataset records (RAG QA pairs) ----
const RECORDS = [
  { q: "How do I reset my account password?", topic: "Account", ref: "Go to Settings → Security → Reset password. A reset link is emailed and expires in 30 minutes.", chunks: ["help/security#reset", "help/account-basics"] },
  { q: "What's the difference between the Team and Business plans?", topic: "Billing", ref: "Business adds SSO, audit logs, and unlimited guest seats over Team; both include unlimited projects.", chunks: ["pricing/compare", "help/plans#business"] },
  { q: "Can I export my project data to CSV?", topic: "Data", ref: "Yes — open a project, click ··· → Export, and choose CSV or JSON. Exports include all task fields.", chunks: ["help/export", "help/data-portability"] },
  { q: "Why am I getting rate-limited on the API?", topic: "API", ref: "Free keys allow 60 req/min. Upgrade or request a higher tier; 429 responses include a Retry-After header.", chunks: ["api/rate-limits", "api/errors#429"] },
  { q: "How do I set up SSO with Okta?", topic: "Admin", ref: "Business plan only: Admin → SSO → add Okta SAML metadata URL, then enforce SSO for the org.", chunks: ["help/sso-okta", "help/sso-overview"] },
  { q: "Does Northwind have a mobile app?", topic: "Product", ref: "Yes, iOS and Android apps are available; they support offline editing that syncs on reconnect.", chunks: ["help/mobile", "product/apps"] },
  { q: "How are guest seats billed?", topic: "Billing", ref: "Guests are free on Business; on Team they count as 0.5 of a paid seat, billed monthly.", chunks: ["pricing/seats", "help/guests"] },
  { q: "Can I recover a deleted task?", topic: "Data", ref: "Deleted tasks go to Trash for 30 days; restore from Project → Trash. After 30 days they're purged.", chunks: ["help/trash", "help/data-retention"] },
  { q: "What webhooks does the API support?", topic: "API", ref: "task.created, task.updated, task.completed, and project.archived. Configure under Settings → Webhooks.", chunks: ["api/webhooks", "api/events"] },
  { q: "How do I change my workspace timezone?", topic: "Account", ref: "Admin → Workspace → Locale. Timezone affects due-date rendering and digest emails for everyone.", chunks: ["help/locale", "help/workspace-settings"] },
  { q: "Is there a limit to how many projects I can create?", topic: "Product", ref: "No — all paid plans include unlimited projects. The free trial is capped at 3 active projects.", chunks: ["pricing/compare", "help/projects#limits"] },
  { q: "How do I invite someone outside my company?", topic: "Admin", ref: "Invite them as a guest by email; guests only see projects they're explicitly added to.", chunks: ["help/guests", "help/invites"] },
  { q: "Why didn't my automation trigger?", topic: "Product", ref: "Check the automation log under Project → Automations; common causes are paused rules or unmet conditions.", chunks: ["help/automations#debug", "help/automations"] },
  { q: "Can I use Northwind for free?", topic: "Billing", ref: "There's a 14-day trial and a free tier for up to 5 users with limited automations and 3 projects.", chunks: ["pricing/free", "help/plans#free"] },
  { q: "How do I bulk-archive completed projects?", topic: "Data", ref: "Select projects from the workspace grid, then Actions → Archive. Archived projects are read-only.", chunks: ["help/archive", "help/projects"] },
  { q: "What happens to my data if I cancel?", topic: "Billing", ref: "Data is retained read-only for 60 days after cancellation, then permanently deleted. Export beforehand.", chunks: ["help/cancellation", "help/data-retention"] },
];

const DATASET_RECORDS = RECORDS.map((r, i) => ({
  id: "rec_" + String(i + 1).padStart(3, "0"),
  input: r.q,
  expected: r.ref,
  topic: r.topic,
  chunks: r.chunks,
}));

const DATASETS = [
  {
    id: "ds_golden",
    name: "Support QA — Golden",
    version: "v3",
    versions: [
      { v: "v3", date: "2026-05-21", records: 16, note: "Added 4 billing + cancellation cases", author: "Mei Lin" },
      { v: "v2", date: "2026-04-30", records: 12, note: "Reworded ambiguous API questions", author: "Raj Patel" },
      { v: "v1", date: "2026-04-12", records: 9, note: "Initial golden set from support tickets", author: "Mei Lin" },
    ],
    records: DATASET_RECORDS,
    source: "Hand-curated from Zendesk",
    updated: "2026-05-21",
  },
  {
    id: "ds_prod",
    name: "Prod sampled traces",
    version: "v7",
    versions: [{ v: "v7", date: "2026-05-27", records: 73, note: "Nightly sample @ 15%", author: "SDK" }],
    records: [],
    recordCount: 73,
    source: "SDK online trace sampling",
    updated: "2026-05-27",
  },
  {
    id: "ds_edge",
    name: "Edge cases — adversarial",
    version: "v2",
    versions: [{ v: "v2", date: "2026-05-10", records: 24, note: "Prompt-injection + out-of-scope", author: "Sofia Ortiz" }],
    records: [],
    recordCount: 24,
    source: "Hand-written red-team",
    updated: "2026-05-10",
  },
];

// ---- Experiments + per-record scored results ----
// Each experiment has a quality "profile" that shifts the seeded scores.
const AGENT = "support-copilot";
const EXP_DEFS = [
  { id: "exp_7a2f", name: "v1.2 · baseline", agent: AGENT, version: "v1.2", prompt: "baseline-v1", rerank: "none", tools: "doc-search", seed: 11, bias: 0.0, status: "complete", date: "2026-05-12 14:22", cost: 2.41, dur: "3m 18s", by: "Mei Lin" },
  { id: "exp_9c41", name: "v1.3 · rerank-v2", agent: AGENT, version: "v1.3", prompt: "baseline-v1", rerank: "cohere-rerank-v2", tools: "doc-search", seed: 23, bias: 0.09, status: "complete", date: "2026-05-19 09:05", cost: 2.88, dur: "3m 51s", by: "Raj Patel" },
  { id: "exp_b133", name: "v1.3 · rerank + memory", agent: AGENT, version: "v1.3", prompt: "baseline-v1", rerank: "cohere-rerank-v2", tools: "doc-search, memory", seed: 31, bias: 0.11, status: "complete", date: "2026-05-19 16:40", cost: 3.05, dur: "4m 12s", by: "Raj Patel" },
  { id: "exp_e881", name: "v1.1 · legacy", agent: AGENT, version: "v1.1", prompt: "legacy-v0", rerank: "none", tools: "doc-search", seed: 7, bias: -0.13, status: "complete", date: "2026-05-08 11:10", cost: 0.31, dur: "1m 47s", by: "Sofia Ortiz" },
  { id: "exp_f024", name: "v1.4 · rerank + reflection", agent: AGENT, version: "v1.4", prompt: "reflect-v1", rerank: "cohere-rerank-v2", tools: "doc-search, memory", seed: 42, bias: 0.13, status: "running", progress: 0.62, date: "2026-05-28 08:30", cost: 1.9, dur: "—", by: "Mei Lin" },
];

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

function genResults(def) {
  const rng = mulberry32(def.seed * 1000 + 7);
  return DATASET_RECORDS.map((rec, i) => {
    const base = rng();
    const topicHard = rec.topic === "API" || rec.topic === "Admin" ? -0.08 : 0;
    const faith = clamp(0.72 + def.bias + topicHard + (base - 0.5) * 0.45, 0.05, 1);
    const prec = clamp(0.68 + def.bias * 0.8 + (rng() - 0.5) * 0.5, 0.05, 1);
    const relRaw = clamp(3.6 + def.bias * 6 + topicHard * 8 + (rng() - 0.5) * 2.6, 1, 5);
    const rel = Math.round(relRaw * 10) / 10;
    const compP = clamp(0.7 + def.bias * 1.2 + topicHard + (rng() - 0.5) * 0.5, 0, 1);
    const completeness = compP > 0.5;
    // weighted overall on 0-1
    const overall = clamp(
      faith * 0.35 + (rel / 5) * 0.25 + prec * 0.2 + (completeness ? 1 : 0.35) * 0.2,
      0, 1
    );
    return {
      recId: rec.id,
      input: rec.input,
      topic: rec.topic,
      scores: { faithfulness: +faith.toFixed(2), relevance: rel, precision: +prec.toFixed(2), completeness },
      overall: +overall.toFixed(3),
      latency: Math.round(800 + rng() * 2600),
      rationale: buildRationale(rec, faith, rel, completeness),
      output: buildOutput(rec, faith, completeness),
    };
  });
}

function buildOutput(rec, faith, complete) {
  if (faith > 0.8 && complete) return rec.expected;
  if (faith > 0.8 && !complete) return rec.expected.split(".")[0] + ".";
  if (faith <= 0.6) return rec.expected.split(".")[0] + ". You can also reach support 24/7 by phone for immediate help.";
  return rec.expected.replace(/\b(30|60|14|3)\b/, (m) => String(+m + 15));
}
function buildRationale(rec, faith, rel, complete) {
  const parts = [];
  parts.push(faith > 0.8 ? "All claims trace to the retrieved chunks." : faith > 0.6 ? "Mostly grounded, but one detail isn't supported by context." : "Contains a claim not present in any retrieved chunk (likely hallucinated).");
  parts.push(rel >= 4 ? "Directly addresses the question." : rel >= 3 ? "Answers the question but adds tangential info." : "Drifts from what was asked.");
  parts.push(complete ? "Covers all parts of the ask." : "Misses part of the multi-part question.");
  return parts.join(" ");
}

const EXPERIMENTS = EXP_DEFS.map((def) => {
  const results = def.status === "running" ? [] : genResults(def);
  const n = results.length;
  const agg = (sel) => n ? results.reduce((s, r) => s + sel(r), 0) / n : 0;
  return {
    ...def,
    dataset: "ds_golden",
    datasetVersion: "v3",
    rubric: "rub_rag",
    scorers: ["LLM-as-judge (gpt-4o)", "Human review"],
    records: n || 16,
    results,
    summary: n ? {
      overall: +agg((r) => r.overall).toFixed(3),
      faithfulness: +agg((r) => r.scores.faithfulness).toFixed(3),
      relevance: +agg((r) => r.scores.relevance).toFixed(2),
      precision: +agg((r) => r.scores.precision).toFixed(3),
      completeness: +agg((r) => (r.scores.completeness ? 1 : 0)).toFixed(3),
      latency: Math.round(agg((r) => r.latency)),
    } : null,
  };
});

const expById = (id) => EXPERIMENTS.find((e) => e.id === id);

// factory: build a fully-scored experiment object from a partial config (used by create flows)
function makeExperiment(def) {
  const full = { rerank: "none", prompt: "baseline-v1", tools: "doc-search", bias: 0, seed: Math.floor(Math.random() * 9999), agent: "support-copilot", by: DB.ME.name, cost: +(1 + Math.random() * 2).toFixed(2), dur: (1 + Math.floor(Math.random() * 4)) + "m " + Math.floor(Math.random() * 59) + "s", ...def };
  const results = full.status === "running" ? [] : genResults(full);
  const n = results.length;
  const agg = (sel) => n ? results.reduce((s, r) => s + sel(r), 0) / n : 0;
  return {
    ...full, dataset: full.dataset || "ds_golden", datasetVersion: full.datasetVersion || "v3", rubric: "rub_rag",
    scorers: ["LLM-as-judge (gpt-4o)", "Human review"], records: n || 16, results,
    summary: n ? {
      overall: +agg((r) => r.overall).toFixed(3), faithfulness: +agg((r) => r.scores.faithfulness).toFixed(3),
      relevance: +agg((r) => r.scores.relevance).toFixed(2), precision: +agg((r) => r.scores.precision).toFixed(3),
      completeness: +agg((r) => (r.scores.completeness ? 1 : 0)).toFixed(3), latency: Math.round(agg((r) => r.latency)),
    } : null,
  };
}

// trend for dashboard (overall score over recent experiments, chronological)
const SCORE_TREND = [0.71, 0.69, 0.74, 0.78, 0.76, 0.81, 0.80, 0.84];

// ---- Online traces ----
const TRACE_DEFS = [
  { id: "tr_8f21", q: "How do I reset my account password?", topic: "Account", model: "gpt-4o", overall: 0.91, sampled: true, t: "2026-05-28 09:14:02", lat: 1840 },
  { id: "tr_8f19", q: "Can I get a refund for last month?", topic: "Billing", model: "gpt-4o", overall: 0.42, sampled: true, t: "2026-05-28 09:12:51", lat: 2210, flag: true },
  { id: "tr_8f0a", q: "Does the API support GraphQL?", topic: "API", model: "gpt-4o", overall: 0.58, sampled: true, t: "2026-05-28 09:08:33", lat: 1620, flag: true },
  { id: "tr_8ef7", q: "How do I add a custom field to tasks?", topic: "Product", model: "gpt-4o", overall: 0.88, sampled: false, t: "2026-05-28 09:05:10", lat: 1490 },
  { id: "tr_8ee2", q: "What's your uptime SLA?", topic: "Billing", model: "gpt-4o", overall: 0.79, sampled: true, t: "2026-05-28 08:59:44", lat: 1730 },
  { id: "tr_8ed0", q: "Can I integrate with Slack?", topic: "Product", model: "gpt-4o", overall: 0.94, sampled: true, t: "2026-05-28 08:51:20", lat: 1380 },
  { id: "tr_8ec4", q: "How do I delete my whole workspace?", topic: "Admin", model: "gpt-4o", overall: 0.66, sampled: false, t: "2026-05-28 08:44:02", lat: 2040 },
  { id: "tr_8eb1", q: "Why is my invoice higher this month?", topic: "Billing", model: "gpt-4o", overall: 0.71, sampled: true, t: "2026-05-28 08:37:55", lat: 1910 },
];
const TRACES = TRACE_DEFS.map((t) => ({
  ...t,
  spans: [
    { name: "retrieve", kind: "vector-search", ms: Math.round(t.lat * 0.18), meta: "top_k=8 · cosine" },
    { name: "rerank", kind: "cohere-rerank-v2", ms: Math.round(t.lat * 0.12), meta: "8 → 4 chunks" },
    { name: "generate", kind: t.model, ms: Math.round(t.lat * 0.7), meta: "1.2k in · 180 out tok" },
  ],
  scores: { faithfulness: +clamp(t.overall + 0.04, 0, 1).toFixed(2), relevance: Math.round(clamp(t.overall * 5 + 0.3, 1, 5) * 10) / 10, precision: +clamp(t.overall - 0.05, 0, 1).toFixed(2), completeness: t.overall > 0.6 },
}));

// ---- Human review queue ----
const REVIEW_ITems = [
  { id: "rv_001", source: "tr_8f19", srcType: "trace", q: "Can I get a refund for last month?", topic: "Billing", assignee: "u_mei", status: "in_progress", priority: "high" },
  { id: "rv_002", source: "tr_8f0a", srcType: "trace", q: "Does the API support GraphQL?", topic: "API", assignee: "u_raj", status: "todo", priority: "high" },
  { id: "rv_003", source: "rec_004", srcType: "experiment", q: "Why am I getting rate-limited on the API?", topic: "API", assignee: "u_mei", status: "todo", priority: "med" },
  { id: "rv_004", source: "tr_8ec4", srcType: "trace", q: "How do I delete my whole workspace?", topic: "Admin", assignee: "u_sof", status: "todo", priority: "med" },
  { id: "rv_005", source: "rec_002", srcType: "experiment", q: "Difference between Team and Business plans?", topic: "Billing", assignee: "u_mei", status: "done", priority: "low", goldenFlag: true },
  { id: "rv_006", source: "tr_8eb1", srcType: "trace", q: "Why is my invoice higher this month?", topic: "Billing", assignee: "u_raj", status: "done", priority: "low" },
  { id: "rv_007", source: "rec_013", srcType: "experiment", q: "Why didn't my automation trigger?", topic: "Product", assignee: "u_sof", status: "in_progress", priority: "med" },
];

// ---- API keys ----
const API_KEYS = [
  { id: "k1", name: "prod-ingest", prefix: "ne_live_a91c", created: "2026-01-12", lastUsed: "2026-05-28 09:14", creator: "Mei Lin", scope: "ingest" },
  { id: "k2", name: "ci-eval-runner", prefix: "ne_live_7f3b", created: "2026-03-04", lastUsed: "2026-05-27 02:00", creator: "Mei Lin", scope: "full" },
  { id: "k3", name: "staging-sdk", prefix: "ne_test_2d80", created: "2026-04-22", lastUsed: "2026-05-20 17:31", creator: "Raj Patel", scope: "ingest" },
];

window.DB = {
  ORG, MEMBERS, ME, PROJECT, RUBRIC, RUBRIC_2, DATASETS, DATASET_RECORDS,
  EXPERIMENTS, expById, makeExperiment, SCORE_TREND, TRACES, REVIEW_ITems, API_KEYS,
  RUBRICS: [RUBRIC, RUBRIC_2],
};
