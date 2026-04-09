import { Link } from "react-router-dom"
import { Container, Heading, Text, Badge, IconButton } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { useServiceFees } from "../../../../hooks/api/service-fees"

export const GlobalFeeSummaryCard = () => {
  const { t } = useTranslation()
  const { service_fees, isLoading } = useServiceFees({
    charging_level: "global",
    status: "active",
    limit: 1,
  })

  const globalFee = service_fees?.[0]

  if (isLoading) {
    return (
      <Container className="mb-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-ui-bg-switch-off rounded w-1/4" />
          <div className="h-6 bg-ui-bg-switch-off rounded w-1/2" />
        </div>
      </Container>
    )
  }

  if (!globalFee) {
    return (
      <Container className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heading level="h2">{t("serviceFees.globalFee.title")}</Heading>
              <Badge color="grey" size="xsmall">
                {t("serviceFees.globalFee.badge")}
              </Badge>
            </div>
            <Text className="text-ui-fg-subtle">
              {t("serviceFees.globalFee.noActiveGlobalFee")}
            </Text>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Heading level="h2">{t("serviceFees.globalFee.title")}</Heading>
            <Badge color="green" size="xsmall">
              {t("serviceFees.globalFee.badge")}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <Text className="text-ui-fg-subtle text-xs">{t("serviceFees.globalFee.ruleId")}</Text>
              <Text className="font-medium">
                #{globalFee.id?.split("_").pop()}
              </Text>
            </div>
            <div>
              <Text className="text-ui-fg-subtle text-xs">
                {t("serviceFees.globalFee.rate")}
              </Text>
              <Text className="font-medium">{globalFee.value}%</Text>
            </div>
            <div>
              <Text className="text-ui-fg-subtle text-xs">
                {t("serviceFees.globalFee.displayName")}
              </Text>
              <Text className="font-medium">{globalFee.display_name}</Text>
            </div>
            <div>
              <Text className="text-ui-fg-subtle text-xs">
                {t("serviceFees.globalFee.effectiveDate")}
              </Text>
              <Text className="font-medium">
                {globalFee.effective_date
                  ? new Date(globalFee.effective_date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }
                    )
                  : "-"}
              </Text>
            </div>
          </div>
        </div>
        <Link to="global-fee-edit">
          <IconButton variant="transparent">
            <PencilSquare />
          </IconButton>
        </Link>
      </div>
    </Container>
  )
}
