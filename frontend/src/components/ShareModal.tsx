import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import type { Map as MapboxMap } from 'mapbox-gl';

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

interface ShareModalProps {
	onClose: () => void;
	mapRef: React.RefObject<MapboxMap | null>;
}

export function ShareModal({ onClose, mapRef }: ShareModalProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isCapturing, setIsCapturing] = useState(false);
	const [imageGenerated, setImageGenerated] = useState(false);

	const { data, loading } = useQuery<MyHexagonsCountData>(MY_HEXAGONS_COUNT_QUERY);

	const MOBILE_WIDTH = 540;
	const MOBILE_HEIGHT = 960;

	const captureMapToCanvas = async () => {
		if (!mapRef.current || !canvasRef.current || !data) {
			console.error('Map, canvas, or data not ready');
			return;
		}

		setIsCapturing(true);

		try {
			await document.fonts.load('bold 56px "Bebas Neue"');
			await document.fonts.ready;
			await new Promise((resolve) => setTimeout(resolve, 100));

			const mapCanvas = mapRef.current.getCanvas();
			const targetCanvas = canvasRef.current;
			const ctx = targetCanvas.getContext('2d');

			if (!ctx) {
				console.error('Could not get canvas context');
				return;
			}

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
			const firstName = data.me.stravaProfile.firstname;
			const hexCount = data.myHexagons.length;
			const profileImageUrl = data.me.stravaProfile.imghex;

			if (profileImageUrl) {
				try {
					const img = new Image();
					img.crossOrigin = 'anonymous';
					await new Promise<void>((resolve, reject) => {
						img.onload = () => resolve();
						img.onerror = () => reject();
						img.src = profileImageUrl;
					});

					const profileSize = 120;
					const profileX = centerX;
					const profileY = 100;

					ctx.save();
					ctx.beginPath();
					ctx.arc(profileX, profileY, profileSize / 2, 0, Math.PI * 2);
					ctx.closePath();
					ctx.clip();
					ctx.drawImage(img, profileX - profileSize / 2, profileY - profileSize / 2, profileSize, profileSize);
					ctx.restore();

					ctx.strokeStyle = '#fb923c';
					ctx.lineWidth = 4;
					ctx.beginPath();
					ctx.arc(profileX, profileY, profileSize / 2, 0, Math.PI * 2);
					ctx.stroke();
				} catch (error) {
					console.error('Failed to load profile image:', error);
				}
			}

			ctx.textAlign = 'center';
			ctx.font = 'bold 42px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.letterSpacing = '0.05em';
			ctx.fillText(firstName.toUpperCase(), centerX, 210);

			ctx.font = 'bold 56px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c';
			ctx.letterSpacing = '0.05em';
			ctx.fillText(`${hexCount} HEXES`, centerX, 270);

			const bottomY = MOBILE_HEIGHT - 60;
			ctx.font = 'bold 48px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.letterSpacing = '0.05em';
			ctx.fillText('JOIN', centerX, bottomY - 60);

			ctx.font = 'bold 56px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c';
			ctx.letterSpacing = '0.05em';
			ctx.fillText('WWW.GETOUT.SPACE', centerX, bottomY);

			setImageGenerated(true);
			console.log('Map captured to canvas successfully!');
		} catch (error) {
			console.error('Error capturing map:', error);
			toast.error('Failed to generate image');
		} finally {
			setIsCapturing(false);
		}
	};

	const downloadImage = () => {
		if (!canvasRef.current) return;
		canvasRef.current.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `getout-${data?.me.stravaProfile.firstname}-${Date.now()}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			toast.success('Image downloaded!');
		}, 'image/png');
	};

	const copyImage = async () => {
		if (!canvasRef.current) return;
		try {
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvasRef.current?.toBlob((b) => (b ? resolve(b) : reject()), 'image/png');
			});
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
			toast.success('Image copied to clipboard!');
		} catch (error) {
			console.error('Failed to copy image:', error);
			toast.error('Failed to copy image. Try downloading instead.');
		}
	};

	const shareLink = () => {
		const url = 'https://getout.space';
		navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard!');
	};

	useEffect(() => {
		if (data && !loading && mapRef.current) {
			setTimeout(() => {
				captureMapToCanvas();
			}, 300);
		}
	}, [data, loading, mapRef]);

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						<FontAwesomeIcon icon={faImage} className="mr-2" />
						Share Your Progress
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="flex flex-col items-center gap-4 p-6">
					{loading || isCapturing ? (
						<div className="flex flex-col items-center gap-3 py-32">
							<FontAwesomeIcon icon={faSpinner} spin className="w-8 h-8 text-orange-400" />
							<p className="text-sm text-gray-400">Generating image...</p>
						</div>
					) : (
						<>
							<canvas
								ref={canvasRef}
								width={MOBILE_WIDTH}
								height={MOBILE_HEIGHT}
								className="border border-white/10 rounded-lg shadow-lg"
								style={{ width: '270px', height: '480px' }}
							/>
							<div className="flex flex-col gap-2 w-full">
								<button
									onClick={downloadImage}
									disabled={!imageGenerated || loading}
									className="w-full px-4 py-2 bg-green-600/90 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors border border-white/10"
								>
									Download Image
								</button>
								<button
									onClick={copyImage}
									disabled={!imageGenerated || loading}
									className="w-full px-4 py-2 bg-blue-600/90 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors border border-white/10"
								>
									Copy Image
								</button>
								<button
									onClick={shareLink}
									className="w-full px-4 py-2 bg-orange-600/90 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors border border-white/10"
								>
									Share getout.space
								</button>
							</div>
							<p className="text-xs text-gray-500 text-center">
								Share your running conquests with friends!
							</p>
						</>
					)}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
