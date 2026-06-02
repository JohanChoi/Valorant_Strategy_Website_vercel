import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { Readable } from 'stream';
import { getMediaContentType, getUploadPath } from '@/lib/media-storage';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export const runtime = 'nodejs';

export async function GET(_request: Request, context: RouteContext) {
  const { path: uploadPath } = await context.params;
  const filePath = getUploadPath(uploadPath);

  if (!filePath) {
    return new Response('Not found', { status: 404 });
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    return new Response('Not found', { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new Response(stream, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(fileStat.size),
      'Content-Type': getMediaContentType(filePath),
    },
  });
}
