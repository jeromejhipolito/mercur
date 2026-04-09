import { Link, useParams } from "react-router-dom"
import {
  Badge,
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { PencilSquare, XCircle, CheckCircleSolid } from "@medusajs/icons"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../components/common/action-menu"
import { SectionRow } from "../../../components/common/section/section-row"
import { TwoColumnPage } from "../../../components/layout/pages"
import {
  useServiceFee,
  useServiceFeeChangeLogs,
  useDeactivateServiceFee,
  useActivateServiceFee,
} from "../../../hooks/api/service-fees"
import { RuleDisplayName } from "../components/rule-display-name"
import { RULE_REFERENCE_TYPES } from "../constants"
import type { ServiceFee, ServiceFeeRule, ChangeLog } from "../types"

const formatDate = (date: string | null | undefined, fallback: string) => {
  if (!date) return fallback
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

const statusColorMap: Record<string, "green" | "blue" | "grey"> = {
  active: "green",
  pending: "blue",
  inactive: "grey",
}

const getReferenceLabel = (reference: string): string => {
  const found = RULE_REFERENCE_TYPES.find((r) => r.value === reference)
  return found ? found.label : reference
}

const DetailSkeleton = () => (
  <div className="flex h-[400px] w-full items-center justify-center">
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-ui-bg-switch-off rounded w-1/3" />
      <div className="h-40 bg-ui-bg-switch-off rounded" />
    </div>
  </div>
)

export const ServiceFeeDetailPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const { service_fee, isLoading, isError, error } = useServiceFee(id!)
  const { change_logs } = useServiceFeeChangeLogs(id!)

  if (isError) {
    throw error
  }

  const ready = !isLoading && !!service_fee

  return (
    <div data-testid="service-fee-detail-page">
    <TwoColumnPage data={service_fee ?? {}} hasOutlet showJSON>
      <TwoColumnPage.Main>
        {!ready ? (
          <DetailSkeleton />
        ) : (
          <>
            {/* Basic Information */}
            <Container className="divide-y p-0">
              <div className="flex items-center justify-between px-6 py-4">
                <Heading>{t("serviceFees.detail.basicInfo")}</Heading>
                <div className="flex items-center gap-4">
                  <StatusBadge
                    color={statusColorMap[service_fee.status] ?? "grey"}
                  >
                    {service_fee.status?.charAt(0).toUpperCase() +
                      service_fee.status?.slice(1)}
                  </StatusBadge>
                  <ServiceFeeActions serviceFee={service_fee} />
                </div>
              </div>
              <SectionRow title={t("serviceFees.fields.feeName")} value={service_fee.name} />
              <SectionRow
                title={t("serviceFees.fields.displayName")}
                value={service_fee.display_name}
              />
              <SectionRow
                title={t("serviceFees.fields.chargingLevel")}
                value={
                  <Badge size="2xsmall" className="capitalize">
                    {service_fee.charging_level}
                  </Badge>
                }
              />
              <SectionRow
                title={t("serviceFees.globalFee.rate")}
                value={`${service_fee.value}%`}
              />
              <SectionRow
                title={t("serviceFees.fields.createdDate")}
                value={formatDate(service_fee.created_at, t("serviceFees.detail.notSet"))}
              />
            </Container>

            {/* Period */}
            <Container className="divide-y p-0">
              <div className="flex items-center justify-between px-6 py-4">
                <Heading>{t("serviceFees.fields.period")}</Heading>
              </div>
              <SectionRow
                title={t("serviceFees.fields.startDate")}
                value={formatDate(service_fee.start_date, t("serviceFees.detail.notSet"))}
              />
              <SectionRow
                title={t("serviceFees.fields.endDate")}
                value={formatDate(service_fee.end_date, t("serviceFees.detail.notSet"))}
              />
              {!service_fee.start_date && !service_fee.end_date && (
                <div className="px-6 py-4">
                  <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base p-3">
                    <Text className="text-ui-fg-subtle text-sm">
                      {t("serviceFees.fields.noPeriod")}
                    </Text>
                  </div>
                </div>
              )}
            </Container>

            {/* Targeting Rules */}
            <Container className="divide-y p-0">
              <div className="flex items-center justify-between px-6 py-4">
                <Heading>{t("serviceFees.rules.title")}</Heading>
                <Link to={`/settings/service-fees/${service_fee.id}/rules`}>
                  <Button variant="secondary" size="small">
                    {t("serviceFees.rules.manageRules")}
                  </Button>
                </Link>
              </div>
              {service_fee.rules?.length > 0 ? (
                <div className="px-6 py-4">
                  <div className="flex flex-col gap-y-2">
                    {service_fee.rules.map((rule: ServiceFeeRule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-x-3 rounded-lg border border-ui-border-base p-3"
                      >
                        <Badge
                          color={rule.mode === "exclude" ? "red" : "green"}
                          size="xsmall"
                        >
                          {rule.mode === "exclude"
                            ? t("serviceFees.rules.exclude")
                            : t("serviceFees.rules.include")}
                        </Badge>
                        <Text size="small" className="text-ui-fg-subtle">
                          {t(getReferenceLabel(rule.reference))}
                        </Text>
                        <Text size="small" weight="plus">
                          <RuleDisplayName
                            reference={rule.reference}
                            reference_id={rule.reference_id}
                          />
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4">
                  <Text className="text-ui-fg-subtle text-sm">
                    {t("serviceFees.rules.emptyState")}
                  </Text>
                </div>
              )}
            </Container>
          </>
        )}
      </TwoColumnPage.Main>

      <TwoColumnPage.Sidebar>
        {!ready ? (
          <DetailSkeleton />
        ) : (
          <Container className="p-0">
            <div className="px-6 py-4">
              <Heading>{t("serviceFees.changeLogs.title")}</Heading>
            </div>
            <div className="px-6 pb-4">
              {change_logs && change_logs.length > 0 ? (
                <div className="space-y-0">
                  {change_logs.map((log: ChangeLog, i: number) => (
                    <div key={log.id} className="relative pl-6 pb-6">
                      {i < change_logs.length - 1 && (
                        <div className="absolute left-[9px] top-4 bottom-0 w-px bg-ui-border-base" />
                      )}
                      <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-ui-bg-interactive border-2 border-ui-border-interactive" />
                      <div>
                        <Text className="font-medium text-sm capitalize">
                          {log.action?.replace(/_/g, " ")}
                        </Text>
                        <Text className="text-ui-fg-subtle text-xs">
                          {log.new_snapshot?.description ??
                            `${log.action} service fee`}
                        </Text>
                        <Text className="text-ui-fg-muted text-xs mt-1">
                          {new Date(log.created_at).toLocaleString()}
                        </Text>
                        {log.changed_by && (
                          <Text className="text-ui-fg-muted text-xs">
                            {t("serviceFees.changeLogs.changedBy", { name: log.changed_by })}
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text className="text-ui-fg-subtle text-sm">
                  {t("serviceFees.changeLogs.noChanges")}
                </Text>
              )}
            </div>
          </Container>
        )}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
    </div>
  )
}

// Action menu for the detail page
const ServiceFeeActions = ({ serviceFee }: { serviceFee: ServiceFee }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: deactivate } = useDeactivateServiceFee(serviceFee.id)
  const { mutateAsync: activate } = useActivateServiceFee(serviceFee.id)

  const handleActivate = async () => {
    const res = await prompt({
      title: t("serviceFees.activatePrompt.title"),
      description: t("serviceFees.activatePrompt.description"),
      confirmText: t("serviceFees.actions.activate"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    try {
      await activate()
      toast.success(t("serviceFees.toast.activated"))
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("serviceFees.toast.activateFailed")
      toast.error(message)
    }
  }

  const handleDeactivate = async () => {
    const res = await prompt({
      title: t("serviceFees.deactivatePrompt.title"),
      description: t("serviceFees.deactivatePrompt.description"),
      confirmText: t("serviceFees.actions.deactivate"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    try {
      await deactivate()
      toast.success(t("serviceFees.toast.deactivated"))
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("serviceFees.toast.deactivateFailed")
      toast.error(message)
    }
  }

  const groups: Parameters<typeof ActionMenu>[0]["groups"] = [
    {
      actions: [
        {
          icon: <PencilSquare />,
          label: t("serviceFees.actions.editFee"),
          to: `/settings/service-fees/${serviceFee.id}/edit`,
        },
      ],
    },
  ]

  if (serviceFee.status !== "inactive") {
    groups.push({
      actions: [
        {
          icon: <XCircle />,
          label: t("serviceFees.actions.deactivate"),
          onClick: handleDeactivate,
        },
      ],
    })
  }

  if (serviceFee.status === "inactive") {
    groups.push({
      actions: [
        {
          icon: <CheckCircleSolid />,
          label: t("serviceFees.actions.activate"),
          onClick: handleActivate,
        },
      ],
    })
  }

  return <ActionMenu groups={groups} />
}
