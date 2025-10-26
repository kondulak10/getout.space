import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export interface StravaActivity {
	id: number;
	name: string;
	type: string;
	distance: number;
	moving_time: number;
	elapsed_time: number;
	total_elevation_gain: number;
	start_date: string;
	start_date_local: string;
	average_speed: number;
	max_speed: number;
}

interface ActivitiesTableProps {
	activities: StravaActivity[];
	onActivityClick: (activityId: number) => void;
}

export function ActivitiesTable({ activities, onActivityClick }: ActivitiesTableProps) {
	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(2) + " km";
	};

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		}
		return `${minutes}m ${secs}s`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatSpeed = (metersPerSecond: number) => {
		const kmPerHour = metersPerSecond * 3.6;
		return kmPerHour.toFixed(2) + " km/h";
	};

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Activity</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>Distance</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead>Elevation</TableHead>
						<TableHead>Avg Speed</TableHead>
						<TableHead>Date</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activities.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="text-center text-muted-foreground">
								No activities found
							</TableCell>
						</TableRow>
					) : (
						activities.map((activity) => (
							<TableRow
								key={activity.id}
								onClick={() => onActivityClick(activity.id)}
								className="cursor-pointer hover:bg-muted/70"
							>
								<TableCell className="font-medium">{activity.name}</TableCell>
								<TableCell>{activity.type}</TableCell>
								<TableCell>{formatDistance(activity.distance)}</TableCell>
								<TableCell>{formatTime(activity.moving_time)}</TableCell>
								<TableCell>{activity.total_elevation_gain.toFixed(0)}m</TableCell>
								<TableCell>{formatSpeed(activity.average_speed)}</TableCell>
								<TableCell>{formatDate(activity.start_date_local)}</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
