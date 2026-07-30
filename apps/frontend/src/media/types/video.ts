export type VideoResolution = '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '4k' | '8k';
export type StreamProtocol  = 'hls' | 'dash' | 'mp4' | 'webrtc';

export interface VideoRendition {
  resolution: VideoResolution;
  width:      number;
  height:     number;
  bitrate:    number;   // kbps
  url:        string;
  size?:      number;   // bytes
  codecs?:    string;   // e.g. "avc1.42E01E,mp4a.40.2"
}

export interface SubtitleTrack {
  id:       string;
  language: string;     // ISO 639-1
  label:    string;
  url:      string;
  format:   'vtt' | 'srt' | 'ass';
  isDefault?: boolean;
}

export interface AudioTrack {
  id:       string;
  language: string;
  label:    string;
  url:      string;
  isDefault?: boolean;
}

export interface StreamManifest {
  mediaId:         string;
  protocol:        StreamProtocol;
  manifestUrl:     string;
  duration:        number;      // seconds
  renditions:      VideoRendition[];
  thumbnailUrl?:   string;
  posterUrl?:      string;
  subtitleTracks?: SubtitleTrack[];
  audioTracks?:    AudioTrack[];
  isLive?:         boolean;
  dvrWindowSecs?:  number;      // DVR window for live streams
}

export interface VideoEncodeJob {
  mediaId:            string;
  targetResolutions:  VideoResolution[];
  status:             'queued' | 'encoding' | 'done' | 'failed';
  progress:           number;     // 0–100
  currentResolution?: VideoResolution;
  estimatedMinutes?:  number;
  startedAt?:         number;
  completedAt?:       number;
  error?:             string;
}

export interface VideoThumbnailRequest {
  mediaId:    string;
  timestamps: number[];  // seconds; returns frame images
  width?:     number;
}
