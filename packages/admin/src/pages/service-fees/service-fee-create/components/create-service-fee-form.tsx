import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Heading,
  Input,
  RadioGroup,
  Select,
  Switch,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { Plus, XMarkMini } from "@medusajs/icons"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"
import { PercentageInput } from "../../../../components/inputs/percentage-input"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import { useCreateServiceFee } from "../../../../hooks/api/service-fees"
import { useSellers } from "../../../../hooks/api/sellers"
import { RulesBuilder } from "../../components/rules-builder"
import {
  CreateServiceFeeSchema,
  type CreateServiceFeeFormData,
} from "../schema"
import type { Seller } from "../../types"

interface CreateServiceFeePayload {
  name: string
  display_name: string
  code: string
  type: string
  charging_level: string
  value: number
  status: string
  rules?: Array<{ reference: string; reference_id: string; mode: string }>
  start_date?: string
  effective_date?: string
  end_date?: string
}

export const CreateServiceFeeForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { sellers } = useSellers({ limit: 100 })

  const [selectedShops, setSelectedShops] = useState<string[]>([])
  const [shopGroups, setShopGroups] = useState<string[]>([])
  const [shopPickerValue, setShopPickerValue] = useState("")
  const [groupPickerValue, setGroupPickerValue] = useState("")

  const form = useForm<CreateServiceFeeFormData>({
    defaultValues: {
      name: "",
      display_name: "",
      charging_level: "item",
      shop_scope: "all" as const,
      selected_shops: [],
      shop_groups: [],
      value: 0,
      custom_period: false,
      start_date: "",
      end_date: "",
      rules: [],
    },
    resolver: zodResolver(CreateServiceFeeSchema),
  })

  const { mutateAsync: createServiceFee, isPending } = useCreateServiceFee()

  const sellerOptions = (sellers ?? []).map((s: Seller) => ({
    id: s.id,
    label: s.name ?? s.id,
  }))

  const handleAddShop = () => {
    if (shopPickerValue && !selectedShops.includes(shopPickerValue)) {
      const next = [...selectedShops, shopPickerValue]
      setSelectedShops(next)
      form.setValue("selected_shops", next)
      setShopPickerValue("")
    }
  }

  const handleRemoveShop = (id: string) => {
    const next = selectedShops.filter((s) => s !== id)
    setSelectedShops(next)
    form.setValue("selected_shops", next)
  }

  const handleAddGroup = () => {
    if (groupPickerValue && !shopGroups.includes(groupPickerValue)) {
      const next = [...shopGroups, groupPickerValue]
      setShopGroups(next)
      form.setValue("shop_groups", next)
      setGroupPickerValue("")
    }
  }

  const handleRemoveGroup = (id: string) => {
    const next = shopGroups.filter((g) => g !== id)
    setShopGroups(next)
    form.setValue("shop_groups", next)
  }

  const getSellerLabel = (id: string) => {
    const seller = sellerOptions.find((s) => s.id === id)
    return seller?.label ?? id
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateServiceFeePayload = {
      name: values.name,
      display_name: values.display_name,
      code: values.name.toLowerCase().replace(/\s+/g, "_"),
      type: "percentage",
      charging_level: values.charging_level,
      value: Number(values.value),
      status: "active",
    }

    // Build rules from item-level rules builder OR shop-level selections
    if (
      values.charging_level === "shop" &&
      values.shop_scope === "selected" &&
      selectedShops.length > 0
    ) {
      payload.rules = selectedShops.map((id) => ({
        reference: "seller",
        reference_id: id,
        mode: "include",
      }))
    } else if (
      values.charging_level === "shop" &&
      values.shop_scope === "groups" &&
      shopGroups.length > 0
    ) {
      payload.rules = shopGroups.map((id) => ({
        reference: "seller",
        reference_id: id,
        mode: "include",
      }))
    } else if (values.rules && values.rules.length > 0) {
      payload.rules = values.rules.map((rule) => ({
        reference: rule.reference,
        reference_id: rule.reference_id,
        mode: rule.mode,
      }))
    }

    if (values.custom_period && values.start_date) {
      payload.start_date = new Date(values.start_date).toISOString()
      payload.effective_date = new Date(values.start_date).toISOString()
      payload.status =
        new Date(values.start_date) > new Date() ? "pending" : "active"
      if (values.end_date) {
        payload.end_date = new Date(values.end_date).toISOString()
      }
    }

    await createServiceFee(payload, {
      onSuccess: ({ service_fee }: { service_fee?: { id: string } }) => {
        toast.success(t("serviceFees.toast.created"))
        handleSuccess(`../${service_fee?.id ?? ""}`)
      },
      onError: (e) => {
        toast.error(e?.message ?? "Failed to create service fee")
      },
    })
  })

  const customPeriod = form.watch("custom_period")
  const chargingLevel = form.watch("charging_level")
  const shopScope = form.watch("shop_scope")

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex overflow-hidden">
          <div
            className={clx(
              "flex h-full w-full flex-col items-center overflow-y-auto p-16"
            )}
          >
            <div className="flex w-full max-w-[720px] flex-col gap-y-8">
              <div>
                <Heading>{t("serviceFees.createTitle")}</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("serviceFees.createSubtitle")}
                </Text>
              </div>

              {/* Basic Information */}
              <div className="flex flex-col gap-y-4">
                <Heading level="h2">{t("serviceFees.detail.basicInfo")}</Heading>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>{t("serviceFees.fields.feeName")}</Form.Label>
                        <Form.Control>
                          <Input
                            autoFocus
                            placeholder="e.g., Payment Processing Fee"
                            {...field}
                          />
                        </Form.Control>
                        <Form.Hint>
                          {t("serviceFees.fields.feeNameHint")}
                        </Form.Hint>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>{t("serviceFees.fields.displayName")}</Form.Label>
                        <Form.Control>
                          <Input
                            placeholder="e.g., Payment Gateway Fee"
                            {...field}
                          />
                        </Form.Control>
                        <Form.Hint>
                          {t("serviceFees.fields.displayNameHint")}
                        </Form.Hint>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>

                <Form.Field
                  control={form.control}
                  name="charging_level"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("serviceFees.fields.chargingLevel")}</Form.Label>
                      <Form.Control>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "item", label: t("serviceFees.fields.itemLevel") },
                            { value: "shop", label: t("serviceFees.fields.shopLevel") },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={clx(
                                "border rounded-lg p-3 cursor-pointer transition-colors text-left",
                                field.value === opt.value
                                  ? "border-ui-border-interactive bg-ui-bg-interactive"
                                  : "border-ui-border-base hover:border-ui-border-strong"
                              )}
                              onClick={() => field.onChange(opt.value)}
                            >
                              <Text
                                className={
                                  field.value === opt.value
                                    ? "text-ui-fg-on-color font-medium"
                                    : ""
                                }
                              >
                                {opt.label}
                              </Text>
                            </button>
                          ))}
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                {chargingLevel === "shop" && (
                  <Form.Field
                    control={form.control}
                    name="shop_scope"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>{t("serviceFees.shopSelection.method")}</Form.Label>
                        <Form.Control>
                          <RadioGroup
                            value={field.value ?? "all"}
                            onValueChange={(val) => {
                              field.onChange(val)
                              // Reset selections when switching scope
                              if (val !== "selected") {
                                setSelectedShops([])
                                form.setValue("selected_shops", [])
                                setShopPickerValue("")
                              }
                              if (val !== "groups") {
                                setShopGroups([])
                                form.setValue("shop_groups", [])
                                setGroupPickerValue("")
                              }
                            }}
                          >
                            <div className="flex flex-col gap-y-2">
                              <label className="flex items-center gap-x-2 cursor-pointer">
                                <RadioGroup.Item value="all" />
                                <Text size="small">{t("serviceFees.shopSelection.allShops")}</Text>
                              </label>
                              <label className="flex items-center gap-x-2 cursor-pointer">
                                <RadioGroup.Item value="selected" />
                                <Text size="small">{t("serviceFees.shopSelection.uploadIds")}</Text>
                              </label>
                              <label className="flex items-center gap-x-2 cursor-pointer">
                                <RadioGroup.Item value="groups" />
                                <Text size="small">{t("serviceFees.shopSelection.shopGroups")}</Text>
                              </label>
                            </div>
                          </RadioGroup>
                        </Form.Control>
                        {field.value === "all" && (
                          <Form.Hint>
                            {t("serviceFees.shopSelection.allShopsHint")}
                          </Form.Hint>
                        )}
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                )}

                {/* Selected Shops UI */}
                {chargingLevel === "shop" && shopScope === "selected" && (
                  <div className="flex flex-col gap-y-3">
                    <Heading level="h2">{t("serviceFees.shopSelection.title")}</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                      {t("serviceFees.shopSelection.selectedShopsHint")}
                    </Text>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Select
                          value={shopPickerValue}
                          onValueChange={setShopPickerValue}
                        >
                          <Select.Trigger>
                            <Select.Value
                              placeholder={t("serviceFees.shopSelection.selectShop")}
                            />
                          </Select.Trigger>
                          <Select.Content>
                            {sellerOptions
                              .filter((s) => !selectedShops.includes(s.id))
                              .map((opt) => (
                                <Select.Item key={opt.id} value={opt.id}>
                                  {opt.label}
                                </Select.Item>
                              ))}
                          </Select.Content>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={handleAddShop}
                        disabled={!shopPickerValue}
                      >
                        <Plus className="mr-1" />
                        {t("serviceFees.shopSelection.addShop")}
                      </Button>
                    </div>

                    {selectedShops.length === 0 ? (
                      <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base p-4">
                        <Text className="text-ui-fg-subtle text-sm">
                          {t("serviceFees.shopSelection.noShopsSelected")}
                        </Text>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-y-2">
                        {selectedShops.map((id) => (
                          <div
                            key={id}
                            className="flex items-center justify-between rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2"
                          >
                            <Text size="small">{getSellerLabel(id)}</Text>
                            <button
                              type="button"
                              className="text-ui-fg-muted hover:text-ui-fg-subtle cursor-pointer"
                              onClick={() => handleRemoveShop(id)}
                            >
                              <XMarkMini />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Shop Groups UI */}
                {chargingLevel === "shop" && shopScope === "groups" && (
                  <div className="flex flex-col gap-y-3">
                    <Heading level="h2">{t("serviceFees.shopSelection.shopGroups")}</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                      {t("serviceFees.shopSelection.shopGroupsHint")}
                    </Text>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Select
                          value={groupPickerValue}
                          onValueChange={setGroupPickerValue}
                        >
                          <Select.Trigger>
                            <Select.Value
                              placeholder={t("serviceFees.shopSelection.selectShopGroup")}
                            />
                          </Select.Trigger>
                          <Select.Content>
                            {sellerOptions
                              .filter((s) => !shopGroups.includes(s.id))
                              .map((opt) => (
                                <Select.Item key={opt.id} value={opt.id}>
                                  {opt.label}
                                </Select.Item>
                              ))}
                          </Select.Content>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={handleAddGroup}
                        disabled={!groupPickerValue}
                      >
                        <Plus className="mr-1" />
                        {t("serviceFees.shopSelection.addShopGroup")}
                      </Button>
                    </div>

                    {shopGroups.length === 0 ? (
                      <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base p-4">
                        <Text className="text-ui-fg-subtle text-sm">
                          {t("serviceFees.shopSelection.noGroupsSelected")}
                        </Text>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-y-2">
                        {shopGroups.map((id) => (
                          <div
                            key={id}
                            className="flex items-center justify-between rounded-lg border border-ui-border-base bg-ui-bg-base px-3 py-2"
                          >
                            <Text size="small">{getSellerLabel(id)}</Text>
                            <button
                              type="button"
                              className="text-ui-fg-muted hover:text-ui-fg-subtle cursor-pointer"
                              onClick={() => handleRemoveGroup(id)}
                            >
                              <XMarkMini />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Form.Field
                  control={form.control}
                  name="value"
                  render={({ field: { value, onChange, ...field } }) => (
                    <Form.Item>
                      <Form.Label>{t("serviceFees.fields.rate")}</Form.Label>
                      <Form.Control>
                        <PercentageInput
                          {...field}
                          value={value}
                          decimalsLimit={2}
                          onValueChange={(_value, _name, values) =>
                            onChange(values?.float ?? 0)
                          }
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>

              {/* Period */}
              <div className="flex flex-col gap-y-4">
                <Heading level="h2">{t("serviceFees.fields.period")}</Heading>
                <Form.Field
                  control={form.control}
                  name="custom_period"
                  render={({ field: { value, onChange, ...field } }) => (
                    <Form.Item>
                      <div className="flex items-start justify-between">
                        <div>
                          <Form.Label>{t("serviceFees.fields.setCustomPeriod")}</Form.Label>
                          <Form.Hint>
                            {t("serviceFees.fields.setCustomPeriodHint")}
                          </Form.Hint>
                        </div>
                        <Form.Control>
                          <Switch
                            {...field}
                            checked={!!value}
                            onCheckedChange={onChange}
                          />
                        </Form.Control>
                      </div>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                {customPeriod ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Form.Field
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>{t("serviceFees.fields.startDate")}</Form.Label>
                          <Form.Control>
                            <Input type="date" {...field} />
                          </Form.Control>
                          <Form.Hint>{t("serviceFees.fields.startDateHint")}</Form.Hint>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                    <Form.Field
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>{t("serviceFees.fields.endDate")}</Form.Label>
                          <Form.Control>
                            <Input type="date" {...field} />
                          </Form.Control>
                          <Form.Hint>
                            {t("serviceFees.fields.endDateHint")}
                          </Form.Hint>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base p-3">
                    <Text className="text-ui-fg-subtle text-sm">
                      {t("serviceFees.fields.noPeriod")}
                    </Text>
                  </div>
                )}
              </div>

              {/* Targeting Rules — only for Item Level */}
              {chargingLevel === "item" && (
                <RulesBuilder control={form.control} form={form} />
              )}
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button size="small" type="submit" isLoading={isPending}>
            {t("serviceFees.actions.createFee")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
