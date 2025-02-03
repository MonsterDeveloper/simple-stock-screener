import type { Ticker } from "@/entities/ticker"
import { Checkbox } from "@/shared/ui/checkbox"
import { cn } from "@/shared/ui/cn"
import { LinkBox, LinkOverlay } from "@/shared/ui/link-overlay"
import type { CellContext } from "@tanstack/react-table"

export function TickerCell({ getValue, row }: CellContext<Ticker, string>) {
  return (
    <td className="group relative">
      <div
        className={cn(
          "-left-6 absolute inset-y-0 flex items-center justify-center opacity-0 transition-opacity duration-100 group-hover:opacity-100",
          row.getIsSelected() && "opacity-100",
        )}
      >
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={() => {
            row.toggleSelected()
          }}
        />
      </div>
      <LinkBox asChild>
        <div className="group flex flex-row items-center gap-x-1.5 px-4 py-1.5">
          <div className="size-3.5 overflow-hidden rounded-sm">
            <img
              src={`https://img.logo.dev/ticker/${getValue()}?token=pk_Y8Ewg1JpSNuBNeYS_o2QyA&format=png&size=64&retina=true`}
              alt={`${getValue()} logo`}
              className="size-full scale-110"
            />
          </div>
          <LinkOverlay asChild>
            <a
              className="border-b font-medium text-sm leading-none transition-colors duration-100 group-hover:border-b-zinc-300 dark:border-b-white/10 dark:group-hover:border-b-white/20"
              href={`https://finance.yahoo.com/quote/${getValue()}`}
              rel="noreferrer nofollow"
              target="_blank"
            >
              {getValue()}
            </a>
          </LinkOverlay>
        </div>
      </LinkBox>
    </td>
  )
}
