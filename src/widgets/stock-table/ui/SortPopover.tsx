import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronDown,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import { DraggableSorts } from "./DraggableSorts"

interface SortPopoverProps {
  table: Table<Ticker>
  isSortPopoverOpen: boolean
  setIsSortPopoverOpen: (isSortPopoverOpen: boolean) => void
}

export function SortPopover({
  table,
  isSortPopoverOpen,
  setIsSortPopoverOpen,
}: SortPopoverProps) {
  if (table.getState().sorting.length === 0) {
    return null
  }

  return (
    <Popover open={isSortPopoverOpen} onOpenChange={setIsSortPopoverOpen}>
      <PopoverTrigger className="flex h-6 flex-row items-center justify-center rounded-full border border-blue-300 bg-blue-50/50 px-2 text-blue-500 text-sm transition-colors duration-100 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-blue-500/50 dark:bg-blue-500/10 dark:hover:bg-blue-500/20">
        {table.getState().sorting.length === 1 ? (
          <>
            {table.getState().sorting[0].desc ? (
              <IconArrowDown className="mr-1 size-3.5" strokeWidth={2.5} />
            ) : (
              <IconArrowUp className="mr-1 size-3.5" strokeWidth={2.5} />
            )}
            {String(
              table.getColumn(table.getState().sorting[0].id)?.columnDef.header,
            )}
          </>
        ) : (
          <>
            <IconArrowsSort className="mr-1 size-3.5" strokeWidth={2.5} />
            {table.getState().sorting.length} sorts
          </>
        )}
        <IconChevronDown className="ml-1 size-3.5" strokeWidth={2.5} />
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto min-w-[300px] p-1",
          table.getState().sorting.length > 0 && "!pt-2",
        )}
      >
        <DraggableSorts table={table} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn(
                "w-full justify-start gap-x-2",
                table.getState().sorting.length > 0 && "mt-1",
              )}
              variant="tertiary"
            >
              <IconPlus className="size-4" />
              Add sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {table.getAllColumns().map(
              (column) =>
                column.getCanSort() &&
                !column.getIsSorted() && (
                  <DropdownMenuItem
                    key={column.id}
                    onSelect={() => {
                      table.setSorting((sorting) => [
                        ...sorting,
                        {
                          id: column.id,
                          desc: true,
                        },
                      ])
                    }}
                  >
                    {String(column.columnDef.header)}
                  </DropdownMenuItem>
                ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {table.getState().sorting.length > 0 && (
          <Button
            className="mt-1 w-full justify-start gap-x-2 hover:text-red-500 focus-visible:text-red-500"
            variant="tertiary"
            onClick={() => {
              table.setSorting([])
              setIsSortPopoverOpen(false)
            }}
          >
            <IconTrash className="size-4" />
            Delete sort
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
