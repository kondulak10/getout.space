import { faSyncAlt } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStravaAuth } from "@/hooks/useStravaAuth";

export function StravaSyncBadge() {
	const { loginWithStrava } = useStravaAuth();

	return (
		<div className="absolute top-6 md:top-8 left-1/2 transform -translate-x-1/2 z-40">
			{/* Badge container - circular design */}
			<div
				onClick={loginWithStrava}
				className="relative flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2.5 md:px-5 md:py-3 shadow-xl border border-gray-200 cursor-pointer hover:bg-white hover:shadow-2xl hover:scale-105 transition-all duration-300 active:scale-100"
			>
				{/* Rotating circle with icon */}
				<div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
					{/* Pulsing ring animation */}
					<div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-20"></div>

					{/* Icon */}
					<FontAwesomeIcon
						icon={faSyncAlt}
						className="w-4 h-4 md:w-5 md:h-5 text-white animate-spin-slow relative z-10"
					/>
				</div>

				{/* Text */}
				<div className="flex flex-col leading-tight">
					<span className="text-xs md:text-sm font-bold text-gray-900 tracking-tight">
						AUTO sync with Strava!
					</span>
					<span className="text-[10px] md:text-xs font-medium text-gray-500">
						After first login
					</span>
				</div>
			</div>
		</div>
	);
}
