import { TooltipProvider } from "@/shared/ui/tooltip"
import type { ReactNode } from "react"

export function TableActions({
  sort,
  search,
  filter,
}: {
  sort: ReactNode
  search: ReactNode
  filter: ReactNode
}) {
  return (
    <TooltipProvider delayDuration={140}>
      <div className="flex flex-row items-center justify-end border-b py-2 dark:border-b-white/10">
        {filter}
        {sort}
        {search}
      </div>
    </TooltipProvider>
  )
}
