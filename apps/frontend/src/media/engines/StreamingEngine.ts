import type { StreamManifest, VideoRendition, VideoResolution } from '../types/video';

// Map resolution label → minimum bandwidth (kbps) to sustain it
const RESOLUTION_BANDWIDTH: Record<VideoResolution, number> = {
  '240p':  400,
  '360p':  700,
  '480p':  1200,
  '720p':  2500,
  '1080p': 5000,
  '1440p': 10000,
  '4k':    20000,
  '8k':    50000,
};

export interface StreamingState {
  currentRendition: VideoRendition | null;
  bufferedSeconds:  number;
  bandwidthKbps:    number;
  isStalling:       boolean;
  stallCount:       number;
}

class StreamingEngineImpl {
  private _bandwidthSamples: number[] = [];
  private _stallCount = 0;

  // Measure available bandwidth by downloading a probe chunk
  async measureBandwidth(probeUrl: string): Promise<number> {
    const startMs = Date.now();
    const res     = await fetch(probeUrl, { cache: 'no-store' });
    const blob    = await res.blob();
    const elapsedMs = Date.now() - startMs;
    const kbps = (blob.size * 8) / elapsedMs;  // bits/ms = kbps
    this._bandwidthSamples.push(kbps);
    if (this._bandwidthSamples.length > 10) this._bandwidthSamples.shift();
    return kbps;
  }

  // Exponential moving average of last N bandwidth samples
  getEstimatedBandwidth(): number {
    if (!this._bandwidthSamples.length) return 0;
    return this._bandwidthSamples.reduce((sum, v) => sum + v, 0) / this._bandwidthSamples.length;
  }

  // Pick the best rendition for current connection
  selectRendition(manifest: StreamManifest, targetWidth?: number): VideoRendition {
    const bandwidth = this.getEstimatedBandwidth();
    const { renditions } = manifest;

    // Filter by bandwidth sustainability (with 20% safety margin)
    let suitable = renditions.filter(r => r.bitrate <= bandwidth * 0.8);

    // If bandwidth unknown or very high, allow all
    if (!bandwidth || !suitable.length) suitable = renditions;

    // Filter by viewport width if given
    if (targetWidth) suitable = suitable.filter(r => r.width <= targetWidth * 2) ?? suitable;

    // Pick highest quality from suitable set
    return suitable.reduce((best, r) => (r.bitrate > best.bitrate ? r : best), suitable[0]);
  }

  // Adaptive quality step-up: check if we can bump quality
  shouldUpgrade(current: VideoRendition, manifest: StreamManifest, bufferedSeconds: number): boolean {
    if (bufferedSeconds < 10) return false;   // not enough buffer
    const bandwidth   = this.getEstimatedBandwidth();
    const candidates  = manifest.renditions.filter(r => r.bitrate > current.bitrate && r.bitrate <= bandwidth * 0.7);
    return candidates.length > 0;
  }

  // Adaptive quality step-down: check if we need to drop quality
  shouldDowngrade(current: VideoRendition, manifest: StreamManifest, bufferedSeconds: number): boolean {
    if (bufferedSeconds > 5) return false;  // still enough buffer
    const bandwidth   = this.getEstimatedBandwidth();
    return current.bitrate > bandwidth * 0.9;
  }

  recordStall(): void { this._stallCount++; }
  get stallCount(): number { return this._stallCount; }

  // Attach to an HTMLVideoElement and manage adaptive quality (no external HLS lib needed for native HLS)
  attachToVideoElement(video: HTMLVideoElement, manifest: StreamManifest): () => void {
    const onStall = () => this.recordStall();
    video.addEventListener('waiting', onStall);

    if (manifest.protocol === 'hls' && (video.canPlayType('application/vnd.apple.mpegurl') !== '')) {
      // Native HLS (Safari, iOS) — browser handles adaptation
      video.src = manifest.manifestUrl;
    } else {
      // Fallback: direct MP4 or pick best rendition
      const rendition = this.selectRendition(manifest, video.offsetWidth);
      video.src = rendition.url;
    }

    return () => { video.removeEventListener('waiting', onStall); };
  }
}

export const StreamingEngine = new StreamingEngineImpl();
