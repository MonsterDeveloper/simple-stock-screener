import type { FinancialDatasetsClient } from "@/shared/lib/financial-datasets.server"
import type { StockAnalysisSignal } from "./model"

// Valuation analysis by virattt
// https://github.com/virattt/ai-hedge-fund/blob/46375ac958e109068074a56bff263bdbbdc9ec3a/src/agents/valuation.py

/**
 * Analyzes the valuation of a stock using multiple methods including DCF and Owner Earnings.
 * Combines both analyses to provide a comprehensive valuation signal.
 *
 * @param params - The parameters for valuation analysis
 * @param params.ticker - The stock ticker symbol
 * @param params.apiKey - API key for financial data access
 * @param params.client - Financial datasets client instance
 * @returns An object containing the valuation signal, confidence score, and detailed reasoning
 */
export async function analyzeValuation({
  ticker,
  financialDatasets,
}: {
  ticker: string
  financialDatasets: FinancialDatasetsClient
}): Promise<{
  signal: StockAnalysisSignal
  confidence: number
  reasoning: {
    dcfAnalysis: {
      signal: StockAnalysisSignal
      details: string
    }
    ownerEarningsAnalysis: {
      signal: StockAnalysisSignal
      details: string
    }
  }
}> {
  const {
    financial_metrics: [metrics],
  } = await financialDatasets.getFinancialMetrics({
    ticker,
    period: "ttm",
  })

  if (!metrics) {
    throw new Error("No financial metrics found")
  }

  // Fetch specific line items needed for valuation
  const { search_results: financialLineItems } =
    await financialDatasets.searchByLineItems({
      tickers: [ticker],
      lineItems: [
        "free_cash_flow",
        "net_income",
        "depreciation_and_amortization",
        "capital_expenditure",
        "working_capital",
      ],
      period: "ttm",
      limit: 2,
    })

  // Safety checks
  if (financialLineItems.length < 2) {
    throw new Error("Not enough financial data")
  }

  const currentFinancials = financialLineItems[0]!
  const previousFinancials = financialLineItems[1]!

  // Calculate working capital change
  const workingCapitalChange =
    currentFinancials.working_capital - previousFinancials.working_capital

  // Owner Earnings Valuation (Buffett Method)
  const ownerEarningsValue = calculateOwnerEarningsValue({
    netIncome: currentFinancials.net_income,
    depreciation: currentFinancials.depreciation_and_amortization,
    capex: currentFinancials.capital_expenditure,
    workingCapitalChange,
    growthRate: metrics.earnings_growth,
  })

  // DCF Valuation
  const dcfValue = calculateIntrinsicValue({
    freeCashFlow: currentFinancials.free_cash_flow,
    growthRate: metrics.earnings_growth,
    discountRate: 0.1,
    terminalGrowthRate: 0.03,
    numYears: 5,
  })

  const marketCap = metrics.market_cap

  // Calculate valuation gaps
  const dcfGap = (dcfValue - marketCap) / marketCap
  const ownerEarningsGap = (ownerEarningsValue - marketCap) / marketCap
  const valuationGap = (dcfGap + ownerEarningsGap) / 2

  const signal =
    valuationGap > 0.15
      ? "bullish"
      : valuationGap < -0.15
        ? "bearish"
        : "neutral"

  return {
    signal,
    confidence: Math.round(Math.abs(valuationGap) * 100),
    reasoning: {
      dcfAnalysis: {
        signal:
          dcfGap > 0.15 ? "bullish" : dcfGap < -0.15 ? "bearish" : "neutral",
        details: `Intrinsic Value: $${dcfValue.toLocaleString()}, Market Cap: $${marketCap.toLocaleString()}, Gap: ${(dcfGap * 100).toFixed(1)}%`,
      },
      ownerEarningsAnalysis: {
        signal:
          ownerEarningsGap > 0.15
            ? "bullish"
            : ownerEarningsGap < -0.15
              ? "bearish"
              : "neutral",
        details: `Owner Earnings Value: $${ownerEarningsValue.toLocaleString()}, Market Cap: $${marketCap.toLocaleString()}, Gap: ${(ownerEarningsGap * 100).toFixed(1)}%`,
      },
    },
  }
}

/**
 * Calculates the intrinsic value of a company using Warren Buffett's Owner Earnings method.
 * This method considers net income, depreciation, capital expenditures, and working capital changes
 * to determine a more accurate picture of a company's true earnings power.
 *
 *
 * @param params - Parameters for owner earnings calculation
 * @param params.netIncome - Net income from the most recent period
 * @param params.depreciation - Depreciation and amortization expenses
 * @param params.capex - Capital expenditures
 * @param params.workingCapitalChange - Change in working capital
 * @param params.growthRate - Expected growth rate (default: 5%)
 * @param params.requiredReturn - Required rate of return (default: 15%)
 * @param params.marginOfSafety - Margin of safety to apply (default: 25%)
 * @param params.numYears - Number of years to project (default: 5)
 * @returns The calculated intrinsic value using owner earnings method
 */
function calculateOwnerEarningsValue({
  netIncome,
  depreciation,
  capex,
  workingCapitalChange,
  growthRate = 0.05,
  requiredReturn = 0.15,
  marginOfSafety = 0.25,
  numYears = 5,
}: {
  netIncome: number
  depreciation: number
  capex: number
  workingCapitalChange: number
  growthRate?: number
  requiredReturn?: number
  marginOfSafety?: number
  numYears?: number
}): number {
  // Calculate initial owner earnings
  const ownerEarnings = netIncome + depreciation - capex - workingCapitalChange

  if (ownerEarnings <= 0) {
    return 0
  }

  // Project future owner earnings
  const futureValues = Array.from({ length: numYears }, (_, year) => {
    const futureValue = ownerEarnings * (1 + growthRate) ** (year + 1)
    return futureValue / (1 + requiredReturn) ** (year + 1)
  })

  // Calculate terminal value
  const terminalGrowth = Math.min(growthRate, 0.03)
  const terminalValue =
    (futureValues[futureValues.length - 1]! * (1 + terminalGrowth)) /
    (requiredReturn - terminalGrowth)
  const terminalValueDiscounted =
    terminalValue / (1 + requiredReturn) ** numYears

  // Sum all values and apply margin of safety
  const intrinsicValue =
    futureValues.reduce((sum, val) => sum + val, 0) + terminalValueDiscounted
  return intrinsicValue * (1 - marginOfSafety)
}

/**
 * Calculates the intrinsic value of a company using the Discounted Cash Flow (DCF) method.
 * This method projects future free cash flows and discounts them back to present value.
 *
 * @see https://www.investopedia.com/terms/d/dcf.asp
 *
 * @param params - Parameters for DCF calculation
 * @param params.freeCashFlow - Current free cash flow
 * @param params.growthRate - Expected growth rate
 * @param params.discountRate - Rate used to discount future cash flows
 * @param params.terminalGrowthRate - Long-term growth rate for terminal value
 * @param params.numYears - Number of years to project
 * @returns The calculated intrinsic value using DCF method
 */
function calculateIntrinsicValue({
  freeCashFlow,
  growthRate,
  discountRate,
  terminalGrowthRate,
  numYears,
}: {
  freeCashFlow: number
  growthRate: number
  discountRate: number
  terminalGrowthRate: number
  numYears: number
}): number {
  // Estimate the future cash flows based on the growth rate
  const cashFlows = Array.from(
    { length: numYears },
    (_, i) => freeCashFlow * (1 + growthRate) ** i,
  )

  // Calculate the present value of projected cash flows
  const presentValues = cashFlows.map(
    (cf, i) => cf / (1 + discountRate) ** (i + 1),
  )

  // Calculate the terminal value
  const terminalValue =
    (cashFlows[cashFlows.length - 1]! * (1 + terminalGrowthRate)) /
    (discountRate - terminalGrowthRate)
  const terminalPresentValue = terminalValue / (1 + discountRate) ** numYears

  // Sum up the present values and terminal value
  const dcfValue =
    presentValues.reduce((sum, val) => sum + val, 0) + terminalPresentValue

  return dcfValue
}
