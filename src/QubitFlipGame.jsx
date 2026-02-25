import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ══════════════════════════════════════════════════════
   QUBIT FLIP CHALLENGE — Interactive Quantum Game
   ══════════════════════════════════════════════════════ */

const PI = Math.PI;
const S2 = Math.SQRT1_2;

/* ─── QUANTUM MATH (single qubit) ─────────────── */
// State = [re0, im0, re1, im1]
function initQ() { return [1, 0, 0, 0]; }
function cloneQ(s) { return [...s]; }

function apply(s, m) {
    const [ar, ai, br, bi, cr, ci, dr, di] = m;
    const [r0, i0, r1, i1] = s;
    return [
        ar * r0 - ai * i0 + br * r1 - bi * i1,
        ar * i0 + ai * r0 + br * i1 + bi * r1,
        cr * r0 - ci * i0 + dr * r1 - di * i1,
        cr * i0 + ci * r0 + dr * i1 + di * r1,
    ];
}

function getMat(name, p = PI / 2) {
    const c = Math.cos, s = Math.sin;
    switch (name) {
        case "X": return [0, 0, 1, 0, 1, 0, 0, 0];
        case "Y": return [0, 0, 0, -1, 0, 1, 0, 0];
        case "Z": return [1, 0, 0, 0, 0, 0, -1, 0];
        case "H": return [S2, 0, S2, 0, S2, 0, -S2, 0];
        case "S": return [1, 0, 0, 0, 0, 0, 0, 1];
        case "T": return [1, 0, 0, 0, 0, 0, S2, S2];
        case "Rx": return [c(p / 2), 0, 0, -s(p / 2), 0, -s(p / 2), c(p / 2), 0];
        case "Ry": return [c(p / 2), 0, -s(p / 2), 0, s(p / 2), 0, c(p / 2), 0];
        case "Rz": return [c(p / 2), -s(p / 2), 0, 0, 0, 0, c(p / 2), s(p / 2)];
        default: return [1, 0, 0, 0, 0, 0, 1, 0];
    }
}

function blochVec(s) {
    const [r0, i0, r1, i1] = s;
    const x = 2 * (r0 * r1 + i0 * i1);
    const y = 2 * (i0 * r1 - r0 * i1);
    const z = r0 * r0 + i0 * i0 - r1 * r1 - i1 * i1;
    return [x, y, z];
}

function blochDist(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/* ─── LEVELS ──────────────────────────────────── */
const LEVELS = [
    {
        name: "Bit Flip",
        desc: "Flip |0⟩ to |1⟩ using the X gate",
        hint: "The X gate is the quantum NOT — it flips the qubit!",
        start: [1, 0, 0, 0],
        target: [0, 0, 1, 0],
        gates: ["X"],
        minGates: 1,
        concept: "Pauli-X (NOT gate)",
    },
    {
        name: "Superposition",
        desc: "Put |0⟩ into superposition |+⟩",
        hint: "Hadamard creates equal superposition — try H!",
        start: [1, 0, 0, 0],
        target: [S2, 0, S2, 0],
        gates: ["H"],
        minGates: 1,
        concept: "Hadamard gate",
    },
    {
        name: "Undo!",
        desc: "Bring |+⟩ back to |0⟩",
        hint: "H applied twice = Identity. H² = I!",
        start: [S2, 0, S2, 0],
        target: [1, 0, 0, 0],
        gates: ["H"],
        minGates: 1,
        concept: "H² = Identity",
    },
    {
        name: "Phase Flip",
        desc: "Create |−⟩ from |0⟩",
        hint: "H then Z gives you the minus superposition.",
        start: [1, 0, 0, 0],
        target: [S2, 0, -S2, 0],
        gates: ["H", "Z"],
        minGates: 2,
        concept: "Phase matters!",
    },
    {
        name: "Quarter Turn",
        desc: "Reach |i⟩ = (|0⟩+i|1⟩)/√2",
        hint: "Try H first, then S for a π/2 phase.",
        start: [1, 0, 0, 0],
        target: [S2, 0, 0, S2],
        gates: ["H", "S"],
        minGates: 2,
        concept: "S gate (√Z)",
    },
    {
        name: "Combo Move",
        desc: "Get from |1⟩ to |+⟩",
        hint: "First flip with X, then create superposition with H!",
        start: [0, 0, 1, 0],
        target: [S2, 0, S2, 0],
        gates: ["X", "H"],
        minGates: 2,
        concept: "Gate chaining",
    },
    {
        name: "Roundabout",
        desc: "|0⟩ → |1⟩ but use H gates!",
        hint: "H → X → H is another way to flip. Or just X!",
        start: [1, 0, 0, 0],
        target: [0, 0, 1, 0],
        gates: ["H", "X", "Z"],
        minGates: 1,
        concept: "Multiple paths",
    },
    {
        name: "Y Rotation",
        desc: "Rotate to a custom angle on the YZ plane",
        hint: "Use the Ry slider to rotate exactly to the target.",
        start: [1, 0, 0, 0],
        target: [Math.cos(PI / 6), 0, Math.sin(PI / 6), 0], // 60° from |0⟩
        gates: ["Ry"],
        minGates: 1,
        concept: "Rotation gates",
    },
    {
        name: "Phase Chain",
        desc: "|+⟩ → |−i⟩ via phase gates",
        hint: "S adds π/2 phase. Adding S then Z gets you to −i.",
        start: [S2, 0, S2, 0],
        target: [S2, 0, 0, -S2],
        gates: ["S", "Z", "T"],
        minGates: 2,
        concept: "Phase accumulation",
    },
    {
        name: "Full Circuit",
        desc: "Combine everything! |0⟩ → |−i⟩",
        hint: "Think: H then S then Z. Or find your own path!",
        start: [1, 0, 0, 0],
        target: [S2, 0, 0, -S2],
        gates: ["H", "X", "Y", "Z", "S", "T"],
        minGates: 3,
        concept: "Quantum mastery!",
    },
];

/* ─── GATE COLORS ─────────────────────────────── */
const GCOLS = {
    X: "#ff5555", Y: "#ffb86c", Z: "#f1fa8c", H: "#50fa7b",
    S: "#8be9fd", T: "#bd93f9", Rx: "#ffaa80", Ry: "#ff9060", Rz: "#c897ff",
};

/* ─── BLOCH CANVAS ────────────────────────────── */
function BlochBall({ vec, targetVec, size, won }) {
    const ref = useRef(null);

    useEffect(() => {
        const cv = ref.current; if (!cv) return;
        const ctx = cv.getContext("2d");
        const W = cv.width, H = cv.height;
        const cx = W / 2, cy = H / 2, R = W / 2 - 24;
        ctx.clearRect(0, 0, W, H);

        // background glow
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
        bg.addColorStop(0, won ? "rgba(80,250,123,0.08)" : "rgba(0,245,255,0.06)");
        bg.addColorStop(1, "transparent");
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, 2 * PI); ctx.fill();

        // sphere outline
        ctx.strokeStyle = won ? "#50fa7b55" : "#00f5ff33";
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * PI); ctx.stroke();

        // equator ellipse
        ctx.strokeStyle = won ? "#50fa7b22" : "#00f5ff18";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.28, 0, 0, 2 * PI); ctx.stroke();

        // axes
        ctx.strokeStyle = "#ffffff08"; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();

        // labels
        ctx.font = "10px 'Share Tech Mono',monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#00f5ff55";
        ctx.fillText("|0⟩", cx, cy - R - 8);
        ctx.fillText("|1⟩", cx, cy + R + 14);
        ctx.fillText("+X", cx + R + 12, cy + 4);
        ctx.fillText("−X", cx - R - 12, cy + 4);

        function project(bx, by, bz) {
            const px = (bx * 0.65 + by * 0.3) * R;
            const py = (-bz - by * 0.28) * R;
            return [cx + px, cy + py];
        }

        // draw target ghost
        if (targetVec) {
            const [tx, ty] = project(...targetVec);
            const tMag = Math.sqrt(targetVec[0] ** 2 + targetVec[1] ** 2 + targetVec[2] ** 2);
            if (tMag > 0.02) {
                // dashed line
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = "#50fa7b44";
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty); ctx.stroke();
                ctx.setLineDash([]);
                // target dot
                ctx.fillStyle = "#50fa7b";
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.004) * 0.2;
                ctx.shadowColor = "#50fa7b";
                ctx.shadowBlur = 12;
                ctx.beginPath(); ctx.arc(tx, ty, 8, 0, 2 * PI); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
                // label
                ctx.font = "bold 10px 'Exo 2',sans-serif";
                ctx.fillStyle = "#50fa7b88";
                ctx.fillText("TARGET", tx, ty - 14);
            }
        }

        // draw current vector
        const [bx, by, bz] = vec;
        const mag = Math.sqrt(bx * bx + by * by + bz * bz);
        if (mag > 0.02) {
            const [px, py] = project(bx, by, bz);
            // solid line
            const g = ctx.createLinearGradient(cx, cy, px, py);
            g.addColorStop(0, won ? "#50fa7b55" : "#00f5ff55");
            g.addColorStop(1, won ? "#50fa7b" : "#00f5ff");
            ctx.strokeStyle = g; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
            // arrowhead
            const ang = Math.atan2(py - cy, px - cx);
            ctx.fillStyle = won ? "#50fa7b" : "#00f5ff";
            ctx.shadowColor = won ? "#50fa7b" : "#00f5ff";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - 11 * Math.cos(ang - 0.4), py - 11 * Math.sin(ang - 0.4));
            ctx.lineTo(px - 11 * Math.cos(ang + 0.4), py - 11 * Math.sin(ang + 0.4));
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            // tip glow
            ctx.fillStyle = won ? "#50fa7b" : "#00f5ff";
            ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.arc(px, py, 14, 0, 2 * PI); ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = "#00f5ff33";
            ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * PI); ctx.fill();
        }
    });

    return (
        <canvas ref={ref} width={size} height={size}
            style={{ display: "block", borderRadius: 16, border: `1px solid ${won ? "#50fa7b22" : "#00f5ff11"}`, background: "#060e19" }} />
    );
}

/* ─── CONFETTI PARTICLES ──────────────────────── */
function Confetti({ active }) {
    const ref = useRef(null);
    useEffect(() => {
        if (!active) return;
        const cv = ref.current; if (!cv) return;
        const ctx = cv.getContext("2d");
        const W = cv.width = cv.parentElement.clientWidth;
        const H = cv.height = cv.parentElement.clientHeight;
        const cols = ["#00f5ff", "#ff79c6", "#50fa7b", "#ffcc44", "#bd93f9", "#ff5555"];
        const P = Array.from({ length: 50 }, () => ({
            x: W / 2 + (Math.random() - 0.5) * 100,
            y: H / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 10 - 3,
            r: Math.random() * 4 + 2,
            col: cols[Math.floor(Math.random() * cols.length)],
            rot: Math.random() * 6.28,
            rv: (Math.random() - 0.5) * 0.3,
            life: 1,
        }));
        let raf;
        function draw() {
            ctx.clearRect(0, 0, W, H);
            let alive = false;
            for (const p of P) {
                if (p.life <= 0) continue;
                alive = true;
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.15; p.vx *= 0.99;
                p.rot += p.rv;
                p.life -= 0.012;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.col;
                ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
                ctx.restore();
            }
            if (alive) raf = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(raf);
    }, [active]);

    if (!active) return null;
    return <canvas ref={ref} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }} />;
}

/* ─── STYLES ──────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
.qfg{font-family:'Inter',sans-serif;background:#04090f;color:#b0cce0;min-height:100vh;
  display:flex;flex-direction:column;overflow:hidden;position:relative}
.qfg *{box-sizing:border-box;margin:0;padding:0}
.qfg-grid{position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(0,245,255,0.012) 1px,transparent 1px),
  linear-gradient(90deg,rgba(0,245,255,0.012) 1px,transparent 1px);background-size:50px 50px}

@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
@keyframes winPulse{0%,100%{box-shadow:0 0 20px rgba(80,250,123,0.2)}50%{box-shadow:0 0 50px rgba(80,250,123,0.5)}}
@keyframes shimmer{0%{left:-100%}100%{left:200%}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes gradFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

.qfg-hdr{position:relative;z-index:5;display:flex;align-items:center;gap:14px;
  padding:0 24px;height:58px;border-bottom:1px solid rgba(0,245,255,0.06);
  background:rgba(4,9,15,0.95);flex-shrink:0}
.qfg-hdr .logo{font-family:'Orbitron',monospace;font-weight:900;font-size:15px;
  color:#00f5ff;letter-spacing:2px;display:flex;align-items:center;gap:10px;text-shadow:0 0 15px rgba(0,245,255,0.25)}
.qfg-hdr .spinner{width:22px;height:22px;border:2px solid rgba(0,245,255,0.1);
  border-top-color:#00f5ff;border-radius:50%;animation:spin 2.5s linear infinite}
.qfg-hdr .lv{font-family:'Share Tech Mono',monospace;font-size:12px;
  padding:4px 14px;border-radius:8px;border:1px solid rgba(0,245,255,0.15);
  background:rgba(0,245,255,0.05);color:#00f5ff;letter-spacing:1px}
.qfg-hdr .score{font-family:'Orbitron',monospace;font-size:14px;color:#ffcc44;
  text-shadow:0 0 10px rgba(255,204,68,0.3)}
.qfg-hdr .timer{font-family:'Share Tech Mono',monospace;font-size:13px;color:#4a6878}
.qfg-hdr .sep{flex:1}

.qfg-back{background:none;border:1px solid rgba(0,245,255,0.12);border-radius:8px;
  color:#4a6878;font-family:'Exo 2',sans-serif;font-size:11px;padding:6px 16px;
  cursor:pointer;transition:all .2s;letter-spacing:.5px}
.qfg-back:hover{color:#00f5ff;border-color:rgba(0,245,255,0.3);transform:translateY(-1px)}

.qfg-body{flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;padding:30px 24px;position:relative;z-index:1;gap:24px}

.qfg-title{font-family:'Orbitron',monospace;font-weight:900;font-size:20px;
  color:#d8eef8;text-align:center;animation:fadeIn .5s ease both}
.qfg-desc{font-family:'Exo 2',sans-serif;font-size:14px;color:#5a8899;
  text-align:center;max-width:440px;animation:fadeIn .6s ease both .1s}
.qfg-concept{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;
  color:#bd93f9;text-align:center;animation:fadeIn .6s ease both .15s;
  padding:4px 14px;border:1px solid rgba(189,147,249,0.15);border-radius:12px;
  background:rgba(189,147,249,0.04)}

.qfg-spheres{display:flex;gap:40px;align-items:center;justify-content:center;
  animation:slideIn .5s ease both .2s;flex-wrap:wrap}
.qfg-sphere-wrap{display:flex;flex-direction:column;align-items:center;gap:8px}
.qfg-sphere-label{font-family:'Orbitron',monospace;font-size:10px;letter-spacing:3px}
.qfg-vs{font-family:'Orbitron',monospace;font-size:22px;font-weight:900;
  color:#1e3d55;text-shadow:0 0 10px rgba(0,245,255,0.1)}

.qfg-gates{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;
  animation:fadeIn .6s ease both .3s;max-width:500px}
.qfg-gate{position:relative;overflow:hidden;padding:10px 18px;border-radius:10px;
  font-family:'Orbitron',monospace;font-weight:700;font-size:13px;cursor:pointer;
  transition:all .2s cubic-bezier(.34,1.56,.64,1);border:1.5px solid}
.qfg-gate .sh{position:absolute;top:0;width:30px;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
  transform:skewX(-20deg);left:-100%;pointer-events:none}
.qfg-gate:hover .sh{animation:shimmer .5s ease both}
.qfg-gate:hover{transform:translateY(-3px) scale(1.08);filter:brightness(1.25)}
.qfg-gate:active{transform:scale(0.9)}

.qfg-slider{display:flex;align-items:center;gap:12px;animation:fadeIn .6s ease both .35s}
.qfg-slider input[type=range]{-webkit-appearance:none;width:180px;background:transparent;cursor:pointer}
.qfg-slider input[type=range]::-webkit-slider-track{background:#091520;height:5px;border-radius:5px}
.qfg-slider input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;
  border-radius:50%;background:#ff9060;margin-top:-5px;box-shadow:0 0 8px rgba(255,144,96,0.4)}
.qfg-slider .ang{font-family:'Share Tech Mono',monospace;font-size:12px;color:#ff9060;min-width:60px}

.qfg-controls{display:flex;gap:10px;animation:fadeIn .6s ease both .4s}
.qfg-ctrl{padding:8px 20px;border-radius:8px;font-family:'Exo 2',sans-serif;
  font-weight:600;font-size:11px;cursor:pointer;transition:all .2s;letter-spacing:1px}
.qfg-ctrl:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.2)}
.qfg-ctrl:disabled{opacity:0.3;cursor:not-allowed}

.qfg-hint{font-family:'Inter',sans-serif;font-size:12px;color:#3a5a6a;text-align:center;
  max-width:380px;line-height:1.6;font-style:italic;animation:fadeIn .7s ease both .5s}
.qfg-hint b{color:#5a8899;font-style:normal}

.qfg-status{font-family:'Share Tech Mono',monospace;font-size:10px;color:#1e3d55;
  text-align:center;letter-spacing:1px;animation:fadeIn .6s ease both .4s}

/* WIN OVERLAY */
.qfg-win{position:absolute;inset:0;background:rgba(4,9,15,0.9);z-index:20;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  animation:slideIn .4s ease both;backdrop-filter:blur(8px)}
.qfg-win-title{font-family:'Orbitron',monospace;font-weight:900;font-size:clamp(28px,5vw,42px);
  color:#50fa7b;text-shadow:0 0 40px rgba(80,250,123,0.4);animation:winPulse 2s ease-in-out infinite}
.qfg-win-sub{font-family:'Exo 2',sans-serif;font-size:16px;color:#5a8899}
.qfg-win-score{font-family:'Orbitron',monospace;font-size:22px;color:#ffcc44;
  text-shadow:0 0 15px rgba(255,204,68,0.3)}
.qfg-win-detail{font-family:'Share Tech Mono',monospace;font-size:11px;color:#3a5a6a;
  text-align:center;line-height:1.8}
.qfg-win-btn{padding:14px 40px;border:none;border-radius:12px;
  font-family:'Orbitron',monospace;font-weight:900;font-size:13px;letter-spacing:2px;
  cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);
  background:linear-gradient(135deg,#00f5ff,#00b8d4);color:#04090f;
  box-shadow:0 4px 25px rgba(0,245,255,0.3);margin-top:8px}
.qfg-win-btn:hover{transform:translateY(-3px) scale(1.06);
  box-shadow:0 8px 40px rgba(0,245,255,0.45)}

/* COMPLETE SCREEN */
.qfg-complete{text-align:center}
.qfg-complete-sub{font-family:'Exo 2',sans-serif;font-size:14px;color:#5a8899;margin-top:8px}
.qfg-complete-score{font-family:'Orbitron',monospace;font-size:36px;color:#ffcc44;
  text-shadow:0 0 30px rgba(255,204,68,0.3);margin:20px 0}
.qfg-complete-btns{display:flex;gap:14px;justify-content:center;margin-top:20px}
`;

const WIN_THRESHOLD = 0.15; // Bloch distance threshold to win

/* ─── MAIN GAME COMPONENT ─────────────────────── */
export default function QubitFlipGame({ onBack }) {
    const [level, setLevel] = useState(0);
    const [state, setState] = useState(cloneQ(LEVELS[0].start));
    const [history, setHistory] = useState([]);
    const [score, setScore] = useState(0);
    const [won, setWon] = useState(false);
    const [complete, setComplete] = useState(false);
    const [timer, setTimer] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [rotAngle, setRotAngle] = useState(PI / 2);
    const [confetti, setConfetti] = useState(false);
    const timerRef = useRef(null);
    const animRef = useRef(null);

    const lv = LEVELS[level];
    const curBloch = useMemo(() => blochVec(state), [state]);
    const tgtBloch = useMemo(() => blochVec(lv.target), [lv.target]);
    const dist = blochDist(curBloch, tgtBloch);

    // Timer
    useEffect(() => {
        if (won || complete) return;
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, [level, won, complete]);

    // Force re-render for target pulsing
    useEffect(() => {
        if (won) return;
        function tick() { animRef.current = requestAnimationFrame(tick); }
        tick();
        return () => cancelAnimationFrame(animRef.current);
    }, [won, level]);

    // Check win
    useEffect(() => {
        if (dist < WIN_THRESHOLD && !won && history.length > 0) {
            setWon(true);
            setConfetti(true);
            clearInterval(timerRef.current);
            // Calculate score
            const gatesUsed = history.length;
            const minG = lv.minGates;
            const gateScore = Math.max(5, 30 - (gatesUsed - minG) * 5);
            const timeBonus = Math.max(0, 20 - Math.floor(timer / 5));
            const perfectBonus = gatesUsed === minG ? 25 : 0;
            setScore(s => s + gateScore + timeBonus + perfectBonus);
        }
    }, [dist, won, history.length, lv.minGates, timer]);

    function applyGate(name) {
        if (won) return;
        const param = (name === "Rx" || name === "Ry" || name === "Rz") ? rotAngle : undefined;
        const mat = getMat(name, param);
        const next = apply(state, mat);
        setHistory(h => [...h, cloneQ(state)]);
        setState(next);
        setShowHint(false);
    }

    function undo() {
        if (history.length === 0 || won) return;
        setState(history[history.length - 1]);
        setHistory(h => h.slice(0, -1));
    }

    function resetLevel() {
        setState(cloneQ(lv.start));
        setHistory([]);
        setWon(false);
        setConfetti(false);
        setTimer(0);
        setShowHint(false);
    }

    function nextLevel() {
        if (level + 1 >= LEVELS.length) {
            setComplete(true);
            setConfetti(true);
            return;
        }
        const nl = level + 1;
        setLevel(nl);
        setState(cloneQ(LEVELS[nl].start));
        setHistory([]);
        setWon(false);
        setConfetti(false);
        setTimer(0);
        setShowHint(false);
    }

    function restart() {
        setLevel(0);
        setState(cloneQ(LEVELS[0].start));
        setHistory([]);
        setScore(0);
        setWon(false);
        setComplete(false);
        setConfetti(false);
        setTimer(0);
        setShowHint(false);
    }

    const hasRot = lv.gates.some(g => g === "Rx" || g === "Ry" || g === "Rz");
    const fmtTime = `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")}`;
    const matchPct = Math.max(0, Math.round((1 - dist / 2) * 100));

    return (
        <div className="qfg">
            <style>{CSS}</style>
            <div className="qfg-grid" />

            {/* HEADER */}
            <header className="qfg-hdr">
                <div className="logo"><div className="spinner" />QUBIT FLIP</div>
                <span className="lv">LV.{level + 1}/{LEVELS.length}</span>
                <span className="score">⭐ {score}</span>
                <span className="timer">⏱ {fmtTime}</span>
                <span className="sep" />
                <button className="qfg-back" onClick={onBack}>← Home</button>
            </header>

            {/* BODY */}
            <div className="qfg-body" key={level}>
                <Confetti active={confetti} />

                {!complete && !won && (
                    <>
                        <div className="qfg-concept">{lv.concept}</div>
                        <div className="qfg-title">{lv.name}</div>
                        <div className="qfg-desc">{lv.desc}</div>

                        {/* Bloch spheres */}
                        <div className="qfg-spheres">
                            <div className="qfg-sphere-wrap">
                                <span className="qfg-sphere-label" style={{ color: "#00f5ff" }}>YOUR QUBIT</span>
                                <BlochBall vec={curBloch} targetVec={tgtBloch} size={220} won={false} />
                            </div>
                            <div className="qfg-vs">→</div>
                            <div className="qfg-sphere-wrap">
                                <span className="qfg-sphere-label" style={{ color: "#50fa7b" }}>TARGET</span>
                                <BlochBall vec={tgtBloch} targetVec={null} size={220} won={false} />
                            </div>
                        </div>

                        {/* Match meter */}
                        <div style={{ width: 260, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn .5s ease both .25s" }}>
                            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#3a5a6a", minWidth: 42 }}>MATCH</span>
                            <div style={{ flex: 1, height: 6, background: "#091520", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                    width: `${matchPct}%`, height: "100%", borderRadius: 3,
                                    background: matchPct > 90 ? "linear-gradient(90deg,#50fa7b,#00f5ff)" : matchPct > 50 ? "linear-gradient(90deg,#ffcc44,#00f5ff)" : "#ff5555",
                                    boxShadow: matchPct > 90 ? "0 0 8px rgba(80,250,123,0.5)" : "none",
                                    transition: "width .3s, background .3s",
                                }} />
                            </div>
                            <span style={{
                                fontFamily: "'Orbitron',monospace", fontSize: 12, fontWeight: 900, minWidth: 36, textAlign: "right",
                                color: matchPct > 90 ? "#50fa7b" : matchPct > 50 ? "#ffcc44" : "#ff5555",
                            }}>{matchPct}%</span>
                        </div>

                        {/* Gate buttons */}
                        <div className="qfg-gates">
                            {lv.gates.map(g => (
                                <button key={g} className="qfg-gate"
                                    onClick={() => applyGate(g)}
                                    style={{
                                        color: GCOLS[g] || "#00f5ff",
                                        borderColor: (GCOLS[g] || "#00f5ff") + "55",
                                        background: (GCOLS[g] || "#00f5ff") + "0c",
                                    }}
                                >
                                    <span className="sh" />{g}
                                </button>
                            ))}
                        </div>

                        {/* Rotation slider */}
                        {hasRot && (
                            <div className="qfg-slider">
                                <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 11, color: "#5a8899" }}>θ</span>
                                <input type="range" min={-PI} max={PI} step={0.05} value={rotAngle}
                                    onChange={e => setRotAngle(parseFloat(e.target.value))} />
                                <span className="ang">{(rotAngle * 180 / PI).toFixed(0)}°</span>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="qfg-controls">
                            <button className="qfg-ctrl" onClick={undo} disabled={history.length === 0}
                                style={{ background: "rgba(255,204,68,0.08)", border: "1px solid rgba(255,204,68,0.2)", color: "#ffcc44" }}>
                                ↩ Undo
                            </button>
                            <button className="qfg-ctrl" onClick={resetLevel}
                                style={{ background: "rgba(255,85,85,0.08)", border: "1px solid rgba(255,85,85,0.2)", color: "#ff5555" }}>
                                ⟲ Reset
                            </button>
                            <button className="qfg-ctrl" onClick={() => setShowHint(!showHint)}
                                style={{ background: "rgba(189,147,249,0.08)", border: "1px solid rgba(189,147,249,0.2)", color: "#bd93f9" }}>
                                💡 Hint
                            </button>
                        </div>

                        {showHint && (
                            <div className="qfg-hint">
                                💡 <b>Hint:</b> {lv.hint}
                            </div>
                        )}

                        <div className="qfg-status">
                            gates used: {history.length} · minimum: {lv.minGates}
                        </div>
                    </>
                )}

                {/* WIN SCREEN */}
                {won && !complete && (
                    <div className="qfg-win">
                        <Confetti active={confetti} />
                        <div className="qfg-win-title">🎉 Level Complete!</div>
                        <div className="qfg-win-sub">You mastered: <b>{lv.concept}</b></div>
                        <div className="qfg-win-score">⭐ {score} pts</div>
                        <div className="qfg-win-detail">
                            Gates used: {history.length} (optimal: {lv.minGates})<br />
                            Time: {fmtTime}<br />
                            {history.length === lv.minGates ? "🏆 PERFECT — minimum gates!" : ""}
                        </div>
                        <button className="qfg-win-btn" onClick={nextLevel}>
                            {level + 1 < LEVELS.length ? "→ Next Level" : "🏆 Finish"}
                        </button>
                    </div>
                )}

                {/* COMPLETE SCREEN */}
                {complete && (
                    <div className="qfg-win qfg-complete">
                        <Confetti active={confetti} />
                        <div className="qfg-win-title">🏆 Quantum Master!</div>
                        <div className="qfg-complete-sub">You completed all {LEVELS.length} levels!</div>
                        <div className="qfg-complete-score">⭐ {score}</div>
                        <div className="qfg-win-detail">
                            You've learned: Bit flips, Superposition, Phase gates,<br />
                            Rotation gates, Gate chaining, and more!
                        </div>
                        <div className="qfg-complete-btns">
                            <button className="qfg-win-btn" onClick={restart}>🔄 Play Again</button>
                            <button className="qfg-win-btn" onClick={onBack}
                                style={{ background: "linear-gradient(135deg,#ff79c6,#bd93f9)" }}>
                                ⚛ Enter Lab
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
