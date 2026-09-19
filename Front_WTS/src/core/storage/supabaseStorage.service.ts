import { getSupabaseClient } from '@/core/supabase/client';

export type StorageBucket = 'user-avatars' | 'service-gallery';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PUBLIC_URL_LENGTH = 250;

export function assertImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Solo se permiten imagenes JPG, PNG o WEBP.');
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error('La imagen no puede superar 5 MB.');
  }
}

function extensionOf(file: File) {
  if (file.type === 'image/png') return '.png';
  if (file.type === 'image/webp') return '.webp';
  return '.jpg';
}

function sanitizeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  const sanitized = withoutExtension
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  return sanitized || 'image';
}

/**
 * Nombre unico y corto para que la URL publica quepa en
 * profile_picture_url / provider_profile_images.image_url.
 */
function buildObjectName(file: File) {
  return `${Date.now()}_${crypto.randomUUID()}_${sanitizeBaseName(file.name)}${extensionOf(file)}`;
}

export async function uploadFile(
  file: File,
  bucketName: StorageBucket,
): Promise<string> {
  assertImageFile(file);

  const fileName = buildObjectName(file);
  const supabase = getSupabaseClient();
  const bucket = supabase.storage.from(bucketName);

  const { error } = await bucket.upload(fileName, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || 'No se pudo subir la imagen.');
  }

  const { data } = bucket.getPublicUrl(fileName);
  const publicUrl = data.publicUrl;

  if (!publicUrl?.startsWith('https://')) {
    throw new Error('Supabase no devolvio una URL publica valida.');
  }

  if (publicUrl.length > MAX_PUBLIC_URL_LENGTH) {
    throw new Error('La URL publica generada es demasiado larga.');
  }

  return publicUrl;
}

export async function uploadFiles(
  files: File[],
  bucketName: StorageBucket,
): Promise<string[]> {
  const publicUrls: string[] = [];

  for (const file of files) {
    publicUrls.push(await uploadFile(file, bucketName));
  }

  return publicUrls;
}
