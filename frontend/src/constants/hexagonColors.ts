export const HEXAGON_COLORS = [
	"#6B5AFF",  // Purple-Blue (original)
	"#00E5FF",  // Bright Cyan (original)
	"#00FF88",  // Mint Green (original)
	"#FFEE44",  // Yellow (original)
	"#FF5555",  // Red (original)
	"#FF8844",  // Orange (ADJUSTED - brighter orange)
	"#FF22BB",  // Hot Magenta (ADJUSTED - more distinct from lavender)
	"#9966FF",  // Violet (ADJUSTED - more purple, distinct from hot pink)
	"#AAFF44",  // Lime (original)
	"#FFAADD",  // Light Pink (original)
	"#44FFCC",  // Teal (original)
	"#996633",  // Brown (ADJUSTED - true brown, distinct from orange)
	"#FF0088",  // Deep Magenta (NEW - distinct from pinks)
	"#0099FF",  // Sky Blue (NEW - fills blue gap)
	"#5511DD",  // Indigo (ADJUSTED - more distinct from purple-blue)
	"#FFBB00",  // Amber/Gold (NEW - between yellow & orange)
	"#008855",  // Forest Green (ADJUSTED - darker, distinct from mint)
	"#CC0044",  // Crimson (NEW - darker red)
] as const;

export type HexagonColor = typeof HEXAGON_COLORS[number];


const userColorMap = new Map<string, number>();
let nextColorIndex = 0;

export function getUserColor(userId: string, currentUserId?: string): HexagonColor | string {
	// Logged-in user's hexagons are always Strava orange
	if (currentUserId && userId === currentUserId) {
		return "#fc4c02";
	}

	let colorIndex = userColorMap.get(userId);

	if (colorIndex === undefined) {

		colorIndex = nextColorIndex % HEXAGON_COLORS.length;
		userColorMap.set(userId, colorIndex);
		nextColorIndex++;
	}

	return HEXAGON_COLORS[colorIndex];
}


export function resetUserColors() {
	userColorMap.clear();
	nextColorIndex = 0;
}
