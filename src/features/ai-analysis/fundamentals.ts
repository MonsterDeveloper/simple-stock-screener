import { getFinancialMetrics } from "@/shared/lib/financial-datasets.server"

type AnalysisSignal = "bullish" | "bearish" | "neutral"

// Fundamentals analysis by virattt
// https://github.com/virattt/ai-hedge-fund/blob/46375ac958e109068074a56bff263bdbbdc9ec3a/src/agents/fundamentals.py

// TODO simplify, refactor
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: temporary
export async function analyzeFundamentals({
  apiKey,
  ticker,
  endDate,
}: {
  apiKey: string
  ticker: string
  endDate: string
}) {
  // Fetch financial metrics from API
  const { financial_metrics } = await getFinancialMetrics({
    apiKey,
    ticker,
    period: "ttm",
    limit: 10,
    reportPeriodLte: endDate,
  })

  const metrics = financial_metrics[0]

  if (!metrics) {
    throw new Error("No financial metrics found")
  }

  const signals: AnalysisSignal[] = []
  const reasoning: Record<string, Record<string, string>> = {}

  // 1. Profitability Analysis
  const profitabilityScore = [
    metrics.return_on_equity > 0.15,
    metrics.net_margin > 0.2,
    metrics.operating_margin > 0.15,
  ].filter(Boolean).length

  signals.push(
    profitabilityScore >= 2
      ? "bullish"
      : profitabilityScore === 0
        ? "bearish"
        : "neutral",
  )
  reasoning.profitability_signal = {
    // biome-ignore lint/style/noNonNullAssertion: Definitely exists
    signal: signals[0]!,
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
  }

  // 2. Growth Analysis
  const growthScore = [
    metrics.revenue_growth > 0.1,
    metrics.earnings_growth > 0.1,
    metrics.book_value_growth > 0.1,
  ].filter(Boolean).length

  signals.push(
    growthScore >= 2 ? "bullish" : growthScore === 0 ? "bearish" : "neutral",
  )
  reasoning.growth_signal = {
    // biome-ignore lint/style/noNonNullAssertion: Definitely exists
    signal: signals[1]!,
    details: [
      metrics.revenue_growth &&
        `Revenue Growth: ${(metrics.revenue_growth * 100).toFixed(2)}%`,
      metrics.earnings_growth &&
        `Earnings Growth: ${(metrics.earnings_growth * 100).toFixed(2)}%`,
    ]
      .filter(Boolean)
      .join(", "),
  }

  // 3. Financial Health
  const healthScore = [
    metrics.current_ratio > 1.5,
    metrics.debt_to_equity < 0.5,
    metrics.free_cash_flow_per_share &&
      metrics.earnings_per_share &&
      metrics.free_cash_flow_per_share > metrics.earnings_per_share * 0.8,
  ].filter(Boolean).length

  signals.push(
    healthScore >= 2 ? "bullish" : healthScore === 0 ? "bearish" : "neutral",
  )
  reasoning.financial_health_signal = {
    // biome-ignore lint/style/noNonNullAssertion: Definitely exists
    signal: signals[2]!,
    details: [
      metrics.current_ratio &&
        `Current Ratio: ${metrics.current_ratio.toFixed(2)}`,
      metrics.debt_to_equity && `D/E: ${metrics.debt_to_equity.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join(", "),
  }

  // 4. Valuation Ratios
  const priceRatioScore = [
    metrics.price_to_earnings_ratio > 25,
    metrics.price_to_book_ratio > 3,
    metrics.price_to_sales_ratio > 5,
  ].filter(Boolean).length

  signals.push(
    priceRatioScore >= 2
      ? "bullish"
      : priceRatioScore === 0
        ? "bearish"
        : "neutral",
  )
  reasoning.price_ratios_signal = {
    // biome-ignore lint/style/noNonNullAssertion: Definitely exists
    signal: signals[3]!,
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
  }

  // Determine overall signal
  const signalCounts = signals.reduce(
    (acc, signal) => {
      acc[signal] = (acc[signal] || 0) + 1
      return acc
    },
    {} as Record<AnalysisSignal, number>,
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
