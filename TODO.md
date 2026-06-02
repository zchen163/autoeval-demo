# Demo cleanup — remaining work

Snapshot of pending simplifications to the AutoEval demo, in priority order. Goal: laser-focus the demo on the core eval product, drop noise.

## Done so far

- Skipped the login gate (`app.jsx:35` removed, `authed` defaults to true).
- Translated all 61 demo captions in `demo.jsx` from Chinese to English.
- Removed the redundant "▸ Full" chip.
- Deleted dead `scene1()`, `scene2()`, and `scene3()` from `demo.jsx`.
- Deleted bundled `AutoEval-Demo-Full.html` and `AutoEval-Demo-Onboarding.html` (−3 MB).
- **Consolidation:** chips renamed to `A · Offline eval` / `B · Online monitoring`. Daily-monitor tail trimmed from `sceneT3` (offline ends at Report). 3-step monitor segment prepended to `sceneReview` after the dashboard glance.

---

## Pending — small simplifications

### 1. Trim the morning briefing in `conversation.jsx`

**Where:** `conversation.jsx:213–225` — the `msgs.length === 0 && !orchestrating` block. Three alert buttons: "3 judge–human disagreements", "Overall dipped 7pp in early May", "v1.4 still running".

**Why:** First impression overload — three competing CTAs before the user does anything. Trim to one anchor message (the May regression is the most narrative-rich) plus the "Want me to spin up a fresh eval, or dig into one of these?" line.

### 2. Hide non-core destinations from `⌘K`

**Where:** `console.jsx:5–19` — the `DESTS` array. Remove these five entries: `experiments`, `compare`, `agentruns`, `keys`, `settings`.

**Why:** Each adds an option to the ⌘K menu that isn't part of the core eval loop. Audit-log and org/billing aren't what a demo viewer needs to discover.

**Important:** the view files themselves stay (`views_experiments.jsx`, `views_compare.jsx`, `views_settings.jsx`, plus `AgentRunsView` in `views_judge.jsx:98` and `KeysView`/`SettingsView` in `views_settings.jsx:73`/`:133`). They're still reachable via natural-language routing in `conversation.jsx:39–55` (e.g. "compare v1.2 and v1.3"). Just not surfaced in the menu.

### 3. Trim onboarding to traces-only

**Where:**
- `onboarding.jsx` — the three branches in step 1 (`tracePath === "traces" | "describe" | "labeled"`).
- `conversation.jsx:95–115` — `labeledMode` / `describeMode` branches in the orchestration flow.

**Why:** Two of the three paths exist mainly to say "we support multiple data shapes" but the traces path is the only one the autopilot demo touches. Removing the other two collapses a lot of conditional rendering and tightens the narrative.

**Caveat:** this removes the soft promise of "you can start without traces" — a real signal to undecided buyers. If you want to keep that message, leave the paths but cut the labeled/describe greetings in `conversation.jsx:135–139` to one sentence each.

---

## Notes on what's already core (don't touch)

These are central to the product story — leave them alone:

- The Eval Copilot conversation pane (`conversation.jsx`) — orchestration with per-step approvals is the AI-native differentiator.
- The four-agent model (Copilot orchestrates Triage / Rubric / Dataset agents, each with autonomy badges) — defined in `agents.jsx` and `agents_data.jsx`.
- The Proposal card pattern (`agents.jsx`) — every agent output is reviewable, with evidence + autonomy + approve/edit.
- The Canvas-opens-from-chat UX (`app.jsx:39–47`, `conversation.jsx:routeIntent`) — natural-language navigation is core.
- Provenance badges on dataset records (`ProvBadge` in `agents.jsx`) — speaks to trust and auditability.
