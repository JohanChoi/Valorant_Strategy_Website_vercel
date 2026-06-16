import { NextResponse } from 'next/server';
import { cameraState, commandLogs } from '@/lib/camera';

export async function GET() {
  try {
    // Prevent client caching so logs and coordinates stream fresh
    return NextResponse.json(
      {
        state: cameraState,
        logs: commandLogs,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown status error';
    return NextResponse.json(
      { error: 'Failed to retrieve camera status', details: message },
      { status: 500 }
    );
  }
}
