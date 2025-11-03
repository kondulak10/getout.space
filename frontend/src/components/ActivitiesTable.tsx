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
import { Loader2, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime, formatDistance } from "@/utils/dateFormatter";

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
	onDeleteActivity: (activityId: number) => Promise<void>;
}

export function ActivitiesTable({ activities, onActivityClick, onProcessActivity, onDeleteActivity }: ActivitiesTableProps) {
	const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
	const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [activityToDelete, setActivityToDelete] = useState<number | null>(null);

	const handleProcessActivity = async (activityId: number, e: React.MouseEvent) => {
		e.stopPropagation();
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

	const handleDeleteActivity = async (activityId: number, e: React.MouseEvent) => {
		e.stopPropagation();
		setActivityToDelete(activityId);
		setShowDeleteDialog(true);
	};

	const confirmDelete = async () => {
		if (activityToDelete === null) return;
		
		setDeletingIds(prev => new Set(prev).add(activityToDelete));
		setShowDeleteDialog(false);
		try {
			await onDeleteActivity(activityToDelete);
		} finally {
			setDeletingIds(prev => {
				const next = new Set(prev);
				next.delete(activityToDelete);
				return next;
			});
			setActivityToDelete(null);
		}
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
								<TableCell>{formatDateTime(activity.start_date_local)}</TableCell>
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
									<div className="flex gap-2">
										{!activity.isStored ? (
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
										) : (
											<Button
												size="sm"
												variant="destructive"
												onClick={(e) => handleDeleteActivity(activity.id, e)}
												disabled={deletingIds.has(activity.id)}
											>
												{deletingIds.has(activity.id) ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Deleting...
													</>
												) : (
													<>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</>
												)}
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Activity</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this activity?
							<br /><br />
							This will:
							<br />• Remove the activity from the database
							<br />• Restore previous owners of captured hexagons (or delete hexagons if no previous owner)
							<br /><br />
							The activity will remain in your Strava account.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
