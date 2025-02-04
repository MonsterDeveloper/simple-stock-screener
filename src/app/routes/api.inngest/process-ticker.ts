import { tickerMetricDataTable, tickersTable } from "@/shared/lib/database"
import { inngest } from "@/shared/lib/inngest"

export const processTicker = inngest.createFunction(
  {
    id: "process-ticker",
  },
  {
    event: "ticker.process",
  },
  async ({ database, event, financialDatasets }) => {
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
      tickers: [event.data.ticker],
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

      const metrics = calculateMetrics(current, previous)

      await database.insert(tickersTable).values({
        symbol: ticker,
        name: "test",
        exchange: "test",
        ...metrics,
      })

      await database.insert(tickerMetricDataTable).values(
        sortedData.map((item) => ({
          symbol: ticker,
          ...item,
          reportPeriod: item.report_period,
          capitalExpenditure: item.capital_expenditure,
          incomeTaxExpense: item.income_tax_expense,
          netCashFlowFromOperations: item.net_cash_flow_from_operations,
          netIncome: item.net_income,
          totalDebt: item.total_debt,
          cashAndEquivalents: item.cash_and_equivalents,
          shareholdersEquity: item.shareholders_equity,
        })),
      )
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
  const revenueGrowthPercentage = (current.revenue / previous.revenue - 1) * 100

  // Earnings Growth
  const earningsGrowthPercentage =
    (current.net_income / previous.net_income - 1) * 100

  // FCF / Earnings
  const fcf =
    current.net_cash_flow_from_operations - current.capital_expenditure
  const fcfEarningsRatio = (fcf / current.net_income) * 100

  // ROIC
  const nopat = current.ebit - current.income_tax_expense
  const investedCapital = current.total_debt + current.shareholders_equity
  const roic = (nopat / investedCapital) * 100

  // Net Debt / FCF
  const netDebt = current.total_debt - current.cash_and_equivalents
  // using FCF as a proxy for FCFF in this simplified model
  const netDebtToFcff = netDebt / fcf

  // Debt / Equity
  const debtToEquity = (current.total_debt / current.shareholders_equity) * 100

  return {
    revenueGrowthPercentage,
    earningsGrowthPercentage,
    fcfEarningsRatio,
    roic,
    netDebtToFcff,
    debtToEquity,
  }
}
