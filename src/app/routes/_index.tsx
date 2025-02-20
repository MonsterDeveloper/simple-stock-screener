import { ClientOnly } from "@/shared/ui/client-only"
import { DialogTitle } from "@/shared/ui/dialog"
import { Skeleton } from "@/shared/ui/skeleton"
import { AiDialog } from "@/widgets/ai-dialog"
import { StockTable } from "@/widgets/stock-table"
import { useCompletion } from "@ai-sdk/react"
import { IconBrandGithub, IconExternalLink } from "@tabler/icons-react"
import { Suspense, useState } from "react"
import { Await } from "react-router"
import type { Route } from "./+types/_index"

export const meta: Route.MetaFunction = () => [
  { title: "Simple Stock Screener" },
  {
    name: "description",
    content:
      "Simple stock screener to find quality stocks. Made by the CTO of Everything.",
  },
]

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    as: "image",
    href: "/no-tickers.svg",
  },
  {
    rel: "preload",
    as: "image",
    href: "/no-tickers-dark.svg",
  },
  {
    rel: "preconnect",
    href: "https://img.logo.dev",
  },
  {
    rel: "preconnect",
    href: "https://ui-avatars.com",
  },
  // DNS-prefetch as fallback for browsers that don't support preconnect
  {
    rel: "dns-prefetch",
    href: "https://img.logo.dev",
  },
  {
    rel: "dns-prefetch",
    href: "https://ui-avatars.com",
  },
]

export function loader({ context }: Route.LoaderArgs) {
  return {
    tickers: context.database.query.tickersTable
      .findMany({
        with: {
          metrics: true,
        },
      })
      .execute(),
  }
}

export default function IndexPage({
  loaderData: { tickers },
}: Route.ComponentProps) {
  const [isAiCompareDialogOpen, setIsAiCompareDialogOpen] = useState(false)
  const { handleSubmit, completion, setInput, isLoading, stop } = useCompletion(
    {
      api: "/api/ai-compare",
      experimental_throttle: 50,
    },
  )

  return (
    <>
      <main className="mx-auto min-h-[calc(100vh-34px)] max-w-6xl px-4 pt-32 sm:pt-40">
        <h1 className="font-bold text-3xl">Simple Stock Screener</h1>

        <p className="mt-5 text-sm">
          Criteria to screen for quality stocks:
          <br />- Revenue growth &gt; 5%
          <br />- Earnings growth &gt; 7%
          <br />- FCF / earnings &gt; 80%
          <br />- ROIC &gt; 15%
          <br />- Net debt / FCFF &lt; 5<br />- Debt/equity &lt; 80%
        </p>

        <a
          href="https://x.com/QCompounding/status/1870515464801010028"
          rel="noreferrer nofollow"
          target="_blank"
          className="after:-bottom-0.5 relative mt-2.5 inline-block text-sm after:absolute after:inset-x-0 after:h-px after:bg-zinc-200 after:transition-colors after:duration-100 after:content-[''] hover:after:bg-zinc-300 dark:after:bg-white/10 dark:hover:after:bg-white/20"
        >
          @QCompounding on X{" "}
          <IconExternalLink className="ml-0.5 inline-block size-4 align-middle" />
        </a>
        <Suspense fallback={<Skeleton className="mt-8 h-96 w-full" />}>
          <Await resolve={tickers}>
            {(tickers) => (
              <StockTable
                tickers={tickers}
                onSelectedTickersChange={(tickers) => {
                  setInput(tickers.join(";"))
                }}
                onAiCompareButtonClick={() => {
                  handleSubmit()
                  setIsAiCompareDialogOpen(true)
                }}
              />
            )}
          </Await>
        </Suspense>
      </main>

      <footer className="mx-auto mt-auto flex max-w-6xl flex-col items-center justify-between gap-y-2 p-4 text-xs text-zinc-500 sm:flex-row">
        <span>
          Copyright &copy; <ClientOnly>{new Date().getFullYear()}</ClientOnly>{" "}
          CTO of Everything
        </span>
        <div className="flex flex-row items-center gap-x-4">
          <a
            href="https://logo.dev"
            className="text-zinc-500 transition-colors duration-75 hover:text-zinc-400"
            // biome-ignore lint/a11y/noBlankTarget: Logo.dev attribution requirement
            target="_blank"
          >
            Logos provided by Logo.dev
          </a>
          <a
            href="https://github.com/MonsterDeveloper/simple-stock-screener"
            className="text-zinc-500 transition-colors duration-75 hover:text-zinc-400"
            target="_blank"
            rel="noreferrer"
          >
            <IconBrandGithub className="mr-1 inline-block size-4" />
            Source code
          </a>
        </div>
      </footer>
      <AiDialog
        content={completion}
        isOpen={isAiCompareDialogOpen}
        setIsOpen={(isOpen) => {
          setIsAiCompareDialogOpen(isOpen)

          if (!isOpen) {
            stop()
          }
        }}
        isLoading={isLoading}
      >
        <DialogTitle className="sr-only">AI Stock Comparison</DialogTitle>
      </AiDialog>
    </>
  )
}
