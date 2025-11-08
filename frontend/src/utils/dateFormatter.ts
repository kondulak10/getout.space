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

export function formatDistance(meters: number): string {
	return (meters / 1000).toFixed(2) + ' km';
}
