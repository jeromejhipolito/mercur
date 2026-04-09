import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { CreateServiceFeeDTO } from "@mercurjs/types"

import { createServiceFeesStep } from "../steps/create-service-fees"
import { logServiceFeeChangeStep } from "../steps/log-service-fee-change"

export type CreateServiceFeesWorkflowInput = {
  data: CreateServiceFeeDTO[]
  changed_by?: string | null
}

export const createServiceFeesWorkflowId = "create-service-fees"

export const createServiceFeesWorkflow = createWorkflow(
  createServiceFeesWorkflowId,
  function (input: CreateServiceFeesWorkflowInput) {
    const serviceFees = createServiceFeesStep(input.data)

    const logInput = transform(
      { serviceFees, input },
      (data) => {
        const fee = Array.isArray(data.serviceFees)
          ? data.serviceFees[0]
          : data.serviceFees

        let newSnapshot: Record<string, unknown> | null = null
        try {
          newSnapshot = fee ? JSON.parse(JSON.stringify(fee)) : null
        } catch {
          newSnapshot = fee ? { id: fee.id, name: fee.name } : null
        }

        return {
          service_fee_id: fee?.id ?? "",
          action: "created",
          changed_by: data.input.changed_by ?? null,
          previous_snapshot: null,
          new_snapshot: newSnapshot,
        }
      }
    )

    logServiceFeeChangeStep(logInput)

    return new WorkflowResponse(serviceFees)
  }
)
