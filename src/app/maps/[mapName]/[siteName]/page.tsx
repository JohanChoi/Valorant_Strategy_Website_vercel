import Link from 'next/link';
import { MAPS } from '@/lib/maps';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{ mapName: string; siteName: string }>;
}

export default async function SitePage({ params }: PageProps) {
  const { mapName, siteName } = await params;
  const mapKey = Object.keys(MAPS).find((k) => k.toLowerCase() === mapName.toLowerCase());

  if (!mapKey) return notFound();

  const upperSite = siteName.toUpperCase();
  if (!MAPS[mapKey].includes(upperSite)) return notFound();

  const posts = await prisma.post.findMany({
    where: { mapName: mapKey, siteName: upperSite },
    include: {
      user: { select: { username: true } },
      media: { orderBy: { order: 'asc' } },
      _count: { select: { comments: true, media: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-8">
        <Link href={`/maps/${mapName.toLowerCase()}`} className="text-muted back-link">
          Back to {mapKey}
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
          <span className="text-red">{'//'}</span> {mapKey} - Site {upperSite}
        </h1>
        <p className="text-muted">
          {posts.length} {posts.length === 1 ? 'strategy' : 'strategies'} shared
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="card glass-panel text-center" style={{ padding: '3rem' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No strategies posted yet for this site.</p>
          <Link href="/upload" className="btn" style={{ display: 'inline-block' }}>
            Be the first to upload
          </Link>
        </div>
      ) : (
        <div className="post-grid">
          {posts.map((post) => {
            const cover = post.media[0] || { url: post.mediaUrl, type: post.mediaType };
            const mediaCount = Math.max(post._count.media, post.media.length || 1);

            return (
              <Link href={`/post/${post.id}`} key={post.id}>
                <div className="post-card card">
                  <div className="post-card-media">
                    {cover.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.url} alt={post.title} />
                    ) : (
                      <video src={cover.url} muted />
                    )}
                    <div className="media-type-badge">
                      {mediaCount} {mediaCount === 1 ? 'file' : 'files'}
                    </div>
                  </div>
                  <div className="post-card-body">
                    <h3 style={{ fontSize: '1.1rem' }}>{post.title}</h3>
                    <div className="post-card-meta flex justify-between">
                      <span className="text-muted">by {post.user.username}</span>
                      <span className="text-muted">{post._count.comments} comments</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
