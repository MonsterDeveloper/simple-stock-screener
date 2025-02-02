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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import {
  IconChevronDown,
  IconEqual,
  IconEqualNot,
  IconMathEqualGreater,
  IconMathEqualLower,
  IconMathGreater,
  IconMathLower,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import type { Column } from "@tanstack/react-table"
import { motion } from "motion/react"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import useMeasure from "react-use-measure"
import type { FilterValue, FilterValueOperator } from "../model"

const FILTER_OPERATOR_ICONS: Record<FilterValueOperator, ReactNode> = {
  eq: <IconEqual />,
  ne: <IconEqualNot />,
  gt: <IconMathGreater />,
  lt: <IconMathLower />,
  gte: <IconMathEqualGreater />,
  lte: <IconMathEqualLower />,
  contains: "contains",
  notContains: "does not contain",
}

export function FilterPill({ column }: { column: Column<Ticker> }) {
  const [isOpen, setIsOpen] = useState(false)
  const filterValue = column.getFilterValue() as FilterValue | undefined
  const isActive = filterValue?.value && String(filterValue?.value).length > 0

  const setFilterOperator = (operator: FilterValueOperator) => {
    column.setFilterValue({
      operator,
      value: filterValue?.value as never,
    } satisfies FilterValue)
  }

  const [ref, { width }] = useMeasure()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsOpen(true)
    }, 200)

    return () => clearTimeout(timeout)
  }, [])

  if (!filterValue) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          animate={{
            width: width === 0 ? "auto" : width + 2, // border width
          }}
          transition={{
            duration: 0.27,
            ease: [0.25, 1, 0.5, 1],
          }}
          className={cn(
            "flex h-6 flex-row items-center justify-start rounded-full border text-sm text-zinc-500 transition-colors duration-100 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-blue-500/50 dark:bg-blue-500/10 dark:hover:bg-blue-500/20",

            isActive
              ? "border-blue-300 bg-blue-50/50 text-blue-500"
              : "border-zinc-200 bg-white",
          )}
        >
          <div
            ref={ref}
            className="flex max-w-60 flex-row items-center px-2 pl-3.5"
          >
            <span
              className={cn("whitespace-nowrap", isActive && "font-medium")}
            >
              {String(column.columnDef.header)}
            </span>
            {isActive && (
              <>
                <span className="mx-1 shrink-0 whitespace-nowrap [&_svg]:size-2.5">
                  {FILTER_OPERATOR_ICONS[filterValue.operator]}
                </span>
                <span className="truncate">{filterValue.value}</span>
              </>
            )}
            <IconChevronDown
              className={cn(
                "ml-1 size-3.5 shrink-0",
                !isActive && "text-zinc-400",
              )}
              strokeWidth={2.5}
            />
          </div>
        </motion.button>
      </PopoverTrigger>

      <PopoverContent className="w-auto min-w-52 p-2">
        <div className="flex flex-row items-center justify-start gap-x-0.5 text-xs text-zinc-400">
          {String(column.columnDef.header)}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-4 flex-row items-center justify-center rounded-md px-0.5 text-zinc-600 transition-colors duration-75 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
              <span className="[&_svg]:size-2.5">
                {filterValue && FILTER_OPERATOR_ICONS[filterValue.operator]}
              </span>
              <IconChevronDown
                className="size-2 text-zinc-400"
                strokeWidth={2.5}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(column.columnDef.meta as { filterType: string } | undefined)
                ?.filterType === "number" ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("eq")
                    }}
                  >
                    <IconEqual className="size-3.5" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("ne")
                    }}
                  >
                    <IconEqualNot className="size-3.5" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("gt")
                    }}
                  >
                    <IconMathGreater className="size-3.5" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("gte")
                    }}
                  >
                    <IconMathEqualGreater className="size-3.5" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("lt")
                    }}
                  >
                    <IconMathLower className="size-3.5" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("lte")
                    }}
                  >
                    <IconMathEqualLower className="size-3.5" />
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("eq")
                    }}
                  >
                    Is
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("ne")
                    }}
                  >
                    Is not
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("contains")
                    }}
                  >
                    Contains
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setFilterOperator("notContains")
                    }}
                  >
                    Does not contain
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="ml-auto size-6 p-0 hover:text-red-500 focus-visible:text-red-500"
                  variant="tertiary"
                  onClick={() => {
                    flushSync(() => {
                      setIsOpen(false)
                    })
                    column.setFilterValue(undefined)
                  }}
                >
                  <IconTrash className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete filter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <FilterValueInput column={column} />
      </PopoverContent>
    </Popover>
  )
}

function FilterValueInput({ column }: { column: Column<Ticker> }) {
  const filterValue = column.getFilterValue() as FilterValue | undefined
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const shouldShowOperator =
    (column.columnDef.meta as { filterType: string } | undefined)
      ?.filterType === "number"

  if (!filterValue) {
    return null
  }

  const inputValue = filterValue.value

  return (
    <div className="relative mt-3">
      {shouldShowOperator && (
        <div className="-translate-y-1/2 absolute top-1/2 left-1.5 z-10 text-zinc-500 [&_svg]:size-3.5">
          {FILTER_OPERATOR_ICONS[filterValue.operator]}
        </div>
      )}

      {String(inputValue).length > 0 && (
        <button
          type="button"
          className="-translate-y-1/2 absolute top-1/2 right-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-zinc-400 text-zinc-100 transition-colors duration-100 hover:bg-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
          onClick={() => {
            column.setFilterValue({
              operator: filterValue.operator,
              value: "",
            })
          }}
        >
          <IconX className="size-3" strokeWidth={3} />
        </button>
      )}

      <input
        ref={inputRef}
        className={cn(
          "relative h-7 gap-x-1.5 rounded-md border border-zinc-200 bg-zinc-100 px-6 text-sm focus:outline-none focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-blue-500/50 dark:bg-blue-500/10",
          !shouldShowOperator && "pl-1.5",
        )}
        placeholder="Type a value..."
        value={inputValue ?? ""}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => {
          column.setFilterValue({
            operator: filterValue.operator,
            value: event.target.value,
          })
        }}
      />
    </div>
  )
}
