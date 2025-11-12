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

	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(1) + " km";
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	const MOBILE_WIDTH = 540;
	const MOBILE_HEIGHT = 960;

	const generateAndDownloadImage = async () => {
		if (!mapRef.current || !shareData) {
			toast.error('Map or user data not ready');
			return;
		}

		setIsGeneratingImage(true);

		try {
			await document.fonts.load('bold 56px "Bebas Neue"');
			await document.fonts.ready;
			await new Promise((resolve) => setTimeout(resolve, 100));

			const canvas = document.createElement('canvas');
			canvas.width = MOBILE_WIDTH;
			canvas.height = MOBILE_HEIGHT;
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				toast.error('Could not create canvas');
				return;
			}

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

			canvas.toBlob((blob) => {
				if (!blob) return;
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `getout-${firstName}-${Date.now()}.png`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
				toast.success('Image downloaded!');
			}, 'image/png');
		} catch (error) {
			console.error('Error generating image:', error);
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
			{/* Share buttons - standalone top-left (Desktop) */}
			<div className="hidden md:flex absolute top-4 left-4 z-10 gap-2">
				<button
					onClick={generateAndDownloadImage}
					disabled={isGeneratingImage || !shareData}
					className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					title="Download Share Image"
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

			{/* Share buttons - standalone top-left (Mobile) */}
			<div className="md:hidden absolute top-4 left-4 z-10 flex gap-2">
				<button
					onClick={generateAndDownloadImage}
					disabled={isGeneratingImage || !shareData}
					className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					title="Download Share Image"
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
					<div className="flex items-center gap-3 mb-3">
						<img
							src={user.profile.imghex || user.profile.profile}
							alt={user.profile.firstname}
							className="w-12 h-12 object-cover hex-clip"
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
							onClick={() => navigate("/profile")}
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
								Latest: {formatDate(latestActivity.startDate)}
							</div>
							<div className="flex items-center justify-between gap-2">
								<div className="text-sm font-medium text-gray-200 truncate flex-1">
									{latestActivity.name}
								</div>
								<div className="text-xs text-gray-300 whitespace-nowrap">
									{formatDistance(latestActivity.distance)}
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
							onClick={() => navigate("/profile")}
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
