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
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronDown,
  IconExternalLink,
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import {
  type Column,
  type SortingState,
  type Table,
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"

export const meta = () => [
  { title: "Simple Stock Screener" },
  {
    name: "description",
    content:
      "Simple stock screener to find quality stocks. Made by the CTO of Everything.",
  },
]

const data = [
  {
    ticker: "MSFT",
    revenueGrowth: 5,
    earningsGrowth: 7,
    fcfEarnings: 80,
    roic: 15,
    netDebtFcff: 5,
    debtEquity: 80,
    marketCapUsd: 200000000000,
  },
]

const columnHelper = createColumnHelper<(typeof data)[number]>()

const columns = [
  columnHelper.accessor("ticker", {
    header: "Ticker",
    enableSorting: false,
  }),
  columnHelper.accessor("marketCapUsd", {
    header: "Market cap",
  }),
  columnHelper.accessor("revenueGrowth", {
    header: "Revenue growth",
  }),
  columnHelper.accessor("earningsGrowth", {
    header: "Earnings growth",
  }),
  columnHelper.accessor("fcfEarnings", {
    header: "FCF / earnings",
  }),
  columnHelper.accessor("roic", {
    header: "ROIC",
  }),
  columnHelper.accessor("netDebtFcff", {
    header: "Net debt / FCFF",
  }),
  columnHelper.accessor("debtEquity", {
    header: "Debt / equity",
  }),
]

export default function IndexPage() {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false)

  console.log()

  return (
    <main className="mx-auto mt-40 max-w-4xl px-4">
      <h1 className="font-bold text-3xl">Simple Stock Screener</h1>

      <p className="mt-5 text-sm">
        Criteria to screen for quality stocks:
        <br />- Revenue growth &gt; 5%
        <br />- Earnings growth &gt; 7%
        <br />- FCF / earnings &gt; 80%
        <br />- ROIC &gt; 15%
        <br />- Net debt / FCFF &lt; 5<br />- Debt/equity &lt; 80%
      </p>

      <a
        href="https://x.com/QCompounding/status/1870515464801010028"
        rel="noreferrer nofollow"
        target="_blank"
        className="after:-bottom-0.5 relative mt-2.5 inline-block text-sm after:absolute after:inset-x-0 after:h-px after:bg-zinc-200 after:transition-colors after:duration-100 after:content-[''] hover:after:bg-zinc-300 dark:after:bg-white/10 dark:hover:after:bg-white/20"
      >
        @QCompounding on X{" "}
        <IconExternalLink className="ml-0.5 inline-block size-4 align-middle" />
      </a>
      <div className="flex flex-row items-start justify-start">
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
                  table.getColumn(table.getState().sorting[0].id)?.columnDef
                    .header,
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
      </div>
    </main>
  )
}

function DraggableSorts({ table }: { table: Table<(typeof data)[number]> }) {
  const sortingState = table.getState().sorting.map((sorting) => ({
    ...sorting,
    // biome-ignore lint/style/noNonNullAssertion: This column is guaranteed to exist
    column: table.getColumn(sorting.id)!,
  }))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortingState}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-flow-row gap-y-2">
          {sortingState.map((state) => (
            <SortPopoverRow
              key={state.id}
              table={table}
              column={state.column}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      table.setSorting((sorting) => {
        const oldIndex = sorting.findIndex(({ id }) => id === active.id)
        const newIndex = sorting.findIndex(({ id }) => id === over?.id)

        return arrayMove(sorting, oldIndex, newIndex)
      })
    }
  }
}

function SortPopoverRow({
  table,
  column,
}: {
  table: Table<(typeof data)[number]>
  column: Column<(typeof data)[number]>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  }

  const handleSortDirectionSelect = (direction: "asc" | "desc") => {
    table.setSorting((sorting) =>
      sorting.map((sorting) =>
        sorting.id === column.id
          ? { ...sorting, desc: direction === "desc" }
          : sorting,
      ),
    )
  }

  const handleColumnSelect = (newColumnId: string) => {
    table.setSorting((sorting) =>
      sorting.map((sorting) =>
        sorting.id === column.id ? { ...sorting, id: newColumnId } : sorting,
      ),
    )
  }

  return (
    <div
      className="flex flex-row items-center justify-start"
      style={style}
      ref={setNodeRef}
    >
      <button
        className="flex h-8 items-center justify-center pr-3 pl-2"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="size-4 text-zinc-400" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            {String(column.columnDef.header)}
            <IconChevronDown
              className="ml-1 size-3.5 text-zinc-400"
              strokeWidth={2.5}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {table
            .getAllColumns()
            .map(
              (currentColumn) =>
                currentColumn.getCanSort() &&
                (!currentColumn.getIsSorted() ||
                  currentColumn.id === column.id) && (
                  <DropdownMenuItem
                    onSelect={() => handleColumnSelect(currentColumn.id)}
                  >
                    {String(currentColumn.columnDef.header)}
                  </DropdownMenuItem>
                ),
            )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="mr-3 ml-2">
            {column.getIsSorted() === "asc" ? "Ascending" : "Descending"}
            <IconChevronDown
              className="ml-1 size-3.5 text-zinc-400"
              strokeWidth={2.5}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          <DropdownMenuItem onSelect={() => handleSortDirectionSelect("asc")}>
            Ascending
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSortDirectionSelect("desc")}>
            Descending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="ml-auto size-6 p-0"
              variant="tertiary"
              onClick={() => {
                table.setSorting((sorting) =>
                  sorting.filter(({ id }) => id !== column.id),
                )
              }}
            >
              <IconX className="size-4" strokeWidth={3} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove sort rule</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
