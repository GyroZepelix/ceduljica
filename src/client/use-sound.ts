import { useCallback, useRef, useState } from 'react';
import { loadMuted, saveMuted } from './storage.js';

type SoundName = 'tap' | 'ready' | 'reveal';

interface SoundControls {
  muted: boolean;
  toggle: () => void;
  play: (name: SoundName) => void;
}

export function useSound(): SoundControls {
  const [muted, setMuted] = useState(loadMuted);
  const contextRef = useRef<AudioContext | null>(null);
  const userActivated = useRef(false);

  const ensureContext = useCallback((): AudioContext | null => {
    if (contextRef.current) return contextRef.current;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return null;
    contextRef.current = new AudioContextClass();
    return contextRef.current;
  }, []);

  const play = useCallback(
    (name: SoundName): void => {
      if (name === 'tap') userActivated.current = true;
      if (muted || !userActivated.current) return;
      const context = ensureContext();
      if (!context) return;
      if (context.state === 'suspended') {
        void context.resume().then(() => emit(context, name));
      } else if (context.state === 'running') {
        emit(context, name);
      }
    },
    [ensureContext, muted],
  );

  const toggle = useCallback((): void => {
    userActivated.current = true;
    const next = !muted;
    if (next) {
      const context = contextRef.current;
      contextRef.current = null;
      if (context) void context.close();
    } else {
      const context = ensureContext();
      if (context?.state === 'suspended') void context.resume();
    }
    setMuted(next);
    saveMuted(next);
  }, [ensureContext, muted]);

  return { muted, toggle, play };
}

function emit(context: AudioContext, name: SoundName): void {
  const notes = name === 'tap' ? [330] : name === 'ready' ? [440, 587] : [392, 523, 659];
  const duration = name === 'tap' ? 0.055 : name === 'ready' ? 0.16 : 0.5;
  const start = context.currentTime;
  for (const [index, frequency] of notes.entries()) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteStart = start + index * (duration / notes.length) * 0.72;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration / notes.length);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + duration / notes.length + 0.01);
  }
}
