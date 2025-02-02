import { relations, sql } from "drizzle-orm"
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const tickersTable = sqliteTable("tickers", {
  symbol: text("symbol").primaryKey(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  revenueGrowthPercentage: integer("revenue_growth_percentage").notNull(),
  earningsGrowthPercentage: integer("earnings_growth_percentage").notNull(),
  fcfEarningsRatio: integer("fcf_earnings_ratio").notNull(),
  roic: integer("roic").notNull(),
  netDebtToFcff: integer("net_debt_to_fcf").notNull(),
  debtToEquity: integer("debt_to_equity").notNull(),

  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
})

export const tickersTableRelations = relations(tickersTable, ({ many }) => ({
  metrics: many(tickerMetricDataTable),
}))

export const tickerMetricDataTable = sqliteTable(
  "ticker_metric_data",
  {
    symbol: text("ticker_id").references(() => tickersTable.symbol),
    reportPeriod: text("report_period").notNull(),
    period: text("period").notNull(),
    currency: text("currency").notNull(),
    revenue: integer("revenue").notNull(),
    netIncome: integer("net_income").notNull(),
    netCashFlowFromOperations: integer(
      "net_cash_flow_from_operations",
    ).notNull(),
    capitalExpenditure: integer("capital_expenditure").notNull(),
    ebit: integer("ebit").notNull(),
    incomeTaxExpense: integer("income_tax_expense").notNull(),
    totalDebt: integer("total_debt").notNull(),
    cashAndEquivalents: integer("cash_and_equivalents").notNull(),
    shareholdersEquity: integer("shareholders_equity").notNull(),

    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [primaryKey({ columns: [table.symbol, table.reportPeriod] })],
)

export const tickerMetricDataTableRelations = relations(
  tickerMetricDataTable,
  ({ one }) => ({
    ticker: one(tickersTable, {
      fields: [tickerMetricDataTable.symbol],
      references: [tickersTable.symbol],
    }),
  }),
)
