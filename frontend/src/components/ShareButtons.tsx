import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';
import { useMapShareImage } from '@/hooks/useMapShareImage';

export function ShareButtons() {
	const { generateAndShareImage, isGenerating, canShare } = useMapShareImage();

	const shareLink = () => {
		const url = 'https://getout.space';
		navigator.clipboard.writeText(url);
		toast.success('Link copied to clipboard!');
	};

	return (
		<div className="absolute top-4 left-4 z-10 flex gap-2">
			<button
				onClick={generateAndShareImage}
				disabled={isGenerating || !canShare}
				className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
				className="bg-white/95 hover:bg-white border border-black/20 text-black px-4 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold cursor-pointer"
				title="Copy Link to Clipboard"
			>
				<FontAwesomeIcon icon="share-nodes" className="w-5 h-5" />
				<span className="text-sm">Share Link</span>
			</button>
		</div>
	);
}
