import { RouteFocusModal } from "../../../components/modals"
import { CreateServiceFeeForm } from "./components/create-service-fee-form"

export const ServiceFeeCreatePage = () => {
  return (
    <RouteFocusModal>
      <CreateServiceFeeForm />
    </RouteFocusModal>
  )
}
