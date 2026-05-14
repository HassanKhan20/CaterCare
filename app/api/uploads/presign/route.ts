import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { presignUpload, UPLOAD_PURPOSES } from '@/lib/photo-upload';
import { z } from 'zod';

const Body = z.object({
  purpose: z.enum(UPLOAD_PURPOSES),
  contentType: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = Body.parse(await req.json());
  const { uploadUrl, publicUrl } = await presignUpload({
    userId: session.user.id,
    purpose: body.purpose,
    contentType: body.contentType,
  });
  return NextResponse.json({ uploadUrl, publicUrl });
}
