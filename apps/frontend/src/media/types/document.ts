export type DocumentFormat = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'pptx' | 'ppt' | 'txt' | 'csv' | 'odt' | 'ods' | 'odp';
export type DocumentCategory = 'contract' | 'invoice' | 'certificate' | 'report' | 'other';

export interface DocumentFile {
  mediaId:        string;
  format:         DocumentFormat;
  category?:      DocumentCategory;
  pageCount?:     number;
  wordCount?:     number;
  fileSize:       number;   // bytes
  hasPassword?:   boolean;
  extractedText?: string;
  language?:      string;
  thumbnailUrl?:  string;
  previewUrl?:    string;   // first page as image
}

export type PreviewType = 'pdf_embed' | 'image_pages' | 'html' | 'text';

export interface DocumentPreview {
  mediaId:     string;
  previewType: PreviewType;
  previewUrl?: string;
  pages?:      string[];   // per-page image URLs (for image_pages)
  html?:       string;     // inline HTML (for html type)
  pageCount:   number;
  expiresAt?:  number;     // signed URL expiry
}
