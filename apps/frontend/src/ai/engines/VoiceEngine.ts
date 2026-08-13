import type { VoiceRequest, VoiceResult } from '../types';
import { AIGateway } from '../gateway/AIGateway';
import { detectLanguage } from '../prompt/AIPromptEngine';

// Voice command registry
type CommandHandler = (args: Record<string, string>) => void;
const _commands: Map<string, { pattern: RegExp; handler: CommandHandler }> = new Map();

export const VoiceEngine = {
  // ─── Speech to Text ─────────────────────────────────────────────────────

  async speechToText(audioData: string, language?: string): Promise<VoiceResult> {
    try {
      const res = await fetch('/api/ai/voice/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData, language }),
      });
      if (res.ok) return res.json() as Promise<VoiceResult>;
    } catch {
      /* fallback */
    }
    return { type: 'stt', text: '', confidence: 0, language: language ?? 'en' };
  },

  // ─── Text to Speech ─────────────────────────────────────────────────────

  async textToSpeech(
    text: string,
    options?: { language?: string; voice?: string; speed?: number },
  ): Promise<VoiceResult> {
    try {
      const res = await fetch('/api/ai/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ...options }),
      });
      if (res.ok) return res.json() as Promise<VoiceResult>;
    } catch {
      /* */
    }

    // Web Speech API fallback (browser native)
    if (typeof speechSynthesis !== 'undefined') {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options?.language ?? 'ht';
        utterance.rate = options?.speed ?? 1.0;
        speechSynthesis.speak(utterance);
        utterance.onend = () => resolve({ type: 'tts', text, language: utterance.lang });
      });
    }
    return { type: 'tts', text, language: options?.language ?? 'en' };
  },

  // ─── Voice commands ──────────────────────────────────────────────────────

  registerCommand(name: string, pattern: RegExp, handler: CommandHandler): void {
    _commands.set(name, { pattern, handler });
  },

  async parseCommand(text: string): Promise<VoiceResult> {
    const lower = text.toLowerCase().trim();

    for (const [name, { pattern, handler }] of _commands.entries()) {
      const match = pattern.exec(lower);
      if (match) {
        const args: Record<string, string> = {};
        match.groups && Object.assign(args, match.groups);
        handler(args);
        return { type: 'command', text, command: name, commandArgs: args };
      }
    }

    // AI command interpretation fallback
    const interpreted = await AIGateway.json<{
      command: string;
      args: Record<string, string>;
      confidence: number;
    }>(
      `Interpret this voice command and extract the action:\n"${text}"\n\nReturn JSON: { command: string, args: object, confidence: 0-100 }`,
      { strategy: 'fastest', maxTokens: 100 },
    ).catch(() => ({ command: 'unknown', args: {}, confidence: 0 }));

    return {
      type: 'command',
      text,
      command: interpreted.command,
      commandArgs: interpreted.args,
      confidence: interpreted.confidence,
    };
  },

  // ─── Voice translation ───────────────────────────────────────────────────

  async translateVoice(
    audioData: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<VoiceResult> {
    try {
      const res = await fetch('/api/ai/voice/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData, sourceLang, targetLang }),
      });
      if (res.ok) return res.json() as Promise<VoiceResult>;
    } catch {
      /* */
    }
    return { type: 'translation', text: '', language: targetLang };
  },

  // ─── Voice assistant ─────────────────────────────────────────────────────

  async assistant(
    audioData: string,
    sessionId: string,
    userId?: string,
  ): Promise<{ transcript: string; response: string; audioData?: string }> {
    const stt = await this.speechToText(audioData);
    if (!stt.text) return { transcript: '', response: '' };

    const lang = stt.language ?? detectLanguage(stt.text ?? '');
    const response = await AIGateway.complete(stt.text ?? '', {
      context: { ...(userId !== undefined ? { userId } : {}), sessionId, language: lang },
      strategy: 'balanced',
    });

    const tts = await this.textToSpeech(response, { language: lang });
    return {
      transcript: stt.text ?? '',
      response,
      ...(tts.audioData !== undefined ? { audioData: tts.audioData } : {}),
    };
  },

  // ─── Browser Recording ───────────────────────────────────────────────────

  async startRecording(): Promise<MediaRecorder> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return new MediaRecorder(stream);
  },

  audioToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
};
