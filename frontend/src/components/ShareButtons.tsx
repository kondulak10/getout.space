import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';
import { useMapShareImage } from '@/hooks/useMapShareImage';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMap } from '@/contexts/useMap';
import type { LocalStats } from '@/utils/calculateLocalStats';

interface ShareButtonsProps {
	localStats: LocalStats;
	totalHexagons: number;
	globalRank?: number;
}

export function ShareButtons({ localStats, totalHexagons, globalRank }: ShareButtonsProps) {
	const { isZoomedOut } = useMap();
	const { generateAndShareImage, isGenerating, canShare } = useMapShareImage();
	const { track } = useAnalytics();

	// Hide when zoomed out
	if (isZoomedOut) return null;

	const shareLink = () => {
		track('share_link_clicked', {});
		const url = 'https://getout.space';
		navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard!');
	};

	const handleShareImage = () => {
		track('share_image_clicked', {});
		generateAndShareImage(localStats, totalHexagons, globalRank);
	};

	return (
		<div className="absolute top-4 left-4 z-10">
			<div className="flex flex-row gap-1 items-center pointer-events-none">
				{/* Buttons stacked vertically */}
				<div className="flex flex-col gap-2 pointer-events-auto">
					<button
						onClick={handleShareImage}
						disabled={isGenerating || !canShare}
						className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
						title="Share or Download Image"
					>
						<FontAwesomeIcon
							icon={isGenerating ? "spinner" : "image"}
							className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`}
						/>
						<span className="text-sm">Share Image</span>
					</button>
					<button
						onClick={shareLink}
						className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold cursor-pointer whitespace-nowrap"
						title="Copy Link to Clipboard"
					>
						<FontAwesomeIcon icon="share-nodes" className="w-5 h-5" />
						<span className="text-sm">Share Link</span>
					</button>
				</div>

				{/* Hand-drawn style annotation */}
				<div className="relative flex flex-row items-center gap-1 select-none pointer-events-none">
					{/* Hand-drawn split arrow pointing left */}
					<svg
						width="70"
						height="100"
						viewBox="0 0 70 100"
						className="rotate-[5deg] [filter:drop-shadow(0_2px_4px_rgba(0,0,0,0.8))]"
					>
						{/* Top branch pointing to Share Image button */}
						<path
							d="M 65 50 Q 50 46, 35 35 Q 25 26, 12 22"
							stroke="white"
							strokeWidth="2.5"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						{/* Top arrowhead */}
						<path
							d="M 12 22 L 18 18 M 12 22 L 17 26"
							stroke="white"
							strokeWidth="2.5"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						{/* Bottom branch pointing to Share Link button */}
						<path
							d="M 65 50 Q 50 54, 35 65 Q 25 74, 12 78"
							stroke="white"
							strokeWidth="2.5"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						{/* Bottom arrowhead */}
						<path
							d="M 12 78 L 18 82 M 12 78 L 17 74"
							stroke="white"
							strokeWidth="2.5"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>

					{/* Hand-drawn text */}
					<div
						className="text-white font-bold rotate-[-3deg] [text-shadow:0_2px_6px_rgba(0,0,0,0.9)] leading-tight"
						style={{ fontFamily: 'Comic Sans MS, cursive' }}
					>
						<div className="text-base">Invite your friends</div>
						<div className="text-base">to compete with!</div>
					</div>
				</div>
			</div>
		</div>
	);
}
