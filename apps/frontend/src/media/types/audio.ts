export type AudioFormat = 'mp3' | 'aac' | 'ogg' | 'flac' | 'wav' | 'opus' | 'm4a';
export type AudioCategory = 'voice_message' | 'podcast' | 'music' | 'notification' | 'ai_voice' | 'other';

export interface AudioFile {
  mediaId:     string;
  category:    AudioCategory;
  duration:    number;     // seconds
  bitrate:     number;     // kbps
  sampleRate:  number;     // Hz e.g. 44100
  channels:    number;     // 1=mono, 2=stereo
  format:      AudioFormat;
  waveform?:   number[];   // normalized amplitudes 0–1, ~200 data points
  transcript?: string;     // STT result
  language?:   string;
}

export interface AudioStreamInfo {
  mediaId:      string;
  streamUrl:    string;
  duration:     number;
  format:       AudioFormat;
  waveformData?: number[];  // embedded waveform for preview
  waveformUrl?:  string;    // external waveform image URL
}

export interface WaveformData {
  mediaId:    string;
  samples:    number[];    // normalized 0–1, ~200 points
  duration:   number;
  sampleRate: number;
}
