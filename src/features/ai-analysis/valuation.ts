import {
  getFinancialMetrics,
  searchByLineItems,
} from "@/shared/lib/financial-datasets.server"

// Valuation analysis by virattt
// https://github.com/virattt/ai-hedge-fund/blob/46375ac958e109068074a56bff263bdbbdc9ec3a/src/agents/valuation.py

export async function analyzeValuation({
  ticker,
  endDate,
  apiKey,
}: {
  ticker: string
  endDate: string
  apiKey: string
}): Promise<{
  signal: "bullish" | "bearish" | "neutral"
  confidence: number
  reasoning: {
    dcfAnalysis: {
      signal: "bullish" | "bearish" | "neutral"
      details: string
    }
    ownerEarningsAnalysis: {
      signal: "bullish" | "bearish" | "neutral"
      details: string
    }
  }
}> {
  const {
    financial_metrics: [metrics],
  } = await getFinancialMetrics({
    ticker,
    period: "ttm",
    apiKey,
    reportPeriodLte: endDate,
  })

  // Fetch specific line items needed for valuation
  const { search_results: financialLineItems } = await searchByLineItems({
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
    apiKey,
  })

  // Safety checks
  if (financialLineItems.length < 2) {
    throw new Error("Not enough financial data")
  }

  const currentFinancials = financialLineItems[0]
  const previousFinancials = financialLineItems[1]

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
 * Calculates the intrinsic value using Buffett's Owner Earnings method.
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
    (futureValues[futureValues.length - 1] * (1 + terminalGrowth)) /
    (requiredReturn - terminalGrowth)
  const terminalValueDiscounted =
    terminalValue / (1 + requiredReturn) ** numYears

  // Sum all values and apply margin of safety
  const intrinsicValue =
    futureValues.reduce((sum, val) => sum + val, 0) + terminalValueDiscounted
  return intrinsicValue * (1 - marginOfSafety)
}

/**
 * Computes the discounted cash flow (DCF) for a given company based on the current free cash flow.
 * Use this function to calculate the intrinsic value of a stock.
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
    (cashFlows[cashFlows.length - 1] * (1 + terminalGrowthRate)) /
    (discountRate - terminalGrowthRate)
  const terminalPresentValue = terminalValue / (1 + discountRate) ** numYears

  // Sum up the present values and terminal value
  const dcfValue =
    presentValues.reduce((sum, val) => sum + val, 0) + terminalPresentValue

  return dcfValue
}
