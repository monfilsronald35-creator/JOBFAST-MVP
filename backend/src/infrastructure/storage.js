/**
 * Infrastructure — Object Storage
 * Wraps Supabase Storage for images, documents, and media
 */
import { supabase } from '../config/supabaseClient.js';

const BUCKETS = {
  AVATARS:   'avatars',
  JOBS:      'job-attachments',
  DOCUMENTS: 'documents',
  MEDIA:     'media',
  PUBLIC:    'public-assets',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = {
  image:    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'application/msword', 'text/plain'],
  video:    ['video/mp4', 'video/webm'],
};

async function ensureBucket(bucket) {
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (!data) {
    await supabase.storage.createBucket(bucket, {
      public: bucket === BUCKETS.PUBLIC || bucket === BUCKETS.AVATARS,
      fileSizeLimit: MAX_FILE_SIZE,
    });
  }
}

export async function upload(bucket, path, fileBuffer, mimeType) {
  await ensureBucket(bucket);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return data;
}

export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

export async function remove(bucket, paths) {
  const { error } = await supabase.storage.from(bucket).remove(Array.isArray(paths) ? paths : [paths]);
  if (error) throw new Error(`Storage delete failed: ${error.message}`);
  return true;
}

export async function listFiles(bucket, folder = '') {
  const { data, error } = await supabase.storage.from(bucket).list(folder);
  if (error) throw new Error(`Storage list failed: ${error.message}`);
  return data || [];
}

// Generate a signed URL for private files (24h expiry)
export async function signedUrl(bucket, path, expiresIn = 86400) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data?.signedUrl || null;
}

// Upload avatar for a user — auto-generates path
export async function uploadAvatar(userId, fileBuffer, mimeType) {
  const ext  = mimeType === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;
  await upload(BUCKETS.AVATARS, path, fileBuffer, mimeType);
  return getPublicUrl(BUCKETS.AVATARS, path);
}

export { BUCKETS, ALLOWED_TYPES };
export default { upload, getPublicUrl, remove, listFiles, signedUrl, uploadAvatar, BUCKETS };
