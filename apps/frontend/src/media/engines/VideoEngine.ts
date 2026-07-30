import type { StreamManifest, VideoEncodeJob, VideoResolution, VideoThumbnailRequest } from '../types/video';

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/media/video${path}`, {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function getManifest(mediaId: string, protocol: 'hls' | 'dash' | 'mp4' = 'hls'): Promise<StreamManifest> {
  return api<StreamManifest>(`/${mediaId}/manifest?protocol=${protocol}`);
}

async function getEncodeJob(mediaId: string): Promise<VideoEncodeJob | null> {
  try {
    return await api<VideoEncodeJob>(`/${mediaId}/encode-job`);
  } catch {
    return null;
  }
}

async function requestEncode(mediaId: string, resolutions: VideoResolution[], priority: 'low' | 'normal' | 'high' = 'normal'): Promise<VideoEncodeJob> {
  return api<VideoEncodeJob>('/encode', { mediaId, resolutions, priority });
}

async function getThumbnails(req: VideoThumbnailRequest): Promise<string[]> {
  const result = await api<{ urls: string[] }>('/thumbnails', req);
  return result.urls;
}

async function setPosterFrame(mediaId: string, timestampSec: number): Promise<string> {
  const result = await api<{ posterUrl: string }>(`/${mediaId}/poster`, { timestampSec });
  return result.posterUrl;
}

async function addSubtitleTrack(mediaId: string, language: string, label: string, vttContent: string): Promise<void> {
  await api(`/${mediaId}/subtitle`, { language, label, vttContent });
}

async function generateSubtitles(mediaId: string, language = 'ht'): Promise<string> {
  const result = await api<{ jobId: string }>('/subtitle/generate', { mediaId, language });
  return result.jobId;
}

function pollEncodeProgress(mediaId: string, onUpdate: (job: VideoEncodeJob) => void, intervalMs = 3000): () => void {
  let active = true;

  const poll = async () => {
    while (active) {
      const job = await getEncodeJob(mediaId);
      if (job) {
        onUpdate(job);
        if (job.status === 'done' || job.status === 'failed') break;
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
  };

  void poll();
  return () => { active = false; };
}

// Check if browser supports HLS natively (Safari) or needs js player
function supportsNativeHLS(): boolean {
  const video = document.createElement('video');
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
}

export const VideoEngine = {
  getManifest,
  getEncodeJob,
  requestEncode,
  getThumbnails,
  setPosterFrame,
  addSubtitleTrack,
  generateSubtitles,
  pollEncodeProgress,
  supportsNativeHLS,
};
