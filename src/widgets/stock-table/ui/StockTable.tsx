import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import { DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { IconFilter } from "@tabler/icons-react"
import {
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Fragment, useEffect, useState } from "react"
import { type NumberFilterValue, columns } from "../model"
import { ActiveFilters } from "./ActiveFilters"
import { SelectionActions } from "./SelectionActions"
import { TableActions } from "./TableActions"
import { TableFilter } from "./TableFilter"
import { TableHeader } from "./TableHeader"
import { PAGE_SIZES, TablePagination } from "./TablePagination"
import { TableSearch } from "./TableSearch"
import { TableSort } from "./TableSort"

// TODO implement pagination
export function StockTable({
  tickers,
  onAiCompareButtonClick,
  onSelectedTickersChange,
}: {
  tickers: Ticker[]
  onAiCompareButtonClick: () => void
  onSelectedTickersChange: (tickers: string[]) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "revenueGrowthPercentage",
      value: {
        operator: "gt",
        value: 5,
      } satisfies NumberFilterValue,
    },
    {
      id: "earningsGrowthPercentage",
      value: {
        operator: "gt",
        value: 7,
      } satisfies NumberFilterValue,
    },
    {
      id: "fcfEarningsRatio",
      value: {
        operator: "gt",
        value: 80,
      } satisfies NumberFilterValue,
    },
    {
      id: "roic",
      value: {
        operator: "gt",
        value: 15,
      } satisfies NumberFilterValue,
    },
    {
      id: "netDebtToFcff",
      value: {
        operator: "lt",
        value: 5,
      } satisfies NumberFilterValue,
    },
    {
      id: "debtToEquity",
      value: {
        operator: "lt",
        value: 80,
      } satisfies NumberFilterValue,
    },
  ])
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZES[0],
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: We need to re-run this effect when the rowSelection changes
  useEffect(() => {
    const selectedTickers = table
      .getFilteredSelectedRowModel()
      .flatRows.map((row) => row.original.symbol)
    onSelectedTickersChange(selectedTickers)
  }, [rowSelection, onSelectedTickersChange])

  const table = useReactTable({
    data: tickers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter: searchQuery,
      pagination,
    },
  })

  return (
    <>
      <TableActions
        sort={
          <TableSort
            table={table}
            setIsSortPopoverOpen={setIsSortPopoverOpen}
            setSorting={setSorting}
          />
        }
        filter={
          <TableFilter
            table={table}
            isFiltersOpen={isFiltersOpen}
            setIsFiltersOpen={setIsFiltersOpen}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="tertiary" className="w-7 px-0">
                <IconFilter className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TableFilter>
        }
        search={
          <TableSearch
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
            }}
          />
        }
      />
      <ActiveFilters
        table={table}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
        isSortPopoverOpen={isSortPopoverOpen}
        setIsSortPopoverOpen={setIsSortPopoverOpen}
      />
      <div>
        <table className="h-px w-full table-fixed">
          <TableHeader table={table} />
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "relative border-b dark:border-b-white/10",
                  row.getIsSelected() && "bg-blue-500/5",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <Fragment key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination table={table} />
      <SelectionActions
        table={table}
        onAiCompareButtonClick={onAiCompareButtonClick}
      />
    </>
  )
}
