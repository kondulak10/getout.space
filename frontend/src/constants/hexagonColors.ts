export const HEXAGON_COLORS = [
	"#6B5AFF",  
	"#00E5FF",  
	"#00FF88",  
	"#FFEE44",  
	"#FF5555",  
	"#FF8844",  
	"#FF55DD",  
	"#CC66FF",  
	"#AAFF44",  
	"#FFAADD",  
	"#44FFCC",  
	"#CC9955",  
] as const;

export type HexagonColor = typeof HEXAGON_COLORS[number];


const userColorMap = new Map<string, number>();
let nextColorIndex = 0;

export function getUserColor(userId: string): HexagonColor {
	
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
