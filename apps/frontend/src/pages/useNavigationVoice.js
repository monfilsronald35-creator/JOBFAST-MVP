import { useState, useCallback, useRef } from 'react';

/**
 * useNavigationVoice — SpeechSynthesis wrapper for navigation instructions.
 */
export function useNavigationVoice() {
  const [voiceOn, setVoiceOn] = useState(true);
  const utteranceRef = useRef(null);

  const speak = useCallback((text, lang = 'ht-HT') => {
    if (!voiceOn || !text || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utterance.voice = match;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceOn]);

  return { voiceOn, setVoiceOn, speak };
}