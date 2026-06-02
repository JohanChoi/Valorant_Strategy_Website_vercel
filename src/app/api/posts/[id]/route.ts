import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { MAPS } from '@/lib/maps';
import { prisma } from '@/lib/prisma';
import { deleteLocalUpload } from '@/lib/media-storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to edit a post.' }, { status: 401 });
    }

    const { id } = await context.params;
    const { title, description, mapName, siteName } = await request.json();

    if (!title || !mapName || !siteName) {
      return NextResponse.json({ error: 'Title, map, and site are required.' }, { status: 400 });
    }

    const mapKey = Object.keys(MAPS).find((k) => k.toLowerCase() === String(mapName).toLowerCase());
    const upperSite = String(siteName).toUpperCase();

    if (!mapKey || !MAPS[mapKey].includes(upperSite)) {
      return NextResponse.json({ error: 'Invalid map or site.' }, { status: 400 });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (existingPost.userId !== session.userId) {
      return NextResponse.json({ error: 'You can only edit your own posts.' }, { status: 403 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: String(title).trim(),
        description: String(description || '').trim(),
        mapName: mapKey,
        siteName: upperSite,
      },
    });

    return NextResponse.json({ message: 'Post updated.', post });
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to delete a post.' }, { status: 401 });
    }

    const { id } = await context.params;
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: {
        userId: true,
        mediaUrl: true,
        media: { select: { url: true } },
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    if (existingPost.userId !== session.userId) {
      return NextResponse.json({ error: 'You can only delete your own posts.' }, { status: 403 });
    }

    await prisma.comment.updateMany({
      where: { postId: id },
      data: { parentCommentId: null },
    });
    await prisma.comment.deleteMany({ where: { postId: id } });
    await prisma.postMedia.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });

    const mediaUrls = new Set([
      existingPost.mediaUrl,
      ...existingPost.media.map((media) => media.url),
    ]);

    for (const mediaUrl of mediaUrls) {
      if (mediaUrl.startsWith('/uploads/')) {
        await deleteLocalUpload(mediaUrl);
      }
    }

    return NextResponse.json({ message: 'Post deleted.' });
  } catch (error) {
    console.error('Post delete error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
