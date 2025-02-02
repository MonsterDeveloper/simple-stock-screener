import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { IconArrowsSort, IconFilter } from "@tabler/icons-react"
import type { SortingState, Table } from "@tanstack/react-table"
import type { FilterValue } from "../model"
import { AddFilterDropdown } from "./AddFilterDropdown"

export function TableActions({
  table,
  isFiltersOpen,
  setIsFiltersOpen,
  setIsSortPopoverOpen,
  setSorting,
}: {
  table: Table<Ticker>
  isFiltersOpen: boolean
  setIsFiltersOpen: (isFiltersOpen: boolean) => void
  setIsSortPopoverOpen: (isSortPopoverOpen: boolean) => void
  setSorting: (sorting: SortingState) => void
}) {
  return (
    <div className="flex flex-row items-center justify-end border-b py-2 dark:border-b-white/10">
      {!isFiltersOpen && table.getState().columnFilters.length === 0 ? (
        <AddFilterDropdown table={table} setIsFiltersOpen={setIsFiltersOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" className="w-7 px-0">
              <IconFilter className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </AddFilterDropdown>
      ) : (
        <Button
          variant="tertiary"
          className="w-7 px-0"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <IconFilter
            className={cn(
              "size-4",
              table
                .getState()
                .columnFilters.map(
                  (filter) => (filter.value as FilterValue | undefined)?.value,
                )
                .filter(Boolean).length > 0 && "text-blue-500",
            )}
          />
        </Button>
      )}

      {table.getState().sorting.length === 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" className="w-7 px-0">
              <IconArrowsSort className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {table.getAllColumns().map(
              (column) =>
                column.getCanSort() && (
                  <DropdownMenuItem
                    key={column.id}
                    onSelect={() => {
                      setSorting([
                        {
                          id: column.id,
                          desc: true,
                        },
                      ])
                      setIsFiltersOpen(true)
                      setIsSortPopoverOpen(true)
                    }}
                  >
                    {String(column.columnDef.header)}
                  </DropdownMenuItem>
                ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="tertiary"
          className="w-7 px-0"
          onClick={() => {
            if (isFiltersOpen) {
              setIsFiltersOpen(false)
              return
            }

            setIsFiltersOpen(true)
            setIsSortPopoverOpen(true)
          }}
        >
          <IconArrowsSort className="size-4 text-blue-500" />
        </Button>
      )}
    </div>
  )
}
