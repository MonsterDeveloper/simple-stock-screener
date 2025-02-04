import { inngest } from "@/shared/lib/inngest"

export const scheduledProcessing = inngest.createFunction(
  {
    id: "scheduled-ticker-processing",
  },
  {
    cron: "TZ=Europe/Berlin 00 10 1 2 *", // every 1st of February at 10:00 AM
  },
  async () => {
    const nasdaqTickers = await getNasdaqTickers()
    const nyseTickers = await getNyseTickers()

    return nasdaqTickers.length + nyseTickers.length
  },
)

async function getNasdaqTickers() {
  const response = await fetch(
    "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt",
  )
  const text = await response.text()

  const lines = text
    .split("\n")
    .map((line) => line.trim()) // trim trailing \r
    .slice(1, -1) // remove header and footer (metadata)

  return lines
    .map((line) => {
      const [
        symbol,
        name,
        category,
        testIssue,
        financialStatus,
        _,
        etf,
        nextShares,
      ] = line.split("|")

      if (
        !(
          symbol &&
          name &&
          category &&
          testIssue &&
          financialStatus &&
          etf &&
          nextShares
        )
      ) {
        return null
      }

      // Skip the tickers:
      // - test issues
      // - financial status is not normal
      // - ETFs
      // - NextShares funds
      if (
        testIssue !== "N" ||
        financialStatus !== "N" ||
        etf !== "N" ||
        nextShares !== "N"
      ) {
        return null
      }

      return {
        symbol,
        name,
      }
    })
    .filter(Boolean)
}

async function getNyseTickers() {
  const response = await fetch(
    "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt",
  )
  const text = await response.text()

  const lines = text
    .split("\n")
    .map((line) => line.trim()) // trim trailing \r
    .slice(1, -1) // remove header and footer (metadata)

  return lines
    .map((line) => {
      const [symbol, name, exchange, cqsSymbol, etf, roundLotSize, testIssue] =
        line.split("|")

      if (
        !(
          symbol &&
          name &&
          exchange &&
          cqsSymbol &&
          etf &&
          roundLotSize &&
          testIssue
        )
      ) {
        return null
      }

      // Skip the tickers:
      // - not on NYSE
      // - test issues
      // - ETFs
      if (exchange !== "N" || testIssue !== "N" || etf !== "N") {
        return null
      }

      return {
        symbol,
        name,
      }
    })
    .filter(Boolean)
}
