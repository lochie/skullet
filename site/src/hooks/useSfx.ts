"use client";

import { useState } from "react";
import useSound from "use-sound";

export const useSfx = ({
  src,
  interrupt = true,
  playbackRate = 1,
  variance = 0.08,
  onEnd,
}: {
  src: string;
  interrupt?: boolean;
  playbackRate?: number;
  /** How far each play's pitch strays from `playbackRate`, either way, so a repeated sound never plays the same twice. */
  variance?: number;
  onEnd?: () => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [count, setCount] = useState(0);

  const [sound, soundProps] = useSound(src, {
    interrupt,
    playbackRate,
    onend: () => {
      setIsPlaying(false);
      onEnd?.();
    },
  });

  // An optional per-call playbackRate overrides the hook's default for this
  // play only (handy for pitch-varying a one-shot on every trigger).
  const play = (opts?: { playbackRate?: number }) => {
    if (isPlaying && !interrupt) return;
    setCount((prev) => prev + 1);
    setIsPlaying(true);
    sound({
      playbackRate:
        opts?.playbackRate ??
        playbackRate * (1 + (Math.random() * 2 - 1) * variance),
    });
  };

  return {
    play,
    duration: soundProps.duration,
    isPlaying,
    playbackCount: count,
  };
};
