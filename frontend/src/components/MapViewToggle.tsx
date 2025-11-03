interface MapViewToggleProps {
	view: 'only-you' | 'battle';
	onViewChange: (view: 'only-you' | 'battle') => void;
	totalHexCount: number;
}

export function MapViewToggle({ view, onViewChange, totalHexCount }: MapViewToggleProps) {
	return (
		<div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
			<div className="flex flex-col gap-2">
				{/* Toggle Buttons */}
				<div className="flex gap-1 bg-gray-100 rounded p-1">
					<button
						onClick={() => onViewChange('only-you')}
						className={`px-4 py-2 text-sm font-medium rounded transition-all ${
							view === 'only-you'
								? 'bg-blue-600 text-white shadow'
								: 'text-gray-700 hover:text-gray-900'
						}`}
					>
						Only You
					</button>
					<button
						onClick={() => onViewChange('battle')}
						className={`px-4 py-2 text-sm font-medium rounded transition-all ${
							view === 'battle'
								? 'bg-orange-600 text-white shadow'
								: 'text-gray-700 hover:text-gray-900'
						}`}
					>
						Battle
					</button>
				</div>

				{/* Stats for Only You view */}
				{view === 'only-you' && (
					<div className="text-xs text-gray-600 px-2">
						<div className="flex items-center justify-between">
							<span className="font-medium">Your Hexagons:</span>
							<span className="font-bold text-blue-600">{totalHexCount.toLocaleString()}</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
