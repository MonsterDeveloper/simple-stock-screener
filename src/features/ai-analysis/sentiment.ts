import {
  getCompanyNews,
  getInsiderTrades,
} from "@/shared/lib/financial-datasets.server"

// Sentiment analysis by virattt
// https://github.com/virattt/ai-hedge-fund/blob/46375ac958e109068074a56bff263bdbbdc9ec3a/src/agents/sentiment.py

export async function analyzeSentiment({
  endDate,
  apiKey,
  ticker,
}: {
  endDate: string
  apiKey: string
  ticker: string
}) {
  // Fetch insider trades
  const { insider_trades: insiderTrades } = await getInsiderTrades({
    apiKey,
    ticker,
    limit: 1000,
    filingDateLte: endDate,
  })

  const insiderSignals = insiderTrades
    .filter((trade) => typeof trade.transaction_shares === "number")
    .map((trade) =>
      (trade.transaction_shares as number) < 0 ? "bearish" : "bullish",
    )

  // Fetch company news
  const { news: companyNews } = await getCompanyNews({
    apiKey,
    ticker,
    endDate,
    limit: 100,
  })

  // Process news sentiment
  const newsSignals = companyNews.map((n) => {
    switch (n.sentiment) {
      case "negative":
        return "bearish"
      case "positive":
        return "bullish"
      default:
        return "neutral"
    }
  })

  // Calculate weighted signals
  const insiderWeight = 0.3
  const newsWeight = 0.7

  const bullishSignals =
    insiderSignals.filter((s) => s === "bullish").length * insiderWeight +
    newsSignals.filter((s) => s === "bullish").length * newsWeight

  const bearishSignals =
    insiderSignals.filter((s) => s === "bearish").length * insiderWeight +
    newsSignals.filter((s) => s === "bearish").length * newsWeight

  // Determine overall signal
  const overallSignal =
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
