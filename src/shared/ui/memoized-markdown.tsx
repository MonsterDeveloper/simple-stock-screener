import { marked } from "marked"
import { type ComponentProps, memo, useMemo } from "react"
import ReactMarkdown from "react-markdown"

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw)
}

type ReactMarkdownComponents = ComponentProps<
  typeof ReactMarkdown
>["components"]

const MemoizedMarkdownBlock = memo(
  ({
    content,
    components,
  }: { content: string; components?: ReactMarkdownComponents }) => {
    return <ReactMarkdown components={components}>{content}</ReactMarkdown>
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) {
      return false
    }
    return true
  },
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

export const MemoizedMarkdown = memo(
  ({
    content,
    id,
    components,
  }: { content: string; id: string; components?: ReactMarkdownComponents }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock
        content={block}
        key={`${id}-block_${
          // biome-ignore lint/suspicious/noArrayIndexKey: Acceptable
          index
        }`}
        components={components}
      />
    ))
  },
)

MemoizedMarkdown.displayName = "MemoizedMarkdown"
