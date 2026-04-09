import i18next from "i18next"
import * as zod from "zod"

export const EditGlobalFeeSchema = zod.object({
  name: zod
    .string()
    .min(1, i18next.t("serviceFees.validation.nameRequired")),
  display_name: zod
    .string()
    .min(1, i18next.t("serviceFees.validation.displayNameRequired")),
  value: zod.coerce
    .number()
    .min(0.01, i18next.t("serviceFees.validation.rateMin"))
    .max(100, i18next.t("serviceFees.validation.rateMax")),
  effective_date: zod
    .string()
    .min(1, i18next.t("serviceFees.validation.effectiveDateRequired")),
})

export type EditGlobalFeeFormData = zod.infer<typeof EditGlobalFeeSchema>
