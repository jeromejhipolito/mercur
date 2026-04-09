import {
  BatchWorkflowInput,
  BatchWorkflowOutput,
} from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateServiceFeeRuleDTO,
  UpdateServiceFeeRuleDTO,
  ServiceFeeRuleDTO,
} from "@mercurjs/types"

import { createServiceFeeRulesStep } from "../steps/create-service-fee-rules"
import { updateServiceFeeRulesStep } from "../steps/update-service-fee-rules"
import { deleteServiceFeeRulesStep } from "../steps/delete-service-fee-rules"
import { logServiceFeeChangeStep } from "../steps/log-service-fee-change"

export interface BatchServiceFeeRulesWorkflowInput
  extends BatchWorkflowInput<
    CreateServiceFeeRuleDTO,
    UpdateServiceFeeRuleDTO
  > {
  service_fee_id: string
  changed_by?: string | null
}

export interface BatchServiceFeeRulesWorkflowOutput
  extends BatchWorkflowOutput<ServiceFeeRuleDTO> {}

export const batchServiceFeeRulesWorkflowId = "batch-service-fee-rules"

export const batchServiceFeeRulesWorkflow = createWorkflow(
  batchServiceFeeRulesWorkflowId,
  (
    input: WorkflowData<BatchServiceFeeRulesWorkflowInput>
  ): WorkflowResponse<BatchServiceFeeRulesWorkflowOutput> => {
    const createInput = transform({ input }, (data) => ({
      service_fee_id: data.input.service_fee_id,
      rules: data.input.create ?? [],
    }))

    const updateInput = transform(
      { input },
      (data) => data.input.update ?? []
    )
    const deleteInput = transform(
      { input },
      (data) => data.input.delete ?? []
    )

    const [created, updated, deleted] = parallelize(
      createServiceFeeRulesStep(createInput),
      updateServiceFeeRulesStep(updateInput),
      deleteServiceFeeRulesStep(deleteInput)
    )

    const logInput = transform(
      { input, created, updated, deleted },
      (data) => ({
        service_fee_id: data.input.service_fee_id,
        action: "rules_updated",
        changed_by: data.input.changed_by ?? null,
        previous_snapshot: null,
        new_snapshot: {
          description: "Batch rules update",
          created_count: Array.isArray(data.created) ? (data.created as any[]).length : 0,
          updated_count: Array.isArray(data.updated) ? (data.updated as any[]).length : 0,
          deleted_count: Array.isArray(data.deleted) ? (data.deleted as any[]).length : 0,
        },
      })
    )

    logServiceFeeChangeStep(logInput)

    return new WorkflowResponse(
      transform({ created, updated, deleted }, (data) => data)
    )
  }
)
