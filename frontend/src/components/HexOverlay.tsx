import { useState } from "react";
import { useAuth } from "@/contexts/useAuth";
import { useActivitiesManager } from "@/hooks/useActivitiesManager";
import { useUserActivities } from "@/hooks/useUserActivities";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { ActivitiesModal } from "./ActivitiesModal";
import { LeaderboardModal } from "./LeaderboardModal";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationModal } from "./NotificationModal";
import { useMap } from "@/contexts/useMap";
import { ErrorBoundary } from "./ErrorBoundary";
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { toast } from 'sonner';
import { formatDate as utilFormatDate, formatDistance as utilFormatDistance } from "@/utils/dateFormatter";
import "./HexOverlay.css";
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
interface HexOverlayProps {
	onActivityChanged?: () => void;
}
export function HexOverlay({ onActivityChanged }: HexOverlayProps) {
	const { user } = useAuth();
	const { latestActivity } = useUserActivities();
	const [showLeaderboard, setShowLeaderboard] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const { currentParentHexagonIds, mapRef } = useMap();
	const { data: shareData } = useQuery<MyHexagonsCountData>(MY_HEXAGONS_COUNT_QUERY);
	const {
		showModal,
		activities,
		loading,
		openModal,
		closeModal,
		loadStravaActivities,
		handleSaveActivity,
		handleRemoveActivity,
	} = useActivitiesManager(onActivityChanged);
	const navigate = useNavigate();
	if (!user) {
		return (
			<div className="absolute top-4 right-4 z-10">
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-80 shadow-2xl animate-pulse">
					<div className="flex items-center gap-3">
						<div className="w-14 h-14 bg-gray-700 hex-clip"></div>
						<div className="flex-1">
							<div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
							<div className="h-3 bg-gray-700 rounded w-24"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}
	const MOBILE_WIDTH = 540;
	const MOBILE_HEIGHT = 960;
	const generateAndShareImage = async () => {
		if (!mapRef.current || !shareData) {
			toast.error('Map or user data not ready');
			return;
		}
		setIsGeneratingImage(true);
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

					// Add cache-busting for S3 images on mobile to avoid CORS issues
					const imageUrl = isMobile && profileImageUrl.includes('s3.amazonaws.com')
						? `${profileImageUrl}?t=${Date.now()}`
						: profileImageUrl;

					img.src = imageUrl;

					// Wait for image to load
					await new Promise<void>((resolve, reject) => {
						const timeout = setTimeout(() => {
							reject(new Error('Image load timeout'));
						}, 10000); // 10 second timeout

						img.onload = () => {
							clearTimeout(timeout);
							resolve();
						};
						img.onerror = (e) => {
							clearTimeout(timeout);
							console.error('Failed to load profile image:', e);
							reject(e);
						};
					});

					// CRITICAL: Explicitly decode the image before drawing to canvas
					// This ensures the image is fully decoded and ready for canvas rendering
					// Without this, mobile browsers (especially iOS) may fail to draw the image
					await img.decode();

					const profileSize = 120;
					const profileX = centerX;
					const profileY = 100;

					// The imghex is already a hexagon PNG, so just draw it directly without clipping
					ctx.drawImage(img, profileX - profileSize / 2, profileY - profileSize / 2, profileSize, profileSize);
				} catch (error) {
					console.warn('Failed to draw profile image:', error);
					// Continue without profile image
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
			setIsGeneratingImage(false);
		}
	};
	const shareLink = () => {
		const url = 'https://getout.space';
		navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard!');
	};
	return (
		<>
			<div className="hidden md:flex absolute top-4 left-4 z-10 gap-2">
				<button
					onClick={generateAndShareImage}
					disabled={isGeneratingImage || !shareData}
					className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					title="Share or Download Image"
				>
					<FontAwesomeIcon icon={isGeneratingImage ? "spinner" : "image"} className={`w-5 h-5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
					<span className="text-sm">Share Image</span>
				</button>
				<button
					onClick={shareLink}
					className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold cursor-pointer"
					title="Copy Link to Clipboard"
				>
					<FontAwesomeIcon icon="share-nodes" className="w-5 h-5" />
					<span className="text-sm">Share Link</span>
				</button>
			</div>
			<div className="md:hidden absolute top-4 left-4 z-10 flex gap-2">
				<button
					onClick={generateAndShareImage}
					disabled={isGeneratingImage || !shareData}
					className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					title="Share or Download Image"
				>
					<FontAwesomeIcon icon={isGeneratingImage ? "spinner" : "image"} className={`w-5 h-5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
					<span className="text-sm">Share Image</span>
				</button>
				<button
					onClick={shareLink}
					className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2 font-semibold cursor-pointer"
					title="Copy Link to Clipboard"
				>
					<FontAwesomeIcon icon="share-nodes" className="w-5 h-5" />
					<span className="text-sm">Share Link</span>
				</button>
			</div>
			<div className="hidden md:block absolute top-4 right-4 z-10">
				<div className="bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
					<div
						className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-all"
						onClick={() => navigate(`/profile/${user.id}`)}
					>
						<img
							src={user.profile.imghex || user.profile.profile}
							alt={user.profile.firstname}
							className={`w-12 h-12 object-cover ${user.profile.imghex ? '' : 'hex-clip'}`}
						/>
						<div className="flex-1 min-w-0">
							<div className="font-semibold text-sm text-gray-100 truncate">
								{user.profile.firstname}
							</div>
							<div className="text-xs text-gray-400">ID: {user.stravaId}</div>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2 mb-3">
						<button
							onClick={() => openModal()}
							disabled={loading}
							className="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50"
							title="Activities"
						>
							<FontAwesomeIcon icon="running" className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">Activities</span>
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								try {
									setShowLeaderboard(true);
								} catch (error) {
									console.error('Error opening leaderboard:', error);
								}
							}}
							className="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-yellow-400 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-yellow-300 subtle-pulse"
							title="Regional Leaderboard"
						>
							<FontAwesomeIcon icon="trophy" className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">Leaders</span>
						</button>
						<NotificationDropdown
							bellClassName="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white relative"
							iconClassName="w-3.5 h-3.5"
							onClick={() => setShowNotifications(true)}
							showLabel={true}
						/>
						<button
							onClick={() => navigate(`/profile/${user.id}`)}
							className="flex items-center justify-start gap-2 bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-md transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
							title="Profile"
						>
							<FontAwesomeIcon icon="user" className="w-3.5 h-3.5" />
							<span className="text-xs font-medium">Profile</span>
						</button>
					</div>
					{latestActivity && (
						<div className="pt-2 pb-1 border-t border-white/10">
							<div className="text-[11px] text-gray-400 mb-1">
								Latest: {utilFormatDate(latestActivity.startDate, { month: "short", day: "numeric" })}
							</div>
							<div className="flex items-center justify-between gap-2">
								<div className="text-sm font-medium text-gray-200 truncate flex-1">
									{latestActivity.name}
								</div>
								<div className="text-xs text-gray-300 whitespace-nowrap">
									{utilFormatDistance(latestActivity.distance, 1)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			<div className="md:hidden fixed bottom-0 left-0 right-0 z-10 safe-area-bottom">
				<div className="bg-[rgba(10,10,10,0.95)] backdrop-blur-md border-t border-white/10 p-3">
					<div className="grid grid-cols-4 gap-2">
						<button
							onClick={() => openModal()}
							disabled={loading}
							className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50"
						>
							<FontAwesomeIcon icon="running" className="w-5 h-5" />
							<span className="text-[10px] font-medium">Activities</span>
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								try {
									setShowLeaderboard(true);
								} catch (error) {
									console.error('Error opening leaderboard:', error);
								}
							}}
							className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-yellow-400 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-yellow-300 subtle-pulse"
						>
							<FontAwesomeIcon icon="trophy" className="w-5 h-5" />
							<span className="text-[10px] font-medium">Leaders</span>
						</button>
						<NotificationDropdown
							bellClassName="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
							iconClassName="w-5 h-5"
							onClick={() => setShowNotifications(true)}
							showLabel={true}
						/>
						<button
							onClick={() => navigate(`/profile/${user.id}`)}
							className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 text-gray-300 px-3 py-3 rounded-lg transition-all cursor-pointer hover:bg-white/10 hover:border-white/20 hover:text-white"
						>
							<FontAwesomeIcon icon="user" className="w-5 h-5" />
							<span className="text-[10px] font-medium">Profile</span>
						</button>
					</div>
				</div>
			</div>
			<ActivitiesModal
				isOpen={showModal}
				onClose={closeModal}
				onFetchActivities={loadStravaActivities}
				stravaActivities={activities}
				loadingStrava={loading}
				onProcess={handleSaveActivity}
				onDeleteStrava={handleRemoveActivity}
			/>
			{showLeaderboard && (
				<ErrorBoundary>
					<LeaderboardModal
						parentHexagonIds={Array.isArray(currentParentHexagonIds.current) ? currentParentHexagonIds.current : []}
						onClose={() => setShowLeaderboard(false)}
					/>
				</ErrorBoundary>
			)}
			{showNotifications && (
				<ErrorBoundary>
					<NotificationModal onClose={() => setShowNotifications(false)} />
				</ErrorBoundary>
			)}
		</>
	);
}
