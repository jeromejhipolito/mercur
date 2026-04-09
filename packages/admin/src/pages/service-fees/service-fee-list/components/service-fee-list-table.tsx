import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Container, Badge, clx } from "@medusajs/ui"
import { createDataTableColumnHelper } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { _DataTable } from "../../../../components/table/data-table"
import { useDataTable } from "../../../../hooks/use-data-table"
import { useServiceFees } from "../../../../hooks/api/service-fees"
import { useQueryParams } from "../../../../hooks/use-query-params"
import type { ServiceFee } from "../../types"

const columnHelper = createDataTableColumnHelper<ServiceFee>()

const statusColorMap: Record<string, string> = {
  active: "green",
  pending: "blue",
  inactive: "grey",
}

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("serviceFees.detail.feeId"),
        cell: ({ getValue }) => {
          const id = getValue()
          return <span className="txt-compact-small">#{id?.split("_").pop()}</span>
        },
      }),
      columnHelper.accessor("name", {
        header: t("serviceFees.fields.feeName"),
        enableSorting: true,
      }),
      columnHelper.accessor("display_name", {
        header: t("serviceFees.fields.displayName"),
        enableSorting: true,
      }),
      columnHelper.accessor("charging_level", {
        header: t("serviceFees.fields.chargingLevel"),
        cell: ({ getValue }) => {
          const level = getValue()
          return (
            <span className="capitalize">{level}</span>
          )
        },
      }),
      columnHelper.accessor("value", {
        header: t("serviceFees.fields.rate"),
        cell: ({ getValue }) => `${getValue()}%`,
      }),
      columnHelper.accessor("start_date", {
        header: t("serviceFees.fields.period"),
        cell: ({ row }) => {
          const start = row.original.start_date
          const end = row.original.end_date
          if (!start) return "-"
          const fmt = (d: string) =>
            new Date(d).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          return `${fmt(start)}${end ? ` to ${fmt(end)}` : ""}`
        },
      }),
      columnHelper.accessor("status", {
        header: t("serviceFees.fields.status"),
        cell: ({ getValue }) => {
          const status = getValue() as string
          return (
            <Badge
              color={statusColorMap[status] as any ?? "grey"}
              size="xsmall"
            >
              {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: t("serviceFees.fields.createdDate"),
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = getValue()
          return date
            ? new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            : "-"
        },
      }),
    ],
    [t]
  )
}

export const ServiceFeeListTable = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const rawParams = useQueryParams(["q", "status", "charging_level", "offset", "order"])
  const params = Object.fromEntries(
    Object.entries(rawParams).filter(([_, v]) => v !== undefined)
  )

  const {
    service_fees,
    count,
    isLoading,
  } = useServiceFees({
    limit: 20,
    offset: 0,
    ...params,
  })

  const columns = useColumns()

  const { table } = useDataTable({
    data: service_fees ?? [],
    columns,
    count: count ?? 0,
    pageSize: 20,
  })

  return (
    <Container className="p-0 overflow-hidden">
      <_DataTable
        table={table}
        columns={columns}
        count={count ?? 0}
        pageSize={20}
        isLoading={isLoading}
        pagination
        navigateTo={(row) => `/settings/service-fees/${row.original.id}`}
        search
        queryObject={params}
        orderBy={[
          { key: "name", label: t("serviceFees.fields.feeName") },
          { key: "created_at", label: t("serviceFees.fields.createdDate") },
          { key: "display_name", label: t("serviceFees.fields.displayName") },
        ]}
        filters={[
          {
            key: "status",
            label: t("serviceFees.fields.status"),
            type: "select" as const,
            options: [
              { label: t("general.active"), value: "active" },
              { label: t("serviceFees.fields.statusPending"), value: "pending" },
              { label: t("serviceFees.fields.statusInactive"), value: "inactive" },
            ],
          },
          {
            key: "charging_level",
            label: t("serviceFees.fields.chargingLevel"),
            type: "select" as const,
            options: [
              { label: t("serviceFees.fields.itemLevel"), value: "item" },
              { label: t("serviceFees.fields.shopLevel"), value: "shop" },
              { label: t("serviceFees.fields.globalLevel"), value: "global" },
            ],
          },
        ]}
      />
    </Container>
  )
}
