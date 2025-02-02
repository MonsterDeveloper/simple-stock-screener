import { cn } from "@/shared/ui/cn"
import type { ComponentPropsWithoutRef } from "react"

export function TableCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"td">) {
  return <td className={cn("px-4 py-1.5 text-sm", className)} {...props} />
}
