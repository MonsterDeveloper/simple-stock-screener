import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { IconFilter } from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import type { ReactNode } from "react"
import type { FilterValue } from "../model"
import { AddFilterDropdown } from "./AddFilterDropdown"

export function TableFilter({
  table,
  isFiltersOpen,
  setIsFiltersOpen,
  children,
}: {
  table: Table<Ticker>
  isFiltersOpen: boolean
  setIsFiltersOpen: (isFiltersOpen: boolean) => void
  children?: ReactNode
}) {
  if (!isFiltersOpen && table.getState().columnFilters.length === 0) {
    return (
      <AddFilterDropdown table={table} setIsFiltersOpen={setIsFiltersOpen}>
        {children}
      </AddFilterDropdown>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="tertiary"
          className="w-7 px-0"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          aria-label="Filter"
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
      </TooltipTrigger>
      <TooltipContent>Filter</TooltipContent>
    </Tooltip>
  )
}
