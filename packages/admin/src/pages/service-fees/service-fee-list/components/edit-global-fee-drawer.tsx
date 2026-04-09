import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Heading,
  Input,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"
import { PercentageInput } from "../../../../components/inputs/percentage-input"
import {
  RouteDrawer,
  useRouteModal,
} from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import {
  useServiceFees,
  useUpdateServiceFee,
  useDeactivateServiceFee,
} from "../../../../hooks/api/service-fees"
import {
  EditGlobalFeeSchema,
  type EditGlobalFeeFormData,
} from "./edit-global-fee-schema"
import type { ServiceFee } from "../../types"

const EditGlobalFeeForm = ({ fee }: { fee: ServiceFee }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const prompt = usePrompt()

  const form = useForm<EditGlobalFeeFormData>({
    defaultValues: {
      name: fee?.name ?? "",
      display_name: fee?.display_name ?? "",
      value: fee?.value ?? 0,
      effective_date: fee?.effective_date
        ? new Date(fee.effective_date).toISOString().split("T")[0]
        : "",
    },
    resolver: zodResolver(EditGlobalFeeSchema),
  })

  const { mutateAsync: updateServiceFee, isPending: isUpdating } =
    useUpdateServiceFee(fee?.id)
  const { mutateAsync: deactivateServiceFee, isPending: isDeactivating } =
    useDeactivateServiceFee(fee?.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await updateServiceFee({
        name: values.name,
        display_name: values.display_name,
        value: Number(values.value),
        effective_date: values.effective_date
          ? new Date(values.effective_date).toISOString()
          : undefined,
      })
      toast.success(t("serviceFees.toast.updated"))
      handleSuccess()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("serviceFees.toast.updateFailed")
      toast.error(message)
    }
  })

  const handleDeactivate = async () => {
    const res = await prompt({
      title: t("serviceFees.deactivatePrompt.title"),
      description: t("serviceFees.deactivatePrompt.description"),
      confirmText: t("serviceFees.actions.deactivate"),
      cancelText: t("actions.cancel"),
    })

    if (!res) return

    try {
      await deactivateServiceFee()
      toast.success(t("serviceFees.toast.deactivated"))
      handleSuccess()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("serviceFees.toast.deactivateFailed")
      toast.error(message)
    }
  }

  const isPending = isUpdating || isDeactivating

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
                  <Form.Hint>
                    {t("serviceFees.fields.displayNameHint")}
                  </Form.Hint>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
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
            <Form.Field
              control={form.control}
              name="effective_date"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("serviceFees.globalFee.effectiveDate")}</Form.Label>
                  <Form.Control>
                    <Input type="date" {...field} />
                  </Form.Control>
                  <Form.Hint>
                    {t("serviceFees.globalFee.effectiveDateHint")}
                  </Form.Hint>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>

          <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
            <Text className="font-medium text-sm">{t("serviceFees.globalFee.important")}</Text>
            <Text className="text-ui-fg-subtle text-xs mt-1">
              {t("serviceFees.globalFee.importantNotice")}
            </Text>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="small"
              type="button"
              onClick={handleDeactivate}
              disabled={isDeactivating}
              isLoading={isDeactivating}
            >
              {t("serviceFees.actions.deactivateFee")}
            </Button>
            <div className="flex gap-2">
              <RouteDrawer.Close asChild>
                <Button size="small" variant="secondary">
                  {t("actions.cancel")}
                </Button>
              </RouteDrawer.Close>
              <Button size="small" type="submit" isLoading={isPending}>
                {t("serviceFees.actions.saveChanges")}
              </Button>
            </div>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

export const EditGlobalFeeDrawer = () => {
  const { t } = useTranslation()
  const { service_fees, isLoading } = useServiceFees({
    charging_level: "global",
    status: "active",
    limit: 1,
  })

  const globalFee = service_fees?.[0]

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("serviceFees.globalFee.editTitle")}</Heading>
      </RouteDrawer.Header>
      {!isLoading && globalFee && <EditGlobalFeeForm fee={globalFee} />}
      {!isLoading && !globalFee && (
        <RouteDrawer.Body>
          <Text className="text-ui-fg-subtle">
            {t("serviceFees.globalFee.noActiveGlobalFeeFound")}
          </Text>
        </RouteDrawer.Body>
      )}
    </RouteDrawer>
  )
}

export const Component = EditGlobalFeeDrawer
