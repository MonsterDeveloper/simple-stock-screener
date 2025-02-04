import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

export const PAGE_SIZES = [10, 20, 50, 100] as const

function PageButton({
  active,
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  active?: boolean
  children: ReactNode
}) {
  return (
    <Button
      variant="secondary"
      className={cn(
        "min-w-[2.5rem] px-3",
        active && "bg-zinc-100 dark:bg-zinc-800",
        className,
      )}
      {...props}
    />
  )
}

export function TablePagination({ table }: { table: Table<Ticker> }) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const pageCount = table.getPageCount()

  const renderPageNumbers = () => {
    // If there are 7 or fewer pages, show all page numbers without ellipsis
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => (
        <PageButton
          // biome-ignore lint/suspicious/noArrayIndexKey: It's okay for pagination
          key={i + 1}
          onClick={() => table.setPageIndex(i)}
          active={currentPage === i + 1}
        >
          {i + 1}
        </PageButton>
      ))
    }

    if (currentPage > 4) {
      if (currentPage < pageCount - 2) {
        // Middle range
        return (
          <>
            <PageButton onClick={() => table.setPageIndex(0)}>1</PageButton>
            <PageButton onClick={() => table.setPageIndex(currentPage - 3)}>
              ...
            </PageButton>
            <PageButton
              onClick={() => table.setPageIndex(currentPage - 2)}
              active={false}
            >
              {currentPage - 1}
            </PageButton>
            <PageButton active={true}>{currentPage}</PageButton>
            <PageButton
              onClick={() => table.setPageIndex(currentPage)}
              active={false}
            >
              {currentPage + 1}
            </PageButton>
            <PageButton onClick={() => table.setPageIndex(currentPage + 1)}>
              ...
            </PageButton>
            <PageButton onClick={() => table.setPageIndex(pageCount - 1)}>
              {pageCount}
            </PageButton>
          </>
        )
      }

      // Near end
      return (
        <>
          <PageButton onClick={() => table.setPageIndex(0)}>1</PageButton>
          <PageButton onClick={() => table.setPageIndex(1)}>2</PageButton>
          <PageButton onClick={() => table.setPageIndex(pageCount - 5)}>
            ...
          </PageButton>
          <PageButton
            onClick={() => table.setPageIndex(pageCount - 4)}
            active={currentPage === pageCount - 3}
          >
            {pageCount - 3}
          </PageButton>
          <PageButton
            onClick={() => table.setPageIndex(pageCount - 3)}
            active={currentPage === pageCount - 2}
          >
            {pageCount - 2}
          </PageButton>
          <PageButton
            onClick={() => table.setPageIndex(pageCount - 2)}
            active={currentPage === pageCount - 1}
          >
            {pageCount - 1}
          </PageButton>
          <PageButton
            onClick={() => table.setPageIndex(pageCount - 1)}
            active={currentPage === pageCount}
          >
            {pageCount}
          </PageButton>
        </>
      )
    }

    // Start range
    return (
      <>
        <PageButton
          onClick={() => table.setPageIndex(0)}
          active={currentPage === 1}
        >
          1
        </PageButton>
        <PageButton
          onClick={() => table.setPageIndex(1)}
          active={currentPage === 2}
        >
          2
        </PageButton>
        <PageButton
          onClick={() => table.setPageIndex(2)}
          active={currentPage === 3}
        >
          3
        </PageButton>
        <PageButton
          onClick={() => table.setPageIndex(3)}
          active={currentPage === 4}
        >
          4
        </PageButton>
        <PageButton onClick={() => table.setPageIndex(4)}>...</PageButton>
        <PageButton
          onClick={() => table.setPageIndex(pageCount - 2)}
          active={false}
        >
          {pageCount - 1}
        </PageButton>
        <PageButton
          onClick={() => table.setPageIndex(pageCount - 1)}
          active={currentPage === pageCount}
        >
          {pageCount}
        </PageButton>
      </>
    )
  }

  return (
    <div className="mt-5 flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={!table.getCanPreviousPage()}
        onClick={() => table.previousPage()}
        aria-label="Previous page"
      >
        <IconChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-1">{renderPageNumbers()}</div>

      <Button
        variant="secondary"
        disabled={!table.getCanNextPage()}
        onClick={() => table.nextPage()}
        aria-label="Next page"
      >
        <IconChevronRight className="size-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="tertiary">
            {table.getState().pagination.pageSize} tickers
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-32">
          {PAGE_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              onSelect={() => {
                table.setPageSize(size)
              }}
            >
              {size}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
