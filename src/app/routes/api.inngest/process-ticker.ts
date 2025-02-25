import { tickerMetricDataTable, tickersTable } from "@/shared/lib/database"
import { inngest } from "@/shared/lib/inngest"
import { sql } from "drizzle-orm"

export const processTicker = inngest.createFunction(
  {
    id: "process-ticker",
    batchEvents: {
      maxSize: 5,
      timeout: "30s",
    },
  },
  {
    event: "ticker.process",
  },
  async ({ database, events, financialDatasets }) => {
    const data = await financialDatasets.searchByLineItems({
      lineItems: [
        "revenue",
        "net_income",
        "net_cash_flow_from_operations",
        "capital_expenditure",
        "ebit",
        "income_tax_expense",
        "total_debt",
        "cash_and_equivalents",
        "shareholders_equity",
      ],
      tickers: events.map((event) => event.data.ticker),
      limit: 2,
      period: "annual",
    })

    const dataPerTicker = Object.groupBy(
      data.search_results,
      (item) => item.ticker,
    )

    for (const [ticker, data] of Object.entries(dataPerTicker)) {
      if (!data) {
        continue
      }

      const sortedData = data.toSorted((a, b) => {
        const dateA = new Date(a.report_period)
        const dateB = new Date(b.report_period)
        return dateB.getTime() - dateA.getTime()
      })

      const [current, previous] = sortedData

      if (!(current && previous)) {
        continue
      }

      if (!(current.currency && previous.currency)) {
        continue
      }

      const metrics = calculateMetrics(current, previous)

      await database
        .insert(tickersTable)
        .values({
          symbol: ticker,
          ...metrics,
        })
        .onConflictDoUpdate({
          target: tickersTable.symbol,
          set: {
            ...metrics,
            updatedAt: new Date(),
          },
        })

      await database
        .insert(tickerMetricDataTable)
        .values(
          sortedData.map((item) => ({
            symbol: ticker,
            reportPeriod: item.report_period,
            period: item.period,
            currency: item.currency!,
            revenue: item.revenue,
            ebit: item.ebit,
            capitalExpenditure: item.capital_expenditure,
            incomeTaxExpense: item.income_tax_expense,
            netCashFlowFromOperations: item.net_cash_flow_from_operations,
            netIncome: item.net_income,
            totalDebt: item.total_debt,
            cashAndEquivalents: item.cash_and_equivalents,
            shareholdersEquity: item.shareholders_equity,
          })),
        )
        .onConflictDoUpdate({
          target: [
            tickerMetricDataTable.symbol,
            tickerMetricDataTable.reportPeriod,
          ],
          set: {
            currency: sql.raw(
              `excluded.${tickerMetricDataTable.currency.name}`,
            ),
            revenue: sql.raw(`excluded.${tickerMetricDataTable.revenue.name}`),
            ebit: sql.raw(`excluded.${tickerMetricDataTable.ebit.name}`),
            capitalExpenditure: sql.raw(
              `excluded.${tickerMetricDataTable.capitalExpenditure.name}`,
            ),
            incomeTaxExpense: sql.raw(
              `excluded.${tickerMetricDataTable.incomeTaxExpense.name}`,
            ),
            netCashFlowFromOperations: sql.raw(
              `excluded.${tickerMetricDataTable.netCashFlowFromOperations.name}`,
            ),
            netIncome: sql.raw(
              `excluded.${tickerMetricDataTable.netIncome.name}`,
            ),
            totalDebt: sql.raw(
              `excluded.${tickerMetricDataTable.totalDebt.name}`,
            ),
            cashAndEquivalents: sql.raw(
              `excluded.${tickerMetricDataTable.cashAndEquivalents.name}`,
            ),
            shareholdersEquity: sql.raw(
              `excluded.${tickerMetricDataTable.shareholdersEquity.name}`,
            ),
            updatedAt: new Date(),
          },
        })
    }
  },
)

type SearchResult = {
  revenue: number
  net_income: number
  net_cash_flow_from_operations: number
  capital_expenditure: number
  ebit: number
  income_tax_expense: number
  total_debt: number
  cash_and_equivalents: number
  shareholders_equity: number
}

function calculateMetrics(current: SearchResult, previous: SearchResult) {
  // Revenue Growth
  const revenueGrowthPercentage =
    previous.revenue === 0 ? 0 : (current.revenue / previous.revenue - 1) * 100

  // Earnings Growth
  const earningsGrowthPercentage =
    previous.net_income === 0
      ? 0
      : (current.net_income / previous.net_income - 1) * 100

  // FCF / Earnings
  const fcf =
    current.net_cash_flow_from_operations - current.capital_expenditure
  const fcfEarningsRatio =
    current.net_income === 0 ? 0 : (fcf / current.net_income) * 100

  // ROIC
  const nopat = current.ebit - current.income_tax_expense
  const investedCapital = current.total_debt + current.shareholders_equity
  const roic = investedCapital === 0 ? 0 : (nopat / investedCapital) * 100

  // Net Debt / FCF
  const netDebt = current.total_debt - current.cash_and_equivalents
  // using FCF as a proxy for FCFF in this simplified model
  const netDebtToFcff = fcf === 0 ? 0 : netDebt / fcf

  // Debt / Equity
  const debtToEquity =
    current.shareholders_equity === 0
      ? 0
      : (current.total_debt / current.shareholders_equity) * 100

  return {
    revenueGrowthPercentage,
    earningsGrowthPercentage,
    fcfEarningsRatio,
    roic,
    netDebtToFcff,
    debtToEquity,
  }
}
