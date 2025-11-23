import { useMap } from "@/contexts/useMap";
import { MIN_ZOOM_FOR_ACTIVITIES, DEFAULT_FLY_TO_ZOOM } from "@/constants/map";
import { useEffect, useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faLocationDot } from "@fortawesome/pro-solid-svg-icons";

interface LocationResult {
	id: string;
	name: string;
	full_address: string;
	coordinates: {
		longitude: number;
		latitude: number;
	};
}

interface MapboxGeocodeResponse {
	type: string;
	features: Array<{
		id: string;
		type: string;
		geometry: {
			type: string;
			coordinates: [number, number];
		};
		properties: {
			name: string;
			full_address: string;
		};
	}>;
}

export function LocationSearch() {
	const { mapRef, flyToLocation, setIsZoomedOut } = useMap();
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState<LocationResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const searchTimeout = useRef<number | undefined>(undefined);
	const abortController = useRef<AbortController | undefined>(undefined);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const updateVisibility = () => {
			const zoom = map.getZoom();
			const isZoomed = zoom < MIN_ZOOM_FOR_ACTIVITIES;
			setShowSearch(isZoomed);
			setIsZoomedOut(isZoomed);
		};

		updateVisibility();
		map.on("zoom", updateVisibility);
		map.on("zoomend", updateVisibility);

		return () => {
			if (map.getStyle()) {
				map.off("zoom", updateVisibility);
				map.off("zoomend", updateVisibility);
			}
		};
	}, [mapRef, setIsZoomedOut]);

	const searchLocation = useCallback(async (query: string) => {
		if (query.length < 3) {
			setResults([]);
			return;
		}

		// Cancel previous request
		if (abortController.current) {
			abortController.current.abort();
		}

		abortController.current = new AbortController();
		setIsLoading(true);

		try {
			const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

			// Smart proximity bias:
			// - Only use for specific queries (contains numbers or very long)
			// - This way "Oslo" finds the city, but "Hlavní 123" finds local streets
			const hasNumbers = /\d/.test(query);
			const isVerySpecific = query.length > 15;
			const shouldUseProximity = hasNumbers || isVerySpecific;

			let proximityParam = '';
			if (shouldUseProximity && mapRef.current) {
				const center = mapRef.current.getCenter();
				proximityParam = `&proximity=${center.lng},${center.lat}`;
			}

			// Prioritize broader locations first (place, locality, region, country)
			// Then neighborhood, street, address for more specific searches
			const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&access_token=${mapboxToken}&limit=6&types=place,locality,region,country,neighborhood,street,address${proximityParam}`;

			const response = await fetch(url, {
				signal: abortController.current.signal,
			});

			if (!response.ok) {
				throw new Error("Geocoding request failed");
			}

			const data: MapboxGeocodeResponse = await response.json();

			const locationResults: LocationResult[] = data.features.map((feature) => ({
				id: feature.id,
				name: feature.properties.name,
				full_address: feature.properties.full_address,
				coordinates: {
					longitude: feature.geometry.coordinates[0],
					latitude: feature.geometry.coordinates[1],
				},
			}));

			setResults(locationResults);
			setSelectedIndex(-1);
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				// Request was cancelled, ignore
				return;
			}
			console.error("Location search error:", error);
			setResults([]);
		} finally {
			setIsLoading(false);
		}
	}, [mapRef]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchQuery(value);

		// Clear previous timeout
		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current);
		}

		// Debounce search
		searchTimeout.current = window.setTimeout(() => {
			searchLocation(value);
		}, 500);
	};

	const handleSelectLocation = (location: LocationResult) => {
		flyToLocation(location.coordinates.longitude, location.coordinates.latitude, DEFAULT_FLY_TO_ZOOM);
		setSearchQuery("");
		setResults([]);
		inputRef.current?.blur();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (results.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < results.length) {
					handleSelectLocation(results[selectedIndex]);
				}
				break;
			case "Escape":
				setSearchQuery("");
				setResults([]);
				inputRef.current?.blur();
				break;
		}
	};

	// Click outside handler to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setResults([]);
				setSearchQuery("");
			}
		};

		if (results.length > 0) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [results.length]);

	useEffect(() => {
		return () => {
			if (searchTimeout.current) {
				clearTimeout(searchTimeout.current);
			}
			if (abortController.current) {
				abortController.current.abort();
			}
		};
	}, []);

	if (!showSearch) return null;

	return (
		<div ref={containerRef} className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-[90vw] max-w-md">
			<div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl">
				{/* Search Input */}
				<div className="relative">
					<div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
						<FontAwesomeIcon
							icon={isLoading ? faSpinner : faSearch}
							className={`w-4 h-4 text-gray-400 ${isLoading ? "animate-spin" : ""}`}
						/>
					</div>
					<input
						ref={inputRef}
						type="text"
						value={searchQuery}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder="Search for a location..."
						className="w-full bg-black/50 text-white placeholder-gray-400 pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-[#FF7F00] focus:outline-none focus:ring-1 focus:ring-[#FF7F00] transition-colors"
						autoComplete="off"
					/>
				</div>

				{/* Results Dropdown */}
				{results.length > 0 && (
					<div className="mt-2 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
						{results.map((location, index) => (
							<button
								key={location.id}
								onClick={() => handleSelectLocation(location)}
								onMouseEnter={() => setSelectedIndex(index)}
								className={`w-full text-left px-4 py-3 transition-colors border-b border-white/5 last:border-b-0 ${
									selectedIndex === index
										? "bg-[#FF7F00]/20"
										: "hover:bg-white/5"
								}`}
							>
								<div className="flex items-start gap-3">
									<FontAwesomeIcon
										icon={faLocationDot}
										className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
											selectedIndex === index ? "text-[#FF7F00]" : "text-gray-400"
										}`}
									/>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-white truncate">
											{location.name}
										</div>
										<div className="text-sm text-gray-400 truncate">
											{location.full_address}
										</div>
									</div>
								</div>
							</button>
						))}
					</div>
				)}

				{/* Helper Text */}
				<div className="mt-3 text-center text-sm text-gray-400">
					{searchQuery.length > 0 && results.length === 0 && !isLoading && (
						<span>No locations found</span>
					)}
					{searchQuery.length === 0 && (
						<span>
							Search for a city or{" "}
							<span style={{ color: "#FF7F00" }}>zoom in manually</span>{" "}
							<span className="text-gray-500">to see the markers</span>
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
