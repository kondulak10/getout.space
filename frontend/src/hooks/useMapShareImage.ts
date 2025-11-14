import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { toast } from 'sonner';
import { useMap } from '@/contexts/useMap';

const MY_HEXAGONS_COUNT_QUERY = gql`
	query MyHexagonsCountForShare {
		me {
			id
			stravaProfile {
				firstname
				imghex
			}
		}
		myHexagons {
			id
		}
	}
`;

type MyHexagonsCountData = {
	me: {
		id: string;
		stravaProfile: {
			firstname: string;
			imghex: string | null;
		};
	};
	myHexagons: Array<{
		id: string;
	}>;
};

const MOBILE_WIDTH = 540;
const MOBILE_HEIGHT = 960;

export function useMapShareImage() {
	const [isGenerating, setIsGenerating] = useState(false);
	const { mapRef } = useMap();
	const { data: shareData } = useQuery<MyHexagonsCountData>(MY_HEXAGONS_COUNT_QUERY);

	const generateAndShareImage = async () => {
		if (!mapRef.current || !shareData) {
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
			const topGradient = ctx.createLinearGradient(0, 0, 0, 350);
			topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
			topGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
			topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
			ctx.fillStyle = topGradient;
			ctx.fillRect(0, 0, MOBILE_WIDTH, 350);
			const bottomGradient = ctx.createLinearGradient(0, MOBILE_HEIGHT - 200, 0, MOBILE_HEIGHT);
			bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
			bottomGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
			bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
			ctx.fillStyle = bottomGradient;
			ctx.fillRect(0, 0, MOBILE_WIDTH, MOBILE_HEIGHT);
			const centerX = MOBILE_WIDTH / 2;
			const firstName = shareData.me.stravaProfile.firstname;
			const hexCount = shareData.myHexagons.length;
			const profileImageUrl = shareData.me.stravaProfile.imghex;
			// TEMPORARILY SKIP PROFILE IMAGE TO DEBUG
			// TODO: Fix S3 CORS configuration for profile images bucket
			const SKIP_PROFILE_IMAGE = false;
			if (profileImageUrl && !SKIP_PROFILE_IMAGE) {
				try {
					const img = new Image();
					// MUST set crossOrigin BEFORE src to prevent canvas taint
					img.crossOrigin = 'anonymous';

					// Detect if we're on any mobile device
					const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

					// Add cache-busting for CDN/S3 images on mobile to avoid CORS issues
					// Check for both S3 and CloudFront URLs
					const needsCacheBust = isMobile && (
						profileImageUrl.includes('s3.amazonaws.com') ||
						profileImageUrl.includes('cdn.getout.space')
					);
					const imageUrl = needsCacheBust
						? `${profileImageUrl}?t=${Date.now()}`
						: profileImageUrl;

					console.log('🖼️ Loading profile image:', {
						url: imageUrl,
						isMobile,
						needsCacheBust,
						crossOrigin: img.crossOrigin
					});

					img.src = imageUrl;

					// Wait for image to load
					await new Promise<void>((resolve, reject) => {
						const timeout = setTimeout(() => {
							const error = new Error('Profile image load timeout after 10s');
							console.error('⏱️ ' + error.message, { url: imageUrl });
							reject(error);
						}, 10000); // 10 second timeout

						img.onload = () => {
							clearTimeout(timeout);
							console.log('✅ Profile image loaded successfully');
							resolve();
						};
						img.onerror = (e) => {
							clearTimeout(timeout);
							console.error('❌ Failed to load profile image:', {
								error: e,
								url: imageUrl,
								naturalWidth: img.naturalWidth,
								naturalHeight: img.naturalHeight
							});
							reject(new Error('Image load error'));
						};
					});

					// CRITICAL: Explicitly decode the image before drawing to canvas
					// This ensures the image is fully decoded and ready for canvas rendering
					// Without this, mobile browsers (especially iOS) may fail to draw the image
					await img.decode();
					console.log('✅ Profile image decoded successfully');

					const profileSize = 120;
					const profileX = centerX;
					const profileY = 100;

					// The imghex is already a hexagon PNG, so just draw it directly without clipping
					ctx.drawImage(img, profileX - profileSize / 2, profileY - profileSize / 2, profileSize, profileSize);
					console.log('✅ Profile image drawn to canvas');
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.warn('⚠️ Skipping profile image due to error:', errorMessage);
					console.error('Full error details:', error);
					// Continue without profile image - not a critical failure
				}
			}
			ctx.textAlign = 'center';
			// Use numeric weight (700) instead of "bold" for better cross-browser compatibility
			ctx.font = '700 42px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.fillText(firstName.toUpperCase(), centerX, 210);

			ctx.font = '700 56px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c';
			ctx.fillText(`${hexCount} HEXES`, centerX, 270);

			const bottomY = MOBILE_HEIGHT - 60;
			ctx.font = '700 48px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.fillText('JOIN', centerX, bottomY - 60);

			ctx.font = '700 56px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c';
			ctx.fillText('WWW.GETOUT.SPACE', centerX, bottomY);
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png');
			});
			const file = new File([blob], `getout-${firstName}-${Date.now()}.png`, { type: 'image/png' });
			const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
			if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
				try {
					toast.dismiss('share-image');
					await navigator.share({
						files: [file],
						title: 'My GetOut.space Progress',
						text: `I've captured ${hexCount} hexagons on GetOut.space!`,
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
		canShare: !!shareData
	};
}
