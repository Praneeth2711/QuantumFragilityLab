import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════════════
   QUANTUM LAB · LANDING PAGE
   ══════════════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

/* ── RESET ── */
html{scroll-behavior:smooth}
.lp{font-family:'Inter',sans-serif;background:#04090f;color:#b0cce0;overflow-x:hidden;min-height:100vh}
.lp *,.lp *::before,.lp *::after{box-sizing:border-box;margin:0;padding:0}
.lp::-webkit-scrollbar{width:5px}
.lp::-webkit-scrollbar-thumb{background:rgba(0,245,255,0.22);border-radius:4px}

/* ── GRID ── */
.lp-grid{position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(0,245,255,0.015) 1px,transparent 1px),
  linear-gradient(90deg,rgba(0,245,255,0.015) 1px,transparent 1px);
  background-size:50px 50px}

/* ── KEYFRAMES ── */
@keyframes fadeUp{from{opacity:0;transform:translate3d(0,60px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
@keyframes fadeUpSoft{from{opacity:0;transform:translate3d(0,30px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
@keyframes glow{0%,100%{text-shadow:0 0 30px rgba(0,245,255,0.5),0 0 80px rgba(0,245,255,0.12)}50%{text-shadow:0 0 60px rgba(0,245,255,0.85),0 0 140px rgba(0,245,255,0.2)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes drift{0%,100%{transform:translate3d(0,0,0)}33%{transform:translate3d(25px,-20px,0)}66%{transform:translate3d(-15px,15px,0)}}
@keyframes pulse{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.7;transform:scale(1.08)}}
@keyframes gradFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes shimmer{0%{left:-100%}100%{left:200%}}
@keyframes borderGlow{0%,100%{border-color:rgba(0,245,255,0.1)}50%{border-color:rgba(0,245,255,0.35)}}
@keyframes ripple{0%{transform:scale(0.8);opacity:0.5}100%{transform:scale(2);opacity:0}}
@keyframes typeLoop{0%,100%{opacity:1}50%{opacity:0}}
@keyframes cardIn{from{opacity:0;transform:translate3d(0,40px,0) scale(0.95)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
@keyframes iconBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

/* ── NAV ── */
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;
  padding:0 44px;height:68px;background:rgba(4,9,15,0.6);
  backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
  border-bottom:1px solid rgba(0,245,255,0.03);transition:all .35s}
.lp-nav.s{background:rgba(4,9,15,0.97);box-shadow:0 2px 40px rgba(0,0,0,0.5);height:58px}。
.lp-nav.s .lp-spinner{width:24px;height:24px}

.lp-logo{display:flex;align-items:center;gap:14px;cursor:pointer}
.lp-spinner{width:30px;height:30px;border:2.5px solid rgba(0,245,255,0.1);border-top-color:#00f5ff;
  border-right-color:rgba(255,121,198,0.35);border-radius:50%;animation:spin 2.5s linear infinite;
  box-shadow:0 0 14px rgba(0,245,255,0.12);flex-shrink:0;transition:all .3s}
.lp-logo-t{font-family:'Orbitron',monospace;font-weight:900;font-size:18px;color:#00f5ff;
  letter-spacing:3px;text-shadow:0 0 20px rgba(0,245,255,0.3)}
.lp-logo-s{font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(0,245,255,0.3);
  letter-spacing:1.5px;margin-top:1px}

.lp-nav-r{display:flex;align-items:center;gap:32px;margin-left:auto}
.lp-nl{font-family:'Exo 2',sans-serif;font-size:13px;font-weight:500;color:#4a6878;
  background:none;border:none;cursor:pointer;position:relative;padding:4px 0;
  transition:color .2s;letter-spacing:.5px}
.lp-nl::after{content:'';position:absolute;bottom:-2px;left:50%;width:0;height:2px;
  background:linear-gradient(90deg,#00f5ff,#ff79c6);border-radius:2px;
  transition:width .3s cubic-bezier(.34,1.56,.64,1),left .3s cubic-bezier(.34,1.56,.64,1)}
.lp-nl:hover{color:#d8eef8}
.lp-nl:hover::after{width:100%;left:0}

.lp-enter{display:inline-flex;align-items:center;gap:10px;padding:11px 28px;
  background:linear-gradient(135deg,rgba(0,245,255,0.12),rgba(255,121,198,0.06));
  border:1.5px solid rgba(0,245,255,0.35);border-radius:12px;color:#00f5ff;
  font-family:'Orbitron',monospace;font-weight:700;font-size:12px;letter-spacing:2px;
  cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.lp-enter .sh{position:absolute;top:0;width:40px;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);
  transform:skewX(-20deg);left:-100%;pointer-events:none}
.lp-enter:hover .sh{animation:shimmer .6s ease both}
.lp-enter:hover{transform:translateY(-3px) scale(1.06);
  box-shadow:0 0 40px rgba(0,245,255,0.25),0 8px 30px rgba(0,0,0,0.3);
  border-color:rgba(0,245,255,0.65);color:#fff}
.lp-enter:active{transform:scale(.95)}

.lp-game-btn{display:inline-flex;align-items:center;gap:10px;padding:11px 24px;
  background:linear-gradient(135deg,rgba(255,121,198,0.12),rgba(189,147,249,0.06));
  border:1.5px solid rgba(255,121,198,0.35);border-radius:12px;color:#ff79c6;
  font-family:'Orbitron',monospace;font-weight:700;font-size:12px;letter-spacing:2px;
  cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.lp-game-btn .sh{position:absolute;top:0;width:40px;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);
  transform:skewX(-20deg);left:-100%;pointer-events:none}
.lp-game-btn:hover .sh{animation:shimmer .6s ease both}
.lp-game-btn:hover{transform:translateY(-3px) scale(1.06);
  box-shadow:0 0 40px rgba(255,121,198,0.25),0 8px 30px rgba(0,0,0,0.3);
  border-color:rgba(255,121,198,0.65);color:#fff}
.lp-game-btn:active{transform:scale(.95)}

/* Game promo section */
.lp-game-promo{position:relative;padding:100px 40px;z-index:1;text-align:center;overflow:hidden;
  background:linear-gradient(180deg,rgba(255,121,198,0.02),rgba(6,14,25,0.5),rgba(189,147,249,0.02));
  border-top:1px solid rgba(255,121,198,0.05);border-bottom:1px solid rgba(189,147,249,0.05)}
.lp-game-promo .glow-orb{position:absolute;width:400px;height:400px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,121,198,0.06),transparent 70%);filter:blur(60px);
  top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.lp-gp-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;
  font-family:'Share Tech Mono',monospace;font-size:10px;color:#ff79c6;
  border:1px solid rgba(255,121,198,0.2);border-radius:16px;background:rgba(255,121,198,0.04);
  margin-bottom:20px;letter-spacing:2px}
.lp-gp-badge .bdot{width:6px;height:6px;border-radius:50%;background:#ff79c6;
  box-shadow:0 0 8px rgba(255,121,198,0.6);animation:pulse 2s ease-in-out infinite}
.lp-gp-h{font-family:'Orbitron',monospace;font-weight:900;font-size:clamp(24px,3.5vw,38px);
  color:#d8eef8;margin-bottom:14px;position:relative;z-index:1}
.lp-gp-p{font-family:'Exo 2',sans-serif;font-size:15px;font-weight:300;color:#5a8899;
  max-width:500px;margin:0 auto 14px;line-height:1.7;position:relative;z-index:1}
.lp-gp-levels{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:24px 0 32px;
  position:relative;z-index:1}
.lp-gp-lv{padding:6px 14px;border-radius:8px;font-family:'Share Tech Mono',monospace;
  font-size:10px;letter-spacing:1px;border:1px solid;transition:all .25s}
.lp-gp-lv:hover{transform:translateY(-2px)}
.lp-game-cta{display:inline-flex;align-items:center;gap:12px;padding:16px 40px;
  background:linear-gradient(135deg,#ff79c6,#bd93f9);background-size:200% 200%;
  animation:gradFlow 3s ease infinite;border:none;border-radius:14px;color:#04090f;
  font-family:'Orbitron',monospace;font-weight:900;font-size:13px;letter-spacing:2px;
  cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);position:relative;
  overflow:hidden;z-index:1;box-shadow:0 4px 25px rgba(255,121,198,0.3)}
.lp-game-cta:hover{transform:translateY(-4px) scale(1.07);
  box-shadow:0 8px 40px rgba(255,121,198,0.45)}

/* ── HERO ── */
.lp-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:130px 40px 80px;text-align:center;overflow:hidden}

.lp-orb{position:absolute;border-radius:50%;pointer-events:none;z-index:0;filter:blur(80px)}
.lp-o1{width:650px;height:650px;top:-220px;left:-180px;
  background:radial-gradient(circle,rgba(0,245,255,0.1),transparent 70%);animation:drift 10s ease-in-out infinite}
.lp-o2{width:550px;height:550px;bottom:-180px;right:-120px;
  background:radial-gradient(circle,rgba(255,121,198,0.08),transparent 70%);animation:drift 13s ease-in-out infinite 3s}
.lp-o3{width:350px;height:350px;top:35%;left:55%;
  background:radial-gradient(circle,rgba(80,250,123,0.05),transparent 70%);animation:drift 16s ease-in-out infinite 6s}

/* Rings */
.lp-ring{position:absolute;border-radius:50%;border:1px solid;pointer-events:none;z-index:0;animation:pulse 4s ease-in-out infinite}
.lp-r1{width:400px;height:400px;top:calc(50% - 200px);left:calc(50% - 200px);border-color:rgba(0,245,255,0.06)}
.lp-r2{width:600px;height:600px;top:calc(50% - 300px);left:calc(50% - 300px);border-color:rgba(255,121,198,0.04);animation-delay:1.5s}
.lp-r3{width:800px;height:800px;top:calc(50% - 400px);left:calc(50% - 400px);border-color:rgba(80,250,123,0.03);animation-delay:3s}

.lp-badge{display:inline-flex;align-items:center;gap:10px;padding:8px 24px;
  font-family:'Share Tech Mono',monospace;font-size:11px;color:#00f5ff;
  border:1px solid rgba(0,245,255,0.15);border-radius:24px;
  background:rgba(0,245,255,0.03);margin-bottom:40px;z-index:1;letter-spacing:1.5px;
  animation:fadeUp .7s ease both,borderGlow 3s ease-in-out infinite;
  backdrop-filter:blur(8px)}
.lp-bdot{width:7px;height:7px;border-radius:50%;background:#50fa7b;
  box-shadow:0 0 10px rgba(80,250,123,0.6);animation:pulse 2s ease-in-out infinite}

.lp-h1{font-family:'Orbitron',monospace;font-weight:900;
  font-size:clamp(40px,6.5vw,78px);color:#d8eef8;line-height:1.05;margin-bottom:12px;
  z-index:1;max-width:880px;animation:fadeUp .8s ease both .1s}
.lp-h1 .cy{color:#00f5ff;animation:glow 3s ease-in-out infinite;display:inline-block}
.lp-h1 .pk{color:#ff79c6}

.lp-sub{font-family:'Exo 2',sans-serif;font-size:clamp(16px,2.2vw,21px);font-weight:300;
  color:#5a8899;max-width:640px;line-height:1.7;margin-bottom:52px;z-index:1;
  animation:fadeUp .9s ease both .2s}
.lp-sub b{color:#b0cce0;font-weight:500}

.lp-btns{display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:center;z-index:1;
  animation:fadeUp 1s ease both .35s}

.lp-cta{display:inline-flex;align-items:center;gap:12px;padding:18px 48px;
  background:linear-gradient(135deg,#00f5ff,#00c8d8,#0099bb);
  background-size:200% 200%;animation:gradFlow 3s ease infinite;
  border:none;border-radius:14px;color:#04090f;font-family:'Orbitron',monospace;
  font-weight:900;font-size:14px;letter-spacing:2px;cursor:pointer;
  transition:all .3s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden;
  box-shadow:0 4px 30px rgba(0,245,255,0.3),0 0 60px rgba(0,245,255,0.08)}
.lp-cta .sh{position:absolute;top:0;width:50px;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
  transform:skewX(-20deg);left:-100%;pointer-events:none}
.lp-cta:hover .sh{animation:shimmer .6s ease both}
.lp-cta:hover{transform:translateY(-4px) scale(1.07);
  box-shadow:0 8px 50px rgba(0,245,255,0.45),0 0 100px rgba(0,245,255,0.12)}
.lp-cta:active{transform:scale(.94)}

.lp-cta2{padding:18px 36px;background:transparent;border:1.5px solid rgba(0,245,255,0.15);
  border-radius:14px;color:#00f5ff;font-family:'Exo 2',sans-serif;font-weight:600;
  font-size:13px;letter-spacing:1px;cursor:pointer;transition:all .25s;overflow:hidden;position:relative}
.lp-cta2:hover{border-color:rgba(0,245,255,0.45);transform:translateY(-2px);
  background:rgba(0,245,255,0.04);box-shadow:0 0 20px rgba(0,245,255,0.08)}

/* Stats */
.lp-stats{display:flex;gap:56px;margin-top:76px;z-index:1;animation:fadeUp 1.1s ease both .5s}
.lp-stat{text-align:center;position:relative}
.lp-stat::before{content:'';position:absolute;top:-10px;left:50%;transform:translateX(-50%);
  width:40px;height:2px;border-radius:1px;
  background:linear-gradient(90deg,transparent,var(--sc),transparent)}
.lp-sv{font-family:'Orbitron',monospace;font-weight:900;font-size:36px;
  background:linear-gradient(135deg,var(--sc),var(--sc2,var(--sc)));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  filter:drop-shadow(0 0 14px var(--sg))}
.lp-sl{font-family:'Share Tech Mono',monospace;font-size:10px;color:#3a5a6a;
  letter-spacing:2.5px;margin-top:6px}

/* ── SECTIONS ── */
.lp-sec{position:relative;padding:120px 40px;z-index:1}
.lp-sec-tag{font-family:'Orbitron',monospace;font-size:10px;letter-spacing:5px;
  text-align:center;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:14px}
.lp-sec-tag .ln{width:44px;height:1px;background:linear-gradient(90deg,transparent,currentColor,transparent)}
.lp-sec-h2{font-family:'Orbitron',monospace;font-weight:900;
  font-size:clamp(26px,4vw,46px);color:#d8eef8;text-align:center;margin-bottom:18px;line-height:1.15}
.lp-sec-p{font-family:'Exo 2',sans-serif;font-size:16px;font-weight:300;color:#4a6878;
  text-align:center;max-width:580px;margin:0 auto 72px;line-height:1.7}

/* ── FEATURE CARDS ── */
.lp-fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:24px;
  max-width:1140px;margin:0 auto}
.lp-fc{background:linear-gradient(145deg,rgba(6,14,25,0.75),rgba(9,21,32,0.6));
  border:1px solid rgba(0,245,255,0.04);border-radius:20px;padding:40px 30px;
  transition:all .4s cubic-bezier(.22,1,.36,1);position:relative;overflow:hidden;cursor:default;
  backdrop-filter:blur(6px)}
.lp-fc .topline{position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent 10%,var(--fc) 50%,transparent 90%);
  opacity:0;transition:opacity .4s;transform:scaleX(0.3);transition:all .4s}
.lp-fc .bloom{position:absolute;top:-80px;right:-80px;width:160px;height:160px;
  border-radius:50%;background:var(--fc);opacity:0;filter:blur(60px);pointer-events:none;transition:opacity .5s}
.lp-fc:hover .topline{opacity:1;transform:scaleX(1)}
.lp-fc:hover .bloom{opacity:.06}
.lp-fc:hover{transform:translateY(-12px);border-color:rgba(0,245,255,0.12);
  box-shadow:0 30px 80px rgba(0,0,0,0.35),0 0 50px var(--fg)}

.lp-fi{width:60px;height:60px;border-radius:16px;display:flex;align-items:center;
  justify-content:center;font-size:28px;margin-bottom:24px;
  border:1px solid transparent;transition:all .4s cubic-bezier(.34,1.56,.64,1);position:relative}
.lp-fi .rng{position:absolute;inset:-5px;border-radius:21px;border:1px solid var(--fc);
  opacity:0;transition:opacity .4s;animation:pulse 2.5s ease-in-out infinite}
.lp-fc:hover .lp-fi{transform:scale(1.15) rotate(-5deg);box-shadow:0 0 25px var(--fg)}
.lp-fc:hover .lp-fi .rng{opacity:.5}

.lp-fn{font-family:'Exo 2',sans-serif;font-weight:700;font-size:19px;color:#d8eef8;margin-bottom:12px}
.lp-fd{font-size:14px;color:#4a6878;line-height:1.8}
.lp-ft{display:inline-flex;align-items:center;gap:7px;margin-top:20px;padding:5px 14px;
  font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.5px;border-radius:6px;border:1px solid}
.lp-ft .td{width:5px;height:5px;border-radius:50%;background:currentColor;box-shadow:0 0 6px currentColor}

/* ── LEARN CARDS ── */
.lp-lg{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;
  max-width:1140px;margin:0 auto}
.lp-lc{display:flex;align-items:flex-start;gap:20px;
  background:linear-gradient(145deg,rgba(9,21,32,0.5),rgba(6,14,25,0.4));
  border:1px solid rgba(0,245,255,0.04);border-radius:16px;padding:30px 26px;
  transition:all .35s cubic-bezier(.22,1,.36,1);cursor:default;position:relative;overflow:hidden;
  backdrop-filter:blur(4px)}
.lp-lc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
  background:var(--lc);opacity:0;transition:opacity .3s;border-radius:0 3px 3px 0;
  box-shadow:0 0 12px var(--lc)}
.lp-lc:hover::before{opacity:1}
.lp-lc:hover{transform:translateX(10px);border-color:rgba(0,245,255,0.1);
  background:linear-gradient(145deg,rgba(9,21,32,0.85),rgba(6,14,25,0.75));
  box-shadow:0 10px 40px rgba(0,0,0,0.2)}
.lp-ln{font-family:'Orbitron',monospace;font-weight:900;font-size:38px;line-height:1;
  min-width:56px;transition:all .35s}
.lp-lc:hover .lp-ln{transform:scale(1.12);filter:brightness(1.4)}
.lp-lt{font-family:'Exo 2',sans-serif;font-weight:700;font-size:17px;color:#d8eef8;margin-bottom:8px}
.lp-ld{font-size:13.5px;color:#4a6878;line-height:1.75}

/* ── CTA BANNER ── */
.lp-cta-ban{position:relative;padding:110px 40px;text-align:center;overflow:hidden;
  background:linear-gradient(135deg,rgba(0,245,255,0.03),rgba(255,121,198,0.02),rgba(80,250,123,0.02));
  border-top:1px solid rgba(0,245,255,0.04);border-bottom:1px solid rgba(0,245,255,0.04)}
.lp-cta-ban .rad{position:absolute;inset:0;
  background:radial-gradient(ellipse 650px 450px at center,rgba(0,245,255,0.06),transparent);pointer-events:none}
.lp-ctah{font-family:'Orbitron',monospace;font-weight:900;
  font-size:clamp(24px,3.5vw,42px);color:#d8eef8;margin-bottom:18px;z-index:1;position:relative}
.lp-ctap{font-family:'Exo 2',sans-serif;font-weight:300;font-size:16px;color:#4a6878;
  margin-bottom:44px;z-index:1;position:relative;max-width:520px;margin-left:auto;margin-right:auto;line-height:1.7}

/* ── FOOTER ── */
.lp-foot{padding:52px 40px;text-align:center;border-top:1px solid rgba(0,245,255,0.03);
  background:rgba(4,9,15,0.95)}
.lp-foot-l{font-family:'Orbitron',monospace;font-weight:900;font-size:15px;color:#00f5ff;
  letter-spacing:4px;margin-bottom:10px;text-shadow:0 0 18px rgba(0,245,255,0.2)}
.lp-foot-s{font-family:'Share Tech Mono',monospace;font-size:11px;color:#1e3d55;letter-spacing:1.5px}
.lp-foot-links{display:flex;gap:20px;justify-content:center;margin-top:18px;flex-wrap:wrap}
.lp-foot-links span{font-family:'Exo 2',sans-serif;font-size:11px;color:#2a4a5a}

/* ── REVEAL ── */
.rv{opacity:0;transform:translate3d(0,50px,0);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.rv.v{opacity:1;transform:translate3d(0,0,0)}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .lp-nav{padding:0 20px}
  .lp-nav-r{gap:16px}
  .lp-hero{padding:110px 24px 60px}
  .lp-stats{gap:24px;flex-wrap:wrap;justify-content:center}
  .lp-sec{padding:80px 24px}
  .lp-sv{font-size:28px}
  .lp-enter span:first-child{display:none}
}
`;

/* ─── PARTICLES (GPU-friendly, mouse-interactive) ── */
function Particles() {
  const ref = useRef(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W, H, raf;
    let mx = -999, my = -999;

    function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    resize();

    const cols = ["#00f5ff", "#ff79c6", "#50fa7b", "#bd93f9", "#ffcc44"];
    const dots = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.2 + 0.6,
      a: Math.random() * 0.3 + 0.12,
      ph: Math.random() * 6.28,
      col: cols[Math.floor(Math.random() * cols.length)],
    }));

    function frame(t) {
      ctx.clearRect(0, 0, W, H);

      // draw lines first (behind dots)
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const d = dx * dx + dy * dy;
          if (d < 18000) { // ~134px
            const alpha = (1 - d / 18000) * 0.07;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = dots[i].col;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      // draw dots
      for (const p of dots) {
        // mouse interaction
        if (mx > 0) {
          const dx = mx - p.x, dy = my - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 200 && d > 1) {
            p.vx += (dx / d) * 0.015;
            p.vy += (dy / d) * 0.015;
          }
        }
        p.vx *= 0.998; p.vy *= 0.998;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        const flicker = p.a + Math.sin(t * 0.0015 + p.ph) * 0.08;
        ctx.globalAlpha = Math.max(0.04, flicker);
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fill();

        // tiny soft glow on bigger particles
        if (p.r > 1.5) {
          ctx.globalAlpha = flicker * 0.15;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, 6.28);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    frame(0);

    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ─── ANIMATED COUNTER ── */
function Counter({ end, suffix = "", dur = 1800 }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const ran = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true;
        const t0 = performance.now();
        (function tick(now) {
          const p = Math.min((now - t0) / dur, 1);
          setV(Math.round((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, dur]);
  return <span ref={ref}>{v}{suffix}</span>;
}

/* ─── SCROLL REVEAL ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".rv");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("v"); }),
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── DATA ── */
const FEATS = [
  { icon: "🌐", name: "3D Bloch Spheres", desc: "Visualize qubit states on interactive 3D spheres with Three.js rendering. Drag to orbit, watch quantum vectors evolve with silky-smooth interpolation.", tag: "VISUALIZATION", c: "#00f5ff", g: "rgba(0,245,255,0.06)" },
  { icon: "⚡", name: "Circuit Builder", desc: "18+ quantum gates — Pauli, Hadamard, Phase, Rotation & entangling gates. Build circuits click-by-click, step through execution with playback.", tag: "INTERACTIVE", c: "#50fa7b", g: "rgba(80,250,123,0.06)" },
  { icon: "🌡️", name: "Noise Simulation", desc: "Dial temperature from 15 mK to 300 K. Add depolarizing noise. Watch fidelity degrade and T₂ coherence time shrink in real time.", tag: "SIMULATION", c: "#ffcc44", g: "rgba(255,204,68,0.06)" },
  { icon: "🤖", name: "Quantum Tutor", desc: "AI chatbot that explains superposition, entanglement, gates, and measurement. Ask anything — it guides your experiments live.", tag: "AI TUTOR", c: "#bd93f9", g: "rgba(189,147,249,0.06)" },
];

const LEARNS = [
  { n: "01", t: "Superposition", d: "Apply Hadamard gates and watch qubits exist in multiple states on the Bloch sphere equator.", c: "#00f5ff" },
  { n: "02", t: "Entanglement", d: "Create Bell states with H + CNOT — achieve 100% correlation and see Einstein's 'spooky action.'", c: "#ff79c6" },
  { n: "03", t: "Quantum Gates", d: "Master 18+ gates — from Pauli-X bit flips to CNOT entanglement — with interactive tooltips.", c: "#50fa7b" },
  { n: "04", t: "Measurement", d: "Run multi-shot experiments, analyze distributions, and experience wavefunction collapse.", c: "#ffcc44" },
  { n: "05", t: "Decoherence", d: "Explore temperature-dependent fidelity loss, noise channels, and coherence time limits.", c: "#bd93f9" },
  { n: "06", t: "Circuit Design", d: "Compose algorithms from scratch, step through gate-by-gate, and watch states transform.", c: "#ff5555" },
];

/* ─── MAIN ── */
export default function LandingPage({ onEnterLab, onPlayGame }) {
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="lp">
      <style>{CSS}</style>
      <div className="lp-grid" />

      {/* NAV */}
      <nav className={`lp-nav${scrolled ? " s" : ""}`}>
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="lp-spinner" />
          <div><div className="lp-logo-t">QUANTUM LAB</div><div className="lp-logo-s">2-QUBIT SIMULATOR</div></div>
        </div>
        <div className="lp-nav-r">
          <button className="lp-nl" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
          <button className="lp-nl" onClick={() => document.getElementById("learn")?.scrollIntoView({ behavior: "smooth" })}>Learn</button>
          <button className="lp-game-btn" onClick={onPlayGame}><span className="sh" />🎮 Play Game</button>
          <button className="lp-enter" onClick={onEnterLab}><span className="sh" />⚛ Enter Lab</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <Particles />
        <div className="lp-orb lp-o1" />
        <div className="lp-orb lp-o2" />
        <div className="lp-orb lp-o3" />
        <div className="lp-ring lp-r1" />
        <div className="lp-ring lp-r2" />
        <div className="lp-ring lp-r3" />

        <div className="lp-badge"><span className="lp-bdot" />INTERACTIVE QUANTUM SIMULATOR</div>

        <h1 className="lp-h1">
          Explore the<br /><span className="cy">Quantum</span> World
        </h1>

        <p className="lp-sub">
          Build circuits, visualize <b>Bloch spheres</b>, simulate <b>noise</b>,
          and master quantum mechanics — all in your browser.
        </p>

        <div className="lp-btns">
          <button className="lp-cta" onClick={onEnterLab}><span className="sh" />⚛ Launch Simulator</button>
          <button className="lp-cta2" onClick={onPlayGame}>🎮 Qubit Flip Challenge</button>
        </div>

        <div className="lp-stats">
          {[
            { v: 18, s: "+", l: "QUANTUM GATES", c: "#00f5ff", c2: "#50fa7b" },
            { v: 3, s: "D", l: "BLOCH SPHERES", c: "#ff79c6", c2: "#bd93f9" },
            { v: 2, s: "", l: "QUBITS", c: "#50fa7b", c2: "#00f5ff" },
            { v: null, s: "∞", l: "EXPERIMENTS", c: "#ffcc44", c2: "#ff79c6" },
          ].map((s) => (
            <div className="lp-stat" key={s.l} style={{ "--sc": s.c, "--sc2": s.c2, "--sg": s.c + "44" }}>
              <div className="lp-sv">{s.v !== null ? <Counter end={s.v} suffix={s.s} /> : s.s}</div>
              <div className="lp-sl">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-sec" id="features">
        <div className="rv">
          <div className="lp-sec-tag" style={{ color: "#00f5ff" }}><span className="ln" />POWERFUL FEATURES<span className="ln" /></div>
          <h2 className="lp-sec-h2">Everything You Need to<br />Learn <span style={{ color: "#00f5ff" }}>Quantum Computing</span></h2>
          <p className="lp-sec-p">A complete quantum lab — real-time 3D visualization, interactive circuits, realistic noise, and an AI tutor. No setup required.</p>
        </div>
        <div className="lp-fg">
          {FEATS.map((f, i) => (
            <div key={f.name} className="lp-fc rv" style={{ "--fc": f.c, "--fg": f.g, transitionDelay: `${i * 0.12}s` }}>
              <div className="topline" />
              <div className="bloom" />
              <div className="lp-fi" style={{ background: f.c + "0c", borderColor: f.c + "20" }}>
                <div className="rng" />{f.icon}
              </div>
              <div className="lp-fn">{f.name}</div>
              <div className="lp-fd">{f.desc}</div>
              <span className="lp-ft" style={{ color: f.c, background: f.c + "08", borderColor: f.c + "28" }}>
                <span className="td" />{f.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* GAME PROMO */}
      <section className="lp-game-promo rv">
        <div className="glow-orb" />
        <div className="lp-gp-badge"><span className="bdot" />LEARN BY PLAYING</div>
        <h2 className="lp-gp-h">🎮 Qubit Flip <span style={{ color: '#ff79c6' }}>Challenge</span></h2>
        <p className="lp-gp-p">
          Apply quantum gates to rotate qubits from start to target state.
          10 progressive levels — from simple bit flips to multi-gate circuits!
        </p>
        <div className="lp-gp-levels">
          {['Bit Flip', 'Superposition', 'H² = I', 'Phase', 'Combos'].map((l, i) => (
            <span key={l} className="lp-gp-lv" style={{
              color: ['#00f5ff', '#50fa7b', '#ffcc44', '#bd93f9', '#ff79c6'][i],
              borderColor: ['#00f5ff', '#50fa7b', '#ffcc44', '#bd93f9', '#ff79c6'][i] + '33',
              background: ['#00f5ff', '#50fa7b', '#ffcc44', '#bd93f9', '#ff79c6'][i] + '08',
            }}>{l}</span>
          ))}
        </div>
        <button className="lp-game-cta" onClick={onPlayGame}><span className="sh" />🎮 Play Now</button>
      </section>

      {/* LEARN */}
      <section className="lp-sec" id="learn" style={{ background: "rgba(9,21,32,0.2)" }}>
        <div className="rv">
          <div className="lp-sec-tag" style={{ color: "#ff79c6" }}><span className="ln" />CURRICULUM<span className="ln" /></div>
          <h2 className="lp-sec-h2">What You'll <span style={{ color: "#ff79c6" }}>Learn</span></h2>
          <p className="lp-sec-p">Master every fundamental through hands-on experiments. Each concept comes alive in the interactive simulator.</p>
        </div>
        <div className="lp-lg">
          {LEARNS.map((item, i) => (
            <div key={item.n} className="lp-lc rv" style={{ "--lc": item.c, transitionDelay: `${i * 0.08}s` }}>
              <div className="lp-ln" style={{ color: item.c + "1a" }}>{item.n}</div>
              <div><div className="lp-lt">{item.t}</div><div className="lp-ld">{item.d}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-ban rv">
        <div className="rad" />
        <h2 className="lp-ctah">Ready to <span style={{ color: "#00f5ff" }}>Experiment</span>?</h2>
        <p className="lp-ctap">Jump into the quantum lab and start building circuits in seconds. No installation — just pure quantum exploration.</p>
        <button className="lp-cta" onClick={onEnterLab} style={{ position: "relative", zIndex: 1 }}><span className="sh" />⚛ Start Experimenting</button>
      </section>

      {/* FOOTER */}
      <footer className="lp-foot">
        <div className="lp-foot-l">QUANTUM LAB</div>
        <div className="lp-foot-s">Built for Students · 2-Qubit Simulator</div>
        <div className="lp-foot-links">
          <span>Bloch Spheres</span><span>·</span><span>Circuit Builder</span><span>·</span>
          <span>Noise Sim</span><span>·</span><span>AI Tutor</span>
        </div>
      </footer>
    </div>
  );
}
