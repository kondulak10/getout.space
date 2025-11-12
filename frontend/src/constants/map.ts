export const H3_RESOLUTION = 10;
export const SAMPLE_IMAGE_URL =
	"https://getout-profile-images.s3.eu-north-1.amazonaws.com/sample.jpg";
export const HEX_COLORS = [
	"#FF6B6B",
	"#4ECDC4",
	"#45B7D1",
	"#96CEB4",
	"#FFEAA7",
	"#DFE6E9",
	"#74B9FF",
	"#A29BFE",
	"#FD79A8",
	"#FDCB6E",
] as const;
export const IMAGE_PROBABILITY = 0.1;
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
