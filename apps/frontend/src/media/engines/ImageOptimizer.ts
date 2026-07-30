import type { ImageOptimizeResult, ImageVariantName, ResponsiveImage } from '../types/image';
import type { MediaTransform } from '../types/core';
import { IMAGE_VARIANT_CONFIGS } from '../types/image';
import { CDNManager } from '../cdn/CDNManager';

// Breakpoint → sizes hint for responsive images
const DEFAULT_SIZES = '(max-width: 480px) 320px, (max-width: 960px) 640px, (max-width: 1440px) 1280px, 1920px';

// Check browser support once on load
const _supportsAVIF = detectAVIF();
const _supportsWebP = detectWebP();

function detectWebP(): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
  });
}

function detectAVIF(): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgAGDAwWDIAAB0hAAAMCAA';
  });
}

function buildSrcSet(storageKey: string, widths: number[], format: 'webp' | 'avif' | 'jpeg'): string {
  return widths
    .map(w => `${CDNManager.buildUrl(storageKey, { width: w, format, quality: 80 })} ${w}w`)
    .join(', ');
}

async function getBlurPlaceholder(storageKey: string): Promise<string> {
  // Fetch a 20px wide, blurred version and return as data URI
  const url = CDNManager.buildUrl(storageKey, { width: 20, quality: 10, blur: 10, format: 'jpeg' });
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

function buildResponsiveImage(
  storageKey: string,
  width:      number,
  height:     number,
  blurDataUrl: string,
  alt?:        string,
): ResponsiveImage {
  const variantWidths = IMAGE_VARIANT_CONFIGS.map(v => v.width);

  return {
    src:          CDNManager.buildUrl(storageKey, { width: 640,  format: 'webp', quality: 80 }),
    srcSet:       buildSrcSet(storageKey, variantWidths, 'webp'),
    srcSetAVIF:   buildSrcSet(storageKey, variantWidths, 'avif'),
    sizes:        DEFAULT_SIZES,
    blurDataUrl,
    width,
    height,
    aspectRatio:  height > 0 ? width / height : undefined,
    alt,
  };
}

async function optimize(
  storageKey: string,
  width:      number,
  height:     number,
  alt?:       string,
): Promise<ImageOptimizeResult> {
  const blurPlaceholder = await getBlurPlaceholder(storageKey);

  const variants: Partial<Record<ImageVariantName, string>> = {};
  for (const cfg of IMAGE_VARIANT_CONFIGS) {
    variants[cfg.name] = CDNManager.buildUrl(storageKey, {
      width:   cfg.width,
      format:  cfg.format,
      quality: cfg.quality,
    });
  }
  variants.original = CDNManager.buildUrl(storageKey);

  return {
    variants,
    original:       CDNManager.buildUrl(storageKey),
    blurPlaceholder,
    responsive:     buildResponsiveImage(storageKey, width, height, blurPlaceholder, alt),
  };
}

function bestFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
  return _supportsAVIF.then(avif => {
    if (avif) return 'avif';
    return _supportsWebP.then(webp => (webp ? 'webp' : 'jpeg'));
  });
}

function getCDNUrl(storageKey: string, transform?: MediaTransform): string {
  return CDNManager.buildUrl(storageKey, transform);
}

export const ImageOptimizer = {
  optimize,
  buildResponsiveImage,
  buildSrcSet,
  getBlurPlaceholder,
  getCDNUrl,
  bestFormat,
};
