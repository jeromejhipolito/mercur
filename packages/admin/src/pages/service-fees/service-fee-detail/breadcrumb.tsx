import { UIMatch } from "react-router-dom"
import { useServiceFee } from "../../../hooks/api/service-fees"

export const ServiceFeeDetailBreadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { service_fee } = useServiceFee(id!, {
    initialData: props.data as any,
    enabled: Boolean(id),
  })

  if (!service_fee) {
    return null
  }

  return <span>{service_fee.name}</span>
}
