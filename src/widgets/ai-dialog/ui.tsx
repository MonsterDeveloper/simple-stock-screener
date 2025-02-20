import { useAnimatedText } from "@/shared/ui/animated-text"
import { Dialog, DialogContent } from "@/shared/ui/dialog"
import { MemoizedMarkdown } from "@/shared/ui/memoized-markdown"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { IconBulb, IconRotateClockwise2 } from "@tabler/icons-react"
import { AnimatePresence, motion } from "motion/react"
import { type ReactNode, useEffect, useId, useRef, useState } from "react"

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

const THINK_TAG_START = "<think>"
const THINK_TAG_REGEX = /<think>(.*?)<\/think>/s

function parseAIContent(rawContent: string) {
  const thinkMatch = rawContent.match(THINK_TAG_REGEX)

  if (thinkMatch) {
    // If we have complete tags, extract reasoning and clean content
    return {
      reasoning: thinkMatch[1]?.trim(),
      content: rawContent.replace(THINK_TAG_REGEX, "").trim(),
    }
  }

  // Check for incomplete think tag (streaming)
  if (rawContent.startsWith(THINK_TAG_START)) {
    return {
      reasoning: rawContent.replace(THINK_TAG_START, "").trim(),
      content: "",
    }
  }

  // No think tags found
  return {
    reasoning: "",
    content: rawContent.trim(),
  }
}

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
  const id = useId()
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0)
  const reasoningContentRef = useRef<HTMLDivElement>(null)

  const { reasoning, content: cleanContent } = parseAIContent(content)
  const animatedCleanContent = useAnimatedText(cleanContent)

  // biome-ignore lint/correctness/useExhaustiveDependencies: We need to scroll the reasoning content when it changes
  useEffect(() => {
    if (reasoningContentRef.current) {
      reasoningContentRef.current.scrollTop =
        reasoningContentRef.current.scrollHeight
    }
  }, [reasoning])

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
          {reasoning && reasoning.length > 0 && (
            <div className="mb-4 flex h-36 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="flex-none p-5 pb-2">
                <IconBulb size={18} className="-mt-1 mr-1.5 inline-block" />
                Thinking...
              </p>
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div
                  ref={reasoningContentRef}
                  className="no-scrollbar absolute inset-0 overflow-y-auto px-5 pt-3 pb-4 text-sm"
                >
                  {reasoning}
                </div>
                <div className="pointer-events-none absolute inset-x-5 bottom-0 h-14 bg-gradient-to-t from-zinc-50 to-transparent dark:from-zinc-900" />
                <div className="pointer-events-none absolute inset-x-5 top-0 h-14 bg-gradient-to-b from-zinc-50 to-transparent dark:from-zinc-900" />
              </div>
            </div>
          )}
          {isLoading && content.length === 0 && (
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
          )}
          {animatedCleanContent.length > 0 && (
            <MemoizedMarkdown
              content={animatedCleanContent}
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
                  <ol className="mb-1.5 ml-5 list-decimal space-y-0.5 text-sm">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                hr: () => (
                  <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
                ),
              }}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
