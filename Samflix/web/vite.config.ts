import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    // Ensure filenames include content hashes for cache busting
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
    // Generate source maps for debugging (optional, can disable in production)
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  // Ensure base path is correct for Firebase Hosting
  base: "/"
});






