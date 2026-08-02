import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      obsidian:              resolve(__dirname, "tests/__mocks__/obsidian.ts"),
      "echarts/core":        resolve(__dirname, "tests/__mocks__/echarts.ts"),
      "echarts/charts":      resolve(__dirname, "tests/__mocks__/echarts.ts"),
      "echarts/components":  resolve(__dirname, "tests/__mocks__/echarts.ts"),
      "echarts/renderers":   resolve(__dirname, "tests/__mocks__/echarts.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov", "json"],
      include: ["src/**/*.ts"],
    },
  },
});
