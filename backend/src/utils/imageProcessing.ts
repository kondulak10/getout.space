import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';
import { uploadImageToS3, getProfileImageKey } from './s3Upload';

/**
 * Download image from URL (follows redirects)
 */
async function downloadImage(url: string): Promise<Buffer> {
	try {
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
			maxRedirects: 5,
			timeout: 10000, // 10 second timeout
		});

		return Buffer.from(response.data);
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(`Failed to download image: ${error.message}`);
		}
		throw error;
	}
}

/**
 * Create hexagon-clipped image buffer
 */
async function createHexagonImageBuffer(imageBuffer: Buffer, size: number = 400): Promise<Buffer> {
	// Load image using canvas
	const img = await loadImage(imageBuffer);

	console.log('✅ Image loaded, dimensions:', img.width, 'x', img.height);

	// Create canvas
	const canvas = createCanvas(size, size);
	const ctx = canvas.getContext('2d');

	// Calculate hexagon vertices
	// Regular hexagon inscribed in a square
	const centerX = size / 2;
	const centerY = size / 2;
	const radius = size / 2;

	// Create hexagon path (flat-top orientation)
	const hexagonPoints: [number, number][] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i - Math.PI / 6; // Start from top, flat-top orientation
		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);
		hexagonPoints.push([x, y]);
	}

	// Create clipping path
	ctx.beginPath();
	ctx.moveTo(hexagonPoints[0][0], hexagonPoints[0][1]);
	for (let i = 1; i < hexagonPoints.length; i++) {
		ctx.lineTo(hexagonPoints[i][0], hexagonPoints[i][1]);
	}
	ctx.closePath();

	// Clip to hexagon
	ctx.clip();

	// Draw the image, scaled to fill the canvas
	ctx.drawImage(img, 0, 0, size, size);

	// Convert to PNG buffer
	return canvas.toBuffer('image/png');
}

/**
 * Process and upload profile images to S3
 * Downloads from Strava, creates hexagon version, uploads both to S3
 * @param stravaImageUrl URL of the Strava profile image
 * @param userId User ID for S3 path
 * @returns Object with original and hexagon S3 URLs
 */
export async function processAndUploadProfileImage(
	stravaImageUrl: string,
	userId: string,
	size: number = 400
): Promise<{ originalUrl: string; hexagonUrl: string }> {
	try {
		console.log('📸 Downloading image from Strava:', stravaImageUrl);

		// Download the original image
		const imageBuffer = await downloadImage(stravaImageUrl);
		console.log('✅ Image downloaded, size:', imageBuffer.length, 'bytes');

		// Upload original to S3
		const originalKey = getProfileImageKey(userId, 'original');
		const originalUrl = await uploadImageToS3(imageBuffer, originalKey, 'image/png');

		// Create hexagon version
		console.log('🔷 Creating hexagon version...');
		const hexagonBuffer = await createHexagonImageBuffer(imageBuffer, size);
		console.log('✅ Hexagon image created, size:', hexagonBuffer.length, 'bytes');

		// Upload hexagon to S3
		const hexagonKey = getProfileImageKey(userId, 'hexagon');
		const hexagonUrl = await uploadImageToS3(hexagonBuffer, hexagonKey, 'image/png');

		return {
			originalUrl,
			hexagonUrl,
		};
	} catch (error) {
		console.error('❌ Error processing profile image:', error);
		throw error;
	}
}
