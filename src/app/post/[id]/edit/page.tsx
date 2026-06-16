import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import EditPostForm from '@/components/EditPostForm';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session) redirect('/login');

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      mapName: true,
      siteName: true,
      userId: true,
    },
  });

  if (!post || post.userId !== session.userId) return notFound();

  return (
    <div className="flex justify-center" style={{ paddingBottom: '3rem' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '640px' }}>
        <div className="mb-4">
          <Link href={`/post/${post.id}`} className="text-muted back-link">
            Back to post
          </Link>
        </div>
        <h2 className="text-center mb-8" style={{ fontSize: '1.6rem' }}>
          <span className="text-red">{'//'}</span> Edit Strategy
        </h2>
        <EditPostForm post={post} />
      </div>
    </div>
  );
}
