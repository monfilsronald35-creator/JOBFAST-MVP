/**
 * Message compression using the browser's native CompressionStream API.
 * Falls back to identity (no compression) if the API is unavailable.
 * Wire format for compressed payloads: "cmp:" + base64url(compressed_bytes)
 */

const HEADER   = 'cmp:';
const FORMAT   = 'deflate-raw';

const SUPPORTED = typeof CompressionStream !== 'undefined' &&
                  typeof DecompressionStream !== 'undefined';

export class Compressor {
  readonly #minBytes: number;

  constructor(minBytes = 512) {
    this.#minBytes = minBytes;
  }

  get isSupported(): boolean { return SUPPORTED; }

  async compress(text: string): Promise<string> {
    if (!SUPPORTED || text.length < this.#minBytes) return text;

    try {
      const bytes    = new TextEncoder().encode(text);
      const cs       = new CompressionStream(FORMAT);
      const writer   = cs.writable.getWriter();
      void writer.write(bytes);
      void writer.close();

      const chunks: Uint8Array[] = [];
      const reader = cs.readable.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      const compressed = this.#concat(chunks);
      if (compressed.length >= bytes.length) return text; // No benefit

      return HEADER + this.#bytesToB64(compressed);
    } catch {
      return text;
    }
  }

  async decompress(data: string): Promise<string> {
    if (!SUPPORTED || !data.startsWith(HEADER)) return data;

    try {
      const bytes = this.#b64ToBytes(data.slice(HEADER.length));
      const ds    = new DecompressionStream(FORMAT);
      const writer = ds.writable.getWriter();
      void writer.write(bytes);
      void writer.close();

      const chunks: Uint8Array[] = [];
      const reader = ds.readable.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }

      return new TextDecoder().decode(this.#concat(chunks));
    } catch {
      return data;
    }
  }

  isCompressed(data: string): boolean {
    return typeof data === 'string' && data.startsWith(HEADER);
  }

  #concat(chunks: Uint8Array[]): Uint8Array {
    const total  = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  #bytesToB64(bytes: Uint8Array): string {
    let s = '';
    bytes.forEach(b => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  #b64ToBytes(b64: string): Uint8Array {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded.padEnd(padded.length + (4 - padded.length % 4) % 4, '='));
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  }
}