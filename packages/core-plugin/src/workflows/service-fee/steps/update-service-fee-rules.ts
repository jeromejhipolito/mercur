import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateServiceFeeRuleDTO, MercurModules } from "@mercurjs/types"
import ServiceFeeModuleService from "../../../modules/service-fee/service"

export const updateServiceFeeRulesStepId = "update-service-fee-rules-step"

export const updateServiceFeeRulesStep = createStep(
  updateServiceFeeRulesStepId,
  async (input: UpdateServiceFeeRuleDTO[], { container }) => {
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )

    // Fetch pre-update snapshots for compensation
    const ruleIds = input.map((r) => r.id).filter(Boolean) as string[]
    const snapshots = ruleIds.length
      ? await service.listServiceFeeRules({ id: ruleIds })
      : []

    const rules = await service.updateServiceFeeRules(input)
    return new StepResponse(
      rules,
      snapshots.map((s: any) => ({
        id: s.id,
        reference: s.reference,
        reference_id: s.reference_id,
        mode: s.mode,
      }))
    )
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return
    const service = container.resolve<ServiceFeeModuleService>(
      MercurModules.SERVICE_FEE
    )
    await service.updateServiceFeeRules(prevData)
  }
)
