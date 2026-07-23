import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["modules/**/*.test.ts", "lib/**/*.test.ts"],
    exclude: ["**/*.integration.test.ts", "node_modules"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
