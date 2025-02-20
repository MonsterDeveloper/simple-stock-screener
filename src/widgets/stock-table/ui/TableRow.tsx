import { flexRender } from "@tanstack/react-table"

import type { Ticker } from "@/entities/ticker"
import { cn } from "@/shared/ui/cn"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu"
import { IconExternalLink } from "@tabler/icons-react"
import type { Row } from "@tanstack/react-table"
import { Fragment } from "react/jsx-runtime"

export function TableRow({ row }: { row: Row<Ticker> }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          className={cn(
            "relative border-b dark:border-b-white/10",
            row.getIsSelected() && "bg-blue-500/5",
          )}
        >
          {row.getVisibleCells().map((cell) => (
            <Fragment key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Fragment>
          ))}
        </tr>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {/* TODO add ai analysis */}
        {/* <ContextMenuItem>
          <IconWand
            size={18}
            className="mr-2.5 text-zinc-700 dark:text-zinc-300"
          />
          AI Analysis
        </ContextMenuItem> */}
        <ContextMenuItem asChild>
          <a
            href={`https://finance.yahoo.com/quote/${row.original.symbol}`}
            rel="noreferrer nofollow"
            target="_blank"
          >
            <IconExternalLink
              size={18}
              className="mr-2.5 text-zinc-700 dark:text-zinc-300"
            />
            Open in Yahoo Finance
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
