import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Heading,
  Input,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Form } from "../../../../components/common/form"
import { PercentageInput } from "../../../../components/inputs/percentage-input"
import {
  RouteDrawer,
  useRouteModal,
} from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import { useUpdateServiceFee } from "../../../../hooks/api/service-fees"
import {
  EditServiceFeeSchema,
  type EditServiceFeeFormData,
} from "../schema"
import type { ServiceFee } from "../../types"

type EditServiceFeeFormProps = {
  serviceFee: ServiceFee
}

export const EditServiceFeeForm = ({
  serviceFee,
}: EditServiceFeeFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<EditServiceFeeFormData>({
    defaultValues: {
      name: serviceFee.name ?? "",
      display_name: serviceFee.display_name ?? "",
      value: serviceFee.value ?? 0,
      custom_period: !!(serviceFee.start_date || serviceFee.end_date),
      start_date: serviceFee.start_date
        ? new Date(serviceFee.start_date).toISOString().split("T")[0]
        : "",
      end_date: serviceFee.end_date
        ? new Date(serviceFee.end_date).toISOString().split("T")[0]
        : "",
    },
    resolver: zodResolver(EditServiceFeeSchema),
  })

  const { mutateAsync: updateServiceFee, isPending } = useUpdateServiceFee(
    serviceFee.id
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: Record<string, string | number | null> = {
      name: values.name,
      display_name: values.display_name,
      value: Number(values.value),
    }

    if (values.custom_period && values.start_date) {
      payload.start_date = new Date(values.start_date).toISOString()
      if (values.end_date) {
        payload.end_date = new Date(values.end_date).toISOString()
      }
    } else if (
      !values.custom_period &&
      (serviceFee.start_date || serviceFee.end_date)
    ) {
      payload.start_date = null
      payload.end_date = null
    }

    try {
      await updateServiceFee(payload)
      toast.success(t("serviceFees.toast.updated"))
      handleSuccess()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update"
      toast.error(message)
    }
  })

  const customPeriod = form.watch("custom_period")

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-6 overflow-auto">
          <div className="grid grid-cols-1 gap-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("serviceFees.fields.feeName")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
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
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {/* Charging Level - read only */}
            <div>
              <Text size="small" weight="plus" className="mb-1">
                {t("serviceFees.fields.chargingLevel")}
              </Text>
              <Input
                value={
                  serviceFee?.charging_level
                    ? serviceFee.charging_level.charAt(0).toUpperCase() +
                      serviceFee.charging_level.slice(1) +
                      " Level"
                    : ""
                }
                disabled
              />
              <Text size="small" className="text-ui-fg-subtle mt-1">
                {t("serviceFees.fields.chargingLevelImmutable")}
              </Text>
            </div>

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
                    <Form.Label>{t("serviceFees.fields.setCustomPeriod")}</Form.Label>
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

          {/* Targeting Rules Summary */}
          <div className="flex flex-col gap-y-2">
            <Heading level="h2">{t("serviceFees.rules.title")}</Heading>
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3 flex items-center justify-between">
              <Text className="text-ui-fg-subtle text-sm">
                {serviceFee.rules?.length > 0
                  ? t("serviceFees.rules.rulesCount", {
                      count: serviceFee.rules.length,
                    })
                  : t("serviceFees.rules.noRules")}
              </Text>
              <Link
                to={`/settings/service-fees/${serviceFee.id}/rules`}
                className="text-ui-fg-interactive text-sm font-medium hover:underline"
              >
                {t("serviceFees.rules.manageRules")}
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
            <Text className="text-ui-fg-subtle text-xs">
              {t("serviceFees.notes.immediateEffect")}
            </Text>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <RouteDrawer.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteDrawer.Close>
          <Button size="small" type="submit" isLoading={isPending}>
            {t("serviceFees.actions.saveChanges")}
          </Button>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
