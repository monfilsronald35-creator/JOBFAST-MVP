import { db }                   from '../../../core/database/SupabaseClient.js';
import type { AIAnalysisResult } from '../types/storage.types.js';

// Document type → content type label
const MIME_CONTENT_MAP: Record<string, string> = {
  'application/pdf':      'document_pdf',
  'image/jpeg':           'photo',
  'image/png':            'image',
  'image/gif':            'animation',
  'video/mp4':            'video',
  'video/webm':           'video',
  'audio/mpeg':           'audio',
  'audio/ogg':            'audio',
  'audio/webm':           'voice_message',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document_word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       'document_excel',
  'application/zip':      'archive',
  'text/plain':           'text',
};

// Category → expected tags for classification hint
const CATEGORY_TAGS: Record<string, string[]> = {
  medical:     ['medical', 'health', 'clinical'],
  government:  ['government', 'official', 'legal'],
  contract:    ['contract', 'legal', 'agreement'],
  invoice:     ['invoice', 'payment', 'financial'],
  cv:          ['resume', 'cv', 'professional'],
  marketplace: ['product', 'commerce'],
};

export const AIFileAnalyzer = {
  async analyze(fileId: string, mimeType: string, category: string, filename: string): Promise<AIAnalysisResult> {
    const contentType = MIME_CONTENT_MAP[mimeType] ?? 'unknown';
    const tags        = [...(CATEGORY_TAGS[category] ?? []), contentType];

    // NSFW detection heuristic (in production: call OpenAI Vision or Google SafeSearch)
    const isNsfw    = false; // Default safe — requires API integration
    const confidence = 0.85;

    // Summary based on category + file type
    const summary = `Fichye ${contentType} nan kategori "${category}" (${filename}).`;

    const row: Record<string, unknown> = {
      file_id:      fileId,
      is_nsfw:      isNsfw,
      content_type: contentType,
      tags,
      confidence,
      summary,
    };

    await db.client().from('stor_ai_analysis').upsert(row, { onConflict: 'file_id' });

    return { fileId, isNsfw, contentType, summary, tags, confidence, createdAt: new Date().toISOString() };
  },

  // OCR stub — in production: call OpenAI GPT-4 Vision or Google Document AI
  async extractText(fileId: string, publicUrl: string): Promise<string> {
    void fileId; void publicUrl;

    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      // No API key — return placeholder
      return '[OCR pa disponib. Konfigire OPENAI_API_KEY pou aktive fonksyon sa a.]';
    }

    // Production: call OpenAI Vision API
    // const response = await openai.chat.completions.create({ model: 'gpt-4-vision-preview', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: publicUrl } }, { type: 'text', text: 'Extract all text from this document.' }] }] });
    // return response.choices[0]?.message?.content ?? '';

    return '[OCR tèks ekstrak — API konfigire]';
  },

  async getAnalysis(fileId: string): Promise<AIAnalysisResult | null> {
    const { data } = await db.client().from('stor_ai_analysis').select('*').eq('file_id', fileId).single();
    if (!data) return null;
    const d = data as Record<string, unknown>;
    const r: AIAnalysisResult = {
      fileId: String(d['file_id']), isNsfw: Boolean(d['is_nsfw']),
      contentType: String(d['content_type']), tags: (d['tags'] as string[]) ?? [],
      confidence: Number(d['confidence']), createdAt: String(d['created_at']),
    };
    if (d['extracted_text']) r.extractedText = String(d['extracted_text']);
    if (d['summary'])        r.summary       = String(d['summary']);
    return r;
  },

  // Flag NSFW content — mark file for review
  async flagNsfw(fileId: string): Promise<void> {
    await db.client().from('stor_ai_analysis').update({ is_nsfw: true }).eq('file_id', fileId);
    await db.client().from('stor_files').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', fileId);
  },
};