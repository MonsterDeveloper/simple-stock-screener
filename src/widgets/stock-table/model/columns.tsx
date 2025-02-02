import type { Ticker } from "@/entities/ticker"
import { TooltipContent } from "@/shared/ui/tooltip"
import { TooltipTrigger } from "@/shared/ui/tooltip"
import { Tooltip } from "@/shared/ui/tooltip"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { createColumnHelper } from "@tanstack/react-table"
import { TableCell, TickerCell } from "../ui"
import { numberFilterFn, textFilterFn } from "./filters"

const columnHelper = createColumnHelper<Ticker>()

export const columns = [
  columnHelper.accessor("symbol", {
    header: "Ticker",
    enableSorting: false,
    filterFn: textFilterFn,
    cell: (props) => <TickerCell {...props} />,
    size: 100,
    meta: {
      filterType: "text",
    },
  }),
  columnHelper.accessor("revenueGrowthPercentage", {
    header: "Revenue growth",
    cell: ({ getValue, row: { original } }) => (
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>{Math.round(getValue())}%</TooltipTrigger>
            <TooltipContent className="flex flex-col gap-y-1">
              {original.metrics.map((metrics) => (
                <span key={metrics.reportPeriod}>
                  {new Date(metrics.reportPeriod).getFullYear()}:{" "}
                  {metrics.revenue.toLocaleString("en-US", {
                    style: "currency",
                    currency: metrics.currency,
                    notation: "compact",
                  })}
                </span>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    ),
    filterFn: numberFilterFn,
    size: 150,
    meta: {
      filterType: "number",
    },
  }),
  columnHelper.accessor("earningsGrowthPercentage", {
    header: "Earnings growth",
    filterFn: numberFilterFn,
    cell: ({ getValue }) => <TableCell>{Math.round(getValue())}%</TableCell>,
    size: 150,
    meta: {
      filterType: "number",
    },
  }),
  columnHelper.accessor("fcfEarningsRatio", {
    header: "FCF / earnings",
    filterFn: numberFilterFn,
    cell: ({ getValue }) => <TableCell>{Math.round(getValue())}%</TableCell>,
    size: 150,
    meta: {
      filterType: "number",
    },
  }),
  columnHelper.accessor("roic", {
    header: "ROIC",
    filterFn: numberFilterFn,
    cell: ({ getValue }) => <TableCell>{Math.round(getValue())}%</TableCell>,
    size: 150,
    meta: {
      filterType: "number",
    },
  }),
  columnHelper.accessor("netDebtToFcff", {
    header: "Net debt / FCFF",
    filterFn: numberFilterFn,
    cell: ({ getValue }) => <TableCell>{getValue().toFixed(2)}</TableCell>,
    size: 150,
    meta: {
      filterType: "number",
    },
  }),
  columnHelper.accessor("debtToEquity", {
    header: "Debt / equity",
    filterFn: numberFilterFn,
    cell: ({ getValue }) => <TableCell>{Math.round(getValue())}%</TableCell>,
    size: 150,
    meta: {
      filterType: "number",
    },
  }),
]
