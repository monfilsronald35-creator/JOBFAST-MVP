import type { AudioStreamInfo, WaveformData } from '../types/audio';

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/media/audio${path}`, {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function getStreamInfo(mediaId: string): Promise<AudioStreamInfo> {
  return api<AudioStreamInfo>(`/${mediaId}/stream`);
}

async function getWaveform(mediaId: string): Promise<WaveformData> {
  return api<WaveformData>(`/${mediaId}/waveform`);
}

async function generateWaveform(mediaId: string): Promise<string> {
  const result = await api<{ jobId: string }>('/waveform/generate', { mediaId });
  return result.jobId;
}

async function generateTranscript(mediaId: string, language = 'ht'): Promise<string> {
  const result = await api<{ jobId: string }>('/transcript/generate', { mediaId, language });
  return result.jobId;
}

async function getTranscript(mediaId: string): Promise<string | null> {
  try {
    const result = await api<{ transcript: string }>(`/${mediaId}/transcript`);
    return result.transcript;
  } catch {
    return null;
  }
}

// Build normalized waveform path for SVG rendering (0–1 amplitude values → SVG points)
function waveformToSVGPath(samples: number[], width: number, height: number): string {
  if (!samples.length) return '';
  const step   = width / samples.length;
  const mid    = height / 2;
  const points = samples
    .map((amp, i) => `${i * step},${mid - amp * mid} ${i * step},${mid + amp * mid}`)
    .join(' ');
  return `M ${points}`;
}

// Client-side audio recording helper using MediaRecorder
function startRecording(options: { mimeType?: string } = {}): Promise<{
  stop: () => Promise<Blob>;
  cancel: () => void;
}> {
  return new Promise(async (resolve, reject) => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      reject(err);
      return;
    }

    const mimeType  = options.mimeType ?? 'audio/webm;codecs=opus';
    const recorder  = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(250);

    resolve({
      stop: () => new Promise<Blob>(res => {
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          res(new Blob(chunks, { type: mimeType }));
        };
        recorder.stop();
      }),
      cancel: () => {
        recorder.stop();
        stream.getTracks().forEach(t => t.stop());
      },
    });
  });
}

export const AudioEngine = {
  getStreamInfo,
  getWaveform,
  generateWaveform,
  generateTranscript,
  getTranscript,
  waveformToSVGPath,
  startRecording,
};
