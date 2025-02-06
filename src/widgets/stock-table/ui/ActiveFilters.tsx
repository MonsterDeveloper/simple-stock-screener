import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import { DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area"
import { Separator } from "@/shared/ui/separator"
import { IconPlus } from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import { AnimatePresence, motion } from "motion/react"
import { AddFilterDropdown } from "./AddFilterDropdown"
import { FilterPill } from "./FilterPill"
import { SortPopover } from "./SortPopover"

export function ActiveFilters({
  table,
  isFiltersOpen,
  setIsFiltersOpen,
  isSortPopoverOpen,
  setIsSortPopoverOpen,
}: {
  table: Table<Ticker>
  isFiltersOpen: boolean
  setIsFiltersOpen: (isFiltersOpen: boolean) => void
  isSortPopoverOpen: boolean
  setIsSortPopoverOpen: (isSortPopoverOpen: boolean) => void
}) {
  const canAddFilter = table
    .getAllFlatColumns()
    .some((column) => column.getCanFilter() && !column.getIsFiltered())

  return (
    <ScrollArea
      className={cn(
        "mb-3 whitespace-nowrap pt-3 pb-5",
        !isFiltersOpen && "hidden",
      )}
      type="auto"
      nonViewportChildren={
        <div className="absolute inset-y-0 right-0 w-4.5 bg-gradient-to-r from-0% from-white/0 to-100% to-white" />
      }
    >
      <div className="flex flex-row items-center justify-start gap-1 pr-4">
        <SortPopover
          table={table}
          isSortPopoverOpen={isSortPopoverOpen}
          setIsSortPopoverOpen={setIsSortPopoverOpen}
        />

        {table.getAllFlatColumns().filter((column) => column.getIsFiltered())
          .length > 0 &&
          table.getState().sorting.length > 0 && (
            <Separator orientation="vertical" className="mx-3 h-6" />
          )}

        <AnimatePresence>
          {table.getAllFlatColumns().map(
            (column) =>
              column.getIsFiltered() && (
                <motion.div
                  key={column.id}
                  exit={{
                    width: 0,
                    overflow: "hidden",
                    transition: {
                      duration: 0.27,
                      ease: [0.25, 1, 0.5, 1],
                      overflow: {
                        duration: 0,
                      },
                    },
                  }}
                >
                  <FilterPill column={column} />
                </motion.div>
              ),
          )}
        </AnimatePresence>
        {canAddFilter && (
          <AddFilterDropdown table={table} setIsFiltersOpen={setIsFiltersOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="tertiary" className="px-1.5">
                <IconPlus className="mr-1.5 size-4 " />
                Add filter
              </Button>
            </DropdownMenuTrigger>
          </AddFilterDropdown>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
