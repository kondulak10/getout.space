import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ProfileDangerZoneProps {
	onDelete: () => Promise<void>;
	deleting: boolean;
}

export function ProfileDangerZone({ onDelete, deleting }: ProfileDangerZoneProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

	const handleDelete = async () => {
		if (!showDeleteConfirm) {
			setShowDeleteConfirm(true);
			return;
		}

		await onDelete();
	};

	return (
		<div>
			{/* Subtle toggle button */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="text-xs text-gray-500 hover:text-gray-400 transition-colors cursor-pointer flex items-center gap-1.5"
			>
				<FontAwesomeIcon
					icon={isExpanded ? "chevron-down" : "chevron-right"}
					className="w-2.5 h-2.5"
				/>
				Advanced Settings
			</button>

			{/* Collapsible danger zone */}
			{isExpanded && (
				<div className="mt-3 bg-[rgba(10,10,10,0.9)] backdrop-blur-md border border-red-500/20 rounded-xl p-6">
					<div className="flex items-start gap-3 mb-4">
						<FontAwesomeIcon icon="exclamation-triangle" className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
						<div className="text-sm text-red-400">
							<p className="font-semibold mb-1">Danger Zone</p>
							<p className="text-xs">
								Deleting your account permanently removes all activities and hexagons. This cannot be
								undone.
							</p>
						</div>
					</div>

					<button
						onClick={handleDelete}
						disabled={deleting}
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
							showDeleteConfirm
								? 'bg-red-600 hover:bg-red-700 text-white'
								: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
						}`}
					>
						<FontAwesomeIcon icon="trash" className="w-4 h-4" />
						{deleting ? 'Deleting...' : showDeleteConfirm ? 'Click Again to Confirm' : 'Delete Account'}
					</button>

					{showDeleteConfirm && (
						<button
							onClick={() => setShowDeleteConfirm(false)}
							className="w-full mt-2 text-sm text-gray-400 hover:text-gray-300 cursor-pointer"
						>
							Cancel
						</button>
					)}
				</div>
			)}
		</div>
	);
}
