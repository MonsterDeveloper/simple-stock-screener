import { DropdownMenuItem } from "@/shared/ui/dropdown-menu"

import type { Ticker } from "@/entities/ticker"
import { DropdownMenu, DropdownMenuContent } from "@/shared/ui/dropdown-menu"
import type { Table } from "@tanstack/react-table"
import type { ReactNode } from "react"
import type { FilterValue } from "../model"

export function AddFilterDropdown({
  table,
  children,
  setIsFiltersOpen,
}: {
  table: Table<Ticker>
  children?: ReactNode
  setIsFiltersOpen: (open: boolean) => void
}) {
  return (
    <DropdownMenu>
      {children}
      <DropdownMenuContent className="w-48">
        {table.getAllFlatColumns().map(
          (column) =>
            column.getCanFilter() &&
            !column.getIsFiltered() && (
              <DropdownMenuItem
                key={column.id}
                onSelect={() => {
                  column.setFilterValue({
                    operator: "eq",
                  } satisfies FilterValue)
                  setIsFiltersOpen(true)
                }}
              >
                {String(column.columnDef.header)}
              </DropdownMenuItem>
            ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
