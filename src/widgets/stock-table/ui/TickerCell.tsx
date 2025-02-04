import type { Ticker } from "@/entities/ticker"
import { Checkbox } from "@/shared/ui/checkbox"
import { cn } from "@/shared/ui/cn"
import { LinkBox, LinkOverlay } from "@/shared/ui/link-overlay"
import type { CellContext } from "@tanstack/react-table"

export function TickerCell({ getValue, row }: CellContext<Ticker, string>) {
  const ticker = getValue()

  return (
    <td className="group relative">
      <div
        className={cn(
          "-translate-x-full absolute inset-y-0 left-0 flex items-center justify-center pr-2 opacity-0 transition-opacity duration-100 group-hover:opacity-100",
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
            <object
              type="image/png"
              data={`https://img.logo.dev/ticker/${ticker}?token=pk_Y8Ewg1JpSNuBNeYS_o2QyA&format=webp&size=64&retina=true`}
              className="size-full scale-110"
              aria-label={`${ticker} logo`}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${ticker}&background=random`}
                alt={`${ticker} logo fallback`}
                className="size-full scale-110"
              />
            </object>
          </div>
          <LinkOverlay asChild>
            <a
              className="border-b font-medium text-sm leading-none transition-colors duration-100 group-hover:border-b-zinc-300 dark:border-b-white/10 dark:group-hover:border-b-white/20"
              href={`https://finance.yahoo.com/quote/${ticker}`}
              rel="noreferrer nofollow"
              target="_blank"
            >
              {ticker}
            </a>
          </LinkOverlay>
        </div>
      </LinkBox>
    </td>
  )
}
