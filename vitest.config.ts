import { resolve } from "node:path"
import { defineConfig } from "vitest/config"
import swc from "unplugin-swc"

export default defineConfig({
  test: {
    globals: true,
    root: ".",
    include: ["tests/**/*.spec.ts"],
    // e2e specs each boot the app on the single configured port, so suites must run serially.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["html", "text", "lcov"],
      exclude: ["src/utils/**", "swagger/**", "**/*.spec.ts"],
    },
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        keepClassNames: true,
        baseUrl: "./",
        paths: { "@src/*": ["src/*"] },
      },
    }),
  ],
  resolve: {
    alias: [
      { find: "@src", replacement: resolve(import.meta.dirname, "src") },
      { find: /^swagger\/(.*)$/, replacement: `${resolve(import.meta.dirname, "swagger")}/$1` },
    ],
  },
})
