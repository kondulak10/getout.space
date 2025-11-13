import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/components": path.resolve(__dirname, "./src/components"),
			"@/lib": path.resolve(__dirname, "./src/lib"),
		},
	},
	optimizeDeps: {
		exclude: ["@apollo/client"],
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// Mapbox is huge (~500 KB), split it out
					'mapbox': ['mapbox-gl'],
					// React and router libs
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					// Apollo GraphQL client
					'apollo': ['@apollo/client'],
					// H3 hexagon library
					'h3': ['h3-js'],
					// FontAwesome icons (Pro version)
					'fontawesome': [
						'@fortawesome/fontawesome-svg-core',
						'@fortawesome/react-fontawesome',
						'@fortawesome/pro-solid-svg-icons',
						'@fortawesome/pro-regular-svg-icons',
						'@fortawesome/pro-light-svg-icons'
					],
				},
			},
		},
		// Increase chunk size warning limit to 1000 KB (we've split the large chunks)
		chunkSizeWarningLimit: 1000,
		// Enable source maps for production debugging (optional, increases build time)
		sourcemap: false,
	},
});
