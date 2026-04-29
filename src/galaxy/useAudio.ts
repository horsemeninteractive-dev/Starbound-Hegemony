import { useEffect, useRef, useCallback } from "react";

/**
 * useAudio hook manages the application's audio state and provides methods to play sound effects.
 * Wired up to all interactive UI elements for a premium, tactile experience.
 */
export function useAudio(enabled: boolean, musicVolume: number, sfxVolume: number) {
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  
  // Audio sources - currently using placeholders until user provides final assets
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

  useEffect(() => {
    if (!enabled) {
      if (ambientRef.current) ambientRef.current.pause();
      return;
    }

    if (!ambientRef.current) {
      ambientRef.current = new Audio(SOURCES.ambient);
      ambientRef.current.loop = true;
    }

    ambientRef.current.volume = musicVolume * 0.9;
    
    const playAmbient = () => {
      ambientRef.current?.play().catch(() => {});
    };

    playAmbient();

    return () => {
      ambientRef.current?.pause();
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
