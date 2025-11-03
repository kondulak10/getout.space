export interface MapViewport {
	name: string;
	center: [number, number]; // [longitude, latitude]
	zoom: number;
}

export const MAP_VIEWPORTS = {
	ostrava: {
		name: 'Ostrava',
		center: [18.2820, 49.8209] as [number, number],
		zoom: 12,
	},
	oslo: {
		name: 'Oslo',
		center: [10.7522, 59.9139] as [number, number],
		zoom: 12,
	},
} as const;

export type ViewportKey = keyof typeof MAP_VIEWPORTS;

export const DEFAULT_VIEWPORT: ViewportKey = 'ostrava';
