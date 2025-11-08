import * as h3 from 'h3-js';

/**
 * Geocode a location (city, state, country) to H3 hex at resolution 6
 * Returns undefined if geocoding fails (network error, no results, etc.)
 */
export async function geocodeToHex(city?: string, state?: string, country?: string): Promise<string | undefined> {
	try {
		// Build location string
		const locationParts = [city, state, country].filter(Boolean);
		if (locationParts.length === 0) {
			console.log('ℹ️ No location data provided for geocoding');
			return undefined;
		}

		const location = locationParts.join(', ');
		console.log(`📍 Attempting to geocode: ${location}`);

		// Use Mapbox Geocoding API (free tier: 100,000 requests/month)
		const mapboxToken = process.env.MAPBOX_TOKEN;
		if (!mapboxToken) {
			console.log('ℹ️ MAPBOX_TOKEN not configured - skipping geocoding');
			return undefined;
		}

		const encodedLocation = encodeURIComponent(location);
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${mapboxToken}&limit=1`;

		const response = await fetch(url);
		if (!response.ok) {
			console.warn(`⚠️ Geocoding API error: ${response.status}`);
			return undefined;
		}

		const data = await response.json() as {
			features?: Array<{
				center?: [number, number]; // [longitude, latitude]
				place_name?: string;
			}>;
		};

		if (!data.features || data.features.length === 0) {
			console.log(`ℹ️ No geocoding results found for: ${location}`);
			return undefined;
		}

		const [lng, lat] = data.features[0].center || [];
		if (!lng || !lat) {
			console.log(`ℹ️ Invalid coordinates from geocoding`);
			return undefined;
		}

		console.log(`✅ Geocoded "${location}" to: ${lat}, ${lng}`);

		// Convert to H3 hex at resolution 6
		const hex = h3.latLngToCell(lat, lng, 6);
		console.log(`✅ Converted to hex (res 6): ${hex}`);

		return hex;
	} catch (error) {
		console.warn('⚠️ Geocoding failed:', error instanceof Error ? error.message : 'Unknown error');
		return undefined;
	}
}
