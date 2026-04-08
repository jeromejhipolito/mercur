import { afterEach, vi } from "vitest"

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "srvfee_test123" }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

// Mock global __BACKEND_URL__
vi.stubGlobal("__BACKEND_URL__", "http://localhost:9001")
