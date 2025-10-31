import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
	isStored?: boolean;
}

interface ActivitiesTableProps {
	activities: StravaActivity[];
	onActivityClick: (activityId: number) => void;
	onProcessActivity: (activityId: number) => Promise<void>;
}

export function ActivitiesTable({ activities, onActivityClick, onProcessActivity }: ActivitiesTableProps) {
	const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

	const handleProcessActivity = async (activityId: number, e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent row click
		setProcessingIds(prev => new Set(prev).add(activityId));
		try {
			await onProcessActivity(activityId);
		} finally {
			setProcessingIds(prev => {
				const next = new Set(prev);
				next.delete(activityId);
				return next;
			});
		}
	};

	const formatDistance = (meters: number) => {
		return (meters / 1000).toFixed(2) + " km";
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

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Activity ID</TableHead>
						<TableHead>Activity Name</TableHead>
						<TableHead>Distance</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activities.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="text-center text-muted-foreground">
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
								<TableCell className="font-mono text-sm text-muted-foreground">
									{activity.id}
								</TableCell>
								<TableCell className="font-medium">{activity.name}</TableCell>
								<TableCell>{formatDistance(activity.distance)}</TableCell>
								<TableCell>{formatDate(activity.start_date_local)}</TableCell>
								<TableCell>
									{activity.isStored ? (
										<span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
											✓ Stored
										</span>
									) : (
										<span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
											Not stored
										</span>
									)}
								</TableCell>
								<TableCell onClick={(e) => e.stopPropagation()}>
									{!activity.isStored && (
										<Button
											size="sm"
											variant="outline"
											onClick={(e) => handleProcessActivity(activity.id, e)}
											disabled={processingIds.has(activity.id)}
										>
											{processingIds.has(activity.id) ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Processing...
												</>
											) : (
												"Save"
											)}
										</Button>
									)}
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
