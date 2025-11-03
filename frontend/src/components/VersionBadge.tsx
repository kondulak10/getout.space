import { getVersionString } from '@/version';

export function VersionBadge() {
	return (
		<div className="absolute bottom-2 z-50 pointer-events-none" style={{ left: '100px' }}>
			<span className="text-xs font-mono font-medium text-gray-700">{getVersionString()}</span>
		</div>
	);
}
