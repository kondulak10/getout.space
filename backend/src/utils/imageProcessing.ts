import sharp from 'sharp';
import axios from 'axios';
import { uploadImageToS3, getProfileImageKey } from './s3Upload';

async function downloadImage(url: string): Promise<Buffer> {
	try {
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
			maxRedirects: 5,
			timeout: 10000,
		});

		return Buffer.from(response.data);
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(`Failed to download image: ${error.message}`);
		}
		throw error;
	}
}

function createHexagonSvgMask(size: number): Buffer {
	const centerX = size / 2;
	const centerY = size / 2;
	const radius = size / 2;

	// Generate hexagon points (flat-top hexagon) - same formula as original canvas implementation
	const points: string[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i - Math.PI / 6;
		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);
		points.push(`${x},${y}`);
	}

	// SVG with white hexagon on transparent background (no extra whitespace)
	const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><polygon points="${points.join(' ')}" fill="#ffffff"/></svg>`;

	return Buffer.from(svg);
}

async function createHexagonImageBuffer(imageBuffer: Buffer, size: number = 400): Promise<Buffer> {
	// Create hexagon mask
	const hexagonMask = createHexagonSvgMask(size);

	// Process image:
	// 1. Resize with 'fill' to stretch to exact dimensions (matches original canvas drawImage behavior)
	// 2. ensureAlpha() adds alpha channel (required for dest-in blend with JPEG inputs)
	// 3. Composite with hexagon mask using dest-in (shows image only where mask is opaque)
	const hexagonImage = await sharp(imageBuffer)
		.resize(size, size, { fit: 'fill' })
		.ensureAlpha()
		.composite([
			{
				input: hexagonMask,
				blend: 'dest-in',
			},
		])
		.png()
		.toBuffer();

	console.log('✅ Hexagon image created');

	return hexagonImage;
}

export async function processAndUploadProfileImage(
	stravaImageUrl: string,
	userId: string,
	size: number = 400
): Promise<{ originalUrl: string; hexagonUrl: string }> {
	try {
		console.log('📸 Downloading image from Strava:', stravaImageUrl);

		const imageBuffer = await downloadImage(stravaImageUrl);
		console.log('✅ Image downloaded, size:', imageBuffer.length, 'bytes');

		const originalKey = getProfileImageKey(userId, 'original');
		const originalUrl = await uploadImageToS3(imageBuffer, originalKey, 'image/png');

		console.log('🔷 Creating hexagon version...');
		const hexagonBuffer = await createHexagonImageBuffer(imageBuffer, size);
		console.log('✅ Hexagon image created, size:', hexagonBuffer.length, 'bytes');

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
