import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Shield, Globe, Rocket, Zap } from 'lucide-react';
import logo from "@/assets/logo.png";

interface CreditsScreenProps {
  onClose: () => void;
  onPlayClick?: () => void;
}

const CREDITS_DATA = [
  { section: "Founder & Lead Architect", names: ["Daniel Stone"] },
  { section: "Core Prototyping", names: ["Google AI Studio"] },
  { section: "Primary Development", names: ["Google Antigravity"] },
  { section: "Tactical UI Framework", names: ["Shadcn UI", "Tailwind CSS"] },
  { section: "Design & Technical Assistance", names: ["Gemini 3.1 Pro", "Gemini 3 Flash", "Claude Sonnet 4.6", "ChatGPT 4o"] },
  { section: "Stellar Cartography", names: ["Three.js", "React Three Fiber"] },
  { section: "Neural Link Integration", names: ["Supabase", "Edge Runtime"] },
  { section: "Musical Composition", names: ["Triskelion Audio"] },
  { section: "Aesthetic Direction", names: ["Midjourney v6.1"] },
  { section: "Sound Engineering", names: ["Kenney's Tactical Pack"] },
  { section: "Special Thanks", names: ["The Beta Testing Cohort", "All Early Supporters", "The Open Source Community"] },
];

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onClose, onPlayClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Flatten the credits into a sequential timeline of names
  const sequence = useMemo(() => {
    const list: any[] = [{ type: 'intro' }];
    CREDITS_DATA.forEach((group) => {
      group.names.forEach((name) => {
        list.push({ type: 'credit', section: group.section, name });
      });
    });
    list.push({ type: 'finale' });
    return list;
  }, []);

  const totalSlides = sequence.length;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const runTimer = (idx: number) => {
      let duration = 6500; // Standard duration for credits
      if (sequence[idx].type === 'intro') duration = 5000;
      if (sequence[idx].type === 'finale') duration = 12000;
      
      timeout = setTimeout(() => {
        const nextIdx = (idx + 1) % totalSlides;
        setCurrentIndex(nextIdx);
        runTimer(nextIdx);
      }, duration);
    };

    runTimer(0);

    return () => {
      clearTimeout(timeout);
    };
  }, [totalSlides, sequence]);

  const current = sequence[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background with Cinematic Space Aesthetic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep Nebula Layers */}
        <div className="absolute inset-0 bg-black" />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.1)_0%,transparent_50%)]" 
        />
        
        {/* Digital Grid Layer */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }} 
        />

        {/* Dynamic Scan Lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>

        {/* High-Fidelity Parallax Starfield */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() > 0.8 ? '2px' : '1px',
                height: Math.random() > 0.8 ? '2px' : '1px',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: Math.random() > 0.9 ? '0 0 10px rgba(255,255,255,0.8)' : 'none'
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>

        {/* Floating Digital Dust / Bokeh */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`dust-${i}`}
              className="absolute w-24 h-24 bg-primary/5 rounded-full blur-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, 50, -50, 0],
                y: [0, -50, 50, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Global Grain Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] brightness-200 pointer-events-none" />
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => {
          onPlayClick?.();
          onClose();
        }}
        className="absolute top-6 right-6 sm:top-10 sm:right-10 z-[310] p-3 sm:p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-full transition-all group backdrop-blur-md"
      >
        <X className="w-6 h-6 sm:w-8 sm:h-8 text-primary/40 group-hover:text-primary" />
      </motion.button>

      <div className="relative z-[10] w-full h-full flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {current.type === 'intro' && (
             <motion.div
               key="intro"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 1.2, ease: "easeOut" }}
               className="flex flex-col items-center space-y-8 sm:space-y-12 text-center px-6"
             >
               <motion.div
                 animate={{ 
                   filter: ["drop-shadow(0 0 20px rgba(6,182,212,0.2))", "drop-shadow(0 0 40px rgba(6,182,212,0.4))", "drop-shadow(0 0 20px rgba(6,182,212,0.2))"]
                 }}
                 transition={{ duration: 4, repeat: Infinity }}
               >
                 <img
                   src={logo}
                   alt="Starbound Hegemony"
                   className="h-24 sm:h-40 w-auto"
                 />
               </motion.div>
               <div className="space-y-4">
                 <h1 className="text-4xl sm:text-7xl font-display text-primary tracking-[0.2em] sm:tracking-[0.4em] uppercase text-glow">
                   Starbound Hegemony
                 </h1>
                 <p className="text-sm sm:text-lg font-mono-hud text-primary/40 uppercase tracking-[0.5em] sm:tracking-[0.8em]">
                   Production Credits
                 </p>
               </div>
             </motion.div>
          )}

          {current.type === 'credit' && (
            <div key="credit-container" className="flex flex-col items-center justify-center w-full space-y-12 sm:space-y-20 px-6">
              <div className="h-10 sm:h-12 flex items-center justify-center overflow-visible">
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={current.section}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-xs sm:text-xl font-mono-hud text-primary/60 uppercase tracking-[0.4em] sm:tracking-[0.8em] text-center"
                  >
                    {current.section}
                  </motion.h3>
                </AnimatePresence>
              </div>
 
              <div className="h-20 sm:h-24 flex items-center justify-center overflow-visible">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={current.name}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-3xl sm:text-6xl lg:text-7xl font-display text-white uppercase tracking-wider text-center"
                  >
                    {current.name}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          )}

          {current.type === 'finale' && (
            <motion.div
              key="finale"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              className="flex flex-col items-center space-y-10 sm:space-y-14 text-center px-6"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="relative p-8 sm:p-12 bg-primary/5 rounded-3xl border border-primary/20 backdrop-blur-3xl shadow-[0_0_50px_rgba(6,182,212,0.1)]"
              >
                {/* Internal Glow */}
                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl" />
                
                <div className="relative flex items-center gap-6 sm:gap-10">
                  <Shield size={40} className="text-primary/40" />
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/40 blur-xl animate-pulse" />
                    <Globe size={60} className="relative text-primary animate-spin-slow" />
                  </div>
                  <Rocket size={40} className="text-primary/40" />
                </div>
              </motion.div>
              
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-2xl sm:text-4xl font-display text-white tracking-widest uppercase">Horsemen Interactive</h2>
                
                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  <span className="w-12 sm:w-24 h-px bg-primary/20 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-primary fill-primary animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                  <span className="w-12 sm:w-24 h-px bg-primary/20 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] sm:text-[12px] font-mono-hud text-primary/50 uppercase tracking-[0.4em] sm:tracking-[0.6em] font-medium max-w-sm mx-auto leading-relaxed">
                    Charting the infinite for the pioneers of tomorrow.
                  </p>
                  <div className="flex flex-col gap-2 pt-4">
                    <p className="text-[8px] sm:text-[10px] font-mono-hud text-primary/20 uppercase tracking-[0.3em]">Neural Link Protocol Active</p>
                    <p className="text-[8px] sm:text-[10px] font-mono-hud text-primary/10 uppercase tracking-[0.2em]">London • United Kingdom</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Aesthetic Overlays */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none" />
    </motion.div>
  );
};
