import { useEffect, useState } from 'react';
import { getVersionString } from '@/version';

export function VersionBadge() {
	const [backendVersion, setBackendVersion] = useState<string | null>(null);

	useEffect(() => {
		const fetchBackendVersion = async () => {
			try {
				const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
				const response = await fetch(`${backendUrl}/version`);
				const data = await response.json();
				setBackendVersion(data.versionString);
			} catch (error) {
				setBackendVersion('unknown');
			}
		};

		fetchBackendVersion();
	}, []);

	return (
		<div className="absolute bottom-2 z-50 pointer-events-none" style={{ left: '100px' }}>
			<span className="text-xs font-mono font-medium text-gray-700">
				FE: {getVersionString()}
				{backendVersion && ` | BE: ${backendVersion}`}
			</span>
		</div>
	);
}
