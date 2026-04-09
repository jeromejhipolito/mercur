import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const SERVICE_FEES_QUERY_KEY = "service_fees" as const
export const serviceFeesQueryKeys = queryKeysFactory(SERVICE_FEES_QUERY_KEY)

type ServiceFeePayload = Record<string, unknown>
type BatchRulesPayload = {
  create?: Array<{ reference: string; reference_id: string; mode?: string }>
  update?: Array<{ id: string; reference?: string; reference_id?: string; mode?: string }>
  delete?: string[]
}
type QueryParams = Record<string, string | number | object>

// NOTE: Query hooks use `any` for UseQueryOptions data generics because the
// MedusaJS pattern spreads `data` into the return value (`{ ...data, ...rest }`)
// and the exact API response shape is not statically known here.

// Queries
export const useServiceFees = (
  query?: QueryParams,
  options?: Omit<UseQueryOptions<any, Error, any, QueryKey>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/admin/service-fees", {
        method: "GET",
        query,
      }),
    queryKey: serviceFeesQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useServiceFee = (
  id: string,
  options?: Omit<UseQueryOptions<any, Error, any, QueryKey>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/admin/service-fees/${id}`, { method: "GET" }),
    queryKey: serviceFeesQueryKeys.detail(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useServiceFeeChangeLogs = (
  id: string,
  query?: QueryParams,
  options?: Omit<UseQueryOptions<any, Error, any, QueryKey>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/admin/service-fees/${id}/change-logs`, {
        method: "GET",
        query,
      }),
    queryKey: [...serviceFeesQueryKeys.detail(id), "change-logs"],
    ...options,
  })

  return { ...data, ...rest }
}

// Mutations
export const useCreateServiceFee = (
  options?: UseMutationOptions<Record<string, unknown>, Error, ServiceFeePayload>
) => {
  return useMutation({
    mutationFn: (payload: ServiceFeePayload) =>
      fetchQuery("/admin/service-fees", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateServiceFee = (
  id: string,
  options?: UseMutationOptions<Record<string, unknown>, Error, ServiceFeePayload>
) => {
  return useMutation({
    mutationFn: (payload: ServiceFeePayload) =>
      fetchQuery(`/admin/service-fees/${id}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeactivateServiceFee = (
  id: string,
  options?: UseMutationOptions<Record<string, unknown>, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/admin/service-fees/${id}/deactivate`, {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useActivateServiceFee = (
  id: string,
  options?: UseMutationOptions<Record<string, unknown>, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/admin/service-fees/${id}/activate`, {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteServiceFee = (
  id: string,
  options?: UseMutationOptions<Record<string, unknown>, Error, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/admin/service-fees/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useBatchServiceFeeRules = (
  id: string,
  options?: UseMutationOptions<Record<string, unknown>, Error, BatchRulesPayload>
) => {
  return useMutation({
    mutationFn: (payload: BatchRulesPayload) =>
      fetchQuery(`/admin/service-fees/${id}/rules`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: serviceFeesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
