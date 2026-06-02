// app.jsx — AI-native console shell: icon rail + persistent conversation + canvas
const { useState: useS, useEffect: useE, useCallback: useCb } = React;

function App() {
  const [theme, setTheme] = useS(() => localStorage.getItem("ae_theme") || "light");
  const [authed, setAuthed] = useS(() => true);
  const [onboarded, setOnboarded] = useS(() => localStorage.getItem("ae_onboarded") !== "0");
  const [autostart, setAutostart] = useS(false);
  const [autostartPath, setAutostartPath] = useS("traces");
  // canvas: null = home; else {route, narrate, seq, ask, askSeq}
  const [canvas, setCanvas] = useS(() => {
    try { const d = JSON.parse(sessionStorage.getItem("ae_demo") || "null"); if (d && d.run && d.scene === 3) return { route: { view: "report" }, seq: 1, narrate: false }; } catch {}
    return null;
  });
  const [palette, setPalette] = useS(false);
  const seqRef = React.useRef(0);
  const [push, toastNode] = useToast();

  useE(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("ae_theme", theme); }, [theme]);
  useE(() => { localStorage.setItem("ae_authed", authed ? "1" : "0"); }, [authed]);
  useE(() => { localStorage.setItem("ae_onboarded", onboarded ? "1" : "0"); }, [onboarded]);
  useE(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const openCanvas = useCb((route, narrate = true) => { seqRef.current += 1; setCanvas((c) => ({ ...(c || {}), route, narrate, seq: seqRef.current })); }, []);
  const askAgent = useCb((text) => { seqRef.current += 1; setCanvas((c) => ({ ...(c || {}), ask: text, askSeq: seqRef.current })); }, []);
  const closeCanvas = () => setCanvas((c) => (c ? { ...c, route: null } : null));
  const goHome = () => setCanvas((c) => (c ? { ...c, route: null } : null));

  const onAuth = (isNew) => { setAuthed(true); if (isNew) { setOnboarded(false); } };

  if (!onboarded) return <><OnboardingFlow onComplete={(path) => { setOnboarded(true); setAutostart(true); setAutostartPath(path || "traces"); setCanvas(null); }} theme={theme} toggleTheme={toggleTheme} />{toastNode}</>;

  // view renderer for canvas
  const viewMap = {
    dashboard: window.DashboardView, experiments: window.ExperimentsView, compare: window.CompareView,
    datasets: window.DatasetsView, rubrics: window.RubricsView, judge: window.JudgeView, review: window.ReviewView,
    traces: window.TracesView, agentruns: window.AgentRunsView, keys: window.KeysView, settings: window.SettingsView, report: window.ReportView, monitor: window.MonitorView,
  };
  const route = canvas && canvas.route;
  const View = route ? (viewMap[route.view] || window.DashboardView) : null;
  // canvas views call go() to navigate within the canvas (narrate=false: stay in flow)
  const canvasGo = (r) => openCanvas(typeof r === "string" ? { view: r } : r, false);
  const ctx = { route: route || {}, go: canvasGo, push, theme };

  return (
    <div className="row" style={{ height: "100%", alignItems: "stretch" }}>
      <IconRail theme={theme} toggleTheme={toggleTheme} onHome={goHome} onNew={() => { setCanvas(null); }} onSignOut={() => { setAuthed(false); setOnboarded(true); setAutostart(false); setCanvas(null); }} active={!route} />

      {/* persistent conversation spine */}
      <div style={{ width: 432, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--bg)", height: "100%" }}>
        <ConversationPane openCanvas={openCanvas} canvas={canvas} push={push} autostart={autostart} autostartPath={autostartPath} />
      </div>

      {/* canvas workspace */}
      <main style={{ flex: 1, height: "100%", minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        {route ? <>
          <CanvasHeader route={route} onOpenPalette={() => setPalette(true)} onClose={closeCanvas} />
          <div key={route.view + (route.id || "") + (route.b || "") + canvas.seq} className="view-enter" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 32px 64px" }}><View {...ctx} /></div>
          </div>
        </> : <CanvasHome openCanvas={openCanvas} onOpenPalette={() => setPalette(true)} />}
      </main>

      <CommandPalette open={palette} onClose={() => setPalette(false)} openCanvas={openCanvas} onAsk={askAgent} />
      {toastNode}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
