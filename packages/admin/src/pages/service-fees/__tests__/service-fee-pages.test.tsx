import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { renderWithProviders } from "../../../test/test-utils"

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock modules that have complex dependencies
vi.mock("@medusajs/icons", () => ({
  PencilSquare: () => React.createElement("span", { "data-testid": "pencil-icon" }),
  Plus: () => React.createElement("span", { "data-testid": "plus-icon" }),
}))

vi.mock("../../../../components/layout/pages", () => ({
  SingleColumnPage: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "single-column-page" }, children),
}))

vi.mock("../../../../components/table/data-table", () => ({
  _DataTable: ({ instance }: any) =>
    React.createElement("div", { "data-testid": "data-table" }, "DataTable"),
}))

vi.mock("../../../../hooks/use-data-table", () => ({
  useDataTable: () => ({ getRowModel: () => ({ rows: [] }) }),
}))

vi.mock("../../../../hooks/use-query-params", () => ({
  useQueryParams: () => ({}),
}))

const mockServiceFee = {
  id: "srvfee_test123",
  name: "Global Service Fee",
  display_name: "Platform Service Fee",
  code: "global_fee",
  type: "percentage",
  charging_level: "global",
  status: "active",
  value: 2.5,
  currency_code: null,
  min_amount: null,
  max_amount: null,
  include_tax: false,
  is_enabled: true,
  priority: 0,
  effective_date: "2026-01-01T00:00:00Z",
  start_date: null,
  end_date: null,
  replaces_fee_id: null,
  rules: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockChangeLogs = [
  {
    id: "sflog_1",
    service_fee_id: "srvfee_test123",
    action: "created",
    changed_by: "admin@test.com",
    previous_snapshot: null,
    new_snapshot: mockServiceFee,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "sflog_2",
    service_fee_id: "srvfee_test123",
    action: "deactivated",
    changed_by: "admin@test.com",
    previous_snapshot: mockServiceFee,
    new_snapshot: { ...mockServiceFee, status: "inactive" },
    created_at: "2026-03-15T14:30:00Z",
  },
]

beforeEach(() => {
  mockFetch.mockReset()
})

function setupFetchMocks(overrides: Record<string, any> = {}) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/change-logs")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            overrides.changeLogs ?? {
              change_logs: mockChangeLogs,
              count: 2,
              offset: 0,
              limit: 50,
            }
          ),
      })
    }
    if (url.includes("/deactivate")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            service_fee: { ...mockServiceFee, status: "inactive" },
          }),
      })
    }
    if (url.match(/\/admin\/service-fees\/srvfee_/)) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            overrides.detail ?? { service_fee: mockServiceFee }
          ),
      })
    }
    if (url.includes("/admin/service-fees")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            overrides.list ?? {
              service_fees: [mockServiceFee],
              count: 1,
              offset: 0,
              limit: 50,
            }
          ),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  })
}

describe("Service Fee List Page", () => {
  it("renders page title and create button", async () => {
    setupFetchMocks()
    const { ServiceFeeListPage } = await import(
      "../service-fee-list/service-fee-list"
    )

    renderWithProviders(React.createElement(ServiceFeeListPage))

    expect(screen.getByText("Service Fees")).toBeInTheDocument()
    expect(screen.getByText("Create New Fee")).toBeInTheDocument()
    expect(
      screen.getByText(/Service fees are stackable/)
    ).toBeInTheDocument()
  })
})

describe("Global Fee Summary Card", () => {
  it("renders loading skeleton initially", async () => {
    mockFetch.mockImplementation(
      () => new Promise(() => {}) // never resolves = loading state
    )

    const { GlobalFeeSummaryCard } = await import(
      "../service-fee-list/components/global-fee-summary-card"
    )

    renderWithProviders(React.createElement(GlobalFeeSummaryCard))

    // Should show skeleton (animate-pulse class)
    const container = document.querySelector(".animate-pulse")
    expect(container).toBeInTheDocument()
  })

  it("renders global fee data when loaded", async () => {
    setupFetchMocks()

    const { GlobalFeeSummaryCard } = await import(
      "../service-fee-list/components/global-fee-summary-card"
    )

    renderWithProviders(React.createElement(GlobalFeeSummaryCard))

    await waitFor(() => {
      expect(screen.getByText("Global Service Fee")).toBeInTheDocument()
    })

    expect(screen.getByText("2.5%")).toBeInTheDocument()
    expect(screen.getByText("Platform Service Fee")).toBeInTheDocument()
  })

  it("renders empty state when no global fee", async () => {
    setupFetchMocks({
      list: { service_fees: [], count: 0, offset: 0, limit: 50 },
    })

    const { GlobalFeeSummaryCard } = await import(
      "../service-fee-list/components/global-fee-summary-card"
    )

    renderWithProviders(React.createElement(GlobalFeeSummaryCard))

    await waitFor(() => {
      expect(
        screen.getByText("No active global fee configured")
      ).toBeInTheDocument()
    })
  })
})

describe("Service Fee Detail Page", () => {
  it("renders fee details and change logs", async () => {
    setupFetchMocks()

    const { ServiceFeeDetailPage } = await import(
      "../service-fee-detail/service-fee-detail"
    )

    renderWithProviders(React.createElement(ServiceFeeDetailPage))

    await waitFor(() => {
      expect(screen.getByText("Global Service Fee")).toBeInTheDocument()
    })

    // Basic info
    expect(screen.getByText("Platform Service Fee")).toBeInTheDocument()
    expect(screen.getByText("2.5%")).toBeInTheDocument()

    // Change logs section
    expect(screen.getByText("Change Logs")).toBeInTheDocument()

    // Deactivate and Edit buttons
    expect(screen.getByText("Deactivate")).toBeInTheDocument()
  })

  it("renders loading skeleton while fetching", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    const { ServiceFeeDetailPage } = await import(
      "../service-fee-detail/service-fee-detail"
    )

    renderWithProviders(React.createElement(ServiceFeeDetailPage))

    const skeleton = document.querySelector(".animate-pulse")
    expect(skeleton).toBeInTheDocument()
  })
})

describe("Service Fee Create Page", () => {
  it("renders form with all required fields", async () => {
    setupFetchMocks()

    const { ServiceFeeCreatePage } = await import(
      "../service-fee-create/service-fee-create"
    )

    renderWithProviders(React.createElement(ServiceFeeCreatePage))

    expect(screen.getByText("Create New Service Fee")).toBeInTheDocument()
    expect(screen.getByText("Basic Information")).toBeInTheDocument()
    expect(screen.getByText("Period")).toBeInTheDocument()
    expect(screen.getByText("Create Service Fee")).toBeInTheDocument()
    expect(screen.getByText("Cancel")).toBeInTheDocument()

    // Charging level options
    expect(screen.getByText("Item Level")).toBeInTheDocument()
    expect(screen.getByText("Shop Level")).toBeInTheDocument()
  })

  it("shows item eligibility section when Item Level selected", async () => {
    setupFetchMocks()

    const { ServiceFeeCreatePage } = await import(
      "../service-fee-create/service-fee-create"
    )

    renderWithProviders(React.createElement(ServiceFeeCreatePage))

    // Item Level is default - eligibility should be visible
    expect(screen.getByText("Item Eligibility")).toBeInTheDocument()
    expect(screen.getByText("Categories")).toBeInTheDocument()
    expect(screen.getByText("Product Group")).toBeInTheDocument()
    expect(screen.getByText("Include")).toBeInTheDocument()
    expect(screen.getByText("Exclude")).toBeInTheDocument()
  })

  it("shows stackable note in sidebar", async () => {
    setupFetchMocks()

    const { ServiceFeeCreatePage } = await import(
      "../service-fee-create/service-fee-create"
    )

    renderWithProviders(React.createElement(ServiceFeeCreatePage))

    expect(
      screen.getByText(/Service fees are stackable/)
    ).toBeInTheDocument()
  })
})

describe("Service Fee Edit Page", () => {
  it("renders edit form with pre-filled data", async () => {
    setupFetchMocks()

    const { ServiceFeeEditPage } = await import(
      "../service-fee-edit/service-fee-edit"
    )

    renderWithProviders(React.createElement(ServiceFeeEditPage))

    await waitFor(() => {
      expect(screen.getByText("Edit Service Fee")).toBeInTheDocument()
    })

    expect(screen.getByText("Save Changes")).toBeInTheDocument()
    expect(screen.getByText("Cancel")).toBeInTheDocument()
    expect(
      screen.getByText("Charging level cannot be changed after creation")
    ).toBeInTheDocument()
  })

  it("shows charging level as disabled", async () => {
    setupFetchMocks()

    const { ServiceFeeEditPage } = await import(
      "../service-fee-edit/service-fee-edit"
    )

    renderWithProviders(React.createElement(ServiceFeeEditPage))

    await waitFor(() => {
      expect(screen.getByText("Edit Service Fee")).toBeInTheDocument()
    })

    // The charging level input should be disabled
    const disabledInput = screen.getByDisplayValue("Global Level")
    expect(disabledInput).toBeDisabled()
  })
})

describe("Edit Global Fee Drawer", () => {
  it("renders versioning warning", async () => {
    setupFetchMocks()

    const { EditGlobalFeeDrawer } = await import(
      "../service-fee-list/components/edit-global-fee-drawer"
    )

    renderWithProviders(
      React.createElement(EditGlobalFeeDrawer, {
        fee: mockServiceFee,
        open: true,
        onClose: vi.fn(),
      })
    )

    expect(screen.getByText("Edit Global Service Fee")).toBeInTheDocument()
    expect(screen.getByText(/Editing the global fee will create/)).toBeInTheDocument()
    expect(screen.getByText("Deactivate Fee")).toBeInTheDocument()
    expect(screen.getByText("Save Changes")).toBeInTheDocument()
    expect(screen.getByText("Cancel")).toBeInTheDocument()
  })

  it("shows Prompt dialog when deactivate clicked", async () => {
    setupFetchMocks()
    const user = userEvent.setup()

    const { EditGlobalFeeDrawer } = await import(
      "../service-fee-list/components/edit-global-fee-drawer"
    )

    renderWithProviders(
      React.createElement(EditGlobalFeeDrawer, {
        fee: mockServiceFee,
        open: true,
        onClose: vi.fn(),
      })
    )

    const deactivateBtn = screen.getByText("Deactivate Fee")
    await user.click(deactivateBtn)

    await waitFor(() => {
      expect(screen.getByText("Deactivate Global Fee")).toBeInTheDocument()
    })
  })
})
