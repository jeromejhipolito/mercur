import { LoaderFunctionArgs } from "react-router-dom"
import { serviceFeesQueryKeys } from "../../../hooks/api/service-fees"
import { fetchQuery } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const serviceFeeQuery = (id: string) => ({
  queryKey: serviceFeesQueryKeys.detail(id),
  queryFn: async () => fetchQuery(`/admin/service-fees/${id}`, { method: "GET" }),
})

export const serviceFeeLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = serviceFeeQuery(id!)

  return (
    queryClient.getQueryData(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
