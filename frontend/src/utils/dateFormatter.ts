export function formatDate(
	dateString: string | null | undefined,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}
): string {
	if (!dateString) {
		return 'N/A';
	}
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		return 'Invalid Date';
	}
	return date.toLocaleDateString('en-US', options);
}
export function formatDateTime(dateString: string | null | undefined): string {
	return formatDate(dateString, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}
export function formatDistance(meters: number, decimals: number = 2): string {
	return (meters / 1000).toFixed(decimals) + ' km';
}

export function formatTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

export function formatPace(distanceMeters: number, timeSeconds: number): string {
	if (distanceMeters <= 0 || timeSeconds <= 0) {
		return 'N/A';
	}
	const avgSpeed = distanceMeters / timeSeconds;
	const minutesPerKm = 1000 / (avgSpeed * 60);
	const minutes = Math.floor(minutesPerKm);
	const seconds = Math.round((minutesPerKm - minutes) * 60);
	return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}
