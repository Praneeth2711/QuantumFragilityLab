import { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";

/* ─── STYLES ─────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  [data-theme="dark"] {
    --bg: #04090f; --panel: rgba(4,9,15,0.92); --surface: #091520; --card: #060e19;
    --border: rgba(0,245,255,0.08); --border-md: rgba(0,245,255,0.16); --border-lg: rgba(0,245,255,0.28);
    --accent: #00f5ff; --accent-glow: rgba(0,245,255,0.22);
    --txt: #b0cce0; --txt-strong: #d8eef8; --txt-dim: #4a6878; --txt-muted: #1e3d55;
    --header-bg: rgba(3,7,12,0.99); --grid-color: rgba(0,245,255,0.013);
    --btn-bg: #091520; --cat-label: rgba(0,245,255,0.6); --tip-bg: #050d18;
    --scroll-thumb: rgba(0,245,255,0.22);
    --chat-user: rgba(0,245,255,0.1); --chat-bot: #091520;
    --chat-input-bg: #04090f; --chat-input-bd: rgba(0,245,255,0.18);
    --chat-panel: #060e19; --chat-panel-bd: rgba(0,245,255,0.16);
    --shadow: rgba(0,0,0,0.7); --tgl-track: #091520; --tgl-knob: #00f5ff;
    --measure-bg: linear-gradient(135deg,rgba(0,245,255,0.1),rgba(80,250,123,0.07));
    --measure-bd: rgba(0,245,255,0.3); --measure-col: #00f5ff;
  }
  [data-theme="light"] {
    --bg: #f0f6ff; --panel: rgba(255,255,255,0.98); --surface: #e8f0fe; --card: #ffffff;
    --border: rgba(37,99,235,0.09); --border-md: rgba(37,99,235,0.18); --border-lg: rgba(37,99,235,0.32);
    --accent: #2563eb; --accent-glow: rgba(37,99,235,0.18);
    --txt: #1e293b; --txt-strong: #0f172a; --txt-dim: #475569; --txt-muted: #64748b;
    --header-bg: rgba(255,255,255,0.99); --grid-color: rgba(37,99,235,0.03);
    --btn-bg: #e8f0fe; --cat-label: #1d4ed8; --tip-bg: #ffffff;
    --scroll-thumb: rgba(37,99,235,0.28);
    --chat-user: rgba(37,99,235,0.1); --chat-bot: #eef2ff;
    --chat-input-bg: #ffffff; --chat-input-bd: rgba(37,99,235,0.25);
    --chat-panel: #ffffff; --chat-panel-bd: rgba(37,99,235,0.2);
    --shadow: rgba(0,0,0,0.13); --tgl-track: #e2e8f0; --tgl-knob: #2563eb;
    --measure-bg: linear-gradient(135deg,rgba(37,99,235,0.1),rgba(5,150,105,0.07));
    --measure-bd: rgba(37,99,235,0.35); --measure-col: #1d4ed8;
    /* center panel — white in light mode */
    --center-bg: #f8faff;
    --circuit-area-bg: rgba(248,250,255,0.97);
    --circuit-gate-fill: #dbeafe;
    --circuit-wire-hint: #94a3b8;
    --circuit-empty-hint: #94a3b8;
  }
  [data-theme="dark"] {
    --center-bg: #04090f;
    --circuit-area-bg: rgba(4,9,15,0.97);
    --circuit-gate-fill: #0a1a28;
    --circuit-wire-hint: #1a3a55;
    --circuit-empty-hint: #1a3a55;
  }

  html, body, #root { height: 100%; }
  body { background: var(--bg); transition: background 0.35s; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; }
  input[type=range]::-webkit-slider-track { background: var(--surface); height: 5px; border-radius: 5px; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%; background: var(--accent); margin-top: -5px; box-shadow: 0 0 8px var(--accent-glow); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:0.3; } 50% { opacity:1; } }
  @keyframes fadeIn { from { opacity:0; transform:scale(0.93) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes chatPulse { 0%,100% { box-shadow:0 4px 20px var(--shadow); } 50% { box-shadow:0 4px 20px var(--shadow), 0 0 0 9px var(--accent-glow); } }
  @keyframes dotBounce { 0%,80%,100% { transform:scale(0.6); opacity:0.3; } 40% { transform:scale(1); opacity:1; } }
  @keyframes floatY { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
  @keyframes glowRing { 0%,100% { opacity:0.35; } 50% { opacity:0.9; } }
  @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
  @keyframes sectionPop { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes labelPop { from { opacity:0; letter-spacing:6px; } to { opacity:1; letter-spacing:3px; } }
  @keyframes sparkle { 0%,100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 8px 2px var(--accent-glow); } }
  .gate-btn { transition: transform 0.13s cubic-bezier(.34,1.56,.64,1), filter 0.13s, box-shadow 0.18s; cursor: pointer; border: none; position: relative; overflow: hidden; }
  .gate-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%); background-size:200% 100%; background-position:200% center; opacity:0; border-radius:inherit; pointer-events:none; transition:opacity 0.2s; }
  .gate-btn:hover::after { background-position:-20% center; opacity:1; animation:shimmer 0.55s ease both; }
  .gate-btn:hover { transform: scale(1.18) translateY(-3px); filter: brightness(1.45); box-shadow: 0 4px 14px var(--accent-glow); }
  .gate-btn:active { transform: scale(0.85); }
  .preset-btn { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); cursor: pointer; border: none; }
  .preset-btn:hover { filter: brightness(1.15); transform: translateY(-2px) scale(1.04); }
  .icon-btn { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); cursor: pointer; border: none; outline: none; }
  .icon-btn:hover { transform: scale(1.1); box-shadow: 0 4px 16px var(--accent-glow); }
  .chat-fab { animation: chatPulse 2.8s ease-in-out infinite; cursor: pointer; border: none; }
  .chat-fab:hover { transform: scale(1.12) !important; animation: none !important; }
  .d1 { animation: dotBounce 1.3s ease-in-out infinite 0s; display:inline-block; }
  .d2 { animation: dotBounce 1.3s ease-in-out infinite 0.18s; display:inline-block; }
  .d3 { animation: dotBounce 1.3s ease-in-out infinite 0.36s; display:inline-block; }
  .ctrl-btn { transition: all 0.16s cubic-bezier(.34,1.56,.64,1); }
  .ctrl-btn:hover:not(:disabled) { filter: brightness(1.25); transform: translateY(-2px) scale(1.07); }
  .measure-btn { position:relative; overflow:hidden; }
  .measure-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.14) 50%,transparent 65%); background-size:300% 100%; background-position:300% center; pointer-events:none; }
  .measure-btn:hover::after { animation:shimmer 0.6s ease both; }
  .measure-btn:hover { animation: sparkle 1.2s ease-in-out; }
  .section-label { animation: labelPop 0.5s ease both; }
  .panel-card { animation: sectionPop 0.4s ease both; }
`;

/* ─── CONSTANTS ─────────────────────────────────── */
const PI = Math.PI;
const S2 = Math.SQRT1_2;
const QCOLORS = ["#00f5ff", "#ff79c6"];

const GATE_DEFS = {
  I: { label: "I", color: "#6272a4", qn: 1, cat: "basic", tip: "Identity — does nothing, useful as placeholder" },
  X: { label: "X", color: "#ff5555", qn: 1, cat: "basic", tip: "Pauli-X (NOT gate) — flips |0⟩↔|1⟩, π rotation around X" },
  Y: { label: "Y", color: "#ffb86c", qn: 1, cat: "basic", tip: "Pauli-Y — combined bit + phase flip" },
  Z: { label: "Z", color: "#f1fa8c", qn: 1, cat: "basic", tip: "Pauli-Z — phase flip: |1⟩ → −|1⟩" },
  H: { label: "H", color: "#50fa7b", qn: 1, cat: "basic", tip: "Hadamard — creates equal superposition |+⟩ or |−⟩" },
  S: { label: "S", color: "#8be9fd", qn: 1, cat: "phase", tip: "S gate (√Z) — π/2 phase rotation" },
  SDG: { label: "S†", color: "#5fd8f5", qn: 1, cat: "phase", tip: "S-dagger — −π/2 phase rotation" },
  T: { label: "T", color: "#bd93f9", qn: 1, cat: "phase", tip: "T gate (π/8) — π/4 phase rotation" },
  TDG: { label: "T†", color: "#a57fef", qn: 1, cat: "phase", tip: "T-dagger — −π/4 phase rotation" },
  SX: { label: "√X", color: "#ff79c6", qn: 1, cat: "phase", tip: "Square-root of NOT gate" },
  RX: { label: "Rx", color: "#ffaa80", qn: 1, cat: "rot", tip: "Rotation around X-axis by angle θ", param: true },
  RY: { label: "Ry", color: "#ff9060", qn: 1, cat: "rot", tip: "Rotation around Y-axis by angle θ", param: true },
  RZ: { label: "Rz", color: "#c897ff", qn: 1, cat: "rot", tip: "Rotation around Z-axis by angle θ", param: true },
  CNOT: { label: "CNOT", color: "#00ff99", qn: 2, cat: "two", tip: "⭐ CNOT — THE entanglement gate. Flips target when control=|1⟩", ctrl: true },
  CZ: { label: "CZ", color: "#00ddff", qn: 2, cat: "two", tip: "Controlled-Z — phase flip on |11⟩", ctrl: true },
  CY: { label: "CY", color: "#44ffbb", qn: 2, cat: "two", tip: "Controlled-Y gate", ctrl: true },
  CH: { label: "CH", color: "#22ee88", qn: 2, cat: "two", tip: "Controlled-Hadamard", ctrl: true },
  SWAP: { label: "SWAP", color: "#ff79aa", qn: 2, cat: "two", tip: "SWAP — exchanges states of two qubits" },
};

const GATE_CATS = [
  { key: "basic", label: "PAULI / BASIC" },
  { key: "phase", label: "PHASE" },
  { key: "rot", label: "ROTATION" },
  { key: "two", label: "2-QUBIT (entangling)" },
];

/* ─── QUANTUM MATH ──────────────────────────────── */
function initState() { const s = new Float64Array(8); s[0] = 1; return s; }
function cloneState(s) { return new Float64Array(s); }

function apply1Q(s, m, q) {
  const ns = cloneState(s);
  const bit = q === 0 ? 2 : 1;
  const [ar, ai, br, bi, cr, ci, dr, di] = m;
  for (let i = 0; i < 4; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const r0 = s[2 * i], i0 = s[2 * i + 1], r1 = s[2 * j], i1 = s[2 * j + 1];
    ns[2 * i] = ar * r0 - ai * i0 + br * r1 - bi * i1;
    ns[2 * i + 1] = ar * i0 + ai * r0 + br * i1 + bi * r1;
    ns[2 * j] = cr * r0 - ci * i0 + dr * r1 - di * i1;
    ns[2 * j + 1] = cr * i0 + ci * r0 + dr * i1 + di * r1;
  }
  return ns;
}

function applyCNOT(s, ctrl, tgt) {
  const ns = cloneState(s);
  const cBit = ctrl === 0 ? 2 : 1, tBit = tgt === 0 ? 2 : 1;
  for (let i = 0; i < 4; i++) {
    if (!(i & cBit) || (i & tBit)) continue;
    const j = i | tBit;
    ns[2 * i] = s[2 * j]; ns[2 * i + 1] = s[2 * j + 1]; ns[2 * j] = s[2 * i]; ns[2 * j + 1] = s[2 * i + 1];
  }
  return ns;
}

function applyCZ(s, c, t) {
  const ns = cloneState(s);
  const cB = c === 0 ? 2 : 1, tB = t === 0 ? 2 : 1;
  for (let i = 0; i < 4; i++) {
    ns[2 * i] = s[2 * i]; ns[2 * i + 1] = s[2 * i + 1];
    if ((i & cB) && (i & tB)) { ns[2 * i] = -s[2 * i]; ns[2 * i + 1] = -s[2 * i + 1]; }
  }
  return ns;
}

function applySWAP(s) {
  const ns = cloneState(s);
  ns[2] = s[4]; ns[3] = s[5]; ns[4] = s[2]; ns[5] = s[3];
  return ns;
}

function getMat(name, p) {
  const c = Math.cos, sn = Math.sin;
  switch (name) {
    case "I": return [1, 0, 0, 0, 0, 0, 1, 0];
    case "X": return [0, 0, 1, 0, 1, 0, 0, 0];
    case "Y": return [0, 0, 0, -1, 0, 1, 0, 0];
    case "Z": return [1, 0, 0, 0, 0, 0, -1, 0];
    case "H": return [S2, 0, S2, 0, S2, 0, -S2, 0];
    case "S": return [1, 0, 0, 0, 0, 0, 0, 1];
    case "SDG": return [1, 0, 0, 0, 0, 0, 0, -1];
    case "T": return [1, 0, 0, 0, 0, 0, S2, S2];
    case "TDG": return [1, 0, 0, 0, 0, 0, S2, -S2];
    case "SX": return [0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5];
    case "RX": return [c(p / 2), 0, 0, -sn(p / 2), 0, -sn(p / 2), c(p / 2), 0];
    case "RY": return [c(p / 2), 0, -sn(p / 2), 0, sn(p / 2), 0, c(p / 2), 0];
    case "RZ": return [c(p / 2), -sn(p / 2), 0, 0, 0, 0, c(p / 2), sn(p / 2)];
    default: return null;
  }
}

function runGate(state, gate) {
  const { name, qubits, param = PI / 2 } = gate;
  if (name === "CNOT") return applyCNOT(state, qubits[0], qubits[1]);
  if (name === "CZ") return applyCZ(state, qubits[0], qubits[1]);
  if (name === "SWAP") return applySWAP(state);
  if (name === "CY") {
    let s = apply1Q(state, getMat("S"), qubits[1]);
    s = applyCNOT(s, qubits[0], qubits[1]);
    return apply1Q(s, getMat("SDG"), qubits[1]);
  }
  if (name === "CH") {
    let s = apply1Q(state, getMat("SDG"), qubits[1]);
    s = apply1Q(s, getMat("H"), qubits[1]);
    s = apply1Q(s, getMat("T"), qubits[1]);
    s = applyCNOT(s, qubits[0], qubits[1]);
    s = apply1Q(s, getMat("T"), qubits[1]);
    s = apply1Q(s, getMat("H"), qubits[1]);
    return apply1Q(s, getMat("S"), qubits[1]);
  }
  const mat = getMat(name, param);
  if (mat) return apply1Q(state, mat, qubits[0]);
  return state;
}

function applyNoise(state, p) {
  if (p <= 0) return state;
  const d = Math.sqrt(Math.max(0, 1 - p));
  const ns = cloneState(state);
  for (let i = 0; i < 4; i++) {
    ns[2 * i] = d * state[2 * i] + (i === 0 ? (1 - d) * 0.5 : 0);
    ns[2 * i + 1] = d * state[2 * i + 1];
  }
  let n2 = 0;
  for (let i = 0; i < 4; i++) n2 += ns[2 * i] * ns[2 * i] + ns[2 * i + 1] * ns[2 * i + 1];
  const n = Math.sqrt(n2) || 1;
  for (let i = 0; i < 8; i++) ns[i] /= n;
  return ns;
}

function buildAllStates(circuit, noiseP) {
  let s = initState();
  const arr = [cloneState(s)];
  for (const gate of circuit) {
    s = runGate(s, gate);
    s = applyNoise(s, noiseP * 0.25);
    arr.push(cloneState(s));
  }
  return arr;
}

function getProbs(sv) { return [0, 1, 2, 3].map(i => sv[2 * i] * sv[2 * i] + sv[2 * i + 1] * sv[2 * i + 1]); }

function reducedDM(sv, q) {
  let r00 = 0, r01re = 0, r01im = 0, r11 = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const qi = q === 0 ? (i >> 1) & 1 : i & 1;
      const qj = q === 0 ? (j >> 1) & 1 : j & 1;
      const oi = q === 0 ? i & 1 : (i >> 1) & 1;
      const oj = q === 0 ? j & 1 : (j >> 1) & 1;
      if (oi !== oj) continue;
      const re = sv[2 * i] * sv[2 * j] + sv[2 * i + 1] * sv[2 * j + 1];
      const im = sv[2 * i + 1] * sv[2 * j] - sv[2 * i] * sv[2 * j + 1];
      if (qi === 0 && qj === 0) r00 += re;
      else if (qi === 0 && qj === 1) { r01re += re; r01im += im; }
      else if (qi === 1 && qj === 1) r11 += re;
    }
  }
  return { r00, r01re, r01im, r11 };
}

function blochVec(dm) { return [2 * dm.r01re, -2 * dm.r01im, dm.r00 - dm.r11]; }

function tempToFidelity(K) {
  const logMin = Math.log10(0.015), logMax = Math.log10(300);
  const t = (Math.log10(Math.max(0.015, K)) - logMin) / (logMax - logMin);
  return Math.max(0.05, Math.min(0.99, 0.97 - 0.72 * t * t * (3 - 2 * t)));
}

/* ─── BLOCH CANVAS 2D ──────────────────────────── */
function BlochCanvas({ bloch, color, label, size }) {
  const ref = useRef(null);
  const [bx, by, bz] = bloch;
  const mag = Math.sqrt(bx * bx + by * by + bz * bz);
  const purity = (1 + mag * mag) / 2;

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = W / 2 - 12;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, color + "18"); bg.addColorStop(1, "transparent");
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * PI); ctx.fill();
    ctx.strokeStyle = color + "44"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * PI); ctx.stroke();
    ctx.strokeStyle = color + "25"; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.28, 0, 0, 2 * PI); ctx.stroke();
    ctx.strokeStyle = "#ffffff10"; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    const pc = purity > 0.85 ? color : purity > 0.5 ? "#ffcc44" : "#ff4444";
    ctx.strokeStyle = pc; ctx.lineWidth = 2.5;
    ctx.shadowColor = pc; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(cx, cy, R + 4, -PI / 2, -PI / 2 + purity * 2 * PI); ctx.stroke();
    ctx.shadowBlur = 0;
    if (mag > 0.02) {
      const px = (bx * 0.65 + by * 0.3) * R * mag, py = (-bz - by * 0.28) * R * mag;
      ctx.strokeStyle = color + "20"; ctx.lineWidth = 0.8; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(cx + px, cy + py); ctx.lineTo(cx + px, cy); ctx.stroke();
      ctx.setLineDash([]);
      const g = ctx.createLinearGradient(cx, cy, cx + px, cy + py);
      g.addColorStop(0, color + "55"); g.addColorStop(1, color);
      ctx.strokeStyle = g; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + px, cy + py); ctx.stroke();
      const ang = Math.atan2(py, px);
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx + px, cy + py);
      ctx.lineTo(cx + px - 9 * Math.cos(ang - 0.4), cy + py - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(cx + px - 9 * Math.cos(ang + 0.4), cy + py - 9 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = color + "33"; ctx.shadowColor = color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * PI); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.font = "8px 'Share Tech Mono',monospace"; ctx.textAlign = "center";
    ctx.fillStyle = color + "66";
    ctx.fillText("|0⟩", cx, cy - R - 4); ctx.fillText("|1⟩", cx, cy + R + 11);
    ctx.font = "bold 11px 'Exo 2',sans-serif";
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 6;
    ctx.fillText(label, cx, H - 2); ctx.shadowBlur = 0;
  }, [bloch, color, label, purity, mag]);

  return (
    <canvas ref={ref} width={size} height={size}
      style={{ display: "block", borderRadius: 9, border: `1px solid ${color}22`, background: "var(--card)" }} />
  );
}

/* ─── 3D BLOCH SPHERE ──────────────────────────── */
function BigBloch3D({ bloch0, bloch1, darkMode }) {
  const mountRef = useRef(null);
  const R = useRef({
    renderer: null, scene: null, camera: null,
    a0: null, a1: null, raf: null,
    c0: [0, 0, 1], c1: [0, 0, 1], t0: [0, 0, 1], t1: [0, 0, 1],
    drag: false, lm: { x: 0, y: 0 },
    sphereMats: [],   /* refs to the solid sphere materials for theme updates */
  });

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const r = R.current;
    const W = mount.clientWidth, H = mount.clientHeight;
    r.scene = new THREE.Scene();
    r.camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 100);
    r.camera.position.set(0, 2.2, 3.8);
    r.camera.lookAt(0, 0, 0);
    r.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.renderer.setSize(W, H);
    r.renderer.setPixelRatio(window.devicePixelRatio);
    r.renderer.setClearColor(0x000000, 0);
    mount.appendChild(r.renderer.domElement);
    r.scene.add(new THREE.AmbientLight(0x4488bb, 5));
    const pl = new THREE.PointLight(0x44aaff, 2.5, 18);
    pl.position.set(4, 5, 4); r.scene.add(pl);
    const pl2 = new THREE.PointLight(0xff44aa, 1.2, 14);
    pl2.position.set(-3, -2, 3); r.scene.add(pl2);

    function buildSphere(xOff, arrowHex, glowHex) {
      const grp = new THREE.Group(); grp.position.x = xOff;
      const accentCol = parseInt(arrowHex.replace('#', ''), 16);
      const glowCol = parseInt(glowHex.replace('#', ''), 16);

      /* ─── HOLLOW INTERIOR ───
         Dark mode : fully transparent (opacity=0) — purely wireframe
         Light mode: near-black charcoal ghost shell (opacity=0.10)
         Either way the inside is empty-looking. */
      const sphereMat = new THREE.MeshPhongMaterial({
        color: darkMode ? 0x000000 : 0x1a1e2e,
        transparent: true,
        opacity: darkMode ? 0.0 : 0.10,
        shininess: 0,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.88, 32, 22), sphereMat));
      R.current.sphereMats.push(sphereMat);

      /* ─── WIREFRAME ───  more prominent, uses accent colour */
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 20, 12),
        new THREE.MeshBasicMaterial({
          color: darkMode ? accentCol : 0x1a1e2e,
          wireframe: true, transparent: true,
          opacity: darkMode ? 0.55 : 0.40,
        })
      ));

      /* ─── OUTER GLOW RIM ─── */
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.93, 28, 20),
        new THREE.MeshPhongMaterial({
          color: glowCol, transparent: true,
          opacity: darkMode ? 0.12 : 0.06,
          side: THREE.BackSide,
          emissive: glowCol, emissiveIntensity: darkMode ? 0.7 : 0.25,
          depthWrite: false,
        })
      ));

      /* ─── GRID ARC LINES ───
         5 great circles at different orientations for a full latitude/longitude grid.
         Much higher opacity so the grid really stands out. */
      function addArc(ex, ey, ez, col, op) {
        const pts = [];
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * 2 * PI;
          pts.push(new THREE.Vector3(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0).applyEuler(new THREE.Euler(ex, ey, ez)));
        }
        grp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })
        ));
      }
      const gridCol = darkMode ? accentCol : 0x2d3a5c;
      addArc(0, 0, 0, gridCol, darkMode ? 0.70 : 0.55);  /* equator */
      addArc(PI / 2, 0, 0, gridCol, darkMode ? 0.55 : 0.40);  /* prime meridian */
      addArc(PI / 2, PI / 2, 0, gridCol, darkMode ? 0.55 : 0.40);  /* 90° meridian */
      addArc(PI / 4, 0, 0, gridCol, darkMode ? 0.38 : 0.28);  /* 45° latitude N */
      addArc(3 * PI / 4, 0, 0, gridCol, darkMode ? 0.38 : 0.28);  /* 45° latitude S */

      /* ─── AXIS LINES ─── vivid colored, brighter than before */
      function addAx(x1, y1, z1, x2, y2, z2, col, op) {
        grp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)]),
          new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })
        ));
      }
      addAx(0, 0, 0, 0, 1.4, 0, 0xffee00, 0.95); addAx(0, 0, 0, 0, -1.25, 0, 0xffee00, 0.35); /* Z gold */
      addAx(0, 0, 0, 1.25, 0, 0, 0xff3355, 0.95); addAx(0, 0, 0, -1.15, 0, 0, 0xff3355, 0.35); /* X red  */
      addAx(0, 0, 0, 0, 0, 1.25, 0x44dd88, 0.95); addAx(0, 0, 0, 0, 0, -1.15, 0x44dd88, 0.35); /* Y green */

      /* ─── BLOCH VECTOR ARROW ─── emissive glow */
      const col3 = accentCol;
      const shaftGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.9, 10); shaftGeo.translate(0, 0.45, 0);
      const headGeo = new THREE.ConeGeometry(0.080, 0.16, 10); headGeo.translate(0, 0.08, 0);
      const vMat = new THREE.MeshPhongMaterial({ color: col3, emissive: col3, emissiveIntensity: 0.65, shininess: 100 });
      const arrow = new THREE.Group();
      arrow.add(new THREE.Mesh(shaftGeo, vMat));
      arrow.add(new THREE.Mesh(headGeo, new THREE.MeshPhongMaterial({ color: col3, emissive: col3, emissiveIntensity: 0.85 })));
      grp.add(arrow);
      /* pulsing tip sphere */
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshPhongMaterial({ color: col3, emissive: col3, emissiveIntensity: 1.2 })
      );
      grp.add(tip); r.scene.add(grp);
      return { arrow, tip };
    }
    /* q0=cyan arrow, q1=magenta arrow */
    r.a0 = buildSphere(-1.45, "#00f5ff", "#00ccff");
    r.a1 = buildSphere(1.45, "#ff79c6", "#ff44aa");

    function animate() {
      r.raf = requestAnimationFrame(animate);
      const items = [[r.c0, r.t0, r.a0], [r.c1, r.t1, r.a1]];
      for (const [c, t, a] of items) {
        c[0] += (t[0] - c[0]) * 0.1; c[1] += (t[1] - c[1]) * 0.1; c[2] += (t[2] - c[2]) * 0.1;
        const tx = c[0], ty = c[2], tz = c[1];
        const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (len > 0.01) {
          const dir = new THREE.Vector3(tx, ty, tz).normalize();
          a.arrow.scale.setScalar(len);
          a.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          a.tip.position.set(tx, ty, tz); a.tip.visible = true;
        } else { a.arrow.scale.setScalar(0.001); a.tip.visible = false; }
      }
      r.renderer.render(r.scene, r.camera);
    }
    animate();

    function onResize() {
      const W2 = mount.clientWidth, H2 = mount.clientHeight;
      r.camera.aspect = W2 / H2; r.camera.updateProjectionMatrix(); r.renderer.setSize(W2, H2);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(r.raf); r.renderer.dispose();
      if (mount.contains(r.renderer.domElement)) mount.removeChild(r.renderer.domElement);
    };
  }, [darkMode]);

  useEffect(() => { R.current.t0 = [...bloch0]; }, [bloch0]);
  useEffect(() => { R.current.t1 = [...bloch1]; }, [bloch1]);

  /* Update sphere opacity+color on theme change */
  useEffect(() => {
    R.current.sphereMats.forEach(m => {
      m.color.set(darkMode ? 0x000000 : 0x1a1e2e);
      m.opacity = darkMode ? 0.0 : 0.10;
      m.needsUpdate = true;
    });
  }, [darkMode]);

  function onMD(e) { R.current.drag = true; R.current.lm = { x: e.clientX, y: e.clientY }; }
  function onMM(e) {
    const r = R.current; if (!r.drag) return;
    const dx = e.clientX - r.lm.x, dy = e.clientY - r.lm.y;
    r.lm = { x: e.clientX, y: e.clientY };
    const sp = new THREE.Spherical().setFromVector3(r.camera.position);
    sp.theta -= dx * 0.007; sp.phi = Math.max(0.1, Math.min(PI - 0.1, sp.phi - dy * 0.007));
    r.camera.position.setFromSpherical(sp); r.camera.lookAt(0, 0, 0);
  }
  function onMU() { R.current.drag = false; }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab" }}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} />
      {/* axis legend */}
      <div style={{ position: "absolute", top: 8, right: 12, pointerEvents: "none", display: "flex", flexDirection: "column", gap: 3 }}>
        {[["#ffee00", "Z"], ["#ff3355", "X"], ["#44dd88", "Y"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 2, background: c, borderRadius: 1, boxShadow: `0 0 4px ${c}` }} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: c, fontWeight: 700 }}>{l}</span>
          </div>
        ))}
      </div>
      {/* drag hint */}
      <div style={{
        position: "absolute", top: 8, left: 12, pointerEvents: "none",
        fontFamily: "'Inter',sans-serif", fontSize: 10, color: "rgba(100,160,200,0.5)", letterSpacing: 0.5
      }}>
        drag to rotate
      </div>
      {/* qubit labels */}
      <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "space-around", pointerEvents: "none" }}>
        {[["q₀", "#00f5ff"], ["q₁", "#ff79c6"]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{
              fontFamily: "'Exo 2',sans-serif", fontWeight: 800, fontSize: 17,
              color: c, textShadow: `0 0 12px ${c}, 0 0 24px ${c}44`,
              animation: "floatY 3s ease-in-out infinite"
            }}>{l}</span>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: c + "88" }}>Bloch sphere</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CIRCUIT WIRE DIAGRAM ─────────────────────── */
const CW = 60, RH = 54, WY = 27, LW = 46;
function CircuitWires({ circuit, activeStep, onRemove, isPlaying }) {
  const layout = useMemo(() => {
    const cols = [];
    circuit.forEach((gate, gi) => {
      let col = 0;
      while (true) {
        const used = new Set((cols[col] || []).flatMap(g => g.qubits));
        if (!gate.qubits.some(q => used.has(q))) break;
        col++;
      }
      if (!cols[col]) cols[col] = [];
      cols[col].push({ ...gate, gi });
    });
    return cols;
  }, [circuit]);

  const ncols = Math.max(layout.length, 7);
  const W = LW + ncols * CW + 46;
  const H = 2 * RH + 8;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ display: "block" }}>
        {[0, 1].map(qi => (
          <g key={qi}>
            <text x={3} y={qi * RH + WY + 4} fill={QCOLORS[qi]} fontSize={11} fontFamily="'Exo 2',sans-serif" fontWeight="700">q{qi}</text>
            <text x={22} y={qi * RH + WY + 4} fill={QCOLORS[qi] + "44"} fontSize={9} fontFamily="'Share Tech Mono',monospace">|0⟩</text>
            <line x1={LW} y1={qi * RH + WY} x2={W - 14} y2={qi * RH + WY} stroke={QCOLORS[qi]} strokeWidth={1.8} opacity={0.4} />
          </g>
        ))}
        {circuit.length === 0 && (
          <text x={LW + 8} y={RH - 8} fill="#1a3a55" fontSize={10} fontFamily="'Exo 2',sans-serif" fontStyle="italic">
            ← click gates in palette to add them here
          </text>
        )}
        {layout.map((colGates, ci) => {
          const x = LW + ci * CW;
          return (
            <g key={ci}>
              {colGates.map(gate => {
                const gd = GATE_DEFS[gate.name] || { color: "#888", label: gate.name };
                const active = gate.gi === activeStep;
                const q0 = gate.qubits[0], q1 = gate.qubits[1];
                const isTwo = gate.qubits.length === 2;
                const mx = x + CW / 2;
                return (
                  <g key={gate.gi} onClick={() => { if (!isPlaying) onRemove(gate.gi); }} style={{ cursor: isPlaying ? "default" : "pointer" }}>
                    {isTwo && (<line x1={mx} y1={q0 * RH + WY} x2={mx} y2={q1 * RH + WY} stroke={gd.color} strokeWidth={active ? 2.5 : 1.8} opacity={0.85} />)}
                    {isTwo && gd.ctrl && (<circle cx={mx} cy={q0 * RH + WY} r={7} fill={gd.color} stroke={gd.color} strokeWidth={1} filter={active ? `drop-shadow(0 0 5px ${gd.color})` : "none"} />)}
                    {gate.name === "SWAP" && [q0, q1].map(qi => (
                      <g key={qi}>
                        <line x1={mx - 7} y1={qi * RH + WY - 7} x2={mx + 7} y2={qi * RH + WY + 7} stroke={gd.color} strokeWidth={2.5} />
                        <line x1={mx + 7} y1={qi * RH + WY - 7} x2={mx - 7} y2={qi * RH + WY + 7} stroke={gd.color} strokeWidth={2.5} />
                      </g>
                    ))}
                    {gate.qubits.map((qi, qidx) => {
                      if (isTwo && gd.ctrl && qidx === 0) return null;
                      if (gate.name === "SWAP") return null;
                      if (gate.name === "CNOT" && qidx === 1) {
                        return (
                          <g key={qi}>
                            <circle cx={mx} cy={qi * RH + WY} r={12} fill={active ? gd.color + "22" : "var(--circuit-gate-fill)"} stroke={gd.color} strokeWidth={active ? 2.5 : 1.8} filter={active ? `drop-shadow(0 0 8px ${gd.color})` : "none"} />
                            <line x1={mx - 12} y1={qi * RH + WY} x2={mx + 12} y2={qi * RH + WY} stroke={gd.color} strokeWidth={1.8} />
                            <line x1={mx} y1={qi * RH + WY - 12} x2={mx} y2={qi * RH + WY + 12} stroke={gd.color} strokeWidth={1.8} />
                          </g>
                        );
                      }
                      return (
                        <g key={qi}>
                          <rect x={mx - 18} y={qi * RH + WY - 13} width={36} height={26} rx={5}
                            fill={active ? gd.color + "28" : "var(--circuit-gate-fill)"} stroke={gd.color} strokeWidth={active ? 2 : 1.5}
                            filter={active ? `drop-shadow(0 0 10px ${gd.color})` : "none"} />
                          <text x={mx} y={qi * RH + WY + (gate.param != null ? 1 : 5)} fill={gd.color}
                            fontSize={gate.param != null ? 9 : 12} fontFamily="'Orbitron',monospace" fontWeight="700" textAnchor="middle">
                            {gd.label}
                          </text>
                          {gate.param != null && (
                            <text x={mx} y={qi * RH + WY + 14} fill={gd.color + "99"} fontSize={7} fontFamily="'Share Tech Mono',monospace" textAnchor="middle">
                              {(gate.param * 180 / PI).toFixed(0)}°
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {active && (
                      <circle cx={mx} cy={(isTwo ? (q0 + q1) / 2 : q0) * RH + WY} r={isTwo ? 28 : 20} fill="none"
                        stroke={gd.color} strokeWidth={1.5} opacity={0.5}
                        style={{ animation: "pulse 0.5s ease-in-out infinite" }} />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {[0, 1].map(qi => {
          const mx = LW + ncols * CW + 4, my = qi * RH + WY;
          return (
            <g key={qi}>
              <rect x={mx} y={my - 11} width={28} height={22} rx={4} fill="var(--circuit-gate-fill)" stroke={QCOLORS[qi] + "66"} strokeWidth={1.3} />
              <path d={`M ${mx + 4} ${my + 6} Q ${mx + 14} ${my - 3} ${mx + 24} ${my + 6}`} stroke={QCOLORS[qi]} strokeWidth={1.3} fill="none" />
              <line x1={mx + 14} y1={my + 5} x2={mx + 20} y2={my - 2} stroke={QCOLORS[qi]} strokeWidth={1.3} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── GATE PALETTE ─────────────────────────────── */
function GatePalette({ onAdd }) {
  const [tip, setTip] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {GATE_CATS.map(cat => {
        const gates = Object.entries(GATE_DEFS).filter(([, g]) => g.cat === cat.key);
        return (
          <div key={cat.key}>
            <div style={{
              fontFamily: "'Orbitron',monospace", fontSize: 10, color: "var(--cat-label)",
              letterSpacing: 2, marginBottom: 5, paddingLeft: 6, borderLeft: "2px solid var(--border-md)"
            }}>
              {cat.label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {gates.map(([name, gd]) => (
                <button key={name} className="gate-btn"
                  onClick={() => onAdd(name)}
                  onMouseEnter={() => setTip(name)}
                  onMouseLeave={() => setTip(null)}
                  style={{
                    position: "relative", background: gd.color + "18",
                    border: `2px solid ${gd.color}88`, color: gd.color,
                    fontFamily: "'Orbitron',monospace", fontSize: 11, fontWeight: 700,
                    padding: "5px 8px", borderRadius: 7, boxShadow: `0 0 6px ${gd.color}14`
                  }}>
                  {gd.label}
                  {gd.qn === 2 && (
                    <span style={{
                      position: "absolute", top: -4, right: -4, background: gd.color,
                      color: "#04090f", fontSize: 7, borderRadius: "50%", width: 12, height: 12,
                      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900
                    }}>2</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {tip && GATE_DEFS[tip] && (
        <div style={{
          background: "var(--tip-bg)", border: `1px solid ${GATE_DEFS[tip].color}33`,
          borderRadius: 9, padding: "8px 11px", fontSize: 11.5, color: "var(--txt)",
          lineHeight: 1.6, fontFamily: "'Inter',sans-serif", animation: "fadeIn 0.15s ease",
          boxShadow: "0 4px 18px var(--shadow)"
        }}>
          <span style={{ color: GATE_DEFS[tip].color, fontWeight: 700, fontFamily: "'Orbitron',monospace" }}>{GATE_DEFS[tip].label}</span>
          {" — "}{GATE_DEFS[tip].tip}
        </div>
      )}
    </div>
  );
}

/* ─── QUBIT PICKER MODAL ───────────────────────── */
function QubitPicker({ gateName, onConfirm, onCancel }) {
  const gd = GATE_DEFS[gateName] || {};
  const needTwo = gd.qn === 2;
  const [sel, setSel] = useState([]);
  const [angle, setAngle] = useState(PI / 2);
  const steps = needTwo
    ? (gd.ctrl ? ["Select CONTROL qubit", "Select TARGET qubit"] : ["Select first qubit", "Select second qubit"])
    : ["Select qubit to apply gate"];

  function pick(q) {
    if (sel.includes(q)) return;
    const next = [...sel, q];
    if (next.length === (needTwo ? 2 : 1)) {
      onConfirm({ name: gateName, qubits: next, param: gd.param ? angle : undefined });
    } else { setSel(next); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#050e1c", border: `2px solid ${gd.color || "#0ff"}44`,
        borderRadius: 16, padding: 26, width: 330, animation: "fadeIn 0.18s ease",
        boxShadow: `0 0 48px ${gd.color || "#0ff"}14, 0 20px 60px rgba(0,0,0,0.5)`
      }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, color: gd.color, fontSize: 18, marginBottom: 4 }}>{gd.label} Gate</div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: "#5a8899", marginBottom: 16, lineHeight: 1.55 }}>{gd.tip}</div>
        {gd.param && (
          <div style={{ marginBottom: 16, background: "var(--card)", borderRadius: 9, padding: "10px 12px", border: `1px solid ${gd.color}33` }}>
            <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 11, color: "#7aaabb", marginBottom: 5 }}>Rotation angle θ</div>
            <input type="range" min={-2 * PI} max={2 * PI} step={0.05} value={angle}
              onChange={e => setAngle(parseFloat(e.target.value))} style={{ accentColor: gd.color }} />
            <div style={{ textAlign: "center", color: gd.color, fontFamily: "'Share Tech Mono',monospace", fontSize: 16, marginTop: 5, fontWeight: 700 }}>
              {angle.toFixed(3)} rad &nbsp; ({(angle * 180 / PI).toFixed(0)}°)
            </div>
          </div>
        )}
        {needTwo && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: i < sel.length ? gd.color : "#0a2030", border: `1px solid ${gd.color}44`, transition: "background 0.2s" }} />
                <span style={{ fontSize: 10, color: i === sel.length ? "#8ab8cc" : "#334455", fontFamily: "'Share Tech Mono'" }}>
                  {gd.ctrl ? (i === 0 ? "CTRL" : "TGT") : `Q${i + 1}`}
                </span>
              </div>
            ))}
            {sel.length > 0 && <span style={{ fontSize: 10, color: gd.color, fontFamily: "'Share Tech Mono'" }}>q{sel[0]} ✓</span>}
          </div>
        )}
        <div style={{ fontFamily: "'Exo 2',sans-serif", fontWeight: 600, fontSize: 14, color: "#7aaabb", marginBottom: 12 }}>
          {steps[sel.length] || "—"}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[0, 1].map(qi => {
            const done = sel.includes(qi);
            return (
              <button key={qi} onClick={() => pick(qi)} disabled={done}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 11,
                  background: done ? QCOLORS[qi] + "22" : "#0a1a28",
                  border: `2px solid ${QCOLORS[qi]}${done ? "cc" : "55"}`,
                  color: done ? "#556677" : QCOLORS[qi],
                  fontFamily: "'Exo 2',sans-serif", fontWeight: 900, fontSize: 21,
                  cursor: done ? "default" : "pointer", transition: "all 0.18s"
                }}>
                q{qi}
                <div style={{ fontSize: 9, color: QCOLORS[qi] + (done ? "44" : "88"), fontFamily: "'Share Tech Mono'", marginTop: 3, fontWeight: 400 }}>
                  {done ? "✓ picked" : "click to pick"}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={onCancel}
          style={{
            width: "100%", padding: 8, background: "transparent", border: "1px solid #1a3a55",
            color: "#334455", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "'Exo 2',sans-serif"
          }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

/* ─── TEMPERATURE PANEL ────────────────────────── */
const TEMP_PRESETS = [
  { label: "15 mK", tempK: 0.015, color: "#00f5ff", icon: "❄️", f: "97%" },
  { label: "100 mK", tempK: 0.1, color: "#44aaff", icon: "🧊", f: "75%" },
  { label: "4 K", tempK: 4, color: "#88ddaa", icon: "⚗️", f: "~50%" },
  { label: "77 K", tempK: 77, color: "#ffcc44", icon: "🌡️", f: "35%" },
  { label: "300 K", tempK: 300, color: "#ff6644", icon: "🔥", f: "25%" },
];

function TemperaturePanel({ tempK, onTempK, noiseE, onNoiseE }) {
  const logMin = Math.log10(0.015), logMax = Math.log10(300);
  const pct = (Math.log10(Math.max(0.015, tempK)) - logMin) / (logMax - logMin);
  const fid = tempToFidelity(tempK);
  const tCol = tempK < 0.05 ? "#00f5ff" : tempK < 1 ? "#44aaff" : tempK < 50 ? "#ffcc44" : "#ff6644";
  const tLabel = tempK < 1 ? `${(tempK * 1000).toFixed(0)} mK` : tempK < 10 ? `${tempK.toFixed(1)} K` : `${Math.round(tempK)} K`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ background: "var(--surface)", borderRadius: 11, padding: "12px", border: `1px solid ${tCol}28` }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, color: "var(--txt-muted)", letterSpacing: 3, marginBottom: 5 }}>TEMPERATURE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ position: "relative", width: 20, height: 88, flexShrink: 0 }}>
            <div style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 9, height: 72,
              borderRadius: "4px 4px 0 0", background: "var(--card)", border: "1.5px solid var(--border-md)", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", bottom: 0, width: "100%", height: `${pct * 100}%`, background: tCol,
                boxShadow: `0 0 8px ${tCol}`, transition: "height 0.35s, background 0.35s"
              }} />
            </div>
            <div style={{
              position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 18, height: 18,
              borderRadius: "50%", background: tCol, boxShadow: `0 0 12px ${tCol}`, transition: "background 0.35s"
            }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Exo 2',sans-serif", fontWeight: 900, fontSize: 20, color: tCol, lineHeight: 1 }}>{tLabel}</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: tCol + "bb", marginTop: 4 }}>Fidelity: <strong>{(fid * 100).toFixed(0)}%</strong></div>
          </div>
        </div>
        <input type="range" min={0} max={1} step={0.001} value={pct}
          onChange={e => { const v = parseFloat(e.target.value); onTempK(Math.pow(10, logMin + v * (logMax - logMin))); }}
          style={{ accentColor: tCol }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          {["15mK", "100mK", "4K", "77K", "300K"].map(l => (
            <span key={l} style={{ fontSize: 8, color: "var(--txt-muted)", fontFamily: "'Share Tech Mono'" }}>{l}</span>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "var(--txt-muted)", letterSpacing: 3, marginBottom: 5 }}>QUICK PRESETS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {TEMP_PRESETS.map(p => {
            const active = Math.abs(Math.log10(tempK) - Math.log10(p.tempK)) < 0.15;
            return (
              <button key={p.label} className="preset-btn" onClick={() => onTempK(p.tempK)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: active ? `${p.color}18` : "transparent",
                  border: `1px solid ${p.color}${active ? "55" : "1a"}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer", textAlign: "left"
                }}>
                <span style={{ fontSize: 13 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 11.5, color: p.color }}>{p.label}</div>
                </div>
                <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 10, color: p.color }}>{p.f}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ background: "var(--surface)", borderRadius: 9, padding: "9px 10px", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "var(--txt-muted)", letterSpacing: 2 }}>EXTRA NOISE</span>
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 10, color: "#ff79c6" }}>{(noiseE * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min={0} max={0.6} step={0.01} value={noiseE}
          onChange={e => onNoiseE(parseFloat(e.target.value))} style={{ accentColor: "#ff79c6" }} />
        <div style={{ fontSize: 7, color: "var(--txt-muted)", fontFamily: "'Share Tech Mono'", marginTop: 2 }}>depolarizing_error per gate</div>
      </div>
      <div style={{ background: "var(--surface)", borderRadius: 9, padding: "9px 10px", border: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "var(--txt-muted)", letterSpacing: 3, marginBottom: 6 }}>T₂ COHERENCE TIME</div>
        {[{ temp: "15 mK", t2: "100 μs", bar: 1.0, col: "#00f5ff" }, { temp: "100 mK", t2: "10 μs", bar: 0.45, col: "#44aaff" },
        { temp: "4 K", t2: "100 ns", bar: 0.18, col: "#88ddaa" }, { temp: "300 K", t2: "< 1 ns", bar: 0.02, col: "#ff6644" }].map(({ temp, t2, bar, col }) => (
          <div key={temp} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: "var(--txt-dim)", fontFamily: "'Share Tech Mono'", minWidth: 40, textAlign: "right" }}>{temp}</span>
            <div style={{ flex: 1, background: "var(--card)", borderRadius: 2, height: 5 }}>
              <div style={{ width: `${bar * 100}%`, height: "100%", background: col, borderRadius: 2, boxShadow: `0 0 4px ${col}` }} />
            </div>
            <span style={{ fontSize: 9, color: col, fontFamily: "'Share Tech Mono'", minWidth: 42 }}>{t2}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STATE PANEL ──────────────────────────────── */
function StatePanel({ sv, probs, shots, results, onMeasure, onShots }) {
  const dm0 = useMemo(() => reducedDM(sv, 0), [sv]);
  const dm1 = useMemo(() => reducedDM(sv, 1), [sv]);
  const b0 = useMemo(() => blochVec(dm0), [dm0]);
  const b1 = useMemo(() => blochVec(dm1), [dm1]);
  const mag0 = Math.sqrt(b0[0] ** 2 + b0[1] ** 2 + b0[2] ** 2);
  const mag1 = Math.sqrt(b1[0] ** 2 + b1[1] ** 2 + b1[2] ** 2);
  const pur0 = (1 + mag0 * mag0) / 2, pur1 = (1 + mag1 * mag1) / 2;
  const corr = (probs[0] + probs[3]) * 100;
  const histData = ["00", "01", "10", "11"].map((k, i) => ({
    name: `|${k}⟩`, pct: results ? (results[k] || 0) / shots * 100 : probs[i] * 100,
    fill: ["#00f5ff", "#ff79c6", "#ffcc44", "#50fa7b"][i],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 7, color: "var(--txt-muted)", letterSpacing: 3, marginBottom: 6 }}>QUBIT STATES</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <BlochCanvas bloch={b0} color="#00f5ff" label="q₀" size={100} />
          <BlochCanvas bloch={b1} color="#ff79c6" label="q₁" size={100} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
          {[[b0, pur0, "#00f5ff", "q₀"], [b1, pur1, "#ff79c6", "q₁"]].map(([b, p, c, l]) => (
            <div key={l} style={{ flex: 1, background: "var(--surface)", borderRadius: 7, padding: "5px 7px", border: `1px solid ${c}18` }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 11, color: c, marginBottom: 3 }}>{l}</div>
              {[["purity", (p * 100).toFixed(0) + "%", p > 0.9 ? "#50fa7b" : p > 0.5 ? "#ffcc44" : "#ff4444"], ["⟨Z⟩", b[2].toFixed(3)], ["⟨X⟩", b[0].toFixed(3)]].map(([lbl, val, vc]) => (
                <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: "var(--txt-dim)", fontFamily: "'Exo 2',sans-serif" }}>{lbl}</span>
                  <span style={{ fontSize: 10, color: vc || "var(--txt)", fontFamily: "'Share Tech Mono',monospace" }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "var(--txt-muted)", letterSpacing: 3 }}>OUTCOMES</div>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: corr > 80 ? "#00f5ff" : corr > 50 ? "#ffcc44" : "#ff4444", fontWeight: 700 }}>
            CORR {corr.toFixed(0)}%
          </span>
        </div>
        <div style={{ height: 95 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fill: "#4a7a9a", fontSize: 10, fontFamily: "'Share Tech Mono'" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#3a5a6a", fontSize: 8 }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={{ background: "#0a1a28", border: "1px solid rgba(0,245,255,0.2)", fontSize: 9, color: "#0ff" }} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {histData.map((d, i) => <Cell key={i} fill={d.fill} opacity={d.pct < 0.5 ? 0.2 : 1} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 2 }}>
          <span style={{ fontSize: 7, color: "#00f5ff44", fontFamily: "'Share Tech Mono'" }}>|00⟩+|11⟩ = correct ✓</span>
          <span style={{ fontSize: 7, color: "#ff664444", fontFamily: "'Share Tech Mono'" }}>|01⟩+|10⟩ = error ✗</span>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: "var(--txt-dim)", fontFamily: "'Exo 2',sans-serif" }}>Shots</span>
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 9, color: "var(--accent)" }}>{shots}</span>
        </div>
        <input type="range" min={64} max={2048} step={64} value={shots}
          onChange={e => onShots(parseInt(e.target.value))} style={{ accentColor: "var(--accent)", marginBottom: 7 }} />
        <button onClick={onMeasure} className="measure-btn"
          style={{
            width: "100%", padding: "10px", background: "var(--measure-bg)", border: "1px solid var(--measure-bd)",
            color: "var(--measure-col)", borderRadius: 8, fontSize: 11, cursor: "pointer",
            fontFamily: "'Orbitron',monospace", letterSpacing: 2, transition: "all 0.15s"
          }}>
          ⚡ MEASURE
        </button>
        {results && (
          <div style={{ marginTop: 5, fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "var(--txt-dim)", textAlign: "center" }}>
            {Object.entries(results).sort((a, b) => b[1] - a[1]).map(([k, v]) => `|${k}⟩: ${v}`).join("  ·  ")}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 9, color: "var(--txt-muted)", letterSpacing: 3, marginBottom: 5 }}>STATE VECTOR |ψ⟩</div>
        <div style={{
          background: "var(--surface)", borderRadius: 9, padding: "9px 11px",
          border: "1px solid var(--border-md)", fontFamily: "'Share Tech Mono',monospace", fontSize: 11, lineHeight: 2.0
        }}>
          {["00", "01", "10", "11"].map((k, i) => {
            const re = sv[2 * i], im = sv[2 * i + 1], p = (re * re + im * im) * 100;
            return p > 0.05 ? (
              <div key={k} style={{ color: "var(--txt-dim)", display: "flex", gap: 6, alignItems: "baseline" }}>
                <span style={{ color: "var(--txt-muted)", minWidth: 32 }}>|{k}⟩</span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>{re.toFixed(3)}{im >= 0 ? "+" : ""}{im.toFixed(3)}i</span>
                <span style={{ color: "var(--txt-dim)", marginLeft: 4, fontSize: 10 }}>{p.toFixed(1)}%</span>
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── CHATBOT KNOWLEDGE BASE ───────────────────── */
const KB = [
  { k: ["what is quantum computing", "explain quantum", "quantum computer"], a: "Quantum computing uses quantum mechanics to process info. Unlike classical bits (0 or 1), **qubits** can be in superposition — both 0 and 1 at once — enabling certain problems to be solved exponentially faster!" },
  { k: ["qubit", "quantum bit", "what is a qubit"], a: "A **qubit** is the basic unit of quantum information. Unlike a classical bit, it can exist in a superposition α|0⟩ + β|1⟩ where |α|²+|β|²=1. Physically: superconducting loops, trapped ions, or photon polarizations." },
  { k: ["superposition", "what is superposition"], a: "**Superposition** means a qubit can be simultaneously |0⟩ and |1⟩: α|0⟩+β|1⟩. Measuring collapses it randomly to |0⟩ (prob |α|²) or |1⟩ (prob |β|²). Apply an **H gate** to q₀ and watch the Bloch sphere move to the equator!" },
  { k: ["entanglement", "quantum entanglement"], a: "**Entanglement** links two qubits so measuring one instantly determines the other. Load **Bell |Φ⁺⟩** — you'll see CORR→100%, both qubits always give the same result. Einstein called it 'spooky action at a distance'!" },
  { k: ["hadamard", "h gate", "what does h do"], a: "The **Hadamard (H) gate** creates equal superposition: |0⟩→(|0⟩+|1⟩)/√2. On the Bloch sphere it moves the state from the north pole to the equator. Essential for almost every quantum algorithm!" },
  { k: ["bell state", "bell", "phi+", "psi+"], a: "A **Bell state** is maximally entangled: |Φ⁺⟩=(|00⟩+|11⟩)/√2. Create it: H on q₀, then CNOT (q₀→q₁). Use the **Bell |Φ⁺⟩** preset in the header to try it instantly!" },
  { k: ["cnot", "controlled not", "cx gate"], a: "**CNOT** flips the target qubit when the control is |1⟩. It's THE entanglement gate! H + CNOT = Bell state. A universal 2-qubit gate used in nearly every quantum algorithm." },
  { k: ["bloch sphere", "bloch vector"], a: "The **Bloch sphere** geometrically represents a qubit state. North pole=|0⟩, south pole=|1⟩, equator=superposition. The 3D spheres in the center show q₀ (cyan) and q₁ (pink) live. Drag to rotate the view!" },
  { k: ["pauli x", "x gate", "not gate", "bit flip"], a: "**Pauli-X** = quantum NOT gate. Flips |0⟩↔|1⟩, a π rotation around the X-axis of the Bloch sphere. The simplest quantum gate!" },
  { k: ["pauli y", "y gate"], a: "**Pauli-Y** combines bit flip and phase flip: |0⟩→i|1⟩, |1⟩→-i|0⟩. It's a π rotation around the Y-axis. The imaginary factor creates a relative phase." },
  { k: ["pauli z", "z gate", "phase flip"], a: "**Pauli-Z** adds a phase to |1⟩: |0⟩→|0⟩, |1⟩→-|1⟩. A π rotation around Z. Phase differences matter for quantum interference even though invisible to direct measurement!" },
  { k: ["s gate", "sdg", "s-dagger"], a: "**S gate** (√Z) applies π/2 phase: |1⟩→i|1⟩. **S†** reverses it. Part of the Clifford gate set used in quantum error correction." },
  { k: ["t gate", "tdg", "t-dagger", "pi/8"], a: "**T gate** applies π/4 phase: |1⟩→e^(iπ/4)|1⟩. Together with H and CNOT, T gates enable **universal quantum computation** — any algorithm can be built from these three!" },
  { k: ["rx", "ry", "rz", "rotation gate", "rotation angle"], a: "**Rotation gates (Rx, Ry, Rz)** rotate the qubit by angle θ around the X, Y, or Z axis. A slider appears when you add one. Used in variational algorithms like VQE for chemistry!" },
  { k: ["swap", "swap gate"], a: "**SWAP** exchanges the states of two qubits: |ψ₁⟩|ψ₂⟩→|ψ₂⟩|ψ₁⟩. Built from 3 CNOTs. Important for qubit routing in hardware with limited connectivity." },
  { k: ["cz gate", "controlled z", "controlled phase"], a: "**CZ** applies a Z flip when control=|1⟩: |11⟩→-|11⟩. It's symmetric (no distinct control/target) and widely used in superconducting processors." },
  { k: ["fidelity", "what is fidelity"], a: "**Fidelity** measures how well operations maintain quantum coherence — 100%=perfect, 0%=fully noisy. In this simulator it depends on temperature: 15mK→97%, 300K→25%." },
  { k: ["noise", "quantum noise", "decoherence", "depolarizing"], a: "**Decoherence** = qubit losing its quantum properties via interaction with the environment. Real quantum computers cool to ~15mK to minimize it! The Extra Noise slider simulates depolarizing errors." },
  { k: ["temperature", "why cold", "millikelvin", "mk", "kelvin"], a: "Quantum computers run at ~15 millikelvin — colder than outer space! Thermal energy destroys quantum states (decoherence). At room temp (300K), qubits lose coherence almost instantly." },
  { k: ["t2", "coherence time", "t2 time"], a: "**T₂ coherence time** = how long a qubit stays quantum: 15mK→100μs, 4K→100ns, 300K→<1ns. Quantum algorithms must complete within T₂ — this is why gate count matters!" },
  { k: ["state vector", "wavefunction", "psi"], a: "The **state vector |ψ⟩** fully describes the quantum system. For 2 qubits: 4 complex amplitudes for |00⟩, |01⟩, |10⟩, |11⟩. Probability = squared magnitude. See it in the right panel!" },
  { k: ["measurement", "measure", "collapse", "wavefunction collapse"], a: "**Measurement** collapses the wavefunction to a definite state. Before: α|0⟩+β|1⟩. After: 0 (prob |α|²) or 1 (prob |β|²) — randomly! Press ⚡ MEASURE to run 512 shots and see the statistics." },
  { k: ["quantum circuit", "circuit", "what is a circuit"], a: "A **quantum circuit** = sequence of gates on qubit wires, read left→right. Click gates from the Gate Palette, pick qubits, build your algorithm! Press ▶ to step through with animation." },
  { k: ["how to use", "tutorial", "help", "guide", "get started", "how do i"], a: "Quick start: 1️⃣ Click a gate from the **Gate Palette** (left) → 2️⃣ Pick qubit(s) in the popup → 3️⃣ Watch the **Bloch sphere** update! 4️⃣ Press ▶ to animate → 5️⃣ Press ⚡ MEASURE to simulate. Try the **Bell |Φ⁺⟩** preset!" },
  { k: ["classical vs quantum", "difference", "why quantum", "classical bit"], a: "Classical bits are always 0 or 1. Qubits can be both simultaneously. N qubits represent 2ᴺ states at once vs N classical bits that store ONE number. At 300 qubits that's more states than atoms in the observable universe!" },
  { k: ["algorithm", "shor", "grover", "vqe", "quantum algorithm"], a: "Famous algorithms: **Shor's** (breaks RSA encryption), **Grover's** (quadratic search speedup), **VQE** (molecular chemistry for drug discovery), **QAOA** (optimization). All built on the same gate principles you see here!" },
];

function getBotResponse(q) {
  const lower = q.toLowerCase();
  for (const entry of KB) {
    if (entry.k.some(kw => lower.includes(kw))) return entry.a;
  }
  return "Great question! 🤔 I'm best at explaining **qubits, gates, superposition, entanglement, Bloch sphere, noise, and circuits**. Try: 'What is superposition?' or 'How does CNOT work?' or 'How do I make a Bell state?'";
}

/* ─── QUANTUM CHATBOT COMPONENT ────────────────── */
function QuantumChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { from: "bot", text: "👋 Hi! I'm your **Quantum Tutor**. Ask me anything about qubits, gates, superposition, entanglement, or how to use this simulator!" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  function send() {
    const q = input.trim(); if (!q) return;
    setMsgs(m => [...m, { from: "user", text: q }]);
    setInput(""); setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { from: "bot", text: getBotResponse(q) }]);
    }, 650 + Math.random() * 350);
  }

  function renderText(t) {
    return t.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <>
      <button className="chat-fab"
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 900,
          width: 54, height: 54, borderRadius: "50%",
          background: "linear-gradient(135deg,var(--accent),#7c3aed)",
          color: "#fff", fontSize: 22, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer",
          boxShadow: "0 4px 20px var(--shadow)"
        }}>
        {open ? "✕" : "💬"}
      </button>
      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 899,
          width: 340, height: 480, borderRadius: 18, background: "var(--chat-panel)",
          border: "1px solid var(--chat-panel-bd)", boxShadow: "0 12px 48px var(--shadow)",
          display: "flex", flexDirection: "column", animation: "slideUp 0.25s ease", overflow: "hidden"
        }}>
          <div style={{
            padding: "14px 16px 12px",
            background: "linear-gradient(135deg,var(--accent)22,transparent)",
            borderBottom: "1px solid var(--border)", flexShrink: 0
          }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: 13, color: "var(--accent)", letterSpacing: 1 }}>
              Quantum Tutor 🤖
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: "var(--txt-dim)", marginTop: 2 }}>
              Ask me anything about quantum computing
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.from === "user" ? "flex-end" : "flex-start", maxWidth: "88%",
                background: m.from === "user" ? "var(--chat-user)" : "var(--chat-bot)",
                border: m.from === "user" ? "1px solid var(--border-md)" : "1px solid var(--border)",
                borderRadius: m.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "8px 11px", fontFamily: "'Inter',sans-serif", fontSize: 12,
                lineHeight: 1.55, color: "var(--txt-strong)", animation: "fadeIn 0.2s ease"
              }}>
                {renderText(m.text)}
              </div>
            ))}
            {typing && (
              <div style={{
                alignSelf: "flex-start", background: "var(--chat-bot)",
                border: "1px solid var(--border)", borderRadius: "14px 14px 14px 4px",
                padding: "10px 14px", display: "flex", gap: 4, alignItems: "center"
              }}>
                <span className="d1" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                <span className="d2" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                <span className="d3" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about qubits, gates…"
              style={{
                flex: 1, background: "var(--chat-input-bg)", border: "1px solid var(--chat-input-bd)",
                borderRadius: 10, padding: "8px 12px", color: "var(--txt-strong)",
                fontFamily: "'Inter',sans-serif", fontSize: 12, outline: "none"
              }} />
            <button onClick={send}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "var(--accent)",
                color: "#fff", fontSize: 16, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px var(--accent-glow)", transition: "all 0.15s"
              }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── PRESETS ───────────────────────────────────── */
const PRESETS = [
  { label: "Bell |Φ⁺⟩", color: "#00f5ff", gates: [{ name: "H", qubits: [0] }, { name: "CNOT", qubits: [0, 1] }] },
  { label: "Bell |Ψ⁺⟩", color: "#50fa7b", gates: [{ name: "X", qubits: [1] }, { name: "H", qubits: [0] }, { name: "CNOT", qubits: [0, 1] }] },
  { label: "|++⟩", color: "#bd93f9", gates: [{ name: "H", qubits: [0] }, { name: "H", qubits: [1] }] },
  { label: "Teleport", color: "#ffcc44", gates: [{ name: "H", qubits: [0] }, { name: "CNOT", qubits: [0, 1] }, { name: "H", qubits: [0] }] },
];
let gId = 0;
function mkGate(g) { return { ...g, id: `g${gId++}` }; }

/* ─── MAIN APP ─────────────────────────────────── */
export default function App() {
  const [circuit, setCircuit] = useState([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [picking, setPicking] = useState(null);
  const [tempK, setTempK] = useState(0.015);
  const [noiseE, setNoiseE] = useState(0);
  const [shots, setShots] = useState(512);
  const [results, setResults] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("ql-theme") !== "light");
  const playRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("ql-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const noiseP = useMemo(() => Math.min(0.95, (1 - tempToFidelity(tempK)) + noiseE * 0.5), [tempK, noiseE]);
  const allStates = useMemo(() => buildAllStates(circuit, noiseP), [circuit, noiseP]);
  const displaySV = useMemo(() => activeStep >= 0 ? allStates[activeStep + 1] : allStates[allStates.length - 1], [allStates, activeStep]);
  const probs = useMemo(() => getProbs(displaySV), [displaySV]);
  const bloch0 = useMemo(() => blochVec(reducedDM(displaySV, 0)), [displaySV]);
  const bloch1 = useMemo(() => blochVec(reducedDM(displaySV, 1)), [displaySV]);
  const fidelity = tempToFidelity(tempK);
  const fColor = fidelity > 0.8 ? "#00f5ff" : fidelity > 0.5 ? "#ffcc44" : "#ff6644";
  const tLabel = tempK < 1 ? `${(tempK * 1000).toFixed(0)} mK` : tempK < 10 ? `${tempK.toFixed(1)} K` : `${Math.round(tempK)} K`;

  function confirmGate(d) { setCircuit(c => [...c, mkGate(d)]); setActiveStep(-1); setResults(null); setPicking(null); }
  function removeGate(idx) { setCircuit(c => c.filter((_, i) => i !== idx)); setActiveStep(-1); setResults(null); }
  function loadPreset(p) { setCircuit(p.gates.map(g => mkGate(g))); setActiveStep(-1); setResults(null); }

  async function playCircuit() {
    if (isPlaying || circuit.length === 0) return;
    setIsPlaying(true); setActiveStep(-1);
    for (let i = 0; i < circuit.length; i++) {
      await new Promise(r => { playRef.current = setTimeout(r, 700); }); setActiveStep(i);
    }
    await new Promise(r => setTimeout(r, 500));
    setIsPlaying(false); setActiveStep(-1);
  }

  function measure() {
    const counts = { "00": 0, "01": 0, "10": 0, "11": 0 }, keys = ["00", "01", "10", "11"];
    for (let i = 0; i < shots; i++) {
      let r = Math.random();
      for (let k = 0; k < 4; k++) { r -= probs[k]; if (r <= 0) { counts[keys[k]]++; break; } }
    }
    setResults(counts);
  }

  const SL = { fontFamily: "'Orbitron',monospace", fontSize: 10, color: "var(--accent)", letterSpacing: 3, marginBottom: 9, display: "flex", alignItems: "center", gap: 7 };
  const dot = (c) => ({ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}99`, flexShrink: 0 });

  return (
    <>
      <style>{STYLE}</style>
      <div data-theme={darkMode ? "dark" : "light"}
        style={{
          fontFamily: "'Inter',sans-serif", background: "var(--bg)", color: "var(--txt)",
          height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative"
        }}>

        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px)",
          backgroundSize: "44px 44px"
        }} />

        {/* ── HEADER ── */}
        <header style={{
          position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 10,
          padding: "0 16px", height: 50, borderBottom: "1px solid var(--border-md)",
          background: "var(--header-bg)", flexShrink: 0,
          boxShadow: darkMode ? "0 1px 24px rgba(0,0,0,0.5)" : "0 1px 12px rgba(0,0,0,0.06)"
        }}>

          <div style={{
            width: 24, height: 24, border: "2px solid var(--border-md)",
            borderTop: "2px solid var(--accent)", borderRadius: "50%",
            animation: "spin 3s linear infinite", flexShrink: 0
          }} />
          <div>
            <div style={{
              fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: 15,
              color: "var(--accent)", letterSpacing: 3,
              textShadow: darkMode ? "0 0 20px var(--accent-glow)" : "none", lineHeight: 1.1
            }}>
              QUANTUM LAB <span style={{ color: "var(--txt-muted)", fontSize: 10 }}>2-QUBIT</span>
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10.5, color: "var(--txt-dim)", letterSpacing: 0.3, marginTop: 1 }}>
              Quantum Circuit Simulator · Student Edition
            </div>
          </div>

          <div style={{ display: "flex", gap: 5, marginLeft: 10 }}>
            {PRESETS.map(p => (
              <button key={p.label} className="preset-btn" onClick={() => loadPreset(p)}
                style={{
                  background: `${p.color}18`, border: `1px solid ${p.color}55`, color: p.color,
                  padding: "4px 11px", borderRadius: 7, fontSize: 9, cursor: "pointer",
                  fontFamily: "'Orbitron',monospace", fontWeight: 700
                }}>
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Theme Toggle */}
          <button className="icon-btn" onClick={() => setDarkMode(d => !d)}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            style={{
              background: "var(--surface)", border: "1px solid var(--border-md)",
              borderRadius: 20, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6
            }}>
            <span style={{ fontSize: 14 }}>{darkMode ? "☀️" : "🌙"}</span>
            <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 9, color: "var(--txt-dim)", fontWeight: 600 }}>
              {darkMode ? "Light" : "Dark"}
            </span>
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: 8, background: "var(--surface)",
            border: "1px solid var(--border-md)", borderRadius: 20, padding: "4px 14px",
            fontFamily: "'Share Tech Mono',monospace", fontSize: 10
          }}>
            <span style={{ color: "var(--txt-dim)" }}>T =</span>
            <span style={{ color: fColor, fontWeight: 700 }}>{tLabel}</span>
            <span style={{ color: "var(--border-md)" }}>|</span>
            <span style={{ color: "var(--txt-dim)" }}>F =</span>
            <span style={{ color: fColor, fontWeight: 700 }}>{(fidelity * 100).toFixed(0)}%</span>
          </div>
        </header>

        {/* ── 3-COL BODY ── */}
        <div style={{
          position: "relative", zIndex: 5, flex: 1, display: "grid",
          gridTemplateColumns: "210px 1fr 216px", overflow: "hidden"
        }}>

          {/* LEFT SIDEBAR */}
          <div style={{
            borderRight: "1px solid var(--border)", overflowY: "auto",
            background: "var(--panel)", padding: "14px 10px 18px",
            display: "flex", flexDirection: "column", gap: 16
          }}>
            <div>
              <div style={SL}><div style={dot("var(--accent)")} /> GATE PALETTE</div>
              <div style={{
                background: "var(--surface)", borderRadius: 10, padding: "10px",
                border: "1px solid var(--border)", marginBottom: 6
              }}>
                <div style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 12, color: "var(--txt-dim)",
                  lineHeight: 1.65, marginBottom: 10
                }}>
                  1. Click a gate →<br />2. Pick qubit(s) in popup →<br />3. Gate appears on circuit wire
                </div>
                <GatePalette onAdd={name => setPicking(name)} />
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <div style={SL}><div style={dot("#ffcc44")} /> TEMPERATURE</div>
              <TemperaturePanel tempK={tempK} onTempK={setTempK} noiseE={noiseE} onNoiseE={setNoiseE} />
            </div>
          </div>

          {/* CENTER — uses CSS var for bg so it's white in light mode */}
          <div style={{
            display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--center-bg)",
            transition: "background 0.35s"
          }}>
            <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
              <BigBloch3D bloch0={bloch0} bloch1={bloch1} darkMode={darkMode} />
            </div>
            <div style={{
              borderTop: `1px solid ${darkMode ? "rgba(0,245,255,0.08)" : "rgba(37,99,235,0.12)"}`,
              background: "var(--circuit-area-bg)", flexShrink: 0, padding: "8px 12px 10px",
              transition: "background 0.35s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                {[
                  { label: "⏮", title: "Step back", onClick: () => setActiveStep(p => Math.max(-1, p - 1)), disabled: isPlaying || activeStep < 0 },
                  { label: "⏭", title: "Step forward", onClick: () => setActiveStep(p => Math.min(circuit.length - 1, p + 1)), disabled: isPlaying || activeStep >= circuit.length - 1 },
                ].map(btn => (
                  <button key={btn.label} title={btn.title} onClick={btn.onClick}
                    disabled={btn.disabled} className="ctrl-btn"
                    style={{
                      width: 32, height: 29, borderRadius: 7,
                      background: darkMode ? "#0a1a28" : (btn.disabled ? "#e8f0fe" : "#dbeafe"),
                      border: darkMode ? "1px solid rgba(0,245,255,0.22)" : "1px solid rgba(37,99,235,0.3)",
                      color: btn.disabled ? (darkMode ? "#334455" : "#94a3b8") : (darkMode ? "#00f5ff" : "#2563eb"),
                      fontSize: 13, cursor: btn.disabled ? "not-allowed" : "pointer"
                    }}>
                    {btn.label}
                  </button>
                ))}
                <button onClick={playCircuit} disabled={isPlaying || circuit.length === 0} className="ctrl-btn"
                  style={{
                    width: 32, height: 29, borderRadius: 7,
                    background: isPlaying ? "rgba(80,250,123,0.18)" : (darkMode ? "#0a1a28" : "#dbeafe"),
                    border: `1px solid ${isPlaying ? "#50fa7b" : (darkMode ? "rgba(80,250,123,0.3)" : "rgba(5,150,105,0.4)")}`,
                    color: isPlaying ? "#50fa7b" : circuit.length === 0 ? (darkMode ? "#334455" : "#94a3b8") : (darkMode ? "#50fa7b" : "#059669"),
                    fontSize: 13, cursor: circuit.length === 0 ? "not-allowed" : "pointer"
                  }}>
                  {isPlaying ? "⏹" : "▶"}
                </button>
                <div style={{ width: 1, height: 20, background: "#0a2030", margin: "0 3px" }} />
                <button title="Undo" className="ctrl-btn"
                  onClick={() => { setCircuit(c => c.slice(0, -1)); setActiveStep(-1); setResults(null); }}
                  disabled={isPlaying || circuit.length === 0}
                  style={{
                    width: 32, height: 29, borderRadius: 7,
                    background: darkMode ? "#0a1a28" : "#fef9c3",
                    border: darkMode ? "1px solid rgba(255,204,68,0.25)" : "1px solid rgba(202,138,4,0.35)",
                    color: isPlaying || circuit.length === 0 ? (darkMode ? "#334455" : "#94a3b8") : (darkMode ? "#ffcc44" : "#b45309"),
                    fontSize: 14, cursor: isPlaying || circuit.length === 0 ? "not-allowed" : "pointer"
                  }}>↩</button>
                <button title="Clear" className="ctrl-btn"
                  onClick={() => { setCircuit([]); setActiveStep(-1); setResults(null); }} disabled={isPlaying}
                  style={{
                    width: 32, height: 29, borderRadius: 7,
                    background: darkMode ? "#0a1a28" : "#fee2e2",
                    border: darkMode ? "1px solid rgba(255,85,85,0.25)" : "1px solid rgba(239,68,68,0.35)",
                    color: isPlaying ? (darkMode ? "#334455" : "#94a3b8") : (darkMode ? "#ff5555" : "#dc2626"),
                    fontSize: 13, cursor: isPlaying ? "not-allowed" : "pointer"
                  }}>🗑</button>
                <div style={{ flex: 1 }} />
                <span style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 9.5,
                  color: darkMode ? "#1a3a55" : "#94a3b8"
                }}>
                  {circuit.length} gate{circuit.length !== 1 ? "s" : ""}
                  {circuit.length > 0 && ` · step ${Math.max(0, activeStep + 1)}/${circuit.length}`}
                </span>
              </div>
              <div style={{
                background: darkMode ? "#04090f" : "#f0f6ff",
                borderRadius: 9, padding: "8px 10px",
                border: darkMode ? "1px solid rgba(0,245,255,0.08)" : "1px solid rgba(37,99,235,0.12)",
                minHeight: 122, transition: "background 0.35s, border-color 0.35s"
              }}>
                <CircuitWires circuit={circuit} activeStep={activeStep} onRemove={removeGate} isPlaying={isPlaying} />
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono',monospace", fontSize: 8.5,
                color: darkMode ? "#1a3a55" : "#94a3b8", marginTop: 5
              }}>
                click any gate on the wire to remove it
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{
            borderLeft: "1px solid var(--border)", overflowY: "auto",
            background: "var(--panel)", padding: "14px 10px 18px"
          }}>
            <div style={SL}><div style={dot("#ff79c6")} /> STATE INFO</div>
            <StatePanel sv={displaySV} probs={probs} shots={shots} results={results}
              onMeasure={measure} onShots={setShots} />
          </div>
        </div>
      </div>

      {picking && <QubitPicker gateName={picking} onConfirm={confirmGate} onCancel={() => setPicking(null)} />}
      <QuantumChatbot />
    </>
  );
}
