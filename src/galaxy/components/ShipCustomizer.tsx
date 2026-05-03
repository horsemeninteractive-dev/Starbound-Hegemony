import React, { useState, useRef, memo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { SHIP_PARTS, ShipConfiguration, ShipComponentType } from "../shipPresets";
import { ModularShip } from "./ModularShip";
import { SpaceBackground } from "./SpaceBackground";
import { ChevronLeft, ChevronRight, Rocket, Shield, Cpu, Layout } from "lucide-react";

interface Props {
  config: ShipConfiguration;
  onChange: (config: ShipConfiguration) => void;
  playClick: () => void;
}

const ShipPreview = memo(({ config, previewIntensityRef }: { config: ShipConfiguration; previewIntensityRef: React.MutableRefObject<number> }) => {
  return (
    <Canvas 
      gl={{ antialias: true, alpha: true }} 
      dpr={[1, 2]} 
      camera={{ position: [0, 1, 3.5], fov: 30 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.8, 3]} />
      <ambientLight intensity={1.2} />
      <pointLight position={[5, 5, 5]} intensity={2} />
      <spotLight position={[-5, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      
      {/* Fix for dark white hull: Environment map provides realistic reflections */}
      <Environment preset="city" />
      
      {/* System View Skybox */}
      <SpaceBackground view="system" starType="A" quality="high" />
      
      <group position={[0, -0.2, 0]}>
        <ModularShip config={config} engineIntensityRef={previewIntensityRef} engineColor={config.accentColor} />
      </group>
      
      <OrbitControls 
        enablePan={false} 
        minDistance={1.2} 
        maxDistance={8} 
        autoRotate 
        autoRotateSpeed={0.5}
        makeDefault
      />
    </Canvas>
  );
});

export function ShipCustomizer({ config, onChange, playClick }: Props) {
  const [activeTab, setActiveTab] = useState<ShipComponentType>('hull');
  const previewIntensityRef = useRef(0.8);

  const tabs: { id: ShipComponentType; label: string; icon: React.ElementType }[] = [
    { id: 'hull', label: 'HULL', icon: Shield },
    { id: 'wings', label: 'WINGS', icon: Layout },
    { id: 'engines', label: 'ENGINES', icon: Rocket },
    { id: 'bridge', label: 'BRIDGE', icon: Cpu },
  ];

  const handlePartSelect = (type: ShipComponentType, partId: string) => {
    playClick();
    onChange({
      ...config,
      [`${type}Id`]: partId,
    });
  };

  const activeParts = SHIP_PARTS[activeTab];

  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-black/60 border border-primary/20 backdrop-blur-xl rounded-lg overflow-hidden shadow-2xl min-h-0">
      {/* 3D Preview Area - Sacrifice height to keep controls visible */}
      <div className="relative flex-1 min-h-0 bg-gradient-to-b from-primary/5 to-transparent">
        <ShipPreview config={config} previewIntensityRef={previewIntensityRef} />

        {/* Technical HUD Overlays */}
        <div className="absolute inset-0 pointer-events-none border border-primary/5 m-2 lg:m-4">
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary/30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary/30" />
          <div className="absolute top-2 left-3 flex flex-col gap-0.5">
            <div className="font-mono-hud text-[7px] text-primary uppercase tracking-widest opacity-50">LNK_ESTABLISHED</div>
          </div>
        </div>
      </div>

      {/* Customization Controls - Non-shrinking to guarantee visibility */}
      <div className="flex-none lg:w-[380px] flex flex-col bg-black/40 border-t lg:border-t-0 lg:border-l border-primary/20 min-h-0">
        {/* Ship Name Input */}
        <div className="p-3 border-b border-primary/20 bg-primary/5">
          <div className="font-mono-hud text-[7px] text-primary/40 uppercase tracking-widest mb-1">VESSEL_DESIGNATION</div>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onChange({ ...config, name: e.target.value.substring(0, 24) })}
            placeholder="ENTER_SHIP_NAME"
            className="w-full bg-black/60 border border-primary/20 px-3 py-2 text-primary font-display text-xs lg:text-sm tracking-wider uppercase focus:outline-none focus:border-primary/60 transition-colors placeholder:text-primary/20"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-primary/20 shrink-0 bg-black/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); playClick(); }}
              className={`flex-1 py-2.5 lg:py-4 flex flex-col items-center gap-1 transition-all relative ${
                activeTab === tab.id ? 'text-primary bg-primary/5' : 'text-primary/40 hover:text-primary/60 hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} className="lg:size-[16px]" />
              <span className="font-mono-hud text-[6px] lg:text-[8px] tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          ))}
        </div>

        {/* Selection Area - Scrollable fallback for small heights */}
        <div className="flex-1 p-2 lg:p-3 flex flex-col gap-2 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <div className="font-mono-hud text-[7px] text-primary/40 uppercase flex items-center gap-1.5">
              <span className="w-1 h-1 bg-primary/40 rounded-full" />
              <span>Variant Selection</span>
            </div>

            <div className="grid grid-cols-5 lg:grid-cols-1 gap-1 lg:gap-1.5">
              {activeParts.map((part, idx) => (
                <button
                  key={part.id}
                  onClick={() => handlePartSelect(activeTab, part.id)}
                  className={`group flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3 p-1.5 lg:p-2 border transition-all duration-300 text-center lg:text-left relative overflow-hidden ${
                    config[`${activeTab}Id` as keyof ShipConfiguration] === part.id
                      ? 'border-primary bg-primary/20 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]'
                      : 'border-primary/10 bg-black/40 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className={`hidden lg:block w-1 h-full absolute left-0 top-0 transition-all ${
                    config[`${activeTab}Id` as keyof ShipConfiguration] === part.id ? 'bg-primary' : 'bg-transparent'
                  }`} />
                  
                  <div className="flex-1">
                    <div className={`font-display text-[9px] lg:text-[10px] uppercase tracking-tighter lg:tracking-wider ${
                      config[`${activeTab}Id` as keyof ShipConfiguration] === part.id ? 'text-primary' : 'text-primary/70'
                    }`}>
                      {idx + 1}<span className="hidden lg:inline ml-2">{part.name}</span>
                    </div>
                    <div className="hidden lg:block font-mono-hud text-[7px] text-primary/20 leading-tight uppercase mt-0.5">
                      {part.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Detailed Part Info (Mobile only) */}
            <div className="lg:hidden p-1.5 bg-primary/5 border border-primary/10 rounded">
              <div className="font-display text-[8px] text-primary uppercase tracking-widest leading-none text-center">
                {activeParts.find(p => p.id === config[`${activeTab}Id` as keyof ShipConfiguration])?.name}
              </div>
              <div className="font-mono-hud text-[6px] text-primary/30 uppercase leading-tight mt-1 text-center italic">
                {activeParts.find(p => p.id === config[`${activeTab}Id` as keyof ShipConfiguration])?.description}
              </div>
            </div>
          </div>
        </div>

        {/* Dual Color Customization - Fixed Footer */}
        <div className="shrink-0 p-3 border-t border-primary/20 flex lg:flex-col justify-center lg:items-start gap-6 lg:gap-3 bg-black/20">
          {/* Hull Color */}
          <div className="flex flex-col lg:flex-row lg:w-full items-center lg:justify-between gap-1 lg:gap-2">
            <label className="font-mono-hud text-[6px] lg:text-[7px] text-primary/40 uppercase tracking-widest">HULL</label>
            <div className="flex gap-1 items-center">
              {['#c8d0dc', '#2a2a2a', '#1e293b', '#4a1d1d'].map(color => (
                <button
                  key={color}
                  onClick={() => onChange({ ...config, primaryColor: color })}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm border transition-all ${
                    config.primaryColor === color ? 'border-primary scale-110 shadow-glow-sm' : 'border-transparent opacity-60'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div 
                className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-sm border border-primary/20 overflow-hidden group/picker"
                style={{ background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff, #ff0000)' }}
              >
                <input 
                  type="color" 
                  value={config.primaryColor}
                  onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
                  className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer opacity-0"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 border-t border-l border-white/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Engine Color */}
          <div className="flex flex-col lg:flex-row lg:w-full items-center lg:justify-between gap-1 lg:gap-2">
            <label className="font-mono-hud text-[6px] lg:text-[7px] text-primary/40 uppercase tracking-widest">ENERGY</label>
            <div className="flex gap-1 items-center">
              {['#00ffff', '#ff3333', '#33ff33', '#ffff33'].map(color => (
                <button
                  key={color}
                  onClick={() => onChange({ ...config, accentColor: color })}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm border transition-all ${
                    config.accentColor === color ? 'border-primary scale-110 shadow-glow-sm' : 'border-transparent opacity-60'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div 
                className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-sm border border-primary/20 overflow-hidden group/picker"
                style={{ background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff, #ff0000)' }}
              >
                <input 
                  type="color" 
                  value={config.accentColor}
                  onChange={(e) => onChange({ ...config, accentColor: e.target.value })}
                  className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer opacity-0"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 border-t border-l border-white/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

