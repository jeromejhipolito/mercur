import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { UpdateServiceFeeDTO } from "@mercurjs/types"

import { updateServiceFeesStep } from "../steps/update-service-fees"
import { logServiceFeeChangeStep } from "../steps/log-service-fee-change"

export type UpdateServiceFeesWorkflowInput = {
  data: UpdateServiceFeeDTO[]
  changed_by?: string | null
}

export const updateServiceFeesWorkflowId = "update-service-fees"

export const updateServiceFeesWorkflow = createWorkflow(
  updateServiceFeesWorkflowId,
  function (input: UpdateServiceFeesWorkflowInput) {
    const updateResult = updateServiceFeesStep(input.data)

    const logInput = transform(
      { updateResult, input },
      (data) => {
        const { serviceFees, previousStates } = data.updateResult
        const fee = Array.isArray(serviceFees)
          ? serviceFees[0]
          : serviceFees
        const prior = Array.isArray(previousStates)
          ? previousStates[0]
          : previousStates

        let newSnapshot: Record<string, unknown> | null = null
        try {
          newSnapshot = fee ? JSON.parse(JSON.stringify(fee)) : null
        } catch {
          newSnapshot = fee ? { id: fee.id, name: fee.name } : null
        }

        return {
          service_fee_id: fee?.id ?? data.input.data[0]?.id ?? "",
          action: "updated",
          changed_by: data.input.changed_by ?? null,
          previous_snapshot: prior ?? null,
          new_snapshot: newSnapshot,
        }
      }
    )

    logServiceFeeChangeStep(logInput)

    const serviceFees = transform(updateResult, (data) => data.serviceFees)

    return new WorkflowResponse(serviceFees)
  }
)
