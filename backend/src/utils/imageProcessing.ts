import { createCanvas, loadImage } from 'canvas';
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

async function createHexagonImageBuffer(imageBuffer: Buffer, size: number = 400): Promise<Buffer> {
	const img = await loadImage(imageBuffer);

	console.log('✅ Image loaded, dimensions:', img.width, 'x', img.height);

	const canvas = createCanvas(size, size);
	const ctx = canvas.getContext('2d');

	const centerX = size / 2;
	const centerY = size / 2;
	const radius = size / 2;

	const hexagonPoints: [number, number][] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i - Math.PI / 6;
		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);
		hexagonPoints.push([x, y]);
	}

	ctx.beginPath();
	ctx.moveTo(hexagonPoints[0][0], hexagonPoints[0][1]);
	for (let i = 1; i < hexagonPoints.length; i++) {
		ctx.lineTo(hexagonPoints[i][0], hexagonPoints[i][1]);
	}
	ctx.closePath();

	ctx.clip();

	ctx.drawImage(img, 0, 0, size, size);

	return canvas.toBuffer('image/png');
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
