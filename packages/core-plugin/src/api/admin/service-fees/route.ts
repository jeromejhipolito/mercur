import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminCreateServiceFeeType } from "./validators"
import {
  createServiceFeesWorkflow,
  batchServiceFeeRulesWorkflow,
} from "../../../workflows/service-fee"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminServiceFeeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const filters: Record<string, any> = { ...req.filterableFields }

  // Handle text search via `q` parameter
  const searchQuery = (req.query?.q || req.filterableFields?.q) as string | undefined
  if (searchQuery) {
    // Escape SQL LIKE wildcards to prevent pattern manipulation
    const escapedQuery = searchQuery.replace(/%/g, '\\%').replace(/_/g, '\\_')
    filters.$or = [
      { name: { $ilike: `%${escapedQuery}%` } },
      { display_name: { $ilike: `%${escapedQuery}%` } },
      { code: { $ilike: `%${escapedQuery}%` } },
    ]
    delete filters.q
  }

  // Handle sorting via `order` query parameter
  const pagination: Record<string, any> = { ...req.queryConfig.pagination }
  const orderParam = req.query?.order as string | undefined
  if (orderParam) {
    // orderParam can be "name" (ascending) or "-name" (descending)
    const desc = orderParam.startsWith("-")
    const field = desc ? orderParam.slice(1) : orderParam
    pagination.order = { [field]: desc ? "DESC" : "ASC" }
  }

  const { data: service_fees, metadata } = await query.graph({
    entity: "service_fee",
    fields: req.queryConfig.fields,
    filters,
    pagination,
  })

  res.json({
    service_fees,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateServiceFeeType>,
  res: MedusaResponse<HttpTypes.AdminServiceFeeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { rules, ...feeData } = req.validatedBody

  const { result } = await createServiceFeesWorkflow(req.scope).run({
    input: {
      data: [feeData],
      changed_by: req.auth_context?.actor_id,
    },
  })

  const feeId = result[0].id

  // Create rules separately if provided
  if (rules && rules.length > 0) {
    try {
      await batchServiceFeeRulesWorkflow(req.scope).run({
        input: {
          service_fee_id: feeId,
          create: rules,
          update: [],
          delete: [],
          changed_by: req.auth_context?.actor_id,
        },
      })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.error("Failed to create rules inline:", message)
    }
  }

  const {
    data: [service_fee],
  } = await query.graph({
    entity: "service_fee",
    fields: req.queryConfig.fields,
    filters: { id: feeId },
  })

  res.status(201).json({ service_fee })
}
