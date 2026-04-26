// GalaxyMinimap.tsx
// 2D canvas minimap shown during system/body view.
// Gives the player spatial context of where they are in the galaxy.
// Rendered as a small inset overlay in the bottom-left corner.

import { useEffect, useRef, useMemo, useCallback } from "react";
import type { Galaxy, StarSystem } from "@/galaxy/types";
import { STAR_META } from "@/galaxy/meta";

interface Props {
  galaxy: Galaxy;
  playerSystemId: string;
  viewedSystemId: string | null;
  exploredSystemIds: Set<string>;
  fogOfWar: boolean;
  /** Called when the user clicks the minimap — navigates back to galaxy. */
  onBackToGalaxy: () => void;
}

const MAP_W = 168;
const MAP_H = 128;
const PAD   = 10;

export function GalaxyMinimap({ galaxy, playerSystemId, viewedSystemId, exploredSystemIds, fogOfWar, onBackToGalaxy }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // Pre-compute galaxy bounds once
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const s of galaxy.systems) {
      if (s.pos[0] < minX) minX = s.pos[0];
      if (s.pos[0] > maxX) maxX = s.pos[0];
      if (s.pos[2] < minZ) minZ = s.pos[2];
      if (s.pos[2] > maxZ) maxZ = s.pos[2];
    }
    return { minX, maxX, minZ, maxZ };
  }, [galaxy]);

  const toMap = useCallback((wx: number, wz: number) => {
    const { minX, maxX, minZ, maxZ } = bounds;
    const rx = (wx - minX) / (maxX - minX);
    const rz = (wz - minZ) / (maxZ - minZ);
    return {
      x: PAD + rx * (MAP_W - PAD * 2),
      y: PAD + rz * (MAP_H - PAD * 2),
    };
  }, [bounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = MAP_W * dpr;
    canvas.height = MAP_H * dpr;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const playerSys  = galaxy.systemById[playerSystemId];
    const viewedSys  = viewedSystemId ? galaxy.systemById[viewedSystemId] : null;

    let tick = 0;
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      tick++;

      ctx.clearRect(0, 0, MAP_W, MAP_H);

      // ── Background ──────────────────────────────────────────────────────────
      ctx.fillStyle = "rgba(2,5,9,0.92)";
      ctx.fillRect(0, 0, MAP_W, MAP_H);

      // ── Sector nebula halos ─────────────────────────────────────────────────
      for (const sec of galaxy.sectors) {
        const cx = sec.centroid[0], cz = sec.centroid[2];
        const mp = toMap(cx, cz);
        const g = ctx.createRadialGradient(mp.x, mp.y, 0, mp.x, mp.y, 22);
        const hue = sec.hue;
        g.addColorStop(0,   `hsla(${hue},55%,35%,0.14)`);
        g.addColorStop(0.6, `hsla(${hue},45%,25%,0.06)`);
        g.addColorStop(1,   `hsla(${hue},35%,15%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Hyperlanes ──────────────────────────────────────────────────────────
      ctx.strokeStyle = "rgba(0,200,212,0.10)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (const lane of galaxy.hyperlanes) {
        const a = galaxy.systemById[lane.a];
        const b = galaxy.systemById[lane.b];
        if (!a || !b) continue;
        if (fogOfWar && !exploredSystemIds.has(a.id) && !exploredSystemIds.has(b.id)) continue;
        const ma = toMap(a.pos[0], a.pos[2]);
        const mb = toMap(b.pos[0], b.pos[2]);
        ctx.moveTo(ma.x, ma.y);
        ctx.lineTo(mb.x, mb.y);
      }
      ctx.stroke();

      // ── Star dots ───────────────────────────────────────────────────────────
      for (const sys of galaxy.systems) {
        const isPlayer  = sys.id === playerSystemId;
        const isViewed  = sys.id === viewedSystemId;
        const explored  = !fogOfWar || exploredSystemIds.has(sys.id);
        const mp = toMap(sys.pos[0], sys.pos[2]);
        const meta = STAR_META[sys.starType];
        const color = `#${meta.hex}`;

        if (!explored && !isPlayer) {
          // Fog of war — very faint unknown dot
          ctx.fillStyle = "rgba(80,100,120,0.18)";
          ctx.beginPath();
          ctx.arc(mp.x, mp.y, 0.7, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        // Glow for hubs
        if (sys.gates.length > 3) {
          ctx.shadowColor = color;
          ctx.shadowBlur  = 4;
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = explored ? 0.75 : 0.35;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // ── Viewed system marker ────────────────────────────────────────────────
      if (viewedSys && viewedSys.id !== playerSystemId) {
        const mp = toMap(viewedSys.pos[0], viewedSys.pos[2]);
        ctx.strokeStyle = "rgba(0,200,212,0.7)";
        ctx.lineWidth = 0.8;
        const r = 4 + 0.8 * Math.sin(tick * 0.06);
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, r, 0, Math.PI * 2);
        ctx.stroke();
        // Cross-hair ticks
        ctx.strokeStyle = "rgba(0,200,212,0.5)";
        ctx.lineWidth = 0.6;
        [[mp.x - r - 3, mp.y, mp.x - r - 1, mp.y],
         [mp.x + r + 1, mp.y, mp.x + r + 3, mp.y],
         [mp.x, mp.y - r - 3, mp.x, mp.y - r - 1],
         [mp.x, mp.y + r + 1, mp.x, mp.y + r + 3]].forEach(([x1,y1,x2,y2]) => {
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        });
      }

      // ── Player position — pulsing dot ───────────────────────────────────────
      if (playerSys) {
        const mp = toMap(playerSys.pos[0], playerSys.pos[2]);
        const pulse = 1 + 0.3 * Math.sin(tick * 0.09);
        // Outer ring
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(tick * 0.07);
        ctx.strokeStyle = "#00C8D4";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 4.5 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        // Filled centre
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#00C8D4";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Border ──────────────────────────────────────────────────────────────
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(0,200,212,0.18)";
      ctx.lineWidth = 0.7;
      ctx.strokeRect(0.5, 0.5, MAP_W - 1, MAP_H - 1);

      // ── GALAXY label ────────────────────────────────────────────────────────
      ctx.font = "bold 7px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(0,200,212,0.35)";
      ctx.letterSpacing = "0.2em";
      ctx.textAlign = "left";
      ctx.fillText("GALAXY", PAD, MAP_H - 5);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [galaxy, playerSystemId, viewedSystemId, exploredSystemIds, fogOfWar, toMap]);

  return (
    <div
      title="Click to return to galaxy view"
      onClick={onBackToGalaxy}
      style={{
        position: "absolute",
        bottom: 36,    // sits above the breadcrumb footer
        left: 8,
        width:  MAP_W,
        height: MAP_H,
        cursor: "pointer",
        zIndex: 40,
        // Cut-corner clip matching hud-corner
        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
        transition: "opacity 0.2s",
      }}
      className="hover:opacity-90 active:opacity-75"
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: MAP_W, height: MAP_H }}
      />
      {/* Hover overlay label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,200,212,0)",
          transition: "background 0.2s",
          pointerEvents: "none",
        }}
        className="minimap-hover-overlay"
      />
    </div>
  );
}
