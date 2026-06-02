# AutoEval — agent-native LLM evaluation platform (prototype)

A clickable, original-design prototype: an AI-native eval console where an Eval Copilot
orchestrates expert agents (Triage / Rubric / Dataset) and the human approves each step.

## Run it
Just open `index.html` in a browser — no build step. It's React + Babel-in-browser
(JSX is transpiled at runtime via `<script type="text/babel">`).

## Edit it
- `index.html` — shell, design tokens (light/dark via `[data-theme]`), font + script loading order.
- `data.jsx` / `agents_data.jsx` — all mock data (RAG support-agent scenario).
- `store.jsx` — in-memory store + `useDB()` hook (datasets, rubrics, persistence).
- `components.jsx` — shared UI primitives (Btn, Card, Badge, ScoreBar, Modal, charts…).
- `icons.jsx` — stroke icon set. `agents.jsx` — agent identities, autonomy badges, Proposal card.
- `conversation.jsx` — the Eval Copilot chat + orchestration (plan, proposal cards, approvals).
- `console.jsx` — the workspace shell + canvas (right pane that opens artifacts).
- `onboarding.jsx` — new-customer onboarding (Describe → Traces → First eval).
- `views_*.jsx` — each console view (dashboard, experiments, compare, datasets, rubrics,
  judge, monitor, report, review/traces, settings).
- `demo.jsx` — the self-playing demo autopilot (cursor + captions + chapter chips).
  Remove this `<script>` from `index.html` for a clean, non-demo build.

## Notes
- All Babel files share global scope; components are attached to `window`. Keep styles
  objects uniquely named (no bare `const styles = …`).
- State persists in `localStorage` (theme, auth, onboarding, route). Clear it to reset.
