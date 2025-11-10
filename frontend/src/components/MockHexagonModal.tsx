import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faLocationDot, faUser, faChartLine } from '@fortawesome/pro-solid-svg-icons';
import type { MockHexagon, MockUser } from '@/utils/mockHexData';
import { formatDate } from '@/utils/dateFormatter';

interface MockHexagonModalProps {
	hexagon: MockHexagon;
	user: MockUser | null;
	onClose: () => void;
}

export function MockHexagonModal({
	hexagon,
	user,
	onClose,
}: MockHexagonModalProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={onClose}
		>
			<div
				className="bg-[rgba(10,10,10,0.95)] border border-white/10 rounded-xl shadow-2xl max-w-lg w-full"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-4 border-b border-white/10">
					<h2 className="text-lg font-semibold text-gray-100">Hexagon Details</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
					>
						<FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div className="bg-white/5 rounded-lg p-4">
						<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
							<FontAwesomeIcon icon={faLocationDot} className="w-4 h-4" />
							<span>Hexagon ID</span>
						</div>
						<div className="text-gray-100 font-mono text-sm break-all">
							{hexagon.hexagonId}
						</div>
					</div>

					<div className="bg-white/5 rounded-lg p-4">
						<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
							<FontAwesomeIcon icon={faUser} className="w-4 h-4" />
							<span>Current Owner</span>
						</div>
						<div className="flex items-center gap-3">
							{user?.isPremium && user.imghex && (
								<img
									src={user.imghex}
									alt={user.name}
									className="w-10 h-10 rounded-full border-2 border-white/20"
								/>
							)}
							<div>
								<div className="text-gray-100 font-medium">
									{user?.name || hexagon.currentOwnerId}
								</div>
								{user?.isPremium && (
									<span className="inline-block px-2 py-0.5 mt-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
										Premium
									</span>
								)}
							</div>
						</div>
					</div>

					<div className="bg-white/5 rounded-lg p-4">
						<div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
							<FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
							<span>Activity Details</span>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-gray-400 text-sm">Type</span>
								<span className="text-gray-100 text-sm font-medium">{hexagon.activityType}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400 text-sm">Activity ID</span>
								<span className="text-gray-100 text-sm font-mono">{hexagon.currentStravaActivityId}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400 text-sm">Capture Count</span>
								<span className="text-gray-100 text-sm font-medium">{hexagon.captureCount}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400 text-sm">Last Captured</span>
								<span className="text-gray-100 text-sm">{formatDate(hexagon.lastCapturedAt)}</span>
							</div>
						</div>
					</div>
				</div>

				<div className="p-4 border-t border-white/10 bg-white/5 text-center text-sm text-gray-400">
					Click outside or press ESC to close
				</div>
			</div>
		</div>
	);
}
