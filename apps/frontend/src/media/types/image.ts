export type ImageVariantName = 'thumbnail' | 'small' | 'medium' | 'large' | 'retina' | '4k' | '8k' | 'original';
export type ImageFormat      = 'webp' | 'avif' | 'jpeg' | 'png' | 'svg';

export interface ImageVariantConfig {
  name:     ImageVariantName;
  width:    number;
  height?:  number;
  quality:  number;   // 1–100
  format:   'webp' | 'avif' | 'jpeg' | 'png';
}

// Standard variant configs for the processing pipeline
export const IMAGE_VARIANT_CONFIGS: ImageVariantConfig[] = [
  { name: 'thumbnail', width: 80,   quality: 70, format: 'webp' },
  { name: 'small',     width: 320,  quality: 75, format: 'webp' },
  { name: 'medium',    width: 640,  quality: 80, format: 'webp' },
  { name: 'large',     width: 1280, quality: 85, format: 'webp' },
  { name: 'retina',    width: 1920, quality: 80, format: 'webp' },
  { name: '4k',        width: 3840, quality: 85, format: 'webp' },
  { name: '8k',        width: 7680, quality: 90, format: 'webp' },
];

export interface ResponsiveImage {
  src:          string;      // default src (medium webp)
  srcSet:       string;      // WebP srcset
  srcSetAVIF?:  string;      // AVIF srcset (even smaller)
  sizes:        string;      // responsive sizes hint
  blurDataUrl?: string;      // base64 LQIP for blur-up placeholder
  width:        number;
  height:       number;
  aspectRatio?: number;
  alt?:         string;
}

export interface ImageOptimizeResult {
  variants:        Partial<Record<ImageVariantName, string>>;
  original:        string;
  blurPlaceholder: string;   // tiny base64 image
  responsive:      ResponsiveImage;
  dominantColor?:  string;   // hex
}

export interface SmartCropResult {
  x:      number;
  y:      number;
  width:  number;
  height: number;
  saliency: number;  // 0–1 confidence
}
