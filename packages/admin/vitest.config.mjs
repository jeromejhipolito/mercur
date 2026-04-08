import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localModules = path.resolve(__dirname, "node_modules")

export default {
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    css: false,
  },
  resolve: {
    alias: {
      "@testing-library/react": path.resolve(localModules, "@testing-library/react"),
      "@testing-library/user-event": path.resolve(localModules, "@testing-library/user-event"),
      "@testing-library/jest-dom": path.resolve(localModules, "@testing-library/jest-dom"),
    },
  },
}
