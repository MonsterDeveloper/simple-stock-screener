import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import { DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area"
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
  const isEmpty = table.getRowModel().rows.length === 0

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
      <ScrollArea className="pb-6">
        <table className="h-px w-max min-w-full table-fixed whitespace-nowrap ">
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
        {isEmpty && (
          <div className="mt-8 flex flex-col items-center justify-center gap-y-1">
            <img src="/no-tickers.svg" className="size-32 dark:hidden" alt="" />
            <img
              src="/no-tickers-dark.svg"
              className="hidden size-32 dark:block"
              alt=""
            />
            <h2 className="mt-3 font-bold text-2xl">No tickers found</h2>
            <p className="text-sm text-zinc-500">
              Try relaxing the filters or search query
            </p>
          </div>
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {!isEmpty && <TablePagination table={table} className="mt-3" />}
      <SelectionActions
        table={table}
        onAiCompareButtonClick={onAiCompareButtonClick}
      />
    </>
  )
}
