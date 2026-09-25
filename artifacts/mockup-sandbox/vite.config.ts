import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const PORT = process.env.PORT || 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(PORT),
  },
});
