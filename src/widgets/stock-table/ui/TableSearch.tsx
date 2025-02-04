import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { IconSearch } from "@tabler/icons-react"
import { useRef } from "react"

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

  const handleClick = () => {
    flushSync(() => {
      setIsOpen(true)
    })
    inputRef.current.focus()
  }

  const handleBlur = () => {
    if (typeof value === "string" && value.length === 0) {
      setIsOpen(false)
    }
  }

  return (
    <div className="flex">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Поиск"
            onClick={handleClick}
            variant="tertiary"
            className="w-7 px-0"
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
          value={value}
          {...props}
        />
      </search>
    </div>
  )
}
