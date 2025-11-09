import { MapView } from "@/components/MapView";
import { VersionBadge } from "@/components/VersionBadge";
import { MapProvider } from "@/contexts/MapProvider";
import { useAuth } from "@/contexts/useAuth";
import "mapbox-gl/dist/mapbox-gl.css";

export function HomePage() {
	const { user, isLoading } = useAuth();

	console.log("🔵 HomePage: user =", user);
	console.log("🔵 HomePage: isLoading =", isLoading);

	return (
		<MapProvider>
			<div className="relative w-full h-dvh md:h-screen bg-black">
				{!isLoading && user && <MapView user={user} />}
				<VersionBadge />
			</div>
		</MapProvider>
	);
}
