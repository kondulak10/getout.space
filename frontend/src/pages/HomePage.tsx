import { VersionBadge } from "@/components/VersionBadge";
import { MapView } from "@/components/MapView";
import { useAuth } from "@/contexts/useAuth";
import "mapbox-gl/dist/mapbox-gl.css";

export function HomePage() {
	const { user, isLoading } = useAuth();

	return (
		<div className="relative w-full h-dvh md:h-screen bg-black">
			{!isLoading && <MapView user={user} />}
			<VersionBadge />
		</div>
	);
}
