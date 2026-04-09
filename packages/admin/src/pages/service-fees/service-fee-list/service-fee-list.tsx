import { Link } from "react-router-dom"
import { Button, Heading, Text } from "@medusajs/ui"
import { Plus } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { SingleColumnPage } from "../../../components/layout/pages"
import { GlobalFeeSummaryCard } from "./components/global-fee-summary-card"
import { ServiceFeeListTable } from "./components/service-fee-list-table"

export const ServiceFeeListPage = () => {
  const { t } = useTranslation()

  return (
    <SingleColumnPage>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h1">{t("serviceFees.title")}</Heading>
          <Text className="text-ui-fg-subtle">
            {t("serviceFees.subtitle")}
          </Text>
        </div>
        <Link to="create">
          <Button>
            <Plus />
            {t("serviceFees.createNewFee")}
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3 mb-4">
        <Text className="text-ui-fg-subtle text-sm">
          {t("serviceFees.stackableNote")}
        </Text>
      </div>

      <GlobalFeeSummaryCard />
      <ServiceFeeListTable />
    </SingleColumnPage>
  )
}
