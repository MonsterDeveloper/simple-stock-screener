import type { tickerMetricDataTable, tickersTable } from "@/shared/lib/database"
import type { InferSelectModel } from "drizzle-orm"

export type Ticker = InferSelectModel<typeof tickersTable> & {
  metrics: InferSelectModel<typeof tickerMetricDataTable>[]
}
