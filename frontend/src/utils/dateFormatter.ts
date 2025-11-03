/**
 * Safely format a date string to a localized date
 * @param dateString - ISO 8601 date string or similar
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or 'N/A' if invalid
 */
export function formatDate(
	dateString: string | null | undefined,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}
): string {
	if (!dateString) {
		console.warn('formatDate called with empty value:', dateString);
		return 'N/A';
	}

	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
		console.error('Invalid date string:', {
			value: dateString,
			type: typeof dateString,
			parsed: date,
		});
		return 'Invalid Date';
	}

	return date.toLocaleDateString('en-US', options);
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string | null | undefined): string {
	return formatDate(dateString, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}

/**
 * Format distance in meters to kilometers
 */
export function formatDistance(meters: number): string {
	return (meters / 1000).toFixed(2) + ' km';
}
