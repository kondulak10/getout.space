import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
	region: process.env.AWS_REGION || 'eu-north-1',
});

const S3_BUCKET = 'getout-space-web';
const CLOUDFRONT_DOMAIN = 'https://cdn.getout.space';

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
			CacheControl: 'public, max-age=31536000',
			ACL: 'public-read', // Allow public access via S3 website endpoint
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

export function getProfileImageKey(userId: string, type: 'original' | 'hexagon'): string {
	return `profile-images/${userId}/${type}.png`;
}
