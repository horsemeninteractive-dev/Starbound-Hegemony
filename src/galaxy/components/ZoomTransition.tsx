// ZoomTransition.tsx
// Stellaris-style radial warp overlay when entering or exiting a star system.
//
// Architecture note: UnifiedMap uses a single canvas with camera animation.
// This component is a PURELY VISUAL overlay — it plays alongside the camera
// move, adding the cinematic flash without needing to coordinate a canvas swap.
//
// Usage in Index.tsx:
//   const [zoomOrigin, setZoomOrigin] = useState<{x:number;y:number}|null>(null);
//   const [zoomDir, setZoomDir]       = useState<"in"|"out">("in");
//
//   // When opening a system:
//   setZoomOrigin({ x: lastMouseX.current, y: lastMouseY.current });
//   setZoomDir("in");
//   app.openSystem(id);
//
//   // When going back to galaxy:
//   setZoomOrigin({ x: window.innerWidth/2, y: window.innerHeight/2 });
//   setZoomDir("out");
//   app.backToGalaxy();
//
//   {zoomOrigin && (
//     <ZoomTransition
//       origin={zoomOrigin}
//       direction={zoomDir}
//       onComplete={() => setZoomOrigin(null)}
//     />
//   )}

import { useEffect, useRef } from "react";

interface Props {
  /** Screen-space pixel coordinate to expand from / collapse to. */
  origin: { x: number; y: number };
  /** "in" = galaxy → system (expand then collapse from origin).
   *  "out" = system → galaxy (expand from centre then collapse to origin). */
  direction: "in" | "out";
  /** Called when the animation is fully complete. */
  onComplete: () => void;
}

const easeInExpo  = (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10);
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export function ZoomTransition({ origin, direction, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef   = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || doneRef.current) return;

    const W = window.innerWidth, H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Max radius = diagonal from origin to furthest corner
    const maxR = Math.ceil(Math.max(
      Math.hypot(origin.x,         origin.y),
      Math.hypot(W - origin.x,     origin.y),
      Math.hypot(origin.x,         H - origin.y),
      Math.hypot(W - origin.x,     H - origin.y),
    )) + 30;

    const EXPAND_MS  = 400;
    const HOLD_MS    = 60;
    const COLLAPSE_MS = 340;
    const TOTAL_MS   = EXPAND_MS + HOLD_MS + COLLAPSE_MS;

    // For "out" direction: we expand from screen centre and collapse toward origin
    const expandOrigin  = direction === "in"  ? origin          : { x: W / 2, y: H / 2 };
    const collapseOrigin = direction === "in" ? origin          : origin;

    let phase: "expand" | "hold" | "collapse" = "expand";
    let phaseStart = performance.now();
    let rafId: number;

    const drawFrame = (cx: number, cy: number, radius: number, alpha: number) => {
      ctx.clearRect(0, 0, W, H);
      if (radius <= 0 || alpha <= 0) return;

      ctx.globalAlpha = alpha;

      // Dark mask with circular hole
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2, true); // winding = hole
      ctx.fillStyle = "#020509";
      ctx.fill("evenodd");

      // Glowing rim
      const rimW = Math.max(3, radius * 0.045);
      const grad = ctx.createRadialGradient(cx, cy, Math.max(0, radius - rimW * 2), cx, cy, radius + rimW);
      grad.addColorStop(0,   "rgba(0,200,212,0)");
      grad.addColorStop(0.45,"rgba(0,200,212,0.5)");
      grad.addColorStop(0.75,"rgba(160,240,255,0.9)");
      grad.addColorStop(1,   "rgba(0,200,212,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = rimW * 2;
      ctx.stroke();

      // Inner warp-core glow
      const innerR = Math.min(radius, 180);
      if (innerR > 8) {
        const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
        ig.addColorStop(0,   "rgba(0,200,212,0.16)");
        ig.addColorStop(0.5, "rgba(0,200,212,0.06)");
        ig.addColorStop(1,   "rgba(0,200,212,0)");
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = ig;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const elapsed = now - phaseStart;

      if (phase === "expand") {
        const t = Math.min(elapsed / EXPAND_MS, 1);
        const r = easeInExpo(t) * maxR;
        drawFrame(expandOrigin.x, expandOrigin.y, r, 1);
        if (t >= 1) { phase = "hold"; phaseStart = now; }
      } else if (phase === "hold") {
        // Full screen — just the dark mask, no hole
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "#020509";
        ctx.fillRect(0, 0, W, H);
        if (elapsed >= HOLD_MS) { phase = "collapse"; phaseStart = now; }
      } else {
        const t = Math.min(elapsed / COLLAPSE_MS, 1);
        const r = (1 - easeOutExpo(t)) * maxR;
        const alpha = Math.max(0, 1 - t * 1.5);
        drawFrame(collapseOrigin.x, collapseOrigin.y, r, alpha);
        if (t >= 1) {
          ctx.clearRect(0, 0, W, H);
          if (!doneRef.current) { doneRef.current = true; onComplete(); }
          return;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        pointerEvents: "none",
      }}
    />
  );
}
