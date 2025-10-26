// H3 resolution 10 gives ~65m hex width
export const H3_RESOLUTION = 10;

// Ostrava, Czech Republic coordinates [lng, lat]
export const INITIAL_CENTER: [number, number] = [18.2625, 49.8209];
export const INITIAL_ZOOM = 13;

// Sample image URL
export const SAMPLE_IMAGE_URL = 'https://fastly.picsum.photos/id/305/536/354.jpg?hmac=u9Mw37522_zEQ1FdKoVv_QXkWMkBOZFzRSXn2MCW0IY';

// Color palette for hexagons
export const HEX_COLORS = [
	'#FF6B6B',
	'#4ECDC4',
	'#45B7D1',
	'#96CEB4',
	'#FFEAA7',
	'#DFE6E9',
	'#74B9FF',
	'#A29BFE',
	'#FD79A8',
	'#FDCB6E',
] as const;

// Image probability (10% of hexagons)
export const IMAGE_PROBABILITY = 0.1;

// Ring size calculation based on zoom level
export const getRingSizeForZoom = (zoom: number): number => {
	if (zoom < 2) return 5;
	if (zoom < 4) return 10;
	if (zoom < 6) return 20;
	if (zoom < 8) return 30;
	if (zoom < 10) return 50;
	if (zoom < 12) return 80;
	if (zoom < 14) return 120;
	if (zoom < 16) return 150;
	return 200;
};
