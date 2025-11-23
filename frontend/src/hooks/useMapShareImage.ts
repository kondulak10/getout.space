import { useState } from 'react';
import { toast } from 'sonner';
import { useMap } from '@/contexts/useMap';
import { useAuth } from '@/contexts/useAuth';
import { getRankTier } from '@/utils/calculateLocalStats';
import type { LocalStats } from '@/utils/calculateLocalStats';

// FontAwesome trophy SVG as data URL (gold color)
const TROPHY_GOLD_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath fill='%23FFD700' d='M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z'/%3E%3C/svg%3E`;

// FontAwesome trophy SVG as data URL (grey color)
const TROPHY_GREY_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'%3E%3Cpath fill='%239CA3AF' d='M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z'/%3E%3C/svg%3E`;

const MOBILE_WIDTH = 540;
const MOBILE_HEIGHT = 960;

/**
 * Hook for generating shareable map images with stats overlay
 * Accepts stats as parameters to avoid duplicate queries
 */
export function useMapShareImage() {
	const [isGenerating, setIsGenerating] = useState(false);
	const { mapRef } = useMap();
	const { user } = useAuth();

	/**
	 * Generate and share/download map image with stats overlay
	 * @param localStats - Local hexagon count and rank
	 * @param totalHexagons - Total hexagons owned
	 * @param globalRank - User's global rank (optional)
	 */
	const generateAndShareImage = async (localStats: LocalStats, totalHexagons: number, globalRank?: number) => {
		if (!mapRef.current || !user) {
			toast.error('Map or user data not ready');
			return;
		}

		setIsGenerating(true);
		toast.loading('Generating image...', { id: 'share-image' });

		try {
			// Load both font weights explicitly
			await Promise.all([
				document.fonts.load('400 56px "Bebas Neue"'),
				document.fonts.load('700 56px "Bebas Neue"'),
			]);
			await document.fonts.ready;

			// Mobile Safari needs more time for fonts to be canvas-ready
			const isMobileSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent);
			await new Promise((resolve) => setTimeout(resolve, isMobileSafari ? 500 : 100));

			// Account for device pixel ratio for sharper rendering on high-DPI screens
			const dpr = window.devicePixelRatio || 1;
			const canvas = document.createElement('canvas');
			canvas.width = MOBILE_WIDTH * dpr;
			canvas.height = MOBILE_HEIGHT * dpr;
			canvas.style.width = `${MOBILE_WIDTH}px`;
			canvas.style.height = `${MOBILE_HEIGHT}px`;

			const ctx = canvas.getContext('2d', { alpha: false });
			if (!ctx) {
				toast.error('Could not create canvas');
				return;
			}

			// Scale context to account for DPR
			ctx.scale(dpr, dpr);

			// Improve image rendering quality
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';

			// Draw map background
			const mapCanvas = mapRef.current.getCanvas();
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, MOBILE_WIDTH, MOBILE_HEIGHT);
			const mapWidth = mapCanvas.width;
			const mapHeight = mapCanvas.height;
			const scaleX = MOBILE_WIDTH / mapWidth;
			const scaleY = MOBILE_HEIGHT / mapHeight;
			const scale = Math.max(scaleX, scaleY);
			const scaledWidth = mapWidth * scale;
			const scaledHeight = mapHeight * scale;
			const x = (MOBILE_WIDTH - scaledWidth) / 2;
			const y = (MOBILE_HEIGHT - scaledHeight) / 2;
			ctx.drawImage(mapCanvas, x, y, scaledWidth, scaledHeight);

			// Add top gradient for readability
			const topGradient = ctx.createLinearGradient(0, 0, 0, 350);
			topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
			topGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
			topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
			ctx.fillStyle = topGradient;
			ctx.fillRect(0, 0, MOBILE_WIDTH, 350);

			// Add bottom gradient for readability
			const bottomGradient = ctx.createLinearGradient(0, MOBILE_HEIGHT - 200, 0, MOBILE_HEIGHT);
			bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
			bottomGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
			bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
			ctx.fillStyle = bottomGradient;
			ctx.fillRect(0, 0, MOBILE_WIDTH, MOBILE_HEIGHT);

			const centerX = MOBILE_WIDTH / 2;
			const firstName = user.profile.firstname;
			const profileImageUrl = user.profile.imghex;

			// Load and draw profile image (with CORS handling)
			const SKIP_PROFILE_IMAGE = false;
			if (profileImageUrl && !SKIP_PROFILE_IMAGE) {
				try {
					const img = new Image();
					// MUST set crossOrigin BEFORE src to prevent canvas taint
					img.crossOrigin = 'anonymous';

					// Add cache-busting for CDN/S3 images to avoid CORS issues
					const needsCacheBust = (
						profileImageUrl.includes('s3.amazonaws.com') ||
						profileImageUrl.includes('cdn.getout.space')
					);
					const imageUrl = needsCacheBust
						? `${profileImageUrl}?t=${Date.now()}`
						: profileImageUrl;

					img.src = imageUrl;

					// Wait for image to load
					await new Promise<void>((resolve, reject) => {
						const timeout = setTimeout(() => {
							reject(new Error('Profile image load timeout after 10s'));
						}, 10000);

						img.onload = () => {
							clearTimeout(timeout);
							resolve();
						};
						img.onerror = () => {
							clearTimeout(timeout);
							reject(new Error('Image load error'));
						};
					});

					// Explicitly decode the image (required for iOS Safari)
					try {
						await img.decode();
					} catch {
						// decode() not supported or failed, but image is loaded
					}

					const profileSize = 120;
					const profileX = centerX;
					const profileY = 100;

					// The imghex is already a hexagon PNG, draw directly
					ctx.drawImage(img, profileX - profileSize / 2, profileY - profileSize / 2, profileSize, profileSize);
				} catch (error) {
					console.warn('⚠️ Skipping profile image due to error:', error);
					// Continue without profile image - not a critical failure
				}
			}

			// Load both trophy SVGs (non-blocking, with iOS Safari compatibility)
			const trophyGoldImg = new Image();
			trophyGoldImg.src = TROPHY_GOLD_SVG;
			const trophyGreyImg = new Image();
			trophyGreyImg.src = TROPHY_GREY_SVG;

			// Wait for both trophies to load
			await Promise.all([
				new Promise<void>((resolve) => {
					trophyGoldImg.onload = () => resolve();
					trophyGoldImg.onerror = () => resolve(); // Continue even if fails
				}),
				new Promise<void>((resolve) => {
					trophyGreyImg.onload = () => resolve();
					trophyGreyImg.onerror = () => resolve(); // Continue even if fails
				}),
			]);

			// Explicitly decode images for iOS Safari (non-critical, ignore errors)
			try {
				await Promise.all([
					trophyGoldImg.decode().catch(() => {}),
					trophyGreyImg.decode().catch(() => {}),
				]);
			} catch {
				// decode() not supported or failed, but images are loaded
			}

			ctx.textAlign = 'center';

			// Draw name
			ctx.font = '700 42px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(firstName.toUpperCase(), centerX, 210);

			// Stats section - scaled up and centered
			const statsY = 270;
			const lineHeight = 60;
			const statsScale = 1.25; // Scale up proportionally (more subtle)

			// Font sizes (scaled from MapStats proportions)
			const labelFont = `700 ${Math.round(24 * statsScale)}px "Bebas Neue", sans-serif`;
			const valueFont = `900 ${Math.round(36 * statsScale)}px "Bebas Neue", sans-serif`;
			const rankFont = `800 ${Math.round(24 * statsScale)}px "Bebas Neue", sans-serif`;
			const trophySize = Math.round(28 * statsScale);

			// Spacing (scaled)
			const labelGap = Math.round(15 * statsScale);
			const valueGap = Math.round(12 * statsScale);
			const trophyGap = Math.round(8 * statsScale);

			ctx.textAlign = 'left';

			// === LOCAL stats (row 1) ===
			const localY = statsY;

			// Calculate total width to center the row
			let localWidth = 0;
			ctx.font = labelFont;
			localWidth += ctx.measureText('LOCAL').width + labelGap;
			ctx.font = valueFont;
			localWidth += ctx.measureText(String(localStats.count)).width + valueGap;
			if (localStats.rank > 0 && localStats.count > 0) {
				const localTier = getRankTier(localStats.rank);
				localWidth += trophySize + trophyGap;
				ctx.font = rankFont;
				localWidth += ctx.measureText(`TOP ${localTier}`).width;
			}

			// Start from center
			let currentX = (MOBILE_WIDTH - localWidth) / 2;

			// Draw LOCAL label
			ctx.font = labelFont;
			ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
			ctx.fillText('LOCAL', currentX, localY);
			currentX += ctx.measureText('LOCAL').width + labelGap;

			// Draw local count
			ctx.font = valueFont;
			ctx.fillStyle = '#ffffff';
			ctx.fillText(String(localStats.count), currentX, localY);
			currentX += ctx.measureText(String(localStats.count)).width + valueGap;

			// Draw trophy and rank if available
			if (localStats.rank > 0 && localStats.count > 0) {
				const localTier = getRankTier(localStats.rank);
				const isTopTen = localStats.rank <= 10;
				const trophyImg = isTopTen ? trophyGoldImg : trophyGreyImg;
				const textColor = isTopTen ? '#FFD700' : '#9CA3AF';

				ctx.drawImage(trophyImg, currentX, localY - trophySize + 8, trophySize, trophySize);
				currentX += trophySize + trophyGap;

				ctx.font = rankFont;
				ctx.fillStyle = textColor;
				ctx.fillText(`TOP ${localTier}`, currentX, localY);
			}

			// === TOTAL stats (row 2) ===
			const totalY = localY + lineHeight;

			// Calculate total width to center the row
			let totalWidth = 0;
			ctx.font = labelFont;
			totalWidth += ctx.measureText('TOTAL').width + labelGap;
			ctx.font = valueFont;
			totalWidth += ctx.measureText(String(totalHexagons)).width + valueGap;
			if (globalRank && globalRank > 0 && totalHexagons > 0) {
				const globalTier = getRankTier(globalRank);
				totalWidth += trophySize + trophyGap;
				ctx.font = rankFont;
				totalWidth += ctx.measureText(`TOP ${globalTier}`).width;
			}

			// Start from center
			currentX = (MOBILE_WIDTH - totalWidth) / 2;

			// Draw TOTAL label
			ctx.font = labelFont;
			ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
			ctx.fillText('TOTAL', currentX, totalY);
			currentX += ctx.measureText('TOTAL').width + labelGap;

			// Draw total count
			ctx.font = valueFont;
			ctx.fillStyle = '#ffffff';
			ctx.fillText(String(totalHexagons), currentX, totalY);
			currentX += ctx.measureText(String(totalHexagons)).width + valueGap;

			// Draw trophy and rank if available
			if (globalRank && globalRank > 0 && totalHexagons > 0) {
				const globalTier = getRankTier(globalRank);
				const isTopTen = globalRank <= 10;
				const trophyImg = isTopTen ? trophyGoldImg : trophyGreyImg;
				const textColor = isTopTen ? '#FFD700' : '#9CA3AF';

				ctx.drawImage(trophyImg, currentX, totalY - trophySize + 8, trophySize, trophySize);
				currentX += trophySize + trophyGap;

				ctx.font = rankFont;
				ctx.fillStyle = textColor;
				ctx.fillText(`TOP ${globalTier}`, currentX, totalY);
			}

			// Reset text alignment for bottom branding
			ctx.textAlign = 'center';

			// Draw bottom branding
			const bottomY = MOBILE_HEIGHT - 60;
			ctx.font = '700 48px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.fillText('JOIN', centerX, bottomY - 60);

			ctx.font = '700 56px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#FF7F00';
			ctx.fillText('WWW.GETOUT.SPACE', centerX, bottomY);

			// Convert to blob
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png');
			});
			const file = new File([blob], `getout-${firstName}-${Date.now()}.png`, { type: 'image/png' });

			// Try native share on mobile
			const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
			if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
				try {
					toast.dismiss('share-image');
					await navigator.share({
						files: [file],
						title: 'My GetOut.space Progress',
						text: `I've captured ${totalHexagons} hexagons on GetOut.space!`,
					});
					toast.success('Image shared!');
					return;
				} catch (error) {
					if ((error as Error).name === 'AbortError') {
						toast.dismiss('share-image');
						return;
					}
				}
			}

			// Fallback: Download
			toast.dismiss('share-image');
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `getout-${firstName}-${Date.now()}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success('Image downloaded!');
		} catch {
			toast.dismiss('share-image');
			toast.error('Failed to generate image');
		} finally {
			setIsGenerating(false);
		}
	};

	return {
		generateAndShareImage,
		isGenerating,
		canShare: !!user,
	};
}
