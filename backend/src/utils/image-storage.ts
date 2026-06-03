/**
 * Image storage abstraction — local filesystem (default) or S3 + CloudFront (CDN).
 *
 * Local:  images are saved to IMAGES_DIR and served by Express at /v1/sync/images/:id
 * S3:     images are uploaded to S3; the public URL uses CloudFront if CDN_DOMAIN is set,
 *         otherwise falls back to the S3 public URL.
 *
 * Switch: set S3_BUCKET (and optionally CDN_DOMAIN) in the environment.
 */

import { writeFileSync } from 'node:fs';
import { env } from '../config/env.js';
import { writeLog } from './logger.js';

const S3_CONTENT_TYPE = 'image/webp';

interface StoreResult {
  imagePath: string | null;
  imageUrl: string | null;
}

/**
 * Stores an image buffer and returns the public URL.
 * @param essayId - Used as the storage key / filename
 * @param buffer  - WebP image bytes
 * @param localPath - Absolute path where local storage saves the file
 * @returns imagePath: filesystem path (null for S3 mode)
 *          imageUrl:  public CDN/S3 URL (null for local mode — Express serves it)
 */
export async function storeImage(essayId: string, buffer: Buffer, localPath: string | null): Promise<StoreResult> {
  if (env.s3Bucket) {
    return storeInS3(essayId, buffer);
  }
  return storeLocally(buffer, localPath!);
}

/**
 * Returns the public URL for a stored image.
 * For local mode, returns the Express endpoint URL.
 * For S3 mode, returns the CDN or S3 URL (no Express round-trip).
 */
export function getImagePublicUrl(essayId: string, backendUrl: string): string {
  if (env.s3Bucket) {
    const key = `${env.s3KeyPrefix}${essayId}.webp`;
    if (env.cdnDomain) return `https://${env.cdnDomain}/${key}`;
    return `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com/${key}`;
  }
  return `${backendUrl}/v1/sync/images/${essayId}`;
}

// ─── Local adapter ────────────────────────────────────────────────────────────

function storeLocally(buffer: Buffer, localPath: string): StoreResult {
  writeFileSync(localPath, buffer);
  return { imagePath: localPath, imageUrl: null };
}

// ─── S3 adapter ───────────────────────────────────────────────────────────────

async function storeInS3(essayId: string, buffer: Buffer): Promise<StoreResult> {
  const key = `${env.s3KeyPrefix}${essayId}.webp`;

  // Lazy-load AWS SDK — keeps startup fast when S3 is not configured
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const client = new S3Client({ region: env.s3Region });

  try {
    await client.send(new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: S3_CONTENT_TYPE,
      // CacheControl optimized for write-once images (essay images never change)
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    writeLog('info', 's3_image_uploaded', { essayId, key, bucket: env.s3Bucket });

    const imageUrl = env.cdnDomain
      ? `https://${env.cdnDomain}/${key}`
      : `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com/${key}`;

    return { imagePath: null, imageUrl };
  } catch (err) {
    writeLog('error', 's3_upload_failed', { essayId, key, error: (err as Error).message });
    throw err;
  }
}
