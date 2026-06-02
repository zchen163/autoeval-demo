// components.jsx — shared UI primitives
const { useState, useEffect, useRef, useCallback } = React;
const I = window.Icons;

// ---------- score color helpers ----------
function scoreColor(v) {
  // v in 0..1
  if (v >= 0.8) return "var(--pos)";
  if (v >= 0.6) return "var(--warn)";
  return "var(--neg)";
}
function scoreSoft(v) {
  if (v >= 0.8) return "var(--pos-soft)";
  if (v >= 0.6) return "var(--warn-soft)";
  return "var(--neg-soft)";
}
// normalize any rubric value to 0..1 for coloring
function norm(key, val) {
  if (key === "relevance") return (val - 1) / 4;
  if (key === "completeness") return val ? 1 : 0;
  return val; // 0-1 types
}
function fmtScore(key, val) {
  if (key === "relevance") return val.toFixed(1);
  if (key === "completeness") return val ? "pass" : "fail";
  return val.toFixed(2);
}

// ---------- Button ----------
function Btn({ variant = "default", size = "md", icon, iconR, children, active, full, ...p }) {
  const sizes = {
    sm: { padding: "0 9px", height: 28, fontSize: 12.5, gap: 5 },
    md: { padding: "0 13px", height: 34, fontSize: 13.5, gap: 6 },
    lg: { padding: "0 18px", height: 40, fontSize: 14.5, gap: 7 },
  };
  const variants = {
    primary: { background: "var(--accent)", color: "white", border: "1px solid transparent" },
    default: { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border-strong)" },
    ghost: { background: active ? "var(--surface-3)" : "transparent", color: "var(--text-2)", border: "1px solid transparent" },
    soft: { background: "var(--accent-soft)", color: "var(--accent-text)", border: "1px solid var(--accent-soft-border)" },
    danger: { background: "var(--surface)", color: "var(--neg)", border: "1px solid var(--border-strong)" },
  };
  const sz = sizes[size];
  return (
    <button {...p} className={"btn " + (p.className || "")} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: sz.gap,
      height: sz.height, padding: sz.padding, fontSize: sz.fontSize, fontWeight: 600,
      borderRadius: "var(--r-md)", width: full ? "100%" : undefined,
      transition: "all .14s ease", whiteSpace: "nowrap", letterSpacing: "-0.01em",
      ...variants[variant], ...(p.style || {}),
    }}
      onMouseEnter={(e) => { if (variant === "primary") e.currentTarget.style.background = "var(--accent-hover)"; else if (variant === "ghost") e.currentTarget.style.background = "var(--surface-3)"; else e.currentTarget.style.borderColor = "var(--text-faint)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = variants[variant].background; e.currentTarget.style.borderColor = variants[variant].border.split(" ").pop(); }}
    >
      {icon && I[icon]({ size: size === "sm" ? 14 : 16 })}
      {children}
      {iconR && I[iconR]({ size: size === "sm" ? 14 : 16 })}
    </button>
  );
}

// ---------- Badge / Pill ----------
function Badge({ tone = "neutral", children, dot, style }) {
  const tones = {
    neutral: { bg: "var(--surface-3)", fg: "var(--text-2)", bd: "var(--border)" },
    accent: { bg: "var(--accent-soft)", fg: "var(--accent-text)", bd: "var(--accent-soft-border)" },
    pos: { bg: "var(--pos-soft)", fg: "var(--pos)", bd: "transparent" },
    warn: { bg: "var(--warn-soft)", fg: "var(--warn)", bd: "transparent" },
    neg: { bg: "var(--neg-soft)", fg: "var(--neg)", bd: "transparent" },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, height: 21, padding: "0 8px",
      borderRadius: 99, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      fontSize: 11.5, fontWeight: 600, letterSpacing: "0.01em", whiteSpace: "nowrap", ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} />}
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    complete: ["pos", "Complete"], running: ["accent", "Running"], failed: ["neg", "Failed"],
    todo: ["neutral", "To do"], in_progress: ["warn", "In progress"], done: ["pos", "Done"],
    active: ["pos", "Active"], invited: ["warn", "Invited"],
  };
  const [tone, label] = map[status] || ["neutral", status];
  if (status === "running") return <Badge tone="accent"><Spinner size={11} /> {label}</Badge>;
  return <Badge tone={tone} dot>{label}</Badge>;
}

function Spinner({ size = 14 }) {
  return <span style={{ display: "inline-flex", animation: "spin 0.9s linear infinite" }}>
    {I.spinner({ size })}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </span>;
}

// ---------- Avatar ----------
function Avatar({ m, size = 26 }) {
  if (!m) return null;
  return (
    <span title={m.name} style={{
      width: size, height: size, borderRadius: 99, flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: `oklch(0.62 0.13 ${m.hue})`, color: "white",
      fontSize: size * 0.4, fontWeight: 700, letterSpacing: "-0.02em",
      fontFamily: "var(--font-sans)",
    }}>{m.initials}</span>
  );
}

// ---------- Score bar (inline) ----------
function ScoreBar({ value, w = 54, showVal = true, fmtKey }) {
  const n = fmtKey ? norm(fmtKey, value) : value;
  const c = scoreColor(n);
  return (
    <span className="row gap-2" style={{ minWidth: showVal ? w + 40 : w }}>
      <span style={{ width: w, height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden", flexShrink: 0 }}>
        <span style={{ display: "block", height: "100%", width: `${Math.max(3, n * 100)}%`, background: c, borderRadius: 99, transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
      </span>
      {showVal && <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums", minWidth: 34 }}>
        {fmtKey ? fmtScore(fmtKey, value) : value.toFixed(2)}
      </span>}
    </span>
  );
}

// ---------- Big metric ring ----------
function Ring({ value, size = 64, stroke = 6, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = scoreColor(value);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - value)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="mono" style={{ fontSize: size * 0.26, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{(value * 100).toFixed(0)}</span>
        {label && <span style={{ fontSize: 9, color: "var(--text-3)", marginTop: -2 }}>{label}</span>}
      </div>
    </div>
  );
}

// ---------- Sparkline ----------
function Sparkline({ data, w = 120, h = 36, color = "var(--accent)", fill = true }) {
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 4 - ((d - min) / rng) * (h - 8)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${w} ${h} L0 ${h} Z`;
  const id = "spk" + Math.round(min * 1000) + data.length;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

// ---------- Delta indicator ----------
function Delta({ value, suffix = "", pp = false }) {
  if (Math.abs(value) < 0.0005) return <span className="mono faint" style={{ fontSize: 12 }}>—</span>;
  const up = value > 0;
  const col = up ? "var(--pos)" : "var(--neg)";
  const disp = pp ? `${up ? "+" : ""}${(value * 100).toFixed(1)}` : `${up ? "+" : ""}${value.toFixed(2)}`;
  return (
    <span className="mono row" style={{ gap: 2, color: col, fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
      {up ? I.arrowUp({ size: 11 }) : I.arrowDown({ size: 11 })}{disp}{suffix}
    </span>
  );
}

// ---------- Card ----------
function Card({ children, pad = 18, style, ...p }) {
  return <div {...p} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: pad, ...style }}>{children}</div>;
}

// ---------- Section header ----------
function PageHead({ title, sub, crumbs, actions, tabs, tab, onTab }) {
  return (
    <div style={{ borderBottom: tabs ? "none" : "1px solid var(--border)", paddingBottom: tabs ? 0 : 18, marginBottom: tabs ? 0 : 22 }}>
      {crumbs && <div className="row gap-1" style={{ marginBottom: 8, fontSize: 12.5, color: "var(--text-3)" }}>
        {crumbs.map((c, i) => <React.Fragment key={i}>
          {i > 0 && I.chevRight({ size: 13, style: { opacity: 0.5 } })}
          <span style={{ color: i === crumbs.length - 1 ? "var(--text-2)" : "var(--text-3)", cursor: c.onClick ? "pointer" : "default", fontWeight: i === crumbs.length - 1 ? 600 : 500 }} onClick={c.onClick}>{c.label}</span>
        </React.Fragment>)}
      </div>}
      <div className="row gap-4" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15 }}>{title}</h1>
          {sub && <p className="muted" style={{ fontSize: 13.5, marginTop: 5, maxWidth: 620 }}>{sub}</p>}
        </div>
        {actions && <div className="row gap-2" style={{ flexShrink: 0 }}>{actions}</div>}
      </div>
      {tabs && <div className="row gap-1" style={{ marginTop: 18, borderBottom: "1px solid var(--border)", gap: 2 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            padding: "9px 13px", fontSize: 13.5, fontWeight: 600, color: tab === t.id ? "var(--text)" : "var(--text-3)",
            borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`, marginBottom: -1, transition: "all .14s",
            display: "flex", alignItems: "center", gap: 6,
          }}>{t.label}{t.count != null && <span className="mono" style={{ fontSize: 11, padding: "1px 6px", borderRadius: 99, background: "var(--surface-3)", color: "var(--text-3)" }}>{t.count}</span>}</button>
        ))}
      </div>}
    </div>
  );
}

// ---------- Segmented control ----------
function Segment({ options, value, onChange, size = "md" }) {
  const h = size === "sm" ? 28 : 32;
  return (
    <div className="row" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 2, gap: 2, height: h }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        const act = v === value;
        return <button key={v} onClick={() => onChange(v)} style={{
          padding: "0 11px", height: h - 6, borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 5,
          background: act ? "var(--surface)" : "transparent", color: act ? "var(--text)" : "var(--text-3)",
          boxShadow: act ? "var(--shadow-sm)" : "none", transition: "all .14s",
        }}>{typeof o === "object" && o.icon && I[o.icon]({ size: 14 })}{lbl}</button>;
      })}
    </div>
  );
}

// ---------- Modal ----------
function Modal({ open, onClose, title, sub, children, footer, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(3px)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "9vh 20px 20px", animation: "fadeIn .16s" }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", width, maxWidth: "100%", boxShadow: "var(--shadow-lg)", animation: "scaleIn .2s cubic-bezier(.22,1,.36,1)", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {title && <div className="row" style={{ justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div><h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h3>{sub && <p className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>{sub}</p>}</div>
          <button onClick={onClose} style={{ color: "var(--text-3)", padding: 5, borderRadius: 6, display: "flex" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>{I.x({ size: 18 })}</button>
        </div>}
        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
        {footer && <div className="row gap-2" style={{ justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Field ----------
function Field({ label, hint, children }) {
  return <label className="col gap-2" style={{ marginBottom: 16 }}>
    {label && <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>}
    {children}
    {hint && <span className="faint" style={{ fontSize: 12 }}>{hint}</span>}
  </label>;
}
function Input(p) {
  return <input {...p} style={{
    height: 38, padding: "0 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)",
    background: "var(--surface)", outline: "none", transition: "border .14s, box-shadow .14s", fontSize: 13.5, width: "100%", ...(p.style || {}),
  }}
    onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-soft)"; p.onFocus && p.onFocus(e); }}
    onBlur={(e) => { e.target.style.borderColor = "var(--border-strong)"; e.target.style.boxShadow = "none"; p.onBlur && p.onBlur(e); }} />;
}
function Select({ options, ...p }) {
  return <div style={{ position: "relative" }}>
    <select {...p} style={{
      height: 38, padding: "0 34px 0 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)",
      background: "var(--surface)", outline: "none", fontSize: 13.5, width: "100%", appearance: "none", cursor: "pointer", ...(p.style || {}),
    }}>{options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>
    <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-3)" }}>{I.chevDown({ size: 15 })}</span>
  </div>;
}

// ---------- Toolbar (search + filters row) ----------
function SearchInput({ value, onChange, placeholder = "Search…", w = 240 }) {
  return <div className="row gap-2" style={{ height: 34, padding: "0 11px", borderRadius: "var(--r-md)", border: "1px solid var(--border-strong)", background: "var(--surface)", width: w }}>
    {I.search({ size: 15, style: { color: "var(--text-3)", flexShrink: 0 } })}
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 13.5 }} />
  </div>;
}

// ---------- Empty state ----------
function Empty({ icon = "search", title, sub, action }) {
  return <div className="col" style={{ alignItems: "center", justifyContent: "center", padding: "64px 20px", textAlign: "center", gap: 4 }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", marginBottom: 8 }}>{I[icon]({ size: 22 })}</div>
    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{title}</h3>
    {sub && <p className="muted" style={{ fontSize: 13, maxWidth: 340 }}>{sub}</p>}
    {action && <div style={{ marginTop: 12 }}>{action}</div>}
  </div>;
}

// ---------- Toast ----------
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, tone = "neutral") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const node = (
    <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 200, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      {toasts.map((t) => (
        <div key={t.id} className="row gap-2" style={{
          padding: "10px 15px", borderRadius: 99, background: "var(--text)", color: "var(--bg)",
          fontSize: 13, fontWeight: 600, boxShadow: "var(--shadow-lg)", animation: "slideUp .25s cubic-bezier(.22,1,.36,1)",
        }}>
          {t.tone === "pos" && I.check({ size: 15 })}
          {t.tone === "neg" && I.alert({ size: 15 })}
          {t.msg}
        </div>
      ))}
    </div>
  );
  return [push, node];
}

// ---------- Topic tag ----------
function Topic({ name }) {
  return <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", padding: "1px 6px", borderRadius: 4, background: "var(--surface-2)", border: "1px solid var(--border)" }}>{name}</span>;
}

Object.assign(window, {
  scoreColor, scoreSoft, norm, fmtScore, Btn, Badge, StatusBadge, Spinner, Avatar,
  ScoreBar, Ring, Sparkline, Delta, Card, PageHead, Segment, Modal, Field, Input, Select,
  SearchInput, Empty, useToast, Topic,
});
