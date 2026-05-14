import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (_s3) return _s3;
  _s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
  return _s3;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const UPLOAD_PURPOSES = [
  'cook-id',
  'cook-cert',
  'cook-dshs',
  'dish',
  'cook-profile',
  'driver-license',
  'driver-insurance',
  'driver-id',
  'driver-car',
  'driver-thermal-bag',
  'pickup-confirm',
  'dropoff-confirm',
] as const;

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export async function presignUpload(args: {
  userId: string;
  purpose: UploadPurpose;
  contentType: string;
}) {
  if (!ALLOWED_MIME.includes(args.contentType)) {
    throw new Error(`Unsupported content type: ${args.contentType}`);
  }
  const key = `${args.purpose}/${args.userId}/${crypto.randomUUID()}`;
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET ?? '',
    Key: key,
    ContentType: args.contentType,
  });
  const uploadUrl = await getSignedUrl(getS3(), cmd, { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { uploadUrl, publicUrl, key };
}
