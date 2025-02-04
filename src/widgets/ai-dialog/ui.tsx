import { useAnimatedText } from "@/shared/ui/animated-text"
import { Dialog, DialogContent } from "@/shared/ui/dialog"
import { MemoizedMarkdown } from "@/shared/ui/memoized-markdown"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { IconRotateClockwise2 } from "@tabler/icons-react"
import { AnimatePresence, motion } from "motion/react"
import { type ReactNode, useEffect, useId, useState } from "react"

const loadingMessages = [
  "Crunching market numbers...",
  "Analyzing stock patterns...",
  "Scanning financial indicators...",
  "Evaluating AI predictions...",
  "Filtering market outliers...",
  "Assessing company fundamentals...",
  "Calculating risk metrics...",
  "Processing trading signals...",
  "Optimizing portfolio criteria...",
  "Cross-referencing economic data...",
]

export function AiDialog({
  content,
  isOpen,
  setIsOpen,
  children,
  isLoading,
}: {
  content: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  children?: ReactNode
  isLoading: boolean
}) {
  const animatedText = useAnimatedText(content)
  const id = useId()
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        {children}
        <ScrollArea className="max-h-[calc(100vh-10rem)]">
          {isLoading ? (
            <div className="flex h-5 w-full min-w-0 flex-row items-center justify-start gap-x-2 overflow-hidden whitespace-nowrap text-sm text-zinc-500">
              <IconRotateClockwise2 className="size-4 animate-spin" />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  initial={{ opacity: 0, y: -25 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 25 }}
                  key={currentLoadingMessage}
                >
                  {loadingMessages[currentLoadingMessage]}
                </motion.span>
              </AnimatePresence>
            </div>
          ) : (
            <MemoizedMarkdown
              content={animatedText}
              id={id}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-2 font-bold text-xl">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-3 mb-1.5 font-bold text-lg">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-2 mb-1 font-bold text-base">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mb-1.5 text-sm">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-1.5 ml-3 list-disc space-y-0.5 text-sm">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-1.5 ml-3 list-decimal space-y-0.5 text-sm">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                hr: () => <hr className="bg-zinc-200 dark:bg-zinc-800" />,
              }}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
