import type { ProcessingStatus, MediaType } from '../types';
import type { VideoResolution } from '../types/video';

export interface ProcessingJob {
  jobId:        string;
  mediaId:      string;
  type:         MediaType;
  status:       ProcessingStatus;
  progress:     number;     // 0–100
  steps:        ProcessingStep[];
  createdAt:    number;
  updatedAt:    number;
  completedAt?: number;
  error?:       string;
}

export interface ProcessingStep {
  name:      string;
  status:    ProcessingStatus;
  progress:  number;
  startedAt?: number;
  doneAt?:   number;
}

export interface ImageProcessingRequest {
  mediaId:        string;
  generateVariants?: boolean;
  extractColors?:    boolean;
  runAITagging?:     boolean;
  runNSFWCheck?:     boolean;
  runOCR?:           boolean;
  virusScan?:        boolean;
}

export interface VideoProcessingRequest {
  mediaId:          string;
  targetResolutions: VideoResolution[];
  generateThumbnails?: boolean;
  generateSubtitles?:  boolean;
  extractAudio?:       boolean;
  priority?:           'low' | 'normal' | 'high';
}

export interface AudioProcessingRequest {
  mediaId:            string;
  generateWaveform?:  boolean;
  generateTranscript?: boolean;
  normalizeVolume?:    boolean;
}

export interface DocumentProcessingRequest {
  mediaId:          string;
  generatePreview?: boolean;
  extractText?:     boolean;
  pageCount?:       boolean;
}

async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/media/processing${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function getJob(jobId: string): Promise<ProcessingJob> {
  const res = await fetch(`/api/media/processing/job/${jobId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<ProcessingJob>;
}

async function processImage(req: ImageProcessingRequest): Promise<ProcessingJob> {
  return api<ProcessingJob>('/image', req);
}

async function processVideo(req: VideoProcessingRequest): Promise<ProcessingJob> {
  return api<ProcessingJob>('/video', req);
}

async function processAudio(req: AudioProcessingRequest): Promise<ProcessingJob> {
  return api<ProcessingJob>('/audio', req);
}

async function processDocument(req: DocumentProcessingRequest): Promise<ProcessingJob> {
  return api<ProcessingJob>('/document', req);
}

async function cancelJob(jobId: string): Promise<void> {
  await api('/cancel', { jobId });
}

async function retryJob(jobId: string): Promise<ProcessingJob> {
  return api<ProcessingJob>('/retry', { jobId });
}

function pollJob(
  jobId: string,
  onUpdate: (job: ProcessingJob) => void,
  intervalMs = 2000,
): () => void {
  let active = true;

  const poll = async () => {
    while (active) {
      const job = await getJob(jobId);
      onUpdate(job);
      if (job.status === 'ready' || job.status === 'failed') break;
      await new Promise(r => setTimeout(r, intervalMs));
    }
  };

  void poll();
  return () => { active = false; };
}

export const ProcessingPipeline = {
  processImage,
  processVideo,
  processAudio,
  processDocument,
  getJob,
  cancelJob,
  retryJob,
  pollJob,
};
