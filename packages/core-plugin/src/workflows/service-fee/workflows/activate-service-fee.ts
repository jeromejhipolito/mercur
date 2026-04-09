import {
  WorkflowResponse,
  createWorkflow,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { activateServiceFeeStep } from "../steps/activate-service-fee"

export type ActivateServiceFeeWorkflowInput = {
  id: string
  changed_by?: string
}

export const activateServiceFeeWorkflowId = "activate-service-fee"

export const activateServiceFeeWorkflow = createWorkflow(
  activateServiceFeeWorkflowId,
  (input: WorkflowData<ActivateServiceFeeWorkflowInput>) => {
    const result = activateServiceFeeStep(input)
    return new WorkflowResponse(result)
  }
)
