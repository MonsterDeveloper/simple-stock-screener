import type {
  FinancialDatasetsClient,
  FinancialDatasetsMetrics,
} from "@/shared/lib/financial-datasets.server"
import type { StockAnalysisSignal } from "./model"

// Fundamentals analysis by virattt
// https://github.com/virattt/ai-hedge-fund/blob/46375ac958e109068074a56bff263bdbbdc9ec3a/src/agents/fundamentals.py

/**
 * Analyzes profitability metrics like ROE, net margin, and operating margin
 *
 * @param metrics - The financial metrics to analyze
 */
function analyzeProfitability(metrics: FinancialDatasetsMetrics) {
  const profitabilityScore = [
    metrics.return_on_equity > 0.15,
    metrics.net_margin > 0.2,
    metrics.operating_margin > 0.15,
  ].filter(Boolean).length

  const signal: StockAnalysisSignal =
    profitabilityScore >= 2
      ? "bullish"
      : profitabilityScore === 0
        ? "bearish"
        : "neutral"

  return [
    signal,
    {
      signal,
      details: [
        metrics.return_on_equity &&
          `ROE: ${(metrics.return_on_equity * 100).toFixed(2)}%`,
        metrics.net_margin &&
          `Net Margin: ${(metrics.net_margin * 100).toFixed(2)}%`,
        metrics.operating_margin &&
          `Op Margin: ${(metrics.operating_margin * 100).toFixed(2)}%`,
      ]
        .filter(Boolean)
        .join(", "),
    },
  ] as const
}

/**
 * Analyzes growth metrics like revenue and earnings growth
 *
 * @param metrics - The financial metrics to analyze
 */
function analyzeGrowth(metrics: FinancialDatasetsMetrics) {
  const growthScore = [
    metrics.revenue_growth > 0.1,
    metrics.earnings_growth > 0.1,
    metrics.book_value_growth > 0.1,
  ].filter(Boolean).length

  const signal: StockAnalysisSignal =
    growthScore >= 2 ? "bullish" : growthScore === 0 ? "bearish" : "neutral"

  return [
    signal,
    {
      signal,
      details: [
        metrics.revenue_growth &&
          `Revenue Growth: ${(metrics.revenue_growth * 100).toFixed(2)}%`,
        metrics.earnings_growth &&
          `Earnings Growth: ${(metrics.earnings_growth * 100).toFixed(2)}%`,
      ]
        .filter(Boolean)
        .join(", "),
    },
  ] as const
}

/**
 * Analyzes financial health metrics like current ratio, debt/equity, and cash flow
 *
 * @param metrics - The financial metrics to analyze
 */
function analyzeFinancialHealth(metrics: FinancialDatasetsMetrics) {
  const healthScore = [
    metrics.current_ratio > 1.5,
    metrics.debt_to_equity < 0.5,
    metrics.free_cash_flow_per_share &&
      metrics.earnings_per_share &&
      metrics.free_cash_flow_per_share > metrics.earnings_per_share * 0.8,
  ].filter(Boolean).length

  const signal: StockAnalysisSignal =
    healthScore >= 2 ? "bullish" : healthScore === 0 ? "bearish" : "neutral"

  return [
    signal,
    {
      signal,
      details: [
        metrics.current_ratio &&
          `Current Ratio: ${metrics.current_ratio.toFixed(2)}`,
        metrics.debt_to_equity && `D/E: ${metrics.debt_to_equity.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join(", "),
    },
  ] as const
}

/**
 * Analyzes valuation metrics like P/E, P/B, and P/S ratios
 *
 * @param metrics - The financial metrics to analyze
 */
function analyzeValuation(metrics: FinancialDatasetsMetrics) {
  const priceRatioScore = [
    metrics.price_to_earnings_ratio > 25,
    metrics.price_to_book_ratio > 3,
    metrics.price_to_sales_ratio > 5,
  ].filter(Boolean).length

  const signal: StockAnalysisSignal =
    priceRatioScore >= 2
      ? "bullish"
      : priceRatioScore === 0
        ? "bearish"
        : "neutral"

  return [
    signal,
    {
      signal,
      details: [
        metrics.price_to_earnings_ratio &&
          `P/E: ${metrics.price_to_earnings_ratio.toFixed(2)}`,
        metrics.price_to_book_ratio &&
          `P/B: ${metrics.price_to_book_ratio.toFixed(2)}`,
        metrics.price_to_sales_ratio &&
          `P/S: ${metrics.price_to_sales_ratio.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join(", "),
    },
  ] as const
}

/**
 * Analyzes the fundamental metrics of a stock to determine if it's a good investment.
 *
 * The analysis is based on four key areas:
 * 1. Profitability - ROE, net margin, operating margin
 * 2. Growth - Revenue and earnings growth
 * 3. Financial Health - Current ratio, debt/equity, cash flow
 * 4. Valuation - P/E, P/B, P/S ratios
 *
 * @param client - The financial datasets client instance to fetch data
 * @param ticker - The stock ticker symbol to analyze
 */
export async function analyzeFundamentals({
  financialDatasets,
  ticker,
}: {
  financialDatasets: FinancialDatasetsClient
  ticker: string
}) {
  // Fetch financial metrics from API
  const { financial_metrics } = await financialDatasets.getFinancialMetrics({
    ticker,
    period: "ttm",
    limit: 1,
  })

  const metrics = financial_metrics[0]
  if (!metrics) {
    throw new Error("No financial metrics found")
  }

  // Run all analyses
  const analyses = [
    ["profitability", analyzeProfitability(metrics)] as const,
    ["growth", analyzeGrowth(metrics)] as const,
    ["financial_health", analyzeFinancialHealth(metrics)] as const,
    ["price_ratios", analyzeValuation(metrics)] as const,
  ]

  // Count signals and build reasoning
  const signals = analyses.map(([, [signal]]) => signal)
  const reasoning = Object.fromEntries(
    analyses.map(([key, [, reasoning]]) => [
      `${key}_signal`,
      { ...reasoning, signal: reasoning.signal },
    ]),
  )

  // Calculate overall signal and confidence
  const signalCounts = signals.reduce(
    (acc, signal) => {
      acc[signal] = (acc[signal] || 0) + 1
      return acc
    },
    { bullish: 0, bearish: 0, neutral: 0 },
  )

  const overallSignal =
    signalCounts.bullish > signalCounts.bearish
      ? "bullish"
      : signalCounts.bearish > signalCounts.bullish
        ? "bearish"
        : "neutral"

  const confidence = Math.round(
    (Math.max(signalCounts.bullish, signalCounts.bearish) / signals.length) *
      100,
  )

  return {
    signal: overallSignal,
    confidence,
    reasoning,
  }
}
