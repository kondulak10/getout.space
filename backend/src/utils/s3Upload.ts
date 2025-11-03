import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
	region: process.env.AWS_REGION || 'eu-north-1',
});

const S3_BUCKET = 'getout-space-web';
const CLOUDFRONT_DOMAIN = 'https://getout.space'; // Use custom domain instead of CloudFront directly

/**
 * Upload image buffer to S3
 * @param buffer Image buffer
 * @param key S3 key (path) for the file
 * @param contentType MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadImageToS3(
	buffer: Buffer,
	key: string,
	contentType: string = 'image/png'
): Promise<string> {
	try {
		console.log(`📤 Uploading to S3: ${key}`);

		const command = new PutObjectCommand({
			Bucket: S3_BUCKET,
			Key: key,
			Body: buffer,
			ContentType: contentType,
			CacheControl: 'public, max-age=31536000', // Cache for 1 year
		});

		await s3Client.send(command);

		const publicUrl = `${CLOUDFRONT_DOMAIN}/${key}`;
		console.log(`✅ Uploaded successfully: ${publicUrl}`);

		return publicUrl;
	} catch (error) {
		console.error('❌ S3 upload error:', error);
		throw new Error(`Failed to upload to S3: ${error}`);
	}
}

/**
 * Generate S3 key for profile images
 * @param userId User ID
 * @param type 'original' or 'hexagon'
 * @returns S3 key
 */
export function getProfileImageKey(userId: string, type: 'original' | 'hexagon'): string {
	return `profile-images/${userId}/${type}.png`;
}
