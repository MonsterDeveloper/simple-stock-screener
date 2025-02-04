import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { IconArrowsSort } from "@tabler/icons-react"
import type { SortingState, Table } from "@tanstack/react-table"

export function TableSort({
  table,
  setIsSortPopoverOpen,
  setSorting,
}: {
  table: Table<Ticker>
  setIsSortPopoverOpen: (isSortPopoverOpen: boolean) => void
  setSorting: (sorting: SortingState) => void
}) {
  return (
    <Tooltip>
      {table.getState().sorting.length === 0 ? (
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="tertiary" className="w-7 px-0">
                <IconArrowsSort className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
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
        <TooltipTrigger asChild>
          <Button
            variant="tertiary"
            className="w-7 px-0"
            onClick={() => {
              setIsSortPopoverOpen(true)
            }}
          >
            <IconArrowsSort className="size-4 text-blue-500" />
          </Button>
        </TooltipTrigger>
      )}
      <TooltipContent>Sort</TooltipContent>
    </Tooltip>
  )
}
