import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import i18next from "i18next"

import {
  RouteDrawer,
  useRouteModal,
} from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import { useBatchServiceFeeRules } from "../../../../hooks/api/service-fees"
import { RulesBuilder } from "../../components/rules-builder"

const ManageRulesSchema = zod.object({
  rules: zod
    .array(
      zod.object({
        id: zod.string().optional(),
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

type ManageRulesFormData = zod.infer<typeof ManageRulesSchema>

interface ServiceFeeRule {
  id: string
  reference: string
  reference_id: string
  mode: string
}

interface ManageRulesFormProps {
  serviceFeeId: string
  existingRules: ServiceFeeRule[]
}

export const ManageRulesForm = ({
  serviceFeeId,
  existingRules,
}: ManageRulesFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<ManageRulesFormData>({
    defaultValues: {
      rules: existingRules.map((r) => ({
        id: r.id,
        reference: r.reference as any,
        reference_id: r.reference_id,
        mode: r.mode as "include" | "exclude",
      })),
    },
    resolver: zodResolver(ManageRulesSchema),
  })

  const { mutateAsync: batchRules, isPending } =
    useBatchServiceFeeRules(serviceFeeId)

  const handleSubmit = form.handleSubmit(async (values) => {
    const newRules = values.rules ?? []
    const existingIds = new Set(existingRules.map((r) => r.id))
    const newIds = new Set(
      newRules.filter((r) => r.id).map((r) => r.id as string)
    )

    // Rules to create: no id
    const toCreate = newRules
      .filter((r) => !r.id)
      .map((r) => ({
        reference: r.reference,
        reference_id: r.reference_id,
        mode: r.mode,
      }))

    // Rules to update: have id and something changed
    const toUpdate = newRules
      .filter((r) => r.id && existingIds.has(r.id))
      .filter((r) => {
        const existing = existingRules.find((e) => e.id === r.id)
        if (!existing) return false
        return (
          existing.reference !== r.reference ||
          existing.reference_id !== r.reference_id ||
          existing.mode !== r.mode
        )
      })
      .map((r) => ({
        id: r.id as string,
        reference: r.reference,
        reference_id: r.reference_id,
        mode: r.mode,
      }))

    // Rules to delete: existed before but not in new list
    const toDelete = existingRules
      .filter((r) => !newIds.has(r.id))
      .map((r) => r.id)

    const payload: Record<string, any> = {}
    if (toCreate.length) payload.create = toCreate
    if (toUpdate.length) payload.update = toUpdate
    if (toDelete.length) payload.delete = toDelete

    if (!toCreate.length && !toUpdate.length && !toDelete.length) {
      handleSuccess()
      return
    }

    try {
      await batchRules(payload)
      toast.success(t("serviceFees.toast.rulesUpdated"))
      handleSuccess()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update rules"
      toast.error(message)
    }
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-6 overflow-auto">
          <RulesBuilder control={form.control} form={form} />
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
