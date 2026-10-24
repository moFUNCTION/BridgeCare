import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths({ projects: ["./tsconfig.app.json"] })],
  assetsInclude: ["**/*.lottie"],
  worker: { format: "es" },
  optimizeDeps: {
    exclude: ["@imgly/background-removal"],
    esbuildOptions: {
      external: ["onnxruntime-web", "onnxruntime-web/webgpu"],
    },
  },
  build: {
    rollupOptions: {
      external: ["onnxruntime-web", "onnxruntime-web/webgpu"],
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});

