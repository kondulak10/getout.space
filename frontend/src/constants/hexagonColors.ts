export const HEXAGON_COLORS = [
	"#5D3FFF",
	"#4DFFFF",
	"#B3FF66",
	"#FFEB3B",
	"#FF4444",
	"#FF6B35",
	"#A0FF44",
	"#FF4FA7",
	"#E366FF",
	"#9C5FFF",
	"#66FFE0",
	"#FFB84D",
	"#FF66B8",
	"#5FE8FF",
	"#CCFF33",
] as const;

export type HexagonColor = typeof HEXAGON_COLORS[number];

export function getUserColor(userId: string): HexagonColor {
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash);
	}
	const colorIndex = Math.abs(hash) % HEXAGON_COLORS.length;
	return HEXAGON_COLORS[colorIndex];
}
