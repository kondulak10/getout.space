/**
 * Hexagon color palette for user-owned hexagons
 * Used to assign consistent colors per user across the map
 * Brighter, more vibrant colors for better visibility
 */
export const HEXAGON_COLORS = [
	"#5D3FFF",  // Brighter blue
	"#4DFFFF",  // Bright cyan
	"#B3FF66",  // Bright lime green
	"#FFEB3B",  // Bright yellow
	"#FF4444",  // Bright red
	"#FF6B35",  // Bright orange
	"#A0FF44",  // Bright green
	"#FF4FA7",  // Bright pink
	"#E366FF",  // Bright purple
	"#9C5FFF",  // Bright violet
	"#66FFE0",  // Bright teal
	"#FFB84D",  // Bright amber
	"#FF66B8",  // Bright magenta
	"#5FE8FF",  // Bright sky blue
	"#CCFF33",  // Bright yellow-green
] as const;

export type HexagonColor = typeof HEXAGON_COLORS[number];

/**
 * Generate a consistent color for a user ID using the hexagon color palette
 */
export function getUserColor(userId: string): HexagonColor {
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash);
	}
	const colorIndex = Math.abs(hash) % HEXAGON_COLORS.length;
	return HEXAGON_COLORS[colorIndex];
}
