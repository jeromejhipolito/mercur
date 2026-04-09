import i18next from "i18next"
import * as zod from "zod"

export const EditServiceFeeSchema = zod
  .object({
    name: zod
      .string()
      .min(1, i18next.t("serviceFees.validation.nameRequired"))
      .max(255),
    display_name: zod
      .string()
      .min(1, i18next.t("serviceFees.validation.displayNameRequired"))
      .max(255),
    value: zod.coerce
      .number()
      .min(0.01, i18next.t("serviceFees.validation.rateMin"))
      .max(100, i18next.t("serviceFees.validation.rateMax")),
    custom_period: zod.boolean(),
    start_date: zod.string().optional(),
    end_date: zod.string().optional(),
  })
  .refine(
    (data) => {
      if (data.custom_period) {
        return !!data.start_date
      }
      return true
    },
    {
      message: i18next.t("serviceFees.validation.startDateRequired"),
      path: ["start_date"],
    }
  )

export type EditServiceFeeFormData = zod.infer<typeof EditServiceFeeSchema>
