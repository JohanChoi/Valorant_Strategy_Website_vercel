import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';

const PRODUCTION_UPLOAD_DIR = '/var/www/valorant-strategy-board/uploads';

export interface StoredMediaFile {
  url: string;
  filePath: string;
}

export function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR);
  }

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_UPLOAD_DIR;
  }

  return path.join(process.cwd(), 'public', 'uploads');
}

export function getPublicUploadUrl(parts: string[]): string {
  return `/uploads/${parts.map(encodeURIComponent).join('/')}`;
}

export function getUploadPath(parts: string[]): string | null {
  if (!isSafePath(parts)) {
    return null;
  }

  const uploadDir = getUploadDir();
  const filePath = path.resolve(uploadDir, ...parts);
  const relativePath = path.relative(uploadDir, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

export async function storeMediaFile(file: File, parts: string[]): Promise<StoredMediaFile> {
  const filePath = getUploadPath(parts);
  if (!filePath) {
    throw new Error('Unsafe upload path.');
  }

  await mkdir(path.dirname(filePath), { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  return {
    url: getPublicUploadUrl(parts),
    filePath,
  };
}

export async function deleteLocalUpload(publicUrl: string): Promise<void> {
  const parts = getUploadPartsFromUrl(publicUrl);
  if (!parts) {
    return;
  }

  const filePath = getUploadPath(parts);
  if (!filePath) {
    return;
  }

  await unlink(filePath).catch(() => undefined);
}

export function getUploadPartsFromUrl(publicUrl: string): string[] | null {
  let pathname: string;

  try {
    pathname = new URL(publicUrl, 'http://local').pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith('/uploads/')) {
    return null;
  }

  const parts = pathname
    .slice('/uploads/'.length)
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return '';
      }
    });

  return isSafePath(parts) ? parts : null;
}

export function getMediaContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.apng':
      return 'image/apng';
    case '.avif':
      return 'image/avif';
    case '.gif':
      return 'image/gif';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.ogg':
    case '.ogv':
      return 'video/ogg';
    case '.webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}

export function makeStoredFileName(originalName: string, mediaType: string, index: number): string {
  const ext = path.extname(originalName) || (mediaType === 'image' ? '.png' : '.mp4');
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '') || (mediaType === 'image' ? '.png' : '.mp4');

  return `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}${safeExt}`;
}

function isSafePath(parts: string[]): boolean {
  return (
    parts.length > 0 &&
    parts.every((part) => part.length > 0 && !part.includes('\0') && part !== '..' && part !== '.' && !/[\\/]/.test(part))
  );
}
