import type {
  FinancialDatasetsClient,
  FinancialDatasetsPrice,
} from "@/shared/lib/financial-datasets.server"
import { subMonths } from "date-fns"
import type { StockAnalysisSignal } from "./model"

/**
 * Converts price data into a DataFrame-like structure with parallel arrays
 * for easier technical analysis calculations
 *
 * @param prices - Array of price data points with OHLCV values
 * @returns Object with parallel arrays for open, high, low, close, and volume
 */
function pricesToDf(prices: FinancialDatasetsPrice[]) {
  return {
    open: prices.map((price) => price.open),
    high: prices.map((price) => price.high),
    low: prices.map((price) => price.low),
    close: prices.map((price) => price.close),
    volume: prices.map((price) => price.volume),
  }
}

/**
 * Performs technical analysis on a stock using various indicators and strategies
 *
 * Analyzes:
 * - Trend following (EMAs, ADX)
 * - Mean reversion (Bollinger Bands, RSI)
 * - Momentum (Price momentum, Volume momentum)
 * - Volatility (Historical volatility, ATR)
 *
 * @param params - Analysis parameters
 * @param params.financialDatasets - Client for accessing financial data
 * @param params.ticker - Stock ticker symbol to analyze
 * @returns Object containing signal, confidence score and detailed metrics for each strategy
 */
export async function analyzeTechnicals({
  financialDatasets,
  ticker,
}: {
  financialDatasets: FinancialDatasetsClient
  ticker: string
}) {
  const startDate = subMonths(new Date(), 3)
  const { prices } = await financialDatasets.getPrices({
    ticker,
    startDate,
    endDate: new Date(),
  })
  if (!prices || prices.length === 0) {
    return { error: "No price data found" }
  }

  // Convert price array to a simplified "DataFrame"-like structure
  const df = pricesToDf(prices)

  // Calculate signals
  const trendSignals = calculateTrendSignals(df)
  const meanReversionSignals = calculateMeanReversionSignals(df)
  const momentumSignals = calculateMomentumSignals(df)
  const volatilitySignals = calculateVolatilitySignals(df)

  // Weights for combined signal
  const strategyWeights = {
    trend: 0.25,
    meanReversion: 0.2,
    momentum: 0.25,
    volatility: 0.15,
  }

  // Combine signals
  const combinedSignal = weightedSignalCombination(
    {
      trend: trendSignals,
      meanReversion: meanReversionSignals,
      momentum: momentumSignals,
      volatility: volatilitySignals,
    },
    strategyWeights,
  )

  // Final object replicating the Python structure
  return {
    signal: combinedSignal.signal,
    confidence: Math.round(combinedSignal.confidence * 100),
    strategySignals: {
      trendFollowing: {
        signal: trendSignals.signal,
        confidence: Math.round(trendSignals.confidence * 100),
        metrics: normalizePandas(trendSignals.metrics),
      },
      meanReversion: {
        signal: meanReversionSignals.signal,
        confidence: Math.round(meanReversionSignals.confidence * 100),
        metrics: normalizePandas(meanReversionSignals.metrics),
      },
      momentum: {
        signal: momentumSignals.signal,
        confidence: Math.round(momentumSignals.confidence * 100),
        metrics: normalizePandas(momentumSignals.metrics),
      },
      volatility: {
        signal: volatilitySignals.signal,
        confidence: Math.round(volatilitySignals.confidence * 100),
        metrics: normalizePandas(volatilitySignals.metrics),
      },
    },
  }
}

/**
 * Calculates trend following signals using EMAs and ADX
 *
 * @param df - DataFrame-like price data structure
 * @returns Object containing signal, confidence and trend metrics
 */
function calculateTrendSignals(df: ReturnType<typeof pricesToDf>): {
  signal: StockAnalysisSignal
  confidence: number
  metrics: {
    adx: number
    trendStrength: number
  }
} {
  const ema8 = calculateEma(df.close, 8)
  const ema21 = calculateEma(df.close, 21)
  const ema55 = calculateEma(df.close, 55)
  const adxData = calculateAdx(df, 14)

  const lastEma8 = ema8[ema8.length - 1] ?? 0
  const lastEma21 = ema21[ema21.length - 1] ?? 0
  const lastEma55 = ema55[ema55.length - 1] ?? 0
  const lastAdx = adxData.adx[adxData.adx.length - 1] ?? 0

  const shortTrend = lastEma8 > lastEma21
  const mediumTrend = lastEma21 > lastEma55
  const trendStrength = lastAdx / 100

  let signal: StockAnalysisSignal = "neutral"
  let confidence = 0.5
  if (shortTrend && mediumTrend) {
    signal = "bullish"
    confidence = trendStrength
  } else if (!(shortTrend || mediumTrend)) {
    signal = "bearish"
    confidence = trendStrength
  }

  return {
    signal,
    confidence,
    metrics: {
      adx: lastAdx,
      trendStrength,
    },
  }
}

/**
 * Calculates mean reversion signals using Bollinger Bands and RSI
 *
 * @param df - DataFrame-like price data structure
 * @returns Object containing signal, confidence and mean reversion metrics
 */
function calculateMeanReversionSignals(df: ReturnType<typeof pricesToDf>): {
  signal: StockAnalysisSignal
  confidence: number
  metrics: {
    zScore: number
    priceVsBb: number
    rsi14: number
    rsi28: number
  }
} {
  const close = df.close
  const ma50 = rollingMean(close, 50)
  const std50 = rollingStd(close, 50)

  // z-score = (price - ma50) / std50
  const zScore = []
  for (let i = 0; i < close.length; i++) {
    const standardDeviation = std50[i] ?? 0
    const mean = ma50[i] ?? 0
    const currentPrice = close[i] ?? 0
    const score =
      standardDeviation === 0 ? 0 : (currentPrice - mean) / standardDeviation
    zScore.push(score)
  }

  const { upperBand: bbUpper, lowerBand: bbLower } = calculateBollingerBands(
    close,
    20,
  )
  const rsi14 = calculateRsi(close, 14)
  const rsi28 = calculateRsi(close, 28)

  const lastClose = close[close.length - 1] ?? 0
  const lastBbUpper = bbUpper[bbUpper.length - 1] ?? 0
  const lastBbLower = bbLower[bbLower.length - 1] ?? 0
  const lastZ = zScore[zScore.length - 1] ?? 0

  // priceVsBb = (lastClose - lowerBand) / (upperBand - lowerBand)
  let priceVsBb = 0.5
  const denom = lastBbUpper - lastBbLower
  if (denom !== 0) {
    priceVsBb = (lastClose - lastBbLower) / denom
  }

  let signal: StockAnalysisSignal = "neutral"
  let confidence = 0.5
  if (lastZ < -2 && priceVsBb < 0.2) {
    signal = "bullish"
    confidence = Math.min(Math.abs(lastZ) / 4, 1.0)
  } else if (lastZ > 2 && priceVsBb > 0.8) {
    signal = "bearish"
    confidence = Math.min(Math.abs(lastZ) / 4, 1.0)
  }

  return {
    signal,
    confidence,
    metrics: {
      zScore: lastZ,
      priceVsBb,
      rsi14: rsi14[rsi14.length - 1] ?? 0,
      rsi28: rsi28[rsi28.length - 1] ?? 0,
    },
  }
}

/**
 * Calculates momentum signals using price and volume momentum
 *
 * @param df - DataFrame-like price data structure
 * @returns Object containing signal, confidence and momentum metrics
 */
function calculateMomentumSignals(df: ReturnType<typeof pricesToDf>): {
  signal: StockAnalysisSignal
  confidence: number
  metrics: {
    momentum1m: number
    momentum3m: number
    momentum6m: number
    volumeMomentum: number
  }
} {
  const close = df.close
  // daily returns
  const returns = pctChange(close)

  // 1m ~ 21 days, 3m ~ 63 days, 6m ~ 126 days
  const mom1m = rollingSum(returns, 21)
  const mom3m = rollingSum(returns, 63)
  const mom6m = rollingSum(returns, 126)

  // volume momentum: volume / 21-day MA
  const volMa = rollingMean(df.volume, 21)
  const volumeMomentum = df.volume.map((volume, i) => {
    const mean = volMa[i] ?? 1
    return volume / mean
  })

  // Weighted multi-factor momentum
  const lastMom1m = mom1m[mom1m.length - 1] ?? 0
  const lastMom3m = mom3m[mom3m.length - 1] ?? 0
  const lastMom6m = mom6m[mom6m.length - 1] ?? 0
  const momentumScore = 0.4 * lastMom1m + 0.3 * lastMom3m + 0.3 * lastMom6m
  const lastVolumeMomentum = volumeMomentum[volumeMomentum.length - 1] ?? 0
  const volumeConfirmation = lastVolumeMomentum > 1

  let signal: StockAnalysisSignal = "neutral"
  let confidence = 0.5
  if (momentumScore > 0.05 && volumeConfirmation) {
    signal = "bullish"
    confidence = Math.min(Math.abs(momentumScore) * 5, 1.0)
  } else if (momentumScore < -0.05 && volumeConfirmation) {
    signal = "bearish"
    confidence = Math.min(Math.abs(momentumScore) * 5, 1.0)
  }

  return {
    signal,
    confidence,
    metrics: {
      momentum1m: lastMom1m,
      momentum3m: lastMom3m,
      momentum6m: lastMom6m,
      volumeMomentum: lastVolumeMomentum,
    },
  }
}

/**
 * Calculates volatility signals using historical volatility and ATR
 *
 * @param df - DataFrame-like price data structure
 * @returns Object containing signal, confidence and volatility metrics
 */
function calculateVolatilitySignals(df: ReturnType<typeof pricesToDf>): {
  signal: StockAnalysisSignal
  confidence: number
  metrics: {
    historicalVolatility: number
    volatilityRegime: number
    volatilityZScore: number
    atrRatio: number
  }
} {
  const close = df.close
  const returns = pctChange(close)

  // historical volatility (21-day std * sqrt(252))
  const rollingStd21 = rollingStd(returns, 21)
  const histVol = rollingStd21.map((std) => (std ?? 0) * Math.sqrt(252))

  // volatility regime detection: histVol / 63-day MA of histVol
  const volMa63 = rollingMean(histVol, 63)
  const volRegime = histVol.map((volatility, i) => {
    const mean = volMa63[i] ?? 1
    return volatility / mean
  })

  // volatility z-score: (histVol - volMa63) / std(histVol over 63)
  const stdVol63 = rollingStd(histVol, 63)
  const volZScore = histVol.map((volatility, i) => {
    const mean = volMa63[i] ?? 0
    const std = stdVol63[i] ?? 1
    return (volatility - mean) / std
  })

  const atrVals = calculateAtr(df, 14)
  const atrRatio = atrVals.map((atr, i) => {
    const currentClose = close[i] ?? 1
    return atr / currentClose
  })

  const lastVolRegime = volRegime[volRegime.length - 1] ?? 0
  const lastVolZ = volZScore[volZScore.length - 1] ?? 0
  const lastAtrRatio = atrRatio[atrRatio.length - 1] ?? 0
  let signal: StockAnalysisSignal = "neutral"
  let confidence = 0.5

  if (lastVolRegime < 0.8 && lastVolZ < -1) {
    signal = "bullish"
    confidence = Math.min(Math.abs(lastVolZ) / 3, 1.0)
  } else if (lastVolRegime > 1.2 && lastVolZ > 1) {
    signal = "bearish"
    confidence = Math.min(Math.abs(lastVolZ) / 3, 1.0)
  }

  return {
    signal,
    confidence,
    metrics: {
      historicalVolatility: histVol[histVol.length - 1] ?? 0,
      volatilityRegime: lastVolRegime,
      volatilityZScore: lastVolZ,
      atrRatio: lastAtrRatio,
    },
  }
}

/**
 * Combines multiple technical signals into a single weighted signal
 *
 * @param signals - Object containing signals from different strategies
 * @param weights - Object containing weights for each strategy
 * @returns Object containing combined signal and confidence
 */
function weightedSignalCombination(
  signals: {
    trend: { signal: StockAnalysisSignal; confidence: number }
    meanReversion: { signal: StockAnalysisSignal; confidence: number }
    momentum: { signal: StockAnalysisSignal; confidence: number }
    volatility: { signal: StockAnalysisSignal; confidence: number }
  },
  weights: {
    trend: number
    meanReversion: number
    momentum: number
    volatility: number
  },
): { signal: StockAnalysisSignal; confidence: number } {
  const signalValues: Record<StockAnalysisSignal, number> = {
    bullish: 1,
    neutral: 0,
    bearish: -1,
  }

  let weightedSum = 0
  let totalConfidence = 0

  for (const strategy of Object.keys(signals)) {
    const signal = signals[strategy as keyof typeof signals]
    const numericSignal = signalValues[signal.signal]
    const weight = weights[strategy as keyof typeof weights]
    const confidence = signal.confidence
    weightedSum += numericSignal * weight * confidence
    totalConfidence += weight * confidence
  }

  let finalScore = 0
  if (totalConfidence > 0) {
    finalScore = weightedSum / totalConfidence
  }

  let signal: StockAnalysisSignal = "neutral"
  if (finalScore > 0.2) {
    signal = "bullish"
  } else if (finalScore < -0.2) {
    signal = "bearish"
  }

  return { signal, confidence: Math.abs(finalScore) }
}

/**
 * Utility to convert "DataFrame" to plain objects
 *
 * @param metrics - Object containing technical analysis metrics
 * @returns The same object, normalized for consistency
 */
function normalizePandas<T extends Record<string, unknown>>(metrics: T): T {
  return metrics
}

/**
 * Calculates percent change between consecutive values
 *
 * @param values - Array of numeric values
 * @returns Array of percent changes
 */
function pctChange(values: number[]): number[] {
  const changes = [0]
  for (let i = 1; i < values.length; i++) {
    const previous = values[i - 1] ?? 0
    changes.push(previous ? ((values[i] ?? 0) - previous) / previous : 0)
  }
  return changes
}

/**
 * Calculates rolling mean over a window
 *
 * @param values - Array of numeric values
 * @param window - Window size for calculation
 * @returns Array of rolling means
 */
function rollingMean(values: number[], window: number): number[] {
  const means = []
  let sum = 0
  const queue: number[] = []
  for (let i = 0; i < values.length; i++) {
    const value = values[i] ?? 0
    queue.push(value)
    sum += value
    if (queue.length > window) {
      sum -= queue.shift() ?? 0
    }
    if (i < window - 1) {
      means.push(Number.NaN)
    } else {
      means.push(sum / window)
    }
  }
  return means
}

/**
 * Calculates rolling standard deviation over a window
 *
 * @param values - Array of numeric values
 * @param window - Window size for calculation
 * @returns Array of rolling standard deviations
 */
function rollingStd(values: number[], window: number): number[] {
  const standardDeviations = []
  const queue: number[] = []
  let sum = 0
  let sumSquared = 0
  for (let i = 0; i < values.length; i++) {
    const value = values[i] ?? 0
    queue.push(value)
    sum += value
    sumSquared += value * value
    if (queue.length > window) {
      const removed = queue.shift() ?? 0
      sum -= removed
      sumSquared -= removed * removed
    }
    if (i < window - 1) {
      standardDeviations.push(Number.NaN)
    } else {
      const mean = sum / window
      const variance = sumSquared / window - mean * mean
      standardDeviations.push(Math.sqrt(variance >= 0 ? variance : 0))
    }
  }
  return standardDeviations
}

/**
 * Calculates rolling sum over a window
 *
 * @param values - Array of numeric values
 * @param window - Window size for calculation
 * @returns Array of rolling sums
 */
function rollingSum(values: number[], window: number): number[] {
  const sums = []
  let sum = 0
  const queue: number[] = []
  for (let i = 0; i < values.length; i++) {
    const value = values[i] ?? 0
    queue.push(value)
    sum += value
    if (queue.length > window) {
      sum -= queue.shift() ?? 0
    }
    if (i < window - 1) {
      sums.push(Number.NaN)
    } else {
      sums.push(sum)
    }
  }
  return sums
}

/**
 * Calculates exponential moving average
 *
 * @param values - Array of numeric values
 * @param span - Span for EMA calculation
 * @returns Array of EMA values
 */
function calculateEma(values: number[], span: number): number[] {
  const emaValues = []
  let previousEma = 0
  const alpha = 2 / (span + 1)
  for (let i = 0; i < values.length; i++) {
    const value = values[i] ?? 0
    if (i === 0) {
      previousEma = value
    } else {
      previousEma = alpha * value + (1 - alpha) * previousEma
    }
    emaValues.push(previousEma)
  }
  return emaValues
}

/**
 * Calculates Average Directional Index (ADX)
 *
 * @param df - DataFrame-like price data structure
 * @param period - Period for ADX calculation
 * @returns Object containing ADX and directional indicators
 */

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ADX calculation requires multiple nested conditions and loops to handle directional movements and smoothing
function calculateAdx(
  df: ReturnType<typeof pricesToDf>,
  period: number,
): {
  adx: number[]
  plusDi: number[]
  minusDi: number[]
} {
  const high = df.high
  const low = df.low
  const close = df.close

  // True range
  const trueRange: number[] = []
  const plusDm: number[] = []
  const minusDm: number[] = []

  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      trueRange.push(0)
      plusDm.push(0)
      minusDm.push(0)
      continue
    }
    const currentHigh = high[i] ?? 0
    const currentLow = low[i] ?? 0
    const previousClose = close[i - 1] ?? 0
    const previousHigh = high[i - 1] ?? 0
    const previousLow = low[i - 1] ?? 0

    const highLow = currentHigh - currentLow
    const highClose = Math.abs(currentHigh - previousClose)
    const lowClose = Math.abs(currentLow - previousClose)
    trueRange.push(Math.max(highLow, highClose, lowClose))

    const upMove = currentHigh - previousHigh
    const downMove = previousLow - currentLow
    if (upMove > downMove && upMove > 0) {
      plusDm.push(upMove)
    } else {
      plusDm.push(0)
    }
    if (downMove > upMove && downMove > 0) {
      minusDm.push(downMove)
    } else {
      minusDm.push(0)
    }
  }

  const trueRangeEma = calculateEma(trueRange, period)
  const plusDmEma = calculateEma(plusDm, period)
  const minusDmEma = calculateEma(minusDm, period)

  const plusDi = []
  const minusDi = []
  const dx = []
  for (let i = 0; i < trueRangeEma.length; i++) {
    if (trueRangeEma[i] === 0) {
      plusDi.push(0)
      minusDi.push(0)
      dx.push(0)
    } else {
      const currentTrueRange = trueRangeEma[i] ?? 0
      const currentPlusDm = plusDmEma[i] ?? 0
      const currentMinusDm = minusDmEma[i] ?? 0
      const pdi = (currentPlusDm / currentTrueRange) * 100
      const mdi = (currentMinusDm / currentTrueRange) * 100
      plusDi.push(pdi)
      minusDi.push(mdi)
      const diff = Math.abs(pdi - mdi)
      const sum = pdi + mdi
      dx.push(sum === 0 ? 0 : (diff / sum) * 100)
    }
  }

  const adx = calculateEma(dx, period)
  return {
    adx,
    plusDi,
    minusDi,
  }
}

/**
 * Calculates Average True Range (ATR)
 *
 * @param df - DataFrame-like price data structure
 * @param period - Period for ATR calculation
 * @returns Array of ATR values
 */
function calculateAtr(
  df: ReturnType<typeof pricesToDf>,
  period: number,
): number[] {
  const high = df.high
  const low = df.low
  const close = df.close
  const trueRange: number[] = []
  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      trueRange.push(0)
      continue
    }
    const currentHigh = high[i] ?? 0
    const currentLow = low[i] ?? 0
    const previousClose = close[i - 1] ?? 0

    const highLow = currentHigh - currentLow
    const highClose = Math.abs(currentHigh - previousClose)
    const lowClose = Math.abs(currentLow - previousClose)
    trueRange.push(Math.max(highLow, highClose, lowClose))
  }
  return rollingMean(trueRange, period) // Using simple MA to mimic the example
}

/**
 * Calculates Bollinger Bands
 *
 * @param values - Array of numeric values
 * @param window - Window size for calculation
 * @returns Object containing upper and lower bands
 */
function calculateBollingerBands(
  values: number[],
  window: number,
): { upperBand: number[]; lowerBand: number[] } {
  const sma = rollingMean(values, window)
  const standardDeviation = rollingStd(values, window)
  const upperBand = []
  const lowerBand = []
  for (let i = 0; i < values.length; i++) {
    const mean = sma[i] ?? 0
    const std = standardDeviation[i] ?? 0
    if (Number.isNaN(mean) || Number.isNaN(std)) {
      upperBand.push(Number.NaN)
      lowerBand.push(Number.NaN)
    } else {
      upperBand.push(mean + 2 * std)
      lowerBand.push(mean - 2 * std)
    }
  }
  return { upperBand, lowerBand }
}

/**
 * Calculates Relative Strength Index (RSI)
 *
 * @param close - Array of closing prices
 * @param period - Period for RSI calculation
 * @returns Array of RSI values
 */
function calculateRsi(close: number[], period: number): number[] {
  const rsi: number[] = []
  const gainsQueue: number[] = []
  const lossesQueue: number[] = []
  let averageGain = 0
  let averageLoss = 0

  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      rsi.push(Number.NaN)
      continue
    }
    const currentClose = close[i] ?? 0
    const previousClose = close[i - 1] ?? 0
    const delta = currentClose - previousClose
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? -delta : 0
    gainsQueue.push(gain)
    lossesQueue.push(loss)
    if (gainsQueue.length > period) {
      gainsQueue.shift()
      lossesQueue.shift()
    }
    averageGain = arrayMean(gainsQueue)
    averageLoss = arrayMean(lossesQueue)
    if (averageLoss === 0) {
      rsi.push(100)
    } else {
      const relativeStrength = averageGain / averageLoss
      rsi.push(100 - 100 / (1 + relativeStrength))
    }
  }
  return rsi
}

/**
 * Calculates mean of an array of numbers
 *
 * @param array - Array of numeric values
 * @returns Mean value
 */
function arrayMean(array: number[]): number {
  if (!array.length) {
    return 0
  }
  let sum = 0
  for (const value of array) {
    sum += value
  }
  return sum / array.length
}
