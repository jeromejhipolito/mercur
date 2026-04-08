import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Must import after mocking
import {
  useServiceFees,
  useServiceFee,
  useServiceFeeChangeLogs,
  useCreateServiceFee,
  useUpdateServiceFee,
  useDeactivateServiceFee,
  useDeleteServiceFee,
  useBatchServiceFeeRules,
} from "../../../hooks/api/service-fees"

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockServiceFee = {
  id: "srvfee_test123",
  name: "Test Fee",
  display_name: "Test Display",
  code: "test_fee",
  type: "percentage",
  charging_level: "global",
  status: "active",
  value: 2.5,
  created_at: "2026-04-08T00:00:00Z",
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("Service Fee Hooks", () => {
  describe("useServiceFees", () => {
    it("fetches list of service fees", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          service_fees: [mockServiceFee],
          count: 1,
          offset: 0,
          limit: 50,
        }),
      })

      const { result } = renderHook(() => useServiceFees(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees"),
        expect.objectContaining({ credentials: "include" })
      )
      expect(result.current.service_fees).toHaveLength(1)
      expect(result.current.count).toBe(1)
    })

    it("passes query params for filtering", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ service_fees: [], count: 0, offset: 0, limit: 50 }),
      })

      renderHook(() => useServiceFees({ status: "active", charging_level: "global" }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain("status=active")
      expect(url).toContain("charging_level=global")
    })
  })

  describe("useServiceFee", () => {
    it("fetches single service fee by ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ service_fee: mockServiceFee }),
      })

      const { result } = renderHook(() => useServiceFee("srvfee_test123"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees/srvfee_test123"),
        expect.anything()
      )
      expect(result.current.service_fee).toEqual(mockServiceFee)
    })
  })

  describe("useServiceFeeChangeLogs", () => {
    it("fetches change logs for a fee", async () => {
      const mockLogs = [
        {
          id: "sflog_1",
          service_fee_id: "srvfee_test123",
          action: "created",
          changed_by: "admin",
          created_at: "2026-04-08T00:00:00Z",
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ change_logs: mockLogs, count: 1, offset: 0, limit: 50 }),
      })

      const { result } = renderHook(
        () => useServiceFeeChangeLogs("srvfee_test123"),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees/srvfee_test123/change-logs"),
        expect.anything()
      )
      expect(result.current.change_logs).toHaveLength(1)
    })
  })

  describe("useCreateServiceFee", () => {
    it("sends POST to create endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ service_fee: mockServiceFee }),
      })

      const { result } = renderHook(() => useCreateServiceFee(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        name: "New Fee",
        display_name: "New",
        code: "new_fee",
        type: "percentage",
        charging_level: "item",
        value: 5,
      })

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees"),
        expect.objectContaining({ method: "POST" })
      )

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.name).toBe("New Fee")
      expect(body.value).toBe(5)
      expect(body.charging_level).toBe("item")
    })
  })

  describe("useUpdateServiceFee", () => {
    it("sends POST to update endpoint with fee ID", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ service_fee: { ...mockServiceFee, name: "Updated" } }),
      })

      const { result } = renderHook(
        () => useUpdateServiceFee("srvfee_test123"),
        { wrapper: createWrapper() }
      )

      result.current.mutate({ name: "Updated", value: 3.0 })

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees/srvfee_test123"),
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  describe("useDeactivateServiceFee", () => {
    it("sends POST to deactivate endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          service_fee: { ...mockServiceFee, status: "inactive" },
        }),
      })

      const { result } = renderHook(
        () => useDeactivateServiceFee("srvfee_test123"),
        { wrapper: createWrapper() }
      )

      result.current.mutate()

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees/srvfee_test123/deactivate"),
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  describe("useDeleteServiceFee", () => {
    it("sends DELETE request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "srvfee_test123", deleted: true }),
      })

      const { result } = renderHook(
        () => useDeleteServiceFee("srvfee_test123"),
        { wrapper: createWrapper() }
      )

      result.current.mutate()

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees/srvfee_test123"),
        expect.objectContaining({ method: "DELETE" })
      )
    })
  })

  describe("useBatchServiceFeeRules", () => {
    it("sends POST to rules endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ created: [], updated: [], deleted: [] }),
      })

      const { result } = renderHook(
        () => useBatchServiceFeeRules("srvfee_test123"),
        { wrapper: createWrapper() }
      )

      result.current.mutate({
        create: [{ reference: "product_category", reference_id: "cat_1" }],
      })

      await waitFor(() => expect(mockFetch).toHaveBeenCalled())

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/service-fees/srvfee_test123/rules"),
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  describe("Error handling", () => {
    it("throws on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
      })

      const { result } = renderHook(() => useServiceFees(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toContain("422")
    })
  })
})
