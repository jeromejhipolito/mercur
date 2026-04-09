import i18next from "i18next"
import * as zod from "zod"

export const CreateServiceFeeSchema = zod
  .object({
    name: zod
      .string()
      .min(1, i18next.t("serviceFees.validation.nameRequired"))
      .max(255),
    display_name: zod
      .string()
      .min(1, i18next.t("serviceFees.validation.displayNameRequired"))
      .max(255),
    charging_level: zod.enum(["item", "shop"]),
    shop_scope: zod.enum(["all", "selected", "groups"]).optional(),
    selected_shops: zod.array(zod.string()).optional(),
    shop_groups: zod.array(zod.string()).optional(),
    value: zod.coerce
      .number()
      .min(0.01, i18next.t("serviceFees.validation.rateMin"))
      .max(100, i18next.t("serviceFees.validation.rateMax")),
    custom_period: zod.boolean(),
    start_date: zod.string().optional(),
    end_date: zod.string().optional(),
    rules: zod
      .array(
        zod.object({
          reference: zod.enum([
            "product",
            "product_type",
            "product_collection",
            "product_category",
            "seller",
          ]),
          reference_id: zod.string().min(1, i18next.t("serviceFees.rules.selectValue")),
          mode: zod.enum(["include", "exclude"]),
        })
      )
      .optional(),
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

export type CreateServiceFeeFormData = zod.infer<typeof CreateServiceFeeSchema>
