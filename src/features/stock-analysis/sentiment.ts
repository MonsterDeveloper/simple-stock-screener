import type { FinancialDatasetsClient } from "@/shared/lib/financial-datasets.server"
import type { StockAnalysisSignal } from "./model"

// Sentiment analysis by virattt
// https://github.com/virattt/ai-hedge-fund/blob/46375ac958e109068074a56bff263bdbbdc9ec3a/src/agents/sentiment.py

/**
 * Analyzes insider trading signals to determine market sentiment
 *
 * @param insiderTrades - List of insider trading transactions
 * @returns Array of sentiment signals based on transaction direction
 */
function analyzeInsiderSignals(
  insiderTrades: Array<{ transaction_shares?: number }>,
): StockAnalysisSignal[] {
  return insiderTrades
    .filter((trade) => typeof trade.transaction_shares === "number")
    .map((trade) =>
      (trade.transaction_shares as number) < 0 ? "bearish" : "bullish",
    )
}

/**
 * Analyzes news sentiment signals
 *
 * @param companyNews - List of company news articles with sentiment
 * @returns Array of sentiment signals based on news sentiment
 */
function analyzeNewsSignals(
  companyNews: Array<{ sentiment: string }>,
): StockAnalysisSignal[] {
  return companyNews.map((newsItem) => {
    switch (newsItem.sentiment) {
      case "negative":
        return "bearish"
      case "positive":
        return "bullish"
      default:
        return "neutral"
    }
  })
}

/**
 * Analyzes overall market sentiment for a stock by combining insider trading and news signals
 * Uses a weighted approach where insider trades and news sentiment contribute to the final signal
 *
 * @param financialDatasets - Client for accessing financial data
 * @param ticker - Stock ticker symbol to analyze
 * @returns Object containing overall signal, confidence score, and reasoning
 */
export async function analyzeSentiment({
  financialDatasets,
  ticker,
}: {
  financialDatasets: FinancialDatasetsClient
  ticker: string
}): Promise<{
  signal: StockAnalysisSignal
  confidence: number
  reasoning: string
}> {
  // Fetch insider trades
  const { insider_trades: insiderTrades } =
    await financialDatasets.getInsiderTrades({
      ticker,
      limit: 1000,
    })

  const insiderSignals = analyzeInsiderSignals(insiderTrades)

  // Fetch company news
  const { news: companyNews } = await financialDatasets.getCompanyNews({
    ticker,
    limit: 100,
  })

  const newsSignals = analyzeNewsSignals(companyNews)

  // Calculate weighted signals
  const insiderWeight = 0.3
  const newsWeight = 0.7

  const bullishSignals =
    insiderSignals.filter((signal) => signal === "bullish").length *
      insiderWeight +
    newsSignals.filter((signal) => signal === "bullish").length * newsWeight

  const bearishSignals =
    insiderSignals.filter((signal) => signal === "bearish").length *
      insiderWeight +
    newsSignals.filter((signal) => signal === "bearish").length * newsWeight

  // Determine overall signal
  const overallSignal: StockAnalysisSignal =
    bullishSignals > bearishSignals
      ? "bullish"
      : bearishSignals > bullishSignals
        ? "bearish"
        : "neutral"

  // Calculate confidence
  const totalWeightedSignals =
    insiderSignals.length * insiderWeight + newsSignals.length * newsWeight

  const confidence =
    totalWeightedSignals > 0
      ? Math.round(
          (Math.max(bullishSignals, bearishSignals) / totalWeightedSignals) *
            100,
        )
      : 0

  const reasoning = `Weighted Bullish signals: ${bullishSignals.toFixed(1)}, Weighted Bearish signals: ${bearishSignals.toFixed(1)}`

  return {
    signal: overallSignal,
    confidence,
    reasoning,
  }
}
