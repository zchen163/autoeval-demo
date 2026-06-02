// icons.jsx — minimal stroke icon set
const Ic = ({ d, size = 16, fill = false, sw = 1.6, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block" }} {...p}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  dashboard: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Ic>,
  flask: (p) => <Ic {...p}><path d="M9 3h6M10 3v6.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3"/><path d="M7.5 14h9"/></Ic>,
  dataset: (p) => <Ic {...p}><ellipse cx="12" cy="5.5" rx="7" ry="2.8"/><path d="M5 5.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6"/><path d="M5 11.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6"/></Ic>,
  ruler: (p) => <Ic {...p}><rect x="2.5" y="7" width="19" height="10" rx="2" transform="rotate(0 12 12)"/><path d="M7 7v3M11 7v4M15 7v3M19 7v4"/></Ic>,
  review: (p) => <Ic {...p}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8.5 10.5l2 2 4-4"/></Ic>,
  trace: (p) => <Ic {...p}><circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 6h6a4 4 0 0 1 4 4M7 18h6a4 4 0 0 0 4-4"/></Ic>,
  trophy: (p) => <Ic {...p}><path d="M6 4h12v4a6 6 0 0 1-12 0z"/><path d="M6 6H3.5a2.5 2.5 0 0 0 3 2.5M18 6h2.5a2.5 2.5 0 0 1-3 2.5M9 14.5h6M10 20h4M12 14.5V20"/></Ic>,
  key: (p) => <Ic {...p}><circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13l8-8M16 5l2.5 2.5M14 7l2 2"/></Ic>,
  settings: (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 14H4.5a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 4.6h.09A1.65 1.65 0 0 0 12 3.09V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 17 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1z"/></Ic>,
  plus: (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>,
  search: (p) => <Ic {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Ic>,
  chevDown: (p) => <Ic {...p}><path d="M6 9l6 6 6-6"/></Ic>,
  chevRight: (p) => <Ic {...p}><path d="M9 6l6 6-6 6"/></Ic>,
  chevLeft: (p) => <Ic {...p}><path d="M15 6l-6 6 6 6"/></Ic>,
  arrowUp: (p) => <Ic {...p}><path d="M12 19V5M6 11l6-6 6 6"/></Ic>,
  arrowDown: (p) => <Ic {...p}><path d="M12 5v14M6 13l6 6 6-6"/></Ic>,
  arrowRight: (p) => <Ic {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Ic>,
  check: (p) => <Ic {...p}><path d="M5 12l5 5L20 7"/></Ic>,
  x: (p) => <Ic {...p}><path d="M6 6l12 12M18 6L6 18"/></Ic>,
  filter: (p) => <Ic {...p}><path d="M3 5h18l-7 8v6l-4 2v-8z"/></Ic>,
  download: (p) => <Ic {...p}><path d="M12 3v12M7 10l5 5 5-5M4 19h16"/></Ic>,
  copy: (p) => <Ic {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Ic>,
  eye: (p) => <Ic {...p}><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></Ic>,
  eyeOff: (p) => <Ic {...p}><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10.5 8 10.5 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 1.5 12S5 20 12 20a9 9 0 0 0 5.4-1.6M1 1l22 22M9.9 9.9a3 3 0 0 0 4.2 4.2"/></Ic>,
  trash: (p) => <Ic {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6"/></Ic>,
  dots: (p) => <Ic {...p}><circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/></Ic>,
  play: (p) => <Ic {...p}><path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor" stroke="none"/></Ic>,
  clock: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></Ic>,
  spinner: (p) => <Ic {...p}><path d="M12 3a9 9 0 1 0 9 9" opacity="0.9"/></Ic>,
  sun: (p) => <Ic {...p}><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19 5l-1.8 1.8M6.8 17.2L5 19M19 19l-1.8-1.8M6.8 6.8L5 5"/></Ic>,
  moon: (p) => <Ic {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Ic>,
  bell: (p) => <Ic {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></Ic>,
  bolt: (p) => <Ic {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></Ic>,
  user: (p) => <Ic {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></Ic>,
  users: (p) => <Ic {...p}><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20v-.5a5.5 5.5 0 0 1 11 0v.5M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.3A5.5 5.5 0 0 1 21.5 19.5v.5"/></Ic>,
  doc: (p) => <Ic {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></Ic>,
  link: (p) => <Ic {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></Ic>,
  external: (p) => <Ic {...p}><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></Ic>,
  refresh: (p) => <Ic {...p}><path d="M21 12a9 9 0 1 1-2.6-6.3M21 4v5h-5"/></Ic>,
  sliders: (p) => <Ic {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></Ic>,
  layers: (p) => <Ic {...p}><path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/></Ic>,
  alert: (p) => <Ic {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></Ic>,
  info: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></Ic>,
  send: (p) => <Ic {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></Ic>,
  grid: (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Ic>,
  list: (p) => <Ic {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Ic>,
  tag: (p) => <Ic {...p}><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/></Ic>,
  scale: (p) => <Ic {...p}><path d="M12 3v18M7 21h10M12 6l-6 2 6-2 6 2-6-2M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/></Ic>,
  logo: (p) => <Ic {...p} sw={2}><path d="M4 16.5 12 4l8 12.5M7.5 13h9"/><circle cx="12" cy="19.5" r="1.6" fill="currentColor" stroke="none"/></Ic>,
};

window.Icons = Icons;
