import Link from 'next/link';
import { MAPS } from '@/lib/maps';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{ mapName: string }>;
}

export default async function MapPage({ params }: PageProps) {
  const { mapName } = await params;
  const mapKey = Object.keys(MAPS).find((k) => k.toLowerCase() === mapName.toLowerCase());

  if (!mapKey) return notFound();

  const sites = MAPS[mapKey];

  // Get post counts per site
  const siteCounts = await Promise.all(
    sites.map(async (site) => {
      const count = await prisma.post.count({
        where: { mapName: mapKey, siteName: site },
      });
      return { site, count };
    })
  );

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="text-muted back-link">← Back to Maps</Link>
        <h1 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
          <span className="text-red">{'//'}</span> {mapKey}
        </h1>
        <p className="text-muted">Select a site to view strategies and uploads.</p>
      </div>

      <div className="site-grid">
        {siteCounts.map(({ site, count }) => (
          <Link href={`/maps/${mapName.toLowerCase()}/${site}`} key={site}>
            <div className="site-card card">
              <div className="site-card-label">Site</div>
              <h2 className="site-card-letter">{site}</h2>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                {count} {count === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
