import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";

/* ─── STYLES ─────────────────────────────────────── */
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Exo+2:wght@400;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: #04090f; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,245,255,0.2); border-radius: 2px; }
  input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; }
  input[type=range]::-webkit-slider-track { background: #0a1e2e; height: 4px; border-radius: 4px; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #00f5ff; margin-top: -5px; box-shadow: 0 0 8px rgba(0,245,255,0.5); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .gate-btn { transition: transform 0.12s, filter 0.12s, box-shadow 0.12s; cursor: pointer; border: none; }
  .gate-btn:hover { transform: scale(1.12) translateY(-2px); filter: brightness(1.45); }
  .gate-btn:active { transform: scale(0.9); }
  .preset-btn { transition: all 0.15s; cursor: pointer; border: none; }
  .preset-btn:hover { filter: brightness(1.3); transform: translateY(-1px); }
`;

/* ─── CONSTANTS ─────────────────────────────────── */
const PI = Math.PI;
const S2 = Math.SQRT1_2;
const QCOLORS = ["#00f5ff", "#ff79c6"];

const GATE_DEFS = {
  I:    { label:"I",    color:"#6272a4", qn:1, cat:"basic", tip:"Identity — does nothing, useful as placeholder" },
  X:    { label:"X",    color:"#ff5555", qn:1, cat:"basic", tip:"Pauli-X (NOT gate) — flips |0⟩↔|1⟩, π rotation around X" },
  Y:    { label:"Y",    color:"#ffb86c", qn:1, cat:"basic", tip:"Pauli-Y — combined bit + phase flip" },
  Z:    { label:"Z",    color:"#f1fa8c", qn:1, cat:"basic", tip:"Pauli-Z — phase flip: |1⟩ → −|1⟩" },
  H:    { label:"H",    color:"#50fa7b", qn:1, cat:"basic", tip:"Hadamard — creates equal superposition |+⟩ or |−⟩" },
  S:    { label:"S",    color:"#8be9fd", qn:1, cat:"phase", tip:"S gate (√Z) — π/2 phase rotation" },
  SDG:  { label:"S†",   color:"#5fd8f5", qn:1, cat:"phase", tip:"S-dagger — −π/2 phase rotation" },
  T:    { label:"T",    color:"#bd93f9", qn:1, cat:"phase", tip:"T gate (π/8) — π/4 phase rotation" },
  TDG:  { label:"T†",   color:"#a57fef", qn:1, cat:"phase", tip:"T-dagger — −π/4 phase rotation" },
  SX:   { label:"√X",   color:"#ff79c6", qn:1, cat:"phase", tip:"Square-root of NOT gate" },
  RX:   { label:"Rx",   color:"#ffaa80", qn:1, cat:"rot",   tip:"Rotation around X-axis by angle θ", param:true },
  RY:   { label:"Ry",   color:"#ff9060", qn:1, cat:"rot",   tip:"Rotation around Y-axis by angle θ", param:true },
  RZ:   { label:"Rz",   color:"#c897ff", qn:1, cat:"rot",   tip:"Rotation around Z-axis by angle θ", param:true },
  CNOT: { label:"CNOT", color:"#00ff99", qn:2, cat:"two",   tip:"⭐ CNOT — THE entanglement gate. Flips target when control=|1⟩", ctrl:true },
  CZ:   { label:"CZ",   color:"#00ddff", qn:2, cat:"two",   tip:"Controlled-Z — phase flip on |11⟩", ctrl:true },
  CY:   { label:"CY",   color:"#44ffbb", qn:2, cat:"two",   tip:"Controlled-Y gate", ctrl:true },
  CH:   { label:"CH",   color:"#22ee88", qn:2, cat:"two",   tip:"Controlled-Hadamard", ctrl:true },
  SWAP: { label:"SWAP", color:"#ff79aa", qn:2, cat:"two",   tip:"SWAP — exchanges states of two qubits" },
};

const GATE_CATS = [
  { key:"basic", label:"PAULI / BASIC" },
  { key:"phase", label:"PHASE" },
  { key:"rot",   label:"ROTATION" },
  { key:"two",   label:"2-QUBIT (entangling)" },
];

/* ─── QUANTUM MATH ──────────────────────────────── */
function initState() { const s = new Float64Array(8); s[0] = 1; return s; }
function cloneState(s) { return new Float64Array(s); }

function apply1Q(s, m, q) {
  const ns = cloneState(s);
  const bit = q === 0 ? 2 : 1;
  const [ar,ai, br,bi, cr,ci, dr,di] = m;
  for (let i = 0; i < 4; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const r0=s[2*i], i0=s[2*i+1], r1=s[2*j], i1=s[2*j+1];
    ns[2*i]   = ar*r0 - ai*i0 + br*r1 - bi*i1;
    ns[2*i+1] = ar*i0 + ai*r0 + br*i1 + bi*r1;
    ns[2*j]   = cr*r0 - ci*i0 + dr*r1 - di*i1;
    ns[2*j+1] = cr*i0 + ci*r0 + dr*i1 + di*r1;
  }
  return ns;
}

function applyCNOT(s, ctrl, tgt) {
  const ns = cloneState(s);
  const cBit = ctrl === 0 ? 2 : 1, tBit = tgt === 0 ? 2 : 1;
  for (let i = 0; i < 4; i++) {
    if (!(i & cBit) || (i & tBit)) continue;
    const j = i | tBit;
    ns[2*i]=s[2*j]; ns[2*i+1]=s[2*j+1]; ns[2*j]=s[2*i]; ns[2*j+1]=s[2*i+1];
  }
  return ns;
}

function applyCZ(s, c, t) {
  const ns = cloneState(s);
  const cB = c===0?2:1, tB = t===0?2:1;
  for (let i=0; i<4; i++) {
    ns[2*i]=s[2*i]; ns[2*i+1]=s[2*i+1];
    if ((i&cB) && (i&tB)) { ns[2*i]=-s[2*i]; ns[2*i+1]=-s[2*i+1]; }
  }
  return ns;
}

function applySWAP(s) {
  const ns = cloneState(s);
  ns[2]=s[4]; ns[3]=s[5]; ns[4]=s[2]; ns[5]=s[3];
  return ns;
}

function getMat(name, p) {
  const c = Math.cos, sn = Math.sin;
  switch(name) {
    case "I":   return [1,0,0,0,0,0,1,0];
    case "X":   return [0,0,1,0,1,0,0,0];
    case "Y":   return [0,0,0,-1,0,1,0,0];
    case "Z":   return [1,0,0,0,0,0,-1,0];
    case "H":   return [S2,0,S2,0,S2,0,-S2,0];
    case "S":   return [1,0,0,0,0,0,0,1];
    case "SDG": return [1,0,0,0,0,0,0,-1];
    case "T":   return [1,0,0,0,0,0,S2,S2];
    case "TDG": return [1,0,0,0,0,0,S2,-S2];
    case "SX":  return [0.5,0.5,0.5,-0.5,0.5,-0.5,0.5,0.5];
    case "RX":  return [c(p/2),0,0,-sn(p/2),0,-sn(p/2),c(p/2),0];
    case "RY":  return [c(p/2),0,-sn(p/2),0,sn(p/2),0,c(p/2),0];
    case "RZ":  return [c(p/2),-sn(p/2),0,0,0,0,c(p/2),sn(p/2)];
    default: return null;
  }
}

function runGate(state, gate) {
  const { name, qubits, param = PI/2 } = gate;
  if (name==="CNOT") return applyCNOT(state, qubits[0], qubits[1]);
  if (name==="CZ")   return applyCZ(state, qubits[0], qubits[1]);
  if (name==="SWAP") return applySWAP(state);
  if (name==="CY") {
    let s = apply1Q(state, getMat("S"), qubits[1]);
    s = applyCNOT(s, qubits[0], qubits[1]);
    return apply1Q(s, getMat("SDG"), qubits[1]);
  }
  if (name==="CH") {
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
  for (let i=0; i<4; i++) {
    ns[2*i]   = d*state[2*i]   + (i===0 ? (1-d)*0.5 : 0);
    ns[2*i+1] = d*state[2*i+1];
  }
  let n2 = 0;
  for (let i=0; i<4; i++) n2 += ns[2*i]*ns[2*i] + ns[2*i+1]*ns[2*i+1];
  const n = Math.sqrt(n2) || 1;
  for (let i=0; i<8; i++) ns[i] /= n;
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

function getProbs(sv) {
  return [0,1,2,3].map(i => sv[2*i]*sv[2*i] + sv[2*i+1]*sv[2*i+1]);
}

function reducedDM(sv, q) {
  let r00=0, r01re=0, r01im=0, r11=0;
  for (let i=0; i<4; i++) {
    for (let j=0; j<4; j++) {
      const qi = q===0 ? (i>>1)&1 : i&1;
      const qj = q===0 ? (j>>1)&1 : j&1;
      const oi = q===0 ? i&1 : (i>>1)&1;
      const oj = q===0 ? j&1 : (j>>1)&1;
      if (oi !== oj) continue;
      const re = sv[2*i]*sv[2*j] + sv[2*i+1]*sv[2*j+1];
      const im = sv[2*i+1]*sv[2*j] - sv[2*i]*sv[2*j+1];
      if (qi===0&&qj===0) r00+=re;
      else if (qi===0&&qj===1) { r01re+=re; r01im+=im; }
      else if (qi===1&&qj===1) r11+=re;
    }
  }
  return { r00, r01re, r01im, r11 };
}

function blochVec(dm) {
  return [2*dm.r01re, -2*dm.r01im, dm.r00 - dm.r11];
}

function tempToFidelity(K) {
  const logMin = Math.log10(0.015), logMax = Math.log10(300);
  const t = (Math.log10(Math.max(0.015,K)) - logMin) / (logMax - logMin);
  return Math.max(0.05, Math.min(0.99, 0.97 - 0.72 * t * t * (3 - 2*t)));
}

/* ─── BLOCH CANVAS 2D ──────────────────────────── */
function BlochCanvas({ bloch, color, label, size }) {
  const ref = useRef(null);
  const [bx,by,bz] = bloch;
  const mag = Math.sqrt(bx*bx+by*by+bz*bz);
  const purity = (1+mag*mag)/2;

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W=cv.width, H=cv.height, cx=W/2, cy=H/2, R=W/2-12;
    ctx.clearRect(0,0,W,H);

    const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,R);
    bg.addColorStop(0, color+"18"); bg.addColorStop(1,"transparent");
    ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(cx,cy,R,0,2*PI); ctx.fill();

    ctx.strokeStyle=color+"44"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(cx,cy,R,0,2*PI); ctx.stroke();

    ctx.strokeStyle=color+"25"; ctx.lineWidth=0.9;
    ctx.beginPath(); ctx.ellipse(cx,cy,R,R*0.28,0,0,2*PI); ctx.stroke();

    ctx.strokeStyle="#ffffff10"; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-R,cy); ctx.lineTo(cx+R,cy); ctx.stroke();

    // Purity arc
    const pc = purity>0.85 ? color : purity>0.5 ? "#ffcc44" : "#ff4444";
    ctx.strokeStyle=pc; ctx.lineWidth=2.5;
    ctx.shadowColor=pc; ctx.shadowBlur=5;
    ctx.beginPath(); ctx.arc(cx,cy,R+4,-PI/2,-PI/2+purity*2*PI); ctx.stroke();
    ctx.shadowBlur=0;

    // Bloch vector
    if (mag>0.02) {
      const px=(bx*0.65+by*0.3)*R*mag, py=(-bz-by*0.28)*R*mag;
      ctx.strokeStyle=color+"20"; ctx.lineWidth=0.8; ctx.setLineDash([3,4]);
      ctx.beginPath(); ctx.moveTo(cx+px,cy+py); ctx.lineTo(cx+px,cy); ctx.stroke();
      ctx.setLineDash([]);
      const g=ctx.createLinearGradient(cx,cy,cx+px,cy+py);
      g.addColorStop(0,color+"55"); g.addColorStop(1,color);
      ctx.strokeStyle=g; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+px,cy+py); ctx.stroke();
      const ang=Math.atan2(py,px);
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10;
      ctx.beginPath();
      ctx.moveTo(cx+px,cy+py);
      ctx.lineTo(cx+px-9*Math.cos(ang-0.4),cy+py-9*Math.sin(ang-0.4));
      ctx.lineTo(cx+px-9*Math.cos(ang+0.4),cy+py-9*Math.sin(ang+0.4));
      ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
    } else {
      ctx.fillStyle=color+"33"; ctx.shadowColor=color; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(cx,cy,5,0,2*PI); ctx.fill(); ctx.shadowBlur=0;
    }

    ctx.font="8px 'Share Tech Mono',monospace"; ctx.textAlign="center";
    ctx.fillStyle=color+"66";
    ctx.fillText("|0⟩",cx,cy-R-4); ctx.fillText("|1⟩",cx,cy+R+11);

    ctx.font="bold 11px 'Exo 2',sans-serif";
    ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=6;
    ctx.fillText(label,cx,H-2); ctx.shadowBlur=0;
  }, [bloch, color, label, purity, mag]);

  return (
    <canvas ref={ref} width={size} height={size}
      style={{ display:"block", borderRadius:9, border:`1px solid ${color}22`, background:"#04090f" }}/>
  );
}

/* ─── 3D BLOCH SPHERE ──────────────────────────── */
function BigBloch3D({ bloch0, bloch1 }) {
  const mountRef = useRef(null);
  const R = useRef({
    renderer:null, scene:null, camera:null,
    a0:null, a1:null, raf:null,
    c0:[0,0,1], c1:[0,0,1],
    t0:[0,0,1], t1:[0,0,1],
    drag:false, lm:{x:0,y:0},
  });

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const r = R.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    r.scene = new THREE.Scene();
    r.camera = new THREE.PerspectiveCamera(44, W/H, 0.1, 100);
    r.camera.position.set(0, 2.2, 3.8);
    r.camera.lookAt(0, 0, 0);

    r.renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    r.renderer.setSize(W, H);
    r.renderer.setPixelRatio(window.devicePixelRatio);
    r.renderer.setClearColor(0x000000, 0);
    mount.appendChild(r.renderer.domElement);

    r.scene.add(new THREE.AmbientLight(0x223355, 4));
    const pl = new THREE.PointLight(0x0088ff, 2, 15);
    pl.position.set(4, 4, 3);
    r.scene.add(pl);

    function buildSphere(xOff, hexStr) {
      const grp = new THREE.Group();
      grp.position.x = xOff;

      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 24, 16),
        new THREE.MeshBasicMaterial({ color:0x0a2535, wireframe:true, transparent:true, opacity:0.18 })
      ));
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.895, 28, 20),
        new THREE.MeshPhongMaterial({ color:0x000d18, transparent:true, opacity:0.14, side:THREE.BackSide })
      ));

      function addArc(ex, ey, ez, col, op) {
        const pts = [];
        for (let i=0; i<=64; i++) {
          const a = (i/64)*2*PI;
          pts.push(new THREE.Vector3(Math.cos(a)*0.9, Math.sin(a)*0.9, 0)
            .applyEuler(new THREE.Euler(ex,ey,ez)));
        }
        grp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color:col, transparent:true, opacity:op })
        ));
      }
      addArc(0,0,0,     0x006688, 0.4);
      addArc(PI/2,0,0,  0x003a44, 0.3);
      addArc(PI/2,PI/2,0, 0x003a44, 0.3);

      function addAx(x1,y1,z1, x2,y2,z2, col, op) {
        grp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x2,y2,z2)
          ]),
          new THREE.LineBasicMaterial({ color:col, transparent:true, opacity:op })
        ));
      }
      addAx(0,0,0, 0,1.35,0, 0x00eeff, 0.7);
      addAx(0,0,0, 0,-1.2,0, 0x004455, 0.5);
      addAx(0,0,0, 1.2,0,0,  0xff4444, 0.5);
      addAx(0,0,0, -1.1,0,0, 0x441111, 0.4);
      addAx(0,0,0, 0,0,1.2,  0x44cc44, 0.5);
      addAx(0,0,0, 0,0,-1.1, 0x113311, 0.4);

      const col3 = parseInt(hexStr.replace("#",""), 16);
      const shaftGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.9, 8);
      shaftGeo.translate(0, 0.45, 0);
      const headGeo = new THREE.ConeGeometry(0.06, 0.12, 8);
      headGeo.translate(0, 0.06, 0);
      const mat = new THREE.MeshBasicMaterial({ color:col3 });
      const arrow = new THREE.Group();
      arrow.add(new THREE.Mesh(shaftGeo, mat));
      arrow.add(new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color:col3 })));
      grp.add(arrow);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 8, 8),
        new THREE.MeshBasicMaterial({ color:col3 })
      );
      grp.add(tip);
      r.scene.add(grp);
      return { arrow, tip };
    }

    r.a0 = buildSphere(-1.4, "#00f5ff");
    r.a1 = buildSphere( 1.4, "#ff79c6");

    function animate() {
      r.raf = requestAnimationFrame(animate);
      const items = [[r.c0,r.t0,r.a0],[r.c1,r.t1,r.a1]];
      for (const [c,t,a] of items) {
        c[0]+=(t[0]-c[0])*0.1; c[1]+=(t[1]-c[1])*0.1; c[2]+=(t[2]-c[2])*0.1;
        const tx=c[0], ty=c[2], tz=c[1];
        const len = Math.sqrt(tx*tx+ty*ty+tz*tz);
        if (len > 0.01) {
          const dir = new THREE.Vector3(tx,ty,tz).normalize();
          a.arrow.scale.setScalar(len);
          a.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
          a.tip.position.set(tx,ty,tz);
          a.tip.visible = true;
        } else {
          a.arrow.scale.setScalar(0.001);
          a.tip.visible = false;
        }
      }
      r.renderer.render(r.scene, r.camera);
    }
    animate();

    function onResize() {
      const W2=mount.clientWidth, H2=mount.clientHeight;
      r.camera.aspect=W2/H2; r.camera.updateProjectionMatrix(); r.renderer.setSize(W2,H2);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(r.raf);
      r.renderer.dispose();
      if (mount.contains(r.renderer.domElement)) mount.removeChild(r.renderer.domElement);
    };
  }, []);

  useEffect(() => { R.current.t0 = [...bloch0]; }, [bloch0]);
  useEffect(() => { R.current.t1 = [...bloch1]; }, [bloch1]);

  function onMD(e) { R.current.drag=true; R.current.lm={x:e.clientX,y:e.clientY}; }
  function onMM(e) {
    const r=R.current; if(!r.drag) return;
    const dx=e.clientX-r.lm.x, dy=e.clientY-r.lm.y;
    r.lm={x:e.clientX,y:e.clientY};
    const sp=new THREE.Spherical().setFromVector3(r.camera.position);
    sp.theta -= dx*0.007;
    sp.phi = Math.max(0.1, Math.min(PI-0.1, sp.phi-dy*0.007));
    r.camera.position.setFromSpherical(sp); r.camera.lookAt(0,0,0);
  }
  function onMU() { R.current.drag=false; }

  return (
    <div style={{ position:"relative", width:"100%", height:"100%" }}>
      <div ref={mountRef} style={{ width:"100%", height:"100%", cursor:"grab" }}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}/>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,3,10,0.04) 3px,rgba(0,3,10,0.04) 6px)" }}/>
      <div style={{ position:"absolute", bottom:8, left:0, right:0, display:"flex", justifyContent:"space-around", pointerEvents:"none" }}>
        {[["q₀","#00f5ff"],["q₁","#ff79c6"]].map(([l,c])=>(
          <span key={l} style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:700, fontSize:13, color:c, textShadow:`0 0 10px ${c}` }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── CIRCUIT WIRE DIAGRAM ─────────────────────── */
const CW=60, RH=54, WY=27, LW=46;

function CircuitWires({ circuit, activeStep, onRemove, isPlaying }) {
  const layout = useMemo(() => {
    const cols = [];
    circuit.forEach((gate, gi) => {
      let col = 0;
      while (true) {
        const used = new Set((cols[col]||[]).flatMap(g=>g.qubits));
        if (!gate.qubits.some(q=>used.has(q))) break;
        col++;
      }
      if (!cols[col]) cols[col] = [];
      cols[col].push({ ...gate, gi });
    });
    return cols;
  }, [circuit]);

  const ncols = Math.max(layout.length, 7);
  const W = LW + ncols*CW + 46;
  const H = 2*RH + 8;

  return (
    <div style={{ overflowX:"auto" }}>
      <svg width={W} height={H} style={{ display:"block" }}>

        {/* Wires */}
        {[0,1].map(qi=>(
          <g key={qi}>
            <text x={3} y={qi*RH+WY+4} fill={QCOLORS[qi]} fontSize={11} fontFamily="'Exo 2',sans-serif" fontWeight="700">q{qi}</text>
            <text x={22} y={qi*RH+WY+4} fill={QCOLORS[qi]+"44"} fontSize={9} fontFamily="'Share Tech Mono',monospace">|0⟩</text>
            <line x1={LW} y1={qi*RH+WY} x2={W-14} y2={qi*RH+WY}
              stroke={QCOLORS[qi]} strokeWidth={1.8} opacity={0.4}/>
          </g>
        ))}

        {/* Empty hint */}
        {circuit.length===0 && (
          <text x={LW+8} y={RH-8} fill="#1a3a55" fontSize={10}
            fontFamily="'Exo 2',sans-serif" fontStyle="italic">
            ← click gates in palette to add them here
          </text>
        )}

        {/* Gate columns */}
        {layout.map((colGates, ci)=>{
          const x = LW + ci*CW;
          return (
            <g key={ci}>
              {colGates.map(gate=>{
                const gd = GATE_DEFS[gate.name] || { color:"#888", label:gate.name };
                const active = gate.gi === activeStep;
                const q0=gate.qubits[0], q1=gate.qubits[1];
                const isTwo = gate.qubits.length===2;
                const mx = x+CW/2;

                return (
                  <g key={gate.gi}
                    onClick={()=>{ if(!isPlaying) onRemove(gate.gi); }}
                    style={{ cursor:isPlaying?"default":"pointer" }}>

                    {/* Vertical wire connector */}
                    {isTwo && (
                      <line x1={mx} y1={q0*RH+WY} x2={mx} y2={q1*RH+WY}
                        stroke={gd.color} strokeWidth={active?2.5:1.8} opacity={0.85}/>
                    )}

                    {/* Control dot */}
                    {isTwo && gd.ctrl && (
                      <circle cx={mx} cy={q0*RH+WY} r={7}
                        fill={gd.color} stroke={gd.color} strokeWidth={1}
                        filter={active?`drop-shadow(0 0 5px ${gd.color})`:"none"}/>
                    )}

                    {/* SWAP X marks */}
                    {gate.name==="SWAP" && [q0,q1].map(qi=>(
                      <g key={qi}>
                        <line x1={mx-7} y1={qi*RH+WY-7} x2={mx+7} y2={qi*RH+WY+7} stroke={gd.color} strokeWidth={2.5}/>
                        <line x1={mx+7} y1={qi*RH+WY-7} x2={mx-7} y2={qi*RH+WY+7} stroke={gd.color} strokeWidth={2.5}/>
                      </g>
                    ))}

                    {/* Gate boxes */}
                    {gate.qubits.map((qi,qidx)=>{
                      if (isTwo && gd.ctrl && qidx===0) return null; // ctrl dot already drawn
                      if (gate.name==="SWAP") return null;

                      // CNOT target = ⊕
                      if (gate.name==="CNOT" && qidx===1) {
                        return (
                          <g key={qi}>
                            <circle cx={mx} cy={qi*RH+WY} r={12}
                              fill={active?gd.color+"22":"#04090f"}
                              stroke={gd.color} strokeWidth={active?2.5:1.8}
                              filter={active?`drop-shadow(0 0 8px ${gd.color})`:"none"}/>
                            <line x1={mx-12} y1={qi*RH+WY} x2={mx+12} y2={qi*RH+WY} stroke={gd.color} strokeWidth={1.8}/>
                            <line x1={mx} y1={qi*RH+WY-12} x2={mx} y2={qi*RH+WY+12} stroke={gd.color} strokeWidth={1.8}/>
                          </g>
                        );
                      }

                      // Standard box
                      return (
                        <g key={qi}>
                          <rect x={mx-18} y={qi*RH+WY-13} width={36} height={26} rx={5}
                            fill={active?gd.color+"28":"#0a1a28"}
                            stroke={gd.color} strokeWidth={active?2:1.5}
                            filter={active?`drop-shadow(0 0 10px ${gd.color})`:"none"}/>
                          <text x={mx} y={qi*RH+WY+(gate.param!=null?1:5)}
                            fill={gd.color} fontSize={gate.param!=null?9:12}
                            fontFamily="'Orbitron',monospace" fontWeight="700" textAnchor="middle">
                            {gd.label}
                          </text>
                          {gate.param!=null && (
                            <text x={mx} y={qi*RH+WY+14}
                              fill={gd.color+"99"} fontSize={7}
                              fontFamily="'Share Tech Mono',monospace" textAnchor="middle">
                              {(gate.param*180/PI).toFixed(0)}°
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Pulse ring on active */}
                    {active && (
                      <circle cx={mx} cy={(isTwo?(q0+q1)/2:q0)*RH+WY}
                        r={isTwo?28:20} fill="none"
                        stroke={gd.color} strokeWidth={1.5} opacity={0.5}
                        style={{ animation:"pulse 0.5s ease-in-out infinite" }}/>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Measure boxes */}
        {[0,1].map(qi=>{
          const mx = LW+ncols*CW+4;
          const my = qi*RH+WY;
          return (
            <g key={qi}>
              <rect x={mx} y={my-11} width={28} height={22} rx={4}
                fill="#0a1a28" stroke={QCOLORS[qi]+"55"} strokeWidth={1.2}/>
              <path d={`M ${mx+4} ${my+6} Q ${mx+14} ${my-3} ${mx+24} ${my+6}`}
                stroke={QCOLORS[qi]} strokeWidth={1.2} fill="none"/>
              <line x1={mx+14} y1={my+5} x2={mx+20} y2={my-2}
                stroke={QCOLORS[qi]} strokeWidth={1.2}/>
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
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {GATE_CATS.map(cat=>{
        const gates = Object.entries(GATE_DEFS).filter(([,g])=>g.cat===cat.key);
        return (
          <div key={cat.key}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:2, marginBottom:5, borderLeft:"2px solid #1a3a55", paddingLeft:5 }}>
              {cat.label}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {gates.map(([name,gd])=>(
                <button key={name} className="gate-btn"
                  onClick={()=>onAdd(name)}
                  onMouseEnter={()=>setTip(name)}
                  onMouseLeave={()=>setTip(null)}
                  style={{
                    position:"relative", background:gd.color+"18",
                    border:`2px solid ${gd.color}88`, color:gd.color,
                    fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:700,
                    padding:"5px 8px", borderRadius:6,
                    boxShadow:`0 0 5px ${gd.color}18`,
                  }}>
                  {gd.label}
                  {gd.qn===2 && (
                    <span style={{ position:"absolute", top:-4, right:-4, background:gd.color, color:"#04090f", fontSize:6, borderRadius:"50%", width:11, height:11, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>2</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Tooltip */}
      {tip && GATE_DEFS[tip] && (
        <div style={{ background:"#0a1a28", border:`1px solid ${GATE_DEFS[tip].color}33`, borderRadius:8, padding:"7px 10px", fontSize:10, color:"#8ab8cc", lineHeight:1.55, fontFamily:"Rajdhani,sans-serif", animation:"fadeIn 0.15s ease" }}>
          <span style={{ color:GATE_DEFS[tip].color, fontWeight:700 }}>{GATE_DEFS[tip].label}</span>
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
  const [angle, setAngle] = useState(PI/2);

  const steps = needTwo
    ? (gd.ctrl ? ["Select CONTROL qubit","Select TARGET qubit"] : ["Select first qubit","Select second qubit"])
    : ["Select qubit to apply gate"];

  function pick(q) {
    if (sel.includes(q)) return;
    const next = [...sel, q];
    if (next.length === (needTwo?2:1)) {
      onConfirm({ name:gateName, qubits:next, param:gd.param?angle:undefined });
    } else {
      setSel(next);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#050e1c", border:`2px solid ${gd.color||"#0ff"}44`, borderRadius:14, padding:26, width:320, boxShadow:`0 0 40px ${gd.color||"#0ff"}18`, animation:"fadeIn 0.18s ease" }}>

        <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:900, color:gd.color, fontSize:16, marginBottom:4, letterSpacing:1 }}>
          {gd.label} Gate
        </div>
        <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:11, color:"#5a8899", marginBottom:16, lineHeight:1.5 }}>
          {gd.tip}
        </div>

        {/* Angle slider */}
        {gd.param && (
          <div style={{ marginBottom:16, background:"#04090f", borderRadius:8, padding:"10px 12px", border:`1px solid ${gd.color}33` }}>
            <div style={{ fontFamily:"'Exo 2',sans-serif", fontSize:10, color:"#7aaabb", marginBottom:5 }}>Rotation angle θ</div>
            <input type="range" min={-2*PI} max={2*PI} step={0.05} value={angle}
              onChange={e=>setAngle(parseFloat(e.target.value))} style={{ accentColor:gd.color }}/>
            <div style={{ textAlign:"center", color:gd.color, fontFamily:"'Share Tech Mono',monospace", fontSize:15, marginTop:5, fontWeight:700 }}>
              {angle.toFixed(3)} rad &nbsp; ({(angle*180/PI).toFixed(0)}°)
            </div>
          </div>
        )}

        {/* Progress dots for 2-qubit */}
        {needTwo && (
          <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
            {[0,1].map(i=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:i<sel.length?gd.color:"#0a2030", border:`1px solid ${gd.color}44`, transition:"background 0.2s" }}/>
                <span style={{ fontSize:9, color:i===sel.length?"#8ab8cc":"#334455", fontFamily:"'Share Tech Mono'" }}>
                  {gd.ctrl ? (i===0?"CTRL":"TGT") : `Q${i+1}`}
                </span>
              </div>
            ))}
            {sel.length>0 && <span style={{ fontSize:9, color:gd.color, fontFamily:"'Share Tech Mono'" }}>q{sel[0]} ✓</span>}
          </div>
        )}

        <div style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:700, fontSize:13, color:"#7aaabb", marginBottom:12 }}>
          {steps[sel.length] || "—"}
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {[0,1].map(qi=>{
            const done = sel.includes(qi);
            return (
              <button key={qi} onClick={()=>pick(qi)} disabled={done}
                style={{
                  flex:1, padding:"14px 0", borderRadius:10,
                  background:done?QCOLORS[qi]+"22":"#0a1a28",
                  border:`2px solid ${QCOLORS[qi]}${done?"cc":"55"}`,
                  color:done?"#556677":QCOLORS[qi],
                  fontFamily:"'Exo 2',sans-serif", fontWeight:900, fontSize:20,
                  cursor:done?"default":"pointer", transition:"all 0.18s",
                }}>
                q{qi}
                <div style={{ fontSize:8, color:QCOLORS[qi]+(done?"44":"88"), fontFamily:"'Share Tech Mono'", marginTop:3, fontWeight:400 }}>
                  {done?"✓ picked":"click to pick"}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={onCancel}
          style={{ width:"100%", padding:7, background:"transparent", border:"1px solid #1a3a55", color:"#334455", borderRadius:6, fontSize:10, cursor:"pointer", fontFamily:"'Exo 2',sans-serif" }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

/* ─── TEMPERATURE PANEL ────────────────────────── */
const TEMP_PRESETS = [
  { label:"15 mK",  tempK:0.015, color:"#00f5ff", icon:"❄️", f:"97%" },
  { label:"100 mK", tempK:0.1,   color:"#44aaff", icon:"🧊", f:"75%" },
  { label:"4 K",    tempK:4,     color:"#88ddaa", icon:"⚗️",  f:"~50%" },
  { label:"77 K",   tempK:77,    color:"#ffcc44", icon:"🌡️", f:"~35%" },
  { label:"300 K",  tempK:300,   color:"#ff6644", icon:"🔥", f:"25%" },
];

function TemperaturePanel({ tempK, onTempK, noiseE, onNoiseE }) {
  const logMin=Math.log10(0.015), logMax=Math.log10(300);
  const pct=(Math.log10(Math.max(0.015,tempK))-logMin)/(logMax-logMin);
  const fid=tempToFidelity(tempK);
  const tCol=tempK<0.05?"#00f5ff":tempK<1?"#44aaff":tempK<50?"#ffcc44":"#ff6644";
  const tLabel=tempK<1?`${(tempK*1000).toFixed(0)} mK`:tempK<10?`${tempK.toFixed(1)} K`:`${Math.round(tempK)} K`;

  function onSlider(e) {
    const v=parseFloat(e.target.value);
    onTempK(Math.pow(10, logMin + v*(logMax-logMin)));
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ background:"#0a1a28", borderRadius:10, padding:"12px", border:`1px solid ${tCol}28` }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:3, marginBottom:8 }}>TEMPERATURE</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          {/* Thermometer */}
          <div style={{ position:"relative", width:20, height:88, flexShrink:0 }}>
            <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:9, height:72, borderRadius:"4px 4px 0 0", background:"#04090f", border:"1.5px solid rgba(255,255,255,0.1)", overflow:"hidden" }}>
              <div style={{ position:"absolute", bottom:0, width:"100%", height:`${pct*100}%`, background:tCol, boxShadow:`0 0 8px ${tCol}`, transition:"height 0.35s, background 0.35s" }}/>
            </div>
            <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", width:18, height:18, borderRadius:"50%", background:tCol, boxShadow:`0 0 12px ${tCol}`, transition:"background 0.35s, box-shadow 0.35s" }}/>
          </div>
          <div>
            <div style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:900, fontSize:20, color:tCol, lineHeight:1, transition:"color 0.35s" }}>{tLabel}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:tCol+"88", marginTop:3 }}>
              Fidelity: {(fid*100).toFixed(0)}%
            </div>
          </div>
        </div>
        <input type="range" min={0} max={1} step={0.001} value={pct} onChange={onSlider} style={{ accentColor:tCol }}/>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
          {["15mK","100mK","4K","77K","300K"].map(l=>(
            <span key={l} style={{ fontSize:6, color:"#334455", fontFamily:"'Share Tech Mono'" }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:3, marginBottom:5 }}>QUICK PRESETS</div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {TEMP_PRESETS.map(p=>{
            const active=Math.abs(Math.log10(tempK)-Math.log10(p.tempK))<0.15;
            return (
              <button key={p.label} className="preset-btn"
                onClick={()=>onTempK(p.tempK)}
                style={{ display:"flex", alignItems:"center", gap:6, background:active?`${p.color}18`:"transparent", border:`1px solid ${p.color}${active?"55":"18"}`, borderRadius:6, padding:"5px 8px", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:13 }}>{p.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:700, fontSize:10, color:p.color }}>{p.label}</div>
                </div>
                <span style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:p.color }}>{p.f}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra noise */}
      <div style={{ background:"#0a1a28", borderRadius:8, padding:"9px 10px", border:"1px solid rgba(255,121,198,0.12)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:2 }}>EXTRA NOISE</span>
          <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:"#ff79c6" }}>{(noiseE*100).toFixed(0)}%</span>
        </div>
        <input type="range" min={0} max={0.6} step={0.01} value={noiseE} onChange={e=>onNoiseE(parseFloat(e.target.value))} style={{ accentColor:"#ff79c6" }}/>
        <div style={{ fontSize:7, color:"#1a3a55", fontFamily:"'Share Tech Mono'", marginTop:2 }}>depolarizing_error per gate</div>
      </div>

      {/* T2 bars */}
      <div style={{ background:"#0a1a28", borderRadius:8, padding:"9px 10px", border:"1px solid rgba(189,147,249,0.12)" }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:3, marginBottom:6 }}>T₂ COHERENCE TIME</div>
        {[{temp:"15 mK",t2:"100 μs",bar:1.0,col:"#00f5ff"},{temp:"100 mK",t2:"10 μs",bar:0.45,col:"#44aaff"},{temp:"4 K",t2:"100 ns",bar:0.18,col:"#88ddaa"},{temp:"300 K",t2:"< 1 ns",bar:0.02,col:"#ff6644"}].map(({temp,t2,bar,col})=>(
          <div key={temp} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
            <span style={{ fontSize:7, color:"#334455", fontFamily:"'Share Tech Mono'", minWidth:36, textAlign:"right" }}>{temp}</span>
            <div style={{ flex:1, background:"#04090f", borderRadius:2, height:4 }}>
              <div style={{ width:`${bar*100}%`, height:"100%", background:col, borderRadius:2, boxShadow:`0 0 4px ${col}` }}/>
            </div>
            <span style={{ fontSize:7, color:col, fontFamily:"'Share Tech Mono'", minWidth:38 }}>{t2}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STATE PANEL ──────────────────────────────── */
function StatePanel({ sv, probs, shots, results, onMeasure, onShots }) {
  const dm0 = useMemo(()=>reducedDM(sv,0),[sv]);
  const dm1 = useMemo(()=>reducedDM(sv,1),[sv]);
  const b0 = useMemo(()=>blochVec(dm0),[dm0]);
  const b1 = useMemo(()=>blochVec(dm1),[dm1]);
  const mag0=Math.sqrt(b0[0]**2+b0[1]**2+b0[2]**2);
  const mag1=Math.sqrt(b1[0]**2+b1[1]**2+b1[2]**2);
  const pur0=(1+mag0*mag0)/2, pur1=(1+mag1*mag1)/2;
  const corr=(probs[0]+probs[3])*100;

  const histData=["00","01","10","11"].map((k,i)=>({
    name:`|${k}⟩`,
    pct:results?(results[k]||0)/shots*100:probs[i]*100,
    fill:["#00f5ff","#ff79c6","#ffcc44","#50fa7b"][i],
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Mini Bloch */}
      <div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:3, marginBottom:6 }}>QUBIT STATES</div>
        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          <BlochCanvas bloch={b0} color="#00f5ff" label="q₀" size={100}/>
          <BlochCanvas bloch={b1} color="#ff79c6" label="q₁" size={100}/>
        </div>
        <div style={{ display:"flex", gap:6, marginTop:7 }}>
          {[[b0,pur0,"#00f5ff","q₀"],[b1,pur1,"#ff79c6","q₁"]].map(([b,p,c,l])=>(
            <div key={l} style={{ flex:1, background:"#0a1a28", borderRadius:6, padding:"5px 7px", border:`1px solid ${c}18` }}>
              <div style={{ fontFamily:"'Exo 2',sans-serif", fontWeight:700, fontSize:9, color:c, marginBottom:3 }}>{l}</div>
              {[["purity",(p*100).toFixed(0)+"%",p>0.9?"#50fa7b":p>0.5?"#ffcc44":"#ff4444"],["⟨Z⟩",b[2].toFixed(3)],["⟨X⟩",b[0].toFixed(3)]].map(([lbl,val,vc])=>(
                <div key={lbl} style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ fontSize:8, color:"#3a5a6a", fontFamily:"'Exo 2',sans-serif" }}>{lbl}</span>
                  <span style={{ fontSize:8, color:vc||"#7aaabb", fontFamily:"'Share Tech Mono',monospace" }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Histogram */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:3 }}>OUTCOMES</div>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:corr>80?"#00f5ff":corr>50?"#ffcc44":"#ff4444", fontWeight:700 }}>
            CORR {corr.toFixed(0)}%
          </span>
        </div>
        <div style={{ height:95 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histData} barCategoryGap="15%">
              <XAxis dataKey="name" tick={{ fill:"#4a7a9a", fontSize:10, fontFamily:"'Share Tech Mono'" }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{ fill:"#3a5a6a", fontSize:8 }} axisLine={false} tickLine={false}/>
              <RTooltip contentStyle={{ background:"#0a1a28", border:"1px solid rgba(0,245,255,0.2)", fontSize:9, color:"#0ff" }}/>
              <Bar dataKey="pct" radius={[4,4,0,0]}>
                {histData.map((d,i)=><Cell key={i} fill={d.fill} opacity={d.pct<0.5?0.2:1}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:14, marginTop:2 }}>
          <span style={{ fontSize:7, color:"#00f5ff44", fontFamily:"'Share Tech Mono'" }}>|00⟩+|11⟩ = correct ✓</span>
          <span style={{ fontSize:7, color:"#ff664444", fontFamily:"'Share Tech Mono'" }}>|01⟩+|10⟩ = error ✗</span>
        </div>
      </div>

      {/* Measure */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontSize:9, color:"#3a5a6a", fontFamily:"'Exo 2',sans-serif" }}>Shots</span>
          <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:"#00f5ff" }}>{shots}</span>
        </div>
        <input type="range" min={64} max={2048} step={64} value={shots}
          onChange={e=>onShots(parseInt(e.target.value))} style={{ accentColor:"#00f5ff", marginBottom:7 }}/>
        <button onClick={onMeasure}
          style={{ width:"100%", padding:"8px", background:"linear-gradient(90deg,rgba(0,245,255,0.1),rgba(80,250,123,0.1))", border:"1px solid rgba(0,245,255,0.35)", color:"#00f5ff", borderRadius:6, fontSize:10, cursor:"pointer", fontFamily:"'Orbitron',monospace", letterSpacing:2, transition:"all 0.15s" }}>
          ⚡ MEASURE
        </button>
        {results && (
          <div style={{ marginTop:5, fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:"#334455", textAlign:"center" }}>
            {Object.entries(results).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`|${k}⟩: ${v}`).join("  ·  ")}
          </div>
        )}
      </div>

      {/* State vector */}
      <div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:7, color:"#1a3a55", letterSpacing:3, marginBottom:5 }}>STATE VECTOR |ψ⟩</div>
        <div style={{ background:"#04090f", borderRadius:6, padding:"7px 8px", border:"1px solid rgba(0,245,255,0.08)", fontFamily:"'Share Tech Mono',monospace", fontSize:9, lineHeight:1.9 }}>
          {["00","01","10","11"].map((k,i)=>{
            const re=sv[2*i], im=sv[2*i+1];
            const p=(re*re+im*im)*100;
            return p>0.05?(
              <div key={k} style={{ color:"#5a9aaa" }}>
                <span style={{ color:"#2a4a5a" }}>|{k}⟩ </span>
                <span style={{ color:"#00f5ff" }}>{re.toFixed(3)}{im>=0?"+":""}{im.toFixed(3)}i</span>
                <span style={{ color:"#2a4455", marginLeft:5 }}>{p.toFixed(1)}%</span>
              </div>
            ):null;
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ─────────────────────────────────── */
const PRESETS = [
  { label:"Bell |Φ⁺⟩", color:"#00f5ff", gates:[{name:"H",qubits:[0]},{name:"CNOT",qubits:[0,1]}] },
  { label:"Bell |Ψ⁺⟩",  color:"#50fa7b", gates:[{name:"X",qubits:[1]},{name:"H",qubits:[0]},{name:"CNOT",qubits:[0,1]}] },
  { label:"|++⟩",       color:"#bd93f9", gates:[{name:"H",qubits:[0]},{name:"H",qubits:[1]}] },
  { label:"Teleport",   color:"#ffcc44", gates:[{name:"H",qubits:[0]},{name:"CNOT",qubits:[0,1]},{name:"H",qubits:[0]}] },
];

let gId = 0;
function mkGate(g) { return { ...g, id:`g${gId++}` }; }

export default function App() {
  const [circuit,    setCircuit]    = useState([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [picking,    setPicking]    = useState(null);
  const [tempK,      setTempK]      = useState(0.015);
  const [noiseE,     setNoiseE]     = useState(0);
  const [shots,      setShots]      = useState(512);
  const [results,    setResults]    = useState(null);
  const playRef = useRef(null);

  const noiseP = useMemo(()=>{
    const base = 1-tempToFidelity(tempK);
    return Math.min(0.95, base + noiseE*0.5);
  }, [tempK, noiseE]);

  const allStates = useMemo(()=>buildAllStates(circuit, noiseP), [circuit, noiseP]);

  const displaySV = useMemo(()=>
    activeStep>=0 ? allStates[activeStep+1] : allStates[allStates.length-1]
  , [allStates, activeStep]);

  const probs  = useMemo(()=>getProbs(displaySV), [displaySV]);
  const bloch0 = useMemo(()=>blochVec(reducedDM(displaySV,0)), [displaySV]);
  const bloch1 = useMemo(()=>blochVec(reducedDM(displaySV,1)), [displaySV]);

  const fidelity = tempToFidelity(tempK);
  const fColor   = fidelity>0.8?"#00f5ff":fidelity>0.5?"#ffcc44":"#ff6644";
  const tLabel   = tempK<1?`${(tempK*1000).toFixed(0)} mK`:tempK<10?`${tempK.toFixed(1)} K`:`${Math.round(tempK)} K`;

  function confirmGate(gateData) {
    setCircuit(c=>[...c, mkGate(gateData)]);
    setActiveStep(-1); setResults(null); setPicking(null);
  }
  function removeGate(idx) {
    setCircuit(c=>c.filter((_,i)=>i!==idx));
    setActiveStep(-1); setResults(null);
  }
  function loadPreset(p) {
    setCircuit(p.gates.map(g=>mkGate(g)));
    setActiveStep(-1); setResults(null);
  }

  async function playCircuit() {
    if (isPlaying||circuit.length===0) return;
    setIsPlaying(true); setActiveStep(-1);
    for (let i=0; i<circuit.length; i++) {
      await new Promise(r=>{ playRef.current=setTimeout(r,700); });
      setActiveStep(i);
    }
    await new Promise(r=>setTimeout(r,500));
    setIsPlaying(false); setActiveStep(-1);
  }

  function measure() {
    const counts={"00":0,"01":0,"10":0,"11":0}, keys=["00","01","10","11"];
    for (let i=0;i<shots;i++) {
      let r=Math.random();
      for (let k=0;k<4;k++) { r-=probs[k]; if(r<=0){counts[keys[k]]++;break;} }
    }
    setResults(counts);
  }

  return (
    <>
      <style>{STYLE}</style>
      <div style={{ fontFamily:"Rajdhani,sans-serif", background:"#04090f", color:"#a0c8df", height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>

        {/* Grid bg */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
          backgroundImage:"linear-gradient(rgba(0,245,255,.01) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,.01) 1px,transparent 1px)",
          backgroundSize:"44px 44px" }}/>

        {/* ── HEADER ── */}
        <header style={{ position:"relative", zIndex:10, display:"flex", alignItems:"center", gap:10, padding:"0 14px", height:44, borderBottom:"1px solid rgba(0,245,255,0.1)", background:"rgba(4,9,15,0.97)", flexShrink:0 }}>
          <div style={{ width:22, height:22, border:"2px solid rgba(0,245,255,0.2)", borderTop:"2px solid #00f5ff", borderRadius:"50%", animation:"spin 3s linear infinite", flexShrink:0 }}/>
          <div style={{ fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:14, color:"#00f5ff", letterSpacing:3, textShadow:"0 0 20px rgba(0,245,255,0.35)" }}>
            QUANTUM LAB <span style={{ color:"rgba(0,245,255,0.3)", fontSize:9 }}>2-QUBIT</span>
          </div>

          {/* Presets */}
          <div style={{ display:"flex", gap:5, marginLeft:8 }}>
            {PRESETS.map(p=>(
              <button key={p.label} className="preset-btn" onClick={()=>loadPreset(p)}
                style={{ background:`${p.color}15`, border:`1px solid ${p.color}44`, color:p.color, padding:"3px 9px", borderRadius:5, fontSize:8, cursor:"pointer", fontFamily:"'Orbitron',monospace" }}>
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ flex:1 }}/>

          {/* Status */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#0a1a28", border:"1px solid rgba(0,245,255,0.15)", borderRadius:20, padding:"3px 14px", fontFamily:"'Share Tech Mono',monospace", fontSize:10 }}>
            <span style={{ color:"rgba(0,245,255,0.45)" }}>T =</span>
            <span style={{ color:fColor, fontWeight:700 }}>{tLabel}</span>
            <span style={{ color:"#334455" }}>|</span>
            <span style={{ color:"rgba(0,245,255,0.45)" }}>F =</span>
            <span style={{ color:fColor, fontWeight:700 }}>{(fidelity*100).toFixed(0)}%</span>
          </div>
        </header>

        {/* ── 3-COLUMN BODY ── */}
        <div style={{ position:"relative", zIndex:5, flex:1, display:"grid", gridTemplateColumns:"200px 1fr 210px", overflow:"hidden" }}>

          {/* LEFT */}
          <div style={{ borderRight:"1px solid rgba(0,245,255,0.07)", overflowY:"auto", background:"rgba(4,9,15,0.8)", padding:"12px 10px 16px", display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, color:"#00f5ff", letterSpacing:3, marginBottom:8 }}>GATE PALETTE</div>
              <div style={{ background:"#0a1a28", borderRadius:8, padding:"10px", border:"1px solid rgba(0,245,255,0.1)", marginBottom:6 }}>
                <div style={{ fontFamily:"Rajdhani,sans-serif", fontSize:10, color:"#5a8899", lineHeight:1.45, marginBottom:8 }}>
                  1. Click a gate →<br/>2. Pick qubit(s) in popup →<br/>3. Gate appears on circuit wire
                </div>
                <GatePalette onAdd={name=>setPicking(name)}/>
              </div>
            </div>
            <div style={{ borderTop:"1px solid rgba(0,245,255,0.06)", paddingTop:12 }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, color:"#ffcc44", letterSpacing:3, marginBottom:8 }}>TEMPERATURE</div>
              <TemperaturePanel tempK={tempK} onTempK={setTempK} noiseE={noiseE} onNoiseE={setNoiseE}/>
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* 3D sphere */}
            <div style={{ flex:1, position:"relative", overflow:"hidden", minHeight:0 }}>
              <BigBloch3D bloch0={bloch0} bloch1={bloch1}/>
            </div>

            {/* Circuit */}
            <div style={{ borderTop:"1px solid rgba(0,245,255,0.08)", background:"rgba(4,9,15,0.97)", flexShrink:0, padding:"8px 12px 10px" }}>
              {/* Controls */}
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8, flexWrap:"wrap" }}>
                {[
                  { label:"⏮", title:"Step back",    onClick:()=>setActiveStep(p=>Math.max(-1,p-1)),    disabled:isPlaying||activeStep<0 },
                  { label:"⏭", title:"Step forward", onClick:()=>setActiveStep(p=>Math.min(circuit.length-1,p+1)), disabled:isPlaying||activeStep>=circuit.length-1 },
                ].map(btn=>(
                  <button key={btn.label} title={btn.title} onClick={btn.onClick} disabled={btn.disabled}
                    style={{ width:30, height:27, borderRadius:5, background:"#0a1a28", border:"1px solid rgba(0,245,255,0.2)", color:btn.disabled?"#334455":"#00f5ff", fontSize:12, cursor:btn.disabled?"not-allowed":"pointer" }}>
                    {btn.label}
                  </button>
                ))}
                <button onClick={playCircuit} disabled={isPlaying||circuit.length===0}
                  style={{ width:30, height:27, borderRadius:5, background:isPlaying?"rgba(80,250,123,0.15)":"#0a1a28", border:`1px solid ${isPlaying?"#50fa7b":"rgba(80,250,123,0.3)"}`, color:isPlaying?"#50fa7b":circuit.length===0?"#334455":"#50fa7b", fontSize:12, cursor:circuit.length===0?"not-allowed":"pointer" }}>
                  {isPlaying?"⏹":"▶"}
                </button>
                <div style={{ width:1, height:20, background:"#0a2030", margin:"0 3px" }}/>
                <button title="Undo" onClick={()=>{setCircuit(c=>c.slice(0,-1));setActiveStep(-1);setResults(null);}} disabled={isPlaying||circuit.length===0}
                  style={{ width:30, height:27, borderRadius:5, background:"#0a1a28", border:"1px solid rgba(255,204,68,0.25)", color:isPlaying||circuit.length===0?"#334455":"#ffcc44", fontSize:13, cursor:isPlaying||circuit.length===0?"not-allowed":"pointer" }}>↩</button>
                <button title="Clear" onClick={()=>{setCircuit([]);setActiveStep(-1);setResults(null);}} disabled={isPlaying}
                  style={{ width:30, height:27, borderRadius:5, background:"#0a1a28", border:"1px solid rgba(255,85,85,0.25)", color:isPlaying?"#334455":"#ff5555", fontSize:12, cursor:isPlaying?"not-allowed":"pointer" }}>🗑</button>
                <div style={{ flex:1 }}/>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:"#1a3a55" }}>
                  {circuit.length} gate{circuit.length!==1?"s":""}
                  {circuit.length>0 && ` · step ${Math.max(0,activeStep+1)}/${circuit.length}`}
                </span>
              </div>

              {/* Wire diagram */}
              <div style={{ background:"#04090f", borderRadius:8, padding:"8px 10px", border:"1px solid rgba(0,245,255,0.08)", minHeight:122 }}>
                <CircuitWires circuit={circuit} activeStep={activeStep} onRemove={removeGate} isPlaying={isPlaying}/>
              </div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7, color:"#1a3a55", marginTop:4 }}>
                click any gate on the wire to remove it
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ borderLeft:"1px solid rgba(0,245,255,0.07)", overflowY:"auto", background:"rgba(4,9,15,0.8)", padding:"12px 10px 16px" }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:8, color:"#00f5ff", letterSpacing:3, marginBottom:8 }}>STATE INFO</div>
            <StatePanel sv={displaySV} probs={probs} shots={shots} results={results} onMeasure={measure} onShots={setShots}/>
          </div>
        </div>
      </div>

      {/* Qubit picker modal */}
      {picking && (
        <QubitPicker gateName={picking} onConfirm={confirmGate} onCancel={()=>setPicking(null)}/>
      )}
    </>
  );
}
