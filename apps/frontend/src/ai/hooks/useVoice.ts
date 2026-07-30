import { useState, useCallback, useRef } from 'react';
import type { VoiceResult } from '../types';
import { VoiceEngine } from '../engines/VoiceEngine';

export interface UseVoiceOptions {
  language?:   string;
  onTranscript?: (text: string) => void;
  autoProcess?: boolean;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const [recording,   setRecording]   = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const [transcript,  setTranscript]  = useState('');
  const [result,      setResult]      = useState<VoiceResult | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const recorder = await VoiceEngine.startRecording();
      recorderRef.current = recorder;
      chunksRef.current   = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        setRecording(false);
        if (!options.autoProcess) return;
        setProcessing(true);
        try {
          const blob    = new Blob(chunksRef.current, { type: 'audio/webm' });
          const base64  = await VoiceEngine.audioToBase64(blob);
          const sttResult = await VoiceEngine.speechToText(base64, options.language);
          setTranscript(sttResult.text ?? '');
          setResult(sttResult);
          if (sttResult.text) options.onTranscript?.(sttResult.text);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'STT failed');
        } finally {
          setProcessing(false);
        }
      };

      recorder.start(100);
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach(t => t.stop());
  }, []);

  const speak = useCallback(async (text: string) => {
    setProcessing(true);
    setError(null);
    try {
      const r = await VoiceEngine.textToSpeech(text, { language: options.language });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TTS failed');
    } finally {
      setProcessing(false);
    }
  }, [options.language]);

  const processCommand = useCallback(async (audioBase64: string): Promise<VoiceResult> => {
    setProcessing(true);
    try {
      const stt = await VoiceEngine.speechToText(audioBase64, options.language);
      if (!stt.text) return stt;
      return VoiceEngine.parseCommand(stt.text);
    } finally {
      setProcessing(false);
    }
  }, [options.language]);

  return {
    recording, processing, transcript, result, error,
    startRecording, stopRecording, speak, processCommand,
    registerCommand: VoiceEngine.registerCommand,
  };
}