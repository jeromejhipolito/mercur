import { Button, Heading, Text, Tooltip } from "@medusajs/ui"
import { InformationCircleSolid, Plus } from "@medusajs/icons"
import { useFieldArray, type Control, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { RuleRow } from "./rule-row"

interface RuleFormValues {
  rules: Array<{
    reference: string
    reference_id: string
    mode: string
  }>
  [key: string]: unknown
}

interface RulesBuilderProps {
  control: Control<RuleFormValues>
  form: UseFormReturn<RuleFormValues>
}

export const RulesBuilder = ({ control, form }: RulesBuilderProps) => {
  const { t } = useTranslation()

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rules",
  })

  const handleAdd = () => {
    append({
      reference: "product_category",
      reference_id: "",
      mode: "include",
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <Heading level="h2">{t("serviceFees.rules.title")}</Heading>
        <Tooltip content={t("serviceFees.rules.precedenceTooltip")}>
          <InformationCircleSolid className="text-ui-fg-muted" />
        </Tooltip>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base p-4">
          <Text className="text-ui-fg-subtle text-sm">
            {t("serviceFees.rules.emptyState")}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-y-3">
          {fields.map((field, index) => (
            <RuleRow
              key={field.id}
              index={index}
              control={control}
              form={form}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="transparent"
        onClick={handleAdd}
        className="text-ui-fg-interactive self-start"
      >
        <Plus className="mr-1" />
        {t("serviceFees.rules.addRule")}
      </Button>
    </div>
  )
}
