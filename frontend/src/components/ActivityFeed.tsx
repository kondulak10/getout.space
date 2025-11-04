import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface WebhookEvent {
	object_type: "activity" | "athlete";
	object_id: number;
	aspect_type: "create" | "update" | "delete";
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	updates?: Record<string, any>;
	owner_id: number;
	subscription_id: number;
	event_time: number;
}

interface ConnectionEvent {
	type: "connected";
	message: string;
}

type EventData = WebhookEvent | ConnectionEvent;

interface ActivityFeedProps {
	onActivityClick?: (activityId: number) => void;
}

export function ActivityFeed({ onActivityClick }: ActivityFeedProps) {
	const [events, setEvents] = useState<WebhookEvent[]>([]);
	const [isConnected, setIsConnected] = useState(false);

	const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4001";

	useEffect(() => {

		// Create EventSource for SSE
		const eventSource = new EventSource(`${backendUrl}/api/strava/events`);

		eventSource.onopen = () => {
			setIsConnected(true);
		};

		eventSource.onmessage = (event) => {
			try {
				const data: EventData = JSON.parse(event.data);

				// Check if it's a connection message
				if ("type" in data && data.type === "connected") {
					return;
				}

				// It's a webhook event
				const webhookEvent = data as WebhookEvent;

				// Add event to the list (newest first)
				setEvents((prev) => [webhookEvent, ...prev]);
			} catch (error) {
			}
		};

		eventSource.onerror = (error) => {
			setIsConnected(false);
		};

		// Cleanup on unmount
		return () => {
			eventSource.close();
		};
	}, [backendUrl]);

	const formatEventTime = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	const getEventIcon = (aspectType: string) => {
		switch (aspectType) {
			case "create":
				return "🆕";
			case "update":
				return "✏️";
			case "delete":
				return "🗑️";
			default:
				return "📌";
		}
	};

	const getEventColor = (aspectType: string) => {
		switch (aspectType) {
			case "create":
				return "bg-green-50 border-green-200 text-green-700";
			case "update":
				return "bg-blue-50 border-blue-200 text-blue-700";
			case "delete":
				return "bg-red-50 border-red-200 text-red-700";
			default:
				return "bg-gray-50 border-gray-200 text-gray-700";
		}
	};

	const isEventClickable = (event: WebhookEvent) => {
		// Only "create" activity events are clickable
		return event.object_type === "activity" && event.aspect_type === "create" && onActivityClick;
	};

	const handleEventClick = (event: WebhookEvent) => {
		if (isEventClickable(event) && onActivityClick) {
			onActivityClick(event.object_id);
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Live Activity Feed</CardTitle>
						<CardDescription>Real-time webhook events from Strava</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<div
							className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
						/>
						<span className="text-xs text-muted-foreground">
							{isConnected ? "Connected" : "Disconnected"}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{events.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<p className="text-sm">No events yet</p>
							<p className="text-xs mt-2">Waiting for activity updates from Strava...</p>
						</div>
					) : (
						events.map((event, index) => {
							const clickable = isEventClickable(event);
							return (
								<div
									key={`${event.object_id}-${event.event_time}-${index}`}
									onClick={() => handleEventClick(event)}
									className={`p-4 rounded-lg border ${getEventColor(event.aspect_type)} ${
										clickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""
									}`}
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<span className="text-xl">{getEventIcon(event.aspect_type)}</span>
												<span className="font-semibold capitalize">
													{event.aspect_type} {event.object_type}
												</span>
												{clickable && (
													<span className="text-xs opacity-60">• Click to view on map</span>
												)}
											</div>
											<div className="space-y-1 text-sm">
												<div>
													<span className="font-medium">Object ID:</span> {event.object_id}
												</div>
												<div>
													<span className="font-medium">Athlete ID:</span> {event.owner_id}
												</div>
												{event.updates && Object.keys(event.updates).length > 0 && (
													<div>
														<span className="font-medium">Updates:</span>{" "}
														{JSON.stringify(event.updates)}
													</div>
												)}
												<div className="text-xs opacity-75">{formatEventTime(event.event_time)}</div>
											</div>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</CardContent>
		</Card>
	);
}
