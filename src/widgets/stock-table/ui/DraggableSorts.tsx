import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
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
import { IconChevronDown, IconGripVertical, IconX } from "@tabler/icons-react"
import type { Column, Table } from "@tanstack/react-table"

export function DraggableSorts({ table }: { table: Table<Ticker> }) {
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
  table: Table<Ticker>
  column: Column<Ticker>
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
        className="flex h-8 items-center justify-center rounded-md pr-3 pl-2 focus:outline-none focus-visible:bg-zinc-100"
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
          {table.getAllColumns().map(
            (currentColumn) =>
              currentColumn.getCanSort() &&
              (!currentColumn.getIsSorted() ||
                currentColumn.id === column.id) && (
                <DropdownMenuItem
                  key={currentColumn.id}
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
