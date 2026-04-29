import { useEffect, useRef, useCallback } from "react";

/**
 * useAudio hook manages the application's audio state and provides methods to play sound effects.
 * Wired up to all interactive UI elements for a premium, tactile experience.
 */
export function useAudio(enabled: boolean, musicVolume: number, sfxVolume: number) {
  const ambientRefA = useRef<HTMLAudioElement | null>(null);
  const ambientRefB = useRef<HTMLAudioElement | null>(null);
  const activeBufferRef = useRef<"A" | "B">("A");
  const crossfadeTimerRef = useRef<number | null>(null);
  
  // Audio sources
  const SOURCES = {
    ambient: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/ambient.mp3",
    click: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/click.wav",
    transition: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/transition.wav",
    expand: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/expand.wav",
    collapse: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/collapse.wav",
    alert: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/alert.wav",
    success: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/success.wav",
    type: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/type.wav",
    notification: "https://storage.googleapis.com/run-sources-starbound-hegemony-europe-west1/assets/sound/notification.wav",
  };

  // Preload SFX for low latency
  const sfxPool = useRef<Record<string, HTMLAudioElement[]>>({});

  const getSfx = useCallback((type: keyof typeof SOURCES) => {
    if (!enabled) return null;
    
    if (!sfxPool.current[type]) {
      sfxPool.current[type] = [];
    }

    let audio = sfxPool.current[type].find(a => a.paused || a.ended);
    if (!audio) {
      audio = new Audio(SOURCES[type]);
      sfxPool.current[type].push(audio);
    }
    
    audio.volume = sfxVolume;
    audio.currentTime = 0;
    return audio;
  }, [enabled, sfxVolume]);

  // Seamless looping logic using double-buffering and crossfading
  useEffect(() => {
    if (!enabled) {
      ambientRefA.current?.pause();
      ambientRefB.current?.pause();
      if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
      return;
    }

    const musicVol = musicVolume * 0.9;
    
    if (!ambientRefA.current) {
      ambientRefA.current = new Audio(SOURCES.ambient);
      ambientRefB.current = new Audio(SOURCES.ambient);
    }

    const a = ambientRefA.current!;
    const b = ambientRefB.current!;

    // We don't use .loop = true because we want a manual crossfade
    a.loop = false;
    b.loop = false;

    const startSeamlessLoop = () => {
      const active = activeBufferRef.current === "A" ? a : b;
      const inactive = activeBufferRef.current === "A" ? b : a;

      active.volume = musicVol;
      active.play().catch(() => {
        // Handle auto-play policy by waiting for interaction
        const resume = () => {
          active.play();
          window.removeEventListener("mousedown", resume);
        };
        window.addEventListener("mousedown", resume);
      });

      // Monitor for loop point
      if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
      
      crossfadeTimerRef.current = window.setInterval(() => {
        const current = activeBufferRef.current === "A" ? a : b;
        const next = activeBufferRef.current === "A" ? b : a;

        // If we are within 1.5s of the end, start the crossfade
        if (current.duration > 0 && current.currentTime > current.duration - 1.5) {
          next.currentTime = 0;
          next.volume = 0;
          next.play().catch(() => {});
          
          // Crossfade over 1 second
          const fadeSteps = 10;
          const fadeInterval = 100;
          let step = 0;
          
          const fader = setInterval(() => {
            step++;
            const progress = step / fadeSteps;
            current.volume = Math.max(0, musicVol * (1 - progress));
            next.volume = Math.min(musicVol, musicVol * progress);
            
            if (step >= fadeSteps) {
              clearInterval(fader);
              current.pause();
              activeBufferRef.current = activeBufferRef.current === "A" ? "B" : "A";
            }
          }, fadeInterval);
        }
      }, 500);
    };

    startSeamlessLoop();

    return () => {
      a.pause();
      b.pause();
      if (crossfadeTimerRef.current) clearInterval(crossfadeTimerRef.current);
    };
  }, [enabled, musicVolume]);

  const playClick = useCallback(() => {
    const sfx = getSfx("click");
    if (sfx) sfx.play().catch(() => {});
  }, [getSfx]);

  const playTransition = useCallback(() => {
    const sfx = getSfx("transition");
    if (sfx) sfx.play().catch(() => {});
  }, [getSfx]);

  const playExpand = useCallback(() => {
    const sfx = getSfx("expand");
    if (sfx) {
      sfx.playbackRate = 1.2;
      sfx.play().catch(() => {});
    }
  }, [getSfx]);

  const playCollapse = useCallback(() => {
    const sfx = getSfx("collapse");
    if (sfx) {
      sfx.playbackRate = 0.8;
      sfx.play().catch(() => {});
    }
  }, [getSfx]);

  const playAlert = useCallback(() => {
    const sfx = getSfx("alert");
    if (sfx) sfx.play().catch(() => {});
  }, [getSfx]);

  const playSuccess = useCallback(() => {
    const sfx = getSfx("success");
    if (sfx) sfx.play().catch(() => {});
  }, [getSfx]);

  const playType = useCallback(() => {
    const sfx = getSfx("type");
    if (sfx) {
      sfx.volume = sfxVolume * 0.5;
      sfx.play().catch(() => {});
    }
  }, [getSfx]);

  const playNotification = useCallback(() => {
    const sfx = getSfx("notification");
    if (sfx) sfx.play().catch(() => {});
  }, [getSfx]);

  return { 
    playClick, 
    playTransition, 
    playExpand, 
    playCollapse, 
    playAlert, 
    playSuccess, 
    playType, 
    playNotification 
  };
}
