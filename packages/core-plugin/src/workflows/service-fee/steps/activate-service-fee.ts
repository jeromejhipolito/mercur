import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, ServiceFeeStatus } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const activateServiceFeeStepId = "activate-service-fee-step"

export const activateServiceFeeStep = createStep(
  activateServiceFeeStepId,
  async (
    input: { id: string; changed_by?: string },
    { container }
  ) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    const activated = await service.activateServiceFee(
      input.id,
      input.changed_by
    )
    return new StepResponse(activated, input.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.updateServiceFees([
      { id, status: ServiceFeeStatus.INACTIVE, is_enabled: false },
    ] as any)
  }
)
