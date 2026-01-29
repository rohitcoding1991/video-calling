import { useEffect, useRef } from 'react';

export const useRingtone = (shouldPlay: boolean) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/slack_ringtone.mp3');
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (shouldPlay) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Browser may block autoplay without user interaction
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [shouldPlay]);
};
