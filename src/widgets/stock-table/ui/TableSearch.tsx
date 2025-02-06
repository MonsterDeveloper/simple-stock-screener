import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { IconSearch } from "@tabler/icons-react"
import { type KeyboardEvent, useRef } from "react"

import { useState } from "react"

import type { ChangeEventHandler, ComponentPropsWithoutRef } from "react"
import { flushSync } from "react-dom"

interface TableSearchProps
  extends Omit<ComponentPropsWithoutRef<"input">, "onChange"> {
  debounceMs?: number
  onChange: ChangeEventHandler<HTMLInputElement>
}

export function TableSearch({ value, className, ...props }: TableSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null!)
  const isActive = typeof value === "string" && value.length > 0

  const handleClick = () => {
    flushSync(() => {
      setIsOpen((open) => !open)
    })
    inputRef.current.focus()
    // Move cursor to end by setting selection range to end
    const length = inputRef.current.value.length
    inputRef.current.setSelectionRange(length, length)
  }

  const handleBlur = () => {
    if (!isActive) {
      setIsOpen(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div className="flex">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Search"
            onClick={handleClick}
            variant="tertiary"
            className={cn("w-7 px-0", isActive && !isOpen && "text-blue-500")}
          >
            <IconSearch size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Search</TooltipContent>
      </Tooltip>
      <search>
        <input
          placeholder="Search..."
          className={cn(
            "h-full w-[0px] text-sm opacity-0 transition-[width,opacity] duration-300 focus:outline-none",
            isOpen && "w-[150px] opacity-100",
            className,
          )}
          tabIndex={-1}
          ref={inputRef}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          value={value}
          {...props}
        />
      </search>
    </div>
  )
}
