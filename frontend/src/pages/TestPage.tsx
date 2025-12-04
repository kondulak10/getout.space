import { useState, useRef, useEffect } from 'react';
import { MapProvider } from '@/contexts/MapProvider';
import { useMap } from '@/contexts/useMap';
import { useMapbox } from '@/hooks/useMapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
function TestPageContent() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isCapturing, setIsCapturing] = useState(false);
	const { mapRef } = useMap();
	const { mapContainerRef } = useMapbox({
		enableCustomStyling: true,
	});
	const MOBILE_WIDTH = 540;
	const MOBILE_HEIGHT = 960;
	const captureMapToCanvas = async () => {
		if (!mapRef.current || !canvasRef.current) {
			return;
		}
		setIsCapturing(true);
		try {
			await document.fonts.load('bold 36px "Bebas Neue"');
			await document.fonts.ready;
			await new Promise((resolve) => setTimeout(resolve, 100));
			const mapCanvas = mapRef.current.getCanvas();
			const targetCanvas = canvasRef.current;
			const ctx = targetCanvas.getContext('2d');
			if (!ctx) {
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
			const topGradient = ctx.createLinearGradient(0, 0, 0, 250);
			topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
			topGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.8)');
			topGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
			topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
			ctx.fillStyle = topGradient;
			ctx.fillRect(0, 0, MOBILE_WIDTH, 250);
			const bottomGradient = ctx.createLinearGradient(0, MOBILE_HEIGHT - 300, 0, MOBILE_HEIGHT);
			bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
			bottomGradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.4)');
			bottomGradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.8)');
			bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
			ctx.fillStyle = bottomGradient;
			ctx.fillRect(0, 0, MOBILE_WIDTH, MOBILE_HEIGHT);
			ctx.textAlign = 'center';
			const centerX = MOBILE_WIDTH / 2;
			const topY = 80;
			ctx.font = 'bold 36px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c'; 
			ctx.letterSpacing = '0.05em';
			ctx.fillText('HEXES', centerX, topY);
			ctx.font = 'bold 32px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.letterSpacing = '0px';
			ctx.fillText('Discovered: 50  •  Stolen: 23', centerX, topY + 50);
			const bottomY = MOBILE_HEIGHT - 50;
			const columnWidth = MOBILE_WIDTH / 3;
			ctx.textAlign = 'center';
			const col1X = columnWidth / 2;
			ctx.font = 'bold 28px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c';
			ctx.letterSpacing = '0.05em';
			ctx.fillText('DISTANCE', col1X, bottomY - 70);
			ctx.font = 'bold 36px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.letterSpacing = '0px';
			ctx.fillText('5.3 km', col1X, bottomY - 25);
			const col2X = MOBILE_WIDTH / 2;
			ctx.font = 'bold 28px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c';
			ctx.letterSpacing = '0.05em';
			ctx.fillText('TIME', col2X, bottomY - 70);
			ctx.font = 'bold 36px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.letterSpacing = '0px';
			ctx.fillText('13m 8s', col2X, bottomY - 25);
			const col3X = columnWidth * 2.5;
			ctx.font = 'bold 28px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#fb923c';
			ctx.letterSpacing = '0.05em';
			ctx.fillText('PACE', col3X, bottomY - 70);
			ctx.font = 'bold 36px "Bebas Neue", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.letterSpacing = '0px';
			ctx.fillText('5:30 /km', col3X, bottomY - 25);
			ctx.textAlign = 'center';
			ctx.font = '24px "Bebas Neue", sans-serif';
			ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
			ctx.fillText('Join www.getout.space', centerX, topY + 100);
		} catch {
			// Canvas rendering failed
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
			link.download = `getout-share-${Date.now()}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}, 'image/png');
	};
	useEffect(() => {
		if (!mapRef.current) return;
		const map = mapRef.current;
		const handleLoad = () => {
			setTimeout(() => {
				captureMapToCanvas();
			}, 500);
		};
		if (map.loaded()) {
			handleLoad();
		} else {
			map.once('load', handleLoad);
		}
		// captureMapToCanvas is stable and only needs to run when mapRef loads
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mapRef]);
	return (
		<div className="flex flex-col lg:flex-row w-full h-screen bg-gray-900">
			{}
			<div className="flex-1 relative">
				<div ref={mapContainerRef} className="w-full h-full" />
				{}
				<div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
					<h2 className="text-white font-bold mb-2">Map View</h2>
					<p className="text-white/70 text-sm">Pan and zoom the map</p>
				</div>
			</div>
			{}
			<div className="lg:w-[600px] bg-gray-800 p-8 flex flex-col items-center gap-6 overflow-y-auto">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-white mb-2">Share Test Page</h1>
					<p className="text-gray-400">Mobile layout: {MOBILE_WIDTH}x{MOBILE_HEIGHT}</p>
				</div>
				{}
				<div className="relative">
					<canvas
						ref={canvasRef}
						width={MOBILE_WIDTH}
						height={MOBILE_HEIGHT}
						className="border-4 border-white/20 rounded-lg shadow-2xl"
						style={{
							width: `${MOBILE_WIDTH / 2}px`,
							height: `${MOBILE_HEIGHT / 2}px`
						}}
					/>
					{}
					<div className="absolute inset-0 pointer-events-none">
						<div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-2xl" />
					</div>
				</div>
				{}
				<div className="flex flex-col gap-3 w-full max-w-md">
					<button
						onClick={captureMapToCanvas}
						disabled={isCapturing}
						className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
					>
						{isCapturing ? 'Capturing...' : 'Capture Map'}
					</button>
					<button
						onClick={downloadImage}
						className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
					>
						Download Image
					</button>
				</div>
				{}
				<div className="bg-black/40 rounded-lg p-4 border border-white/10 max-w-md">
					<h3 className="text-white font-semibold mb-2">How it works:</h3>
					<ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
						<li>The map auto-captures when loaded</li>
						<li>Click "Capture Map" to refresh the canvas</li>
						<li>Click "Download Image" to save the PNG</li>
						<li>Pan/zoom the map and capture again</li>
					</ol>
				</div>
			</div>
		</div>
	);
}
export function TestPage() {
	return (
		<MapProvider>
			<TestPageContent />
		</MapProvider>
	);
}
