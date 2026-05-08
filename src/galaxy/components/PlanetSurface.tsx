import React, { useMemo, useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Body, Galaxy, StarType } from "../types";
import { STAR_META } from "../meta";

const ATMOSPHERE_COLORS: Record<string, string> = {
  "Nitrogen-Oxygen": "#87CEEB",
  "Hydrogen-Helium": "#F5F5DC",
  "Nitrogen-Methane": "#FF8C00",
  "Carbon Dioxide": "#DAA520",
  "Corrosive Acid": "#ADFF2F",
  "Silicate Vapors": "#FF4500",
  "Synthetic Trace": "#708090",
  "Trace Nanites": "#C0C0C0",
  "Organic Particulates": "#556B2F",
  "Psionic Haze": "#9932CC",
  "Irradiated Dust": "#BDB76B",
  "Ancient Ozone": "#B0E0E6",
  "Artificially Regulated": "#00BFFF",
  "Stellar Corona": "#FFFFFF",
  "Methane": "#00FFFF",
  "Sulfuric Acid": "#FFFF00",
  "Ammonia": "#E0FFFF",
  "Thin": "#D3D3D3",
  "None": "transparent",
  "Dense Core": "#4B0082",
  "Plasma": "#FF4500",
  "Liquid Metallic": "#C0C0C0",
};

export function PlanetSurface({ body, galaxy, className = "" }: { body: Body; galaxy?: Galaxy; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax Springs
  const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const biomeAssets = useMemo(() => {
    const sub = body.subtype.toLowerCase();
    const atmo = body.atmosphere?.toLowerCase() || "";
    
    let type = "barren";
    
    // 1. High Population / Urban Override
    if (body.population > 5000) { // 5 Billion (population is in millions)
      type = "urban";
    } 
    // 2. Direct Subtype Mapping
    else if (["ecumenopolis"].includes(sub)) {
      type = "urban";
    } else if (["gaia", "tropical", "lush"].includes(sub)) {
      type = "lush";
    } else if (["ocean", "marine", "aquatic"].includes(sub)) {
      type = "oceanic";
    } else if (["desert", "arid"].includes(sub)) {
      type = "desert";
    } else if (["toxic", "shrouded"].includes(sub)) {
      type = "toxic";
    } else if (["relic", "nanite", "machine", "machine_world"].includes(sub)) {
      type = "machine";
    } else if (["infested", "hive"].includes(sub)) {
      type = "infested";
    } else if (["molten", "lava", "volcanic", "magma"].includes(sub)) {
      type = "volcanic";
    } else if (["frozen", "ice", "arctic", "alpine", "tundra", "glacial", "ice_world"].includes(sub)) {
      type = "frozen";
    } else if (["continental", "temperate", "terrestrial", "savanna"].includes(sub)) {
      type = "temperate";
    } else if (sub.includes("gas_giant")) {
      type = "gas_giant";
    } else if (["broken", "shattered"].includes(sub)) {
      type = "shattered";
    } else if (sub === "rogue") {
      type = "rogue";
    } else if (sub === "crystalline" || sub === "carbon") {
      type = "crystalline";
    }
    // 3. Fallback / Keyword Mapping
    else if (sub.includes("swamp") || sub.includes("marsh") || sub.includes("fungal")) {
      type = "swamp";
    } else if (sub.includes("relic") || sub.includes("tomb") || sub.includes("relic")) {
      type = "relic";
    } else if (sub.includes("urban") || sub.includes("city")) {
      type = "urban";
    } else if (sub.includes("toxic") || sub.includes("acid")) {
      type = "toxic";
    } else if (sub.includes("water") || sub.includes("sea")) {
      type = "oceanic";
    } else if (sub.includes("desert") || sub.includes("sand")) {
      type = "desert";
    } else if (sub.includes("crystal")) {
      type = "crystalline";
    } else if (sub.includes("machine") || sub.includes("tech")) {
      type = "machine";
    } else if (sub.includes("broken") || sub.includes("shattered")) {
      type = "shattered";
    }

    return {
      far: `/landscapes/${type}_far.png`,
      mid: `/landscapes/${type}_mid.png`,
      near: `/landscapes/${type}_near.png`,
      type,
      isPopulated: body.population > 0
    };
  }, [body]);

  const colors = useMemo(() => {
    const atmo = body.atmosphere ? ATMOSPHERE_COLORS[body.atmosphere] || "#FFFFFF" : "transparent";
    let land = body.landColor || `hsl(${body.hue}, 40%, 30%)`;
    let sea = body.seaColor || `hsl(${(body.hue + 180) % 360}, 50%, 20%)`;
    
    if (body.type === "star") {
      const meta = STAR_META[body.subtype as StarType];
      const hex = meta?.hex || "ffffff";
      land = `#${hex}`;
      sea = `#${hex}`;
    }
    return { land, sea, atmo };
  }, [body]);

  const parentPlanet = useMemo(() => {
    if (!body.parentId || !galaxy) return null;
    const parent = galaxy.bodyById[body.parentId];
    if (body.type === "moon" && parent && (parent.type === "terrestrial" || parent.type === "gas_giant")) {
      return parent;
    }
    return null;
  }, [body, galaxy]);

  const skyMoons = useMemo(() => {
    if ((body.type !== "terrestrial" && body.type !== "gas_giant") || !body.children) return [];
    return body.children.slice(0, 3);
  }, [body.children, body.type]);

  const skyX = useTransform(mouseX, (v) => v * 10);
  const skyY = useTransform(mouseY, (v) => v * 5);
  const farX = useTransform(mouseX, (v) => v * 30);
  const farY = useTransform(mouseY, (v) => v * 15);
  const midX = useTransform(mouseX, (v) => v * 60);
  const midY = useTransform(mouseY, (v) => v * 25);
  const nearX = useTransform(mouseX, (v) => v * 100);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className={`relative overflow-hidden rounded border border-primary/20 bg-black aspect-[21/9] md:aspect-[3/1] cursor-crosshair ${className}`}
    >
      {/* 1. Atmosphere Gradient */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: `linear-gradient(to bottom, ${colors.atmo}99, ${colors.atmo}33 50%, #000 95%)` 
        }}
      />

      {/* 2. Sky Layer (Celestial Bodies) */}
      <motion.div style={{ x: skyX, y: skyY }} className="absolute inset-0 pointer-events-none">
        {parentPlanet && (
          <div 
            className="absolute -top-[30%] -right-[15%] w-[110%] aspect-square rounded-full opacity-40 blur-[2px] shadow-[inset_-40px_-40px_80px_rgba(0,0,0,0.9)]"
            style={{ 
              background: `radial-gradient(circle at 40% 40%, hsl(${parentPlanet.hue}, 60%, 50%), hsl(${parentPlanet.hue}, 80%, 10%))`,
              transform: "rotate(-15deg)"
            }}
          />
        )}
        {skyMoons.map((moon, i) => (
          <div 
            key={moon.id}
            className="absolute w-8 h-8 rounded-full opacity-60 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            style={{ 
              top: `${10 + i * 15}%`,
              left: `${15 + i * 20}%`,
              background: "radial-gradient(circle at 30% 30%, #ddd, #222)",
              transform: `scale(${0.6 + i * 0.2})`
            }}
          />
        ))}
      </motion.div>

      {/* 3. Background Layer (Distant Peaks) */}
      <motion.div style={{ x: farX, y: farY }} className="absolute inset-x-0 bottom-0 h-[80%] flex items-end pointer-events-none">
        <div className="relative w-[130%] h-full -ml-[15%]">
          <img 
            src={biomeAssets.far} 
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
            alt="Far Back"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundColor: colors.atmo }} />
        </div>
      </motion.div>

      {/* 4. Midground Layer (Main Terrain) */}
      <motion.div style={{ x: midX, y: midY }} className="absolute inset-x-0 bottom-0 h-[85%] flex items-end pointer-events-none">
        <div className="relative w-[140%] h-full -ml-[20%]">
          <img 
            src={biomeAssets.mid} 
            className="w-full h-full object-cover opacity-90 mix-blend-screen"
            alt="Midground"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 opacity-25 mix-blend-color" style={{ backgroundColor: colors.land }} />
        </div>
      </motion.div>

      {/* 5. Infrastructure Layer (Cities) */}
      {biomeAssets.isPopulated && (
        <motion.div style={{ x: midX, y: midY }} className="absolute inset-0 pointer-events-none mix-blend-screen">
          <div className="absolute bottom-[10%] w-full h-[30%] px-10 flex flex-wrap items-end overflow-hidden">
             {[...Array(30)].map((_, i) => (
              <div 
                key={i}
                className="bg-white/80 rounded-sm animate-pulse"
                style={{ 
                  width: `${1 + Math.random() * 2}px`,
                  height: `${2 + Math.random() * 8}px`,
                  position: "absolute",
                  left: `${(i * 133.7) % 90 + 5}%`,
                  bottom: `${(i * 42.1) % 20}%`,
                  opacity: 0.5 + Math.random() * 0.5,
                  animationDelay: `${Math.random() * 5}s`,
                  boxShadow: "0 0 4px #fff"
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* 6. Foreground Layer (Clutter) */}
      <motion.div style={{ x: nearX }} className="absolute inset-x-0 bottom-0 h-[90%] flex items-end pointer-events-none">
        <div className="relative w-[160%] h-full -ml-[30%] -mb-[10%]">
          <img 
            src={biomeAssets.near} 
            className="w-full h-full object-cover opacity-85 mix-blend-screen filter contrast-125 brightness-90"
            alt="Foreground"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 opacity-40 mix-blend-color" style={{ backgroundColor: colors.land }} />
        </div>
      </motion.div>

      {/* 7. Overlay HUD & Signal Texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute inset-x-0 h-[1px] bg-primary/10 animate-scanline shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]" />
        
        <div className="absolute top-3 left-4 flex flex-col gap-0.5">
          <div className="text-[6px] font-mono-hud text-primary/60 uppercase tracking-[0.4em]">
            Surface Visualization Active
          </div>
          <div className="text-[12px] font-display text-primary/90 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            {body.name.toUpperCase()}
          </div>
        </div>

        <div className="absolute bottom-3 right-4 text-right">
          <div className="text-[6px] font-mono-hud text-primary/40 uppercase tracking-[0.3em] leading-relaxed">
            BIOME: {biomeAssets.type.toUpperCase()} // CLASSIFIED<br/>
            POLL: {body.population > 0 ? (body.population / 1000000).toFixed(1) + "M" : "ZERO"}<br/>
            COORD: {body.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}



