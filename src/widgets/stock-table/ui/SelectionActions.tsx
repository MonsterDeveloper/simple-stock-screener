import type { Ticker } from "@/entities/ticker"
import { Button } from "@/shared/ui/button"
import { IconWand } from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"
import { AnimatePresence, motion } from "motion/react"

export function SelectionActions({
  table,
  onAiCompareButtonClick,
}: {
  table: Table<Ticker>
  onAiCompareButtonClick: () => void
}) {
  const selectedCount = Object.keys(table.getState().rowSelection).length
  const canCompare = selectedCount >= 2 && selectedCount <= 5

  return (
    <div className="-translate-x-1/2 fixed bottom-8 left-1/2">
      <AnimatePresence>
        {(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && (
          <motion.div
            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.3, bounce: 0, type: "spring" }}
            className="flex gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 shadow-md dark:border-zinc-700 dark:bg-zinc-700/50"
          >
            <div className="flex flex-row items-center gap-x-1 text-sm">
              <div className="rounded-sm bg-blue-500/10 px-2 py-0.5 text-blue-500">
                {selectedCount}
              </div>
              selected
            </div>
            <Button
              variant="secondary"
              className="ml-4"
              onClick={() => onAiCompareButtonClick()}
              disabled={!canCompare}
            >
              <IconWand className="mr-1 size-4" />
              AI Compare
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
