import type { HTMLAttributes } from "react"
import { cn } from "./cn"

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
