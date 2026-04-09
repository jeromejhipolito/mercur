import { IconButton, Select } from "@medusajs/ui"
import { Trash } from "@medusajs/icons"
import { type Control, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../components/common/form"
import { useProductCategories } from "../../../hooks/api/categories"
import { useProductTypes } from "../../../hooks/api/product-types"
import { useCollections } from "../../../hooks/api/collections"
import { useSellers } from "../../../hooks/api/sellers"
import { useProducts } from "../../../hooks/api/products"
import { RULE_REFERENCE_TYPES, type RuleReferenceType } from "../constants"
import type {
  ProductCategory,
  ProductType,
  ProductCollection,
  Product,
  Seller,
} from "../types"

interface RuleFormValues {
  rules: Array<{
    reference: string
    reference_id: string
    mode: string
  }>
  [key: string]: unknown
}

interface RuleRowProps {
  index: number
  control: Control<RuleFormValues>
  onRemove: () => void
  form: UseFormReturn<RuleFormValues>
}

const ValuePicker = ({
  reference,
  value,
  onChange,
}: {
  reference: RuleReferenceType | ""
  value: string
  onChange: (val: string) => void
}) => {
  const { t } = useTranslation()
  const { product_categories } = useProductCategories(
    { limit: 100 },
    { enabled: reference === "product_category" }
  )
  const { product_types } = useProductTypes(
    { limit: 100 },
    { enabled: reference === "product_type" }
  )
  const { collections } = useCollections(
    { limit: 100 },
    { enabled: reference === "product_collection" }
  )
  const { sellers } = useSellers(
    { limit: 100 },
    { enabled: reference === "seller" }
  )
  const { products } = useProducts(
    { limit: 100 },
    { enabled: reference === "product" }
  )

  const getOptions = (): Array<{ id: string; label: string }> => {
    switch (reference) {
      case "product_category":
        return (product_categories ?? []).map((c: ProductCategory) => ({
          id: c.id,
          label: c.name,
        }))
      case "product_type":
        return (product_types ?? []).map((t: ProductType) => ({
          id: t.id,
          label: t.value,
        }))
      case "product_collection":
        return (collections ?? []).map((c: ProductCollection) => ({
          id: c.id,
          label: c.title,
        }))
      case "product":
        return (products ?? []).map((p: Product) => ({
          id: p.id,
          label: p.title,
        }))
      case "seller":
        return (sellers ?? []).map((s: Seller) => ({
          id: s.id,
          label: s.name ?? s.id,
        }))
      default:
        return []
    }
  }

  const options = getOptions()

  if (!reference) {
    return (
      <Select value="" disabled>
        <Select.Trigger className="flex-1">
          <Select.Value placeholder={t("serviceFees.rules.selectTypeFirst")} />
        </Select.Trigger>
        <Select.Content />
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <Select.Trigger className="flex-1">
        <Select.Value placeholder={t("serviceFees.rules.selectValue")} />
      </Select.Trigger>
      <Select.Content>
        {options.map((opt) => (
          <Select.Item key={opt.id} value={opt.id}>
            {opt.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}

export const RuleRow = ({ index, control, onRemove, form }: RuleRowProps) => {
  const { t } = useTranslation()

  const currentReference = form.watch(`rules.${index}.reference`)

  return (
    <div className="flex items-start gap-2">
      {/* Mode */}
      <Form.Field
        control={control}
        name={`rules.${index}.mode`}
        render={({ field }) => (
          <Form.Item>
            <Form.Control>
              <Select value={field.value} onValueChange={field.onChange}>
                <Select.Trigger className="w-[120px]">
                  <Select.Value placeholder={t("serviceFees.rules.mode")} />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="include">
                    {t("serviceFees.rules.include")}
                  </Select.Item>
                  <Select.Item value="exclude">
                    {t("serviceFees.rules.exclude")}
                  </Select.Item>
                </Select.Content>
              </Select>
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />

      {/* Reference Type */}
      <Form.Field
        control={control}
        name={`rules.${index}.reference`}
        render={({ field }) => (
          <Form.Item>
            <Form.Control>
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val)
                  // Reset the value picker when type changes
                  form.setValue(`rules.${index}.reference_id`, "")
                }}
              >
                <Select.Trigger className="w-[180px]">
                  <Select.Value placeholder={t("serviceFees.rules.selectType")} />
                </Select.Trigger>
                <Select.Content>
                  {RULE_REFERENCE_TYPES.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />

      {/* Value Picker */}
      <Form.Field
        control={control}
        name={`rules.${index}.reference_id`}
        render={({ field }) => (
          <Form.Item className="flex-1">
            <Form.Control>
              <ValuePicker
                reference={currentReference}
                value={field.value}
                onChange={field.onChange}
              />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />

      {/* Remove */}
      <IconButton
        type="button"
        variant="transparent"
        onClick={onRemove}
        className="mt-1"
      >
        <Trash className="text-ui-fg-subtle" />
      </IconButton>
    </div>
  )
}
