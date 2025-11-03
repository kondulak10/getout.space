interface MapViewToggleProps {
	view: 'only-you' | 'battle';
	onViewChange: (view: 'only-you' | 'battle') => void;
}

export function MapViewToggle({ view, onViewChange }: MapViewToggleProps) {
	return (
		<div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
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
		</div>
	);
}
