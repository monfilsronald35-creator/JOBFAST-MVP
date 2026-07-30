import type { SmartCropResult } from '../types/image';

export interface TaggingResult {
  mediaId:    string;
  tags:       string[];
  categories: string[];
  confidence: number;   // 0–1
  language:   string;
}

export interface NSFWResult {
  mediaId:    string;
  isNSFW:     boolean;
  score:      number;   // 0–1
  categories: {
    adult:     number;
    violence:  number;
    hate:      number;
    spam:      number;
  };
}

export interface OCRResult {
  mediaId:    string;
  text:       string;
  confidence: number;
  language:   string;
  blocks:     Array<{
    text:   string;
    x:      number;
    y:      number;
    width:  number;
    height: number;
  }>;
}

export interface DuplicateCheckResult {
  mediaId:      string;
  isDuplicate:  boolean;
  originalId?:  string;
  similarity:   number;  // 0–1
}

export interface FaceDetectionResult {
  mediaId:  string;
  count:    number;
  faces:    Array<{
    x:          number;
    y:          number;
    width:      number;
    height:     number;
    confidence: number;
  }>;
}

async function api<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/media/ai${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function autoTag(mediaId: string, language = 'ht'): Promise<TaggingResult> {
  return api<TaggingResult>('/tag', { mediaId, language });
}

async function checkNSFW(mediaId: string): Promise<NSFWResult> {
  return api<NSFWResult>('/nsfw', { mediaId });
}

async function runOCR(mediaId: string, language?: string): Promise<OCRResult> {
  return api<OCRResult>('/ocr', { mediaId, language });
}

async function smartCrop(mediaId: string, targetWidth: number, targetHeight: number): Promise<SmartCropResult> {
  return api<SmartCropResult>('/smart-crop', { mediaId, targetWidth, targetHeight });
}

async function checkDuplicate(mediaId: string): Promise<DuplicateCheckResult> {
  return api<DuplicateCheckResult>('/duplicate', { mediaId });
}

async function detectFaces(mediaId: string): Promise<FaceDetectionResult> {
  return api<FaceDetectionResult>('/faces', { mediaId });
}

async function blurFaces(mediaId: string): Promise<string> {
  const result = await api<{ newMediaId: string }>('/blur-faces', { mediaId });
  return result.newMediaId;
}

async function generateCaption(mediaId: string, language = 'ht'): Promise<string> {
  const result = await api<{ caption: string }>('/caption', { mediaId, language });
  return result.caption;
}

async function generateAltText(mediaId: string, language = 'ht'): Promise<string> {
  const result = await api<{ altText: string }>('/alt-text', { mediaId, language });
  return result.altText;
}

async function analyzeColor(mediaId: string): Promise<{
  dominant: string;
  palette:  string[];
  isDark:   boolean;
}> {
  return api('/color', { mediaId });
}

export const AIMediaEngine = {
  autoTag,
  checkNSFW,
  runOCR,
  smartCrop,
  checkDuplicate,
  detectFaces,
  blurFaces,
  generateCaption,
  generateAltText,
  analyzeColor,
};
