export function AuthLoadingOverlay() {
	return (
		<div className="absolute inset-0 z-30 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
			<div className="text-center">
				<div className="mb-6">
					<div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
				</div>
				<h2 className="text-2xl font-bold text-white mb-2">GetOut.space</h2>
				<p className="text-gray-400">Authenticating...</p>
			</div>
		</div>
	);
}
