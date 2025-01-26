// import { defineConfig } from 'vite'
import { defineConfig as testConfig } from "vitest/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration
const config = defineConfig({
  plugins: [react()],
  build : {
    outDir: './docs'
  },
  base: "/json-lp-simulator/",
});

// Vitest configuration
const tstConfig = testConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
  },
});

// Merge configurations
export default {
  ...config,
  ...tstConfig,
};
