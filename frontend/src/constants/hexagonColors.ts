export const HEXAGON_COLORS = [
	"#6B5AFF",  // Vibrant purple-blue
	"#00E5FF",  // Bright cyan
	"#00FF88",  // Bright emerald green
	"#FFEE44",  // Bright yellow
	"#FF5555",  // Bright red
	"#FF8844",  // Bright orange
	"#FF55DD",  // Bright magenta-pink
	"#CC66FF",  // Bright lavender
	"#AAFF44",  // Bright lime green
	"#FFAADD",  // Bright soft pink
	"#44FFCC",  // Bright turquoise
	"#CC9955",  // Bright brown-gold
] as const;

export type HexagonColor = typeof HEXAGON_COLORS[number];

// Map to store user ID -> color index assignments
const userColorMap = new Map<string, number>();
let nextColorIndex = 0;

export function getUserColor(userId: string): HexagonColor {
	// Check if we've already assigned a color to this user
	let colorIndex = userColorMap.get(userId);

	if (colorIndex === undefined) {
		// New user - assign next color sequentially
		colorIndex = nextColorIndex % HEXAGON_COLORS.length;
		userColorMap.set(userId, colorIndex);
		nextColorIndex++;

		console.log(`🎨 NEW user color assigned: userId="${userId}" → index=${colorIndex} → color=${HEXAGON_COLORS[colorIndex]} (total users: ${userColorMap.size})`);
	}

	return HEXAGON_COLORS[colorIndex];
}

// Optional: Function to reset color assignments (useful for testing)
export function resetUserColors() {
	userColorMap.clear();
	nextColorIndex = 0;
}
