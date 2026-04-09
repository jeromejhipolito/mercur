import { Heading } from "@medusajs/ui"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { RouteDrawer } from "../../../components/modals"
import { useServiceFee } from "../../../hooks/api/service-fees"
import { ManageRulesForm } from "../service-fee-detail/components/manage-rules-drawer"

export const ServiceFeeManageRulesPage = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const {
    service_fee,
    isPending: isLoading,
    isError,
    error,
  } = useServiceFee(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("serviceFees.rules.manageRules")}</Heading>
      </RouteDrawer.Header>
      {!isLoading && service_fee && (
        <ManageRulesForm
          serviceFeeId={service_fee.id}
          existingRules={service_fee.rules ?? []}
        />
      )}
    </RouteDrawer>
  )
}
