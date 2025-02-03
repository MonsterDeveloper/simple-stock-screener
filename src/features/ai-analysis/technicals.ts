import { getPrices } from "@/shared/lib/financial-datasets.server"
import { subMonths } from "date-fns"

// Technical analysis by virattt
// https://github.com/virattt/ai-hedge-fund/blob/46375ac958e109068074a56bff263bdbbdc9ec3a/src/agents/technicals.py

export async function analyzeTechnicals({
  apiKey,
  ticker,
  startDate,
  endDate,
}: {
  apiKey: string
  ticker: string
  startDate?: string
  endDate?: string
}) {
  const { prices } = await getPrices({
    apiKey,
    ticker,
    startDate:
      startDate ??
      subMonths(endDate ? new Date(endDate) : new Date(), 3)
        .toISOString()
        .split("T")[0],
    endDate,
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

function pricesToDf(prices: FinancialDatasetsPrice[]) {
  // Emulate a pandas DataFrame with parallel arrays
  // (Assumes each price has open, high, low, close, volume, etc.)
  return {
    open: prices.map((p) => p.open),
    high: prices.map((p) => p.high),
    low: prices.map((p) => p.low),
    close: prices.map((p) => p.close),
    volume: prices.map((p) => p.volume),
  }
}

/***** Trend Signals *****/
function calculateTrendSignals(df: ReturnType<typeof pricesToDf>) {
  const ema8 = calculateEma(df.close, 8)
  const ema21 = calculateEma(df.close, 21)
  const ema55 = calculateEma(df.close, 55)
  const adxData = calculateAdx(df, 14)

  const lastEma8 = ema8[ema8.length - 1]
  const lastEma21 = ema21[ema21.length - 1]
  const lastEma55 = ema55[ema55.length - 1]
  const lastAdx = adxData.adx[adxData.adx.length - 1]

  const shortTrend = lastEma8 > lastEma21
  const mediumTrend = lastEma21 > lastEma55
  const trendStrength = lastAdx / 100

  let signal = "neutral"
  let confidence = 0.5
  if (shortTrend && mediumTrend) {
    signal = "bullish"
    confidence = trendStrength
  } else if (!shortTrend && !mediumTrend) {
    signal = "bearish"
    confidence = trendStrength
  }

  return {
    signal,
    confidence,
    metrics: {
      adx: lastAdx,
      trendStrength: trendStrength,
    },
  }
}

/***** Mean Reversion Signals *****/
function calculateMeanReversionSignals(df: ReturnType<typeof pricesToDf>) {
  const close = df.close
  const ma50 = rollingMean(close, 50)
  const std50 = rollingStd(close, 50)

  // z-score = (price - ma50) / std50
  const zScore = []
  for (let i = 0; i < close.length; i++) {
    const s = std50[i] === 0 ? 0 : (close[i] - ma50[i]) / std50[i]
    zScore.push(s)
  }

  const { upperBand: bbUpper, lowerBand: bbLower } = calculateBollingerBands(
    close,
    20,
  )
  const rsi14 = calculateRsi(close, 14)
  const rsi28 = calculateRsi(close, 28)

  const lastClose = close[close.length - 1]
  const lastBbUpper = bbUpper[bbUpper.length - 1]
  const lastBbLower = bbLower[bbLower.length - 1]
  const lastZ = zScore[zScore.length - 1]

  // priceVsBb = (lastClose - lowerBand) / (upperBand - lowerBand)
  let priceVsBb = 0.5
  const denom = lastBbUpper - lastBbLower
  if (denom !== 0) {
    priceVsBb = (lastClose - lastBbLower) / denom
  }

  let signal = "neutral"
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
      priceVsBb: priceVsBb,
      rsi14: rsi14[rsi14.length - 1],
      rsi28: rsi28[rsi28.length - 1],
    },
  }
}

/***** Momentum Signals *****/
function calculateMomentumSignals(df: ReturnType<typeof pricesToDf>) {
  const close = df.close
  // daily returns
  const returns = pctChange(close)

  // 1m ~ 21 days, 3m ~ 63 days, 6m ~ 126 days
  const mom1m = rollingSum(returns, 21)
  const mom3m = rollingSum(returns, 63)
  const mom6m = rollingSum(returns, 126)

  // volume momentum: volume / 21-day MA
  const volMa = rollingMean(df.volume, 21)
  const volumeMomentum = df.volume.map((v, i) => {
    const m = volMa[i] || 1
    return v / m
  })

  // Weighted multi-factor momentum
  const lastMom1m = mom1m[mom1m.length - 1]
  const lastMom3m = mom3m[mom3m.length - 1]
  const lastMom6m = mom6m[mom6m.length - 1]
  const momentumScore = 0.4 * lastMom1m + 0.3 * lastMom3m + 0.3 * lastMom6m
  const lastVolumeMomentum = volumeMomentum[volumeMomentum.length - 1]
  const volumeConfirmation = lastVolumeMomentum > 1

  let signal = "neutral"
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

/***** Volatility Signals *****/
function calculateVolatilitySignals(df: ReturnType<typeof pricesToDf>) {
  const close = df.close
  const returns = pctChange(close)

  // historical volatility (21-day std * sqrt(252))
  const rollingStd21 = rollingStd(returns, 21)
  const histVol = rollingStd21.map((x) => x * Math.sqrt(252))

  // volatility regime detection: histVol / 63-day MA of histVol
  const volMa63 = rollingMean(histVol, 63)
  const volRegime = histVol.map((v, i) => {
    const m = volMa63[i] || 1
    return v / m
  })

  // volatility z-score: (histVol - volMa63) / std(histVol over 63)
  const stdVol63 = rollingStd(histVol, 63)
  const volZScore = histVol.map((v, i) => {
    const m = volMa63[i] || 1
    const s = stdVol63[i] || 1
    return (v - m) / s
  })

  const atrVals = calculateAtr(df, 14)
  const atrRatio = atrVals.map((a, i) => {
    const c = close[i] || 1
    return a / c
  })

  const lastVolRegime = volRegime[volRegime.length - 1]
  const lastVolZ = volZScore[volZScore.length - 1]
  const lastAtrRatio = atrRatio[atrRatio.length - 1]
  let signal = "neutral"
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
      historicalVolatility: histVol[histVol.length - 1],
      volatilityRegime: lastVolRegime,
      volatilityZScore: lastVolZ,
      atrRatio: lastAtrRatio,
    },
  }
}

/***** Weighted Signal Combination *****/
function weightedSignalCombination(
  signals: {
    trend: { signal: string; confidence: number }
    meanReversion: { signal: string; confidence: number }
    momentum: { signal: string; confidence: number }
    volatility: { signal: string; confidence: number }
  },
  weights: {
    trend: number
    meanReversion: number
    momentum: number
    volatility: number
  },
) {
  const signalValues: Record<string, number> = {
    bullish: 1,
    neutral: 0,
    bearish: -1,
  }

  let weightedSum = 0
  let totalConfidence = 0

  for (const strategy of Object.keys(signals)) {
    const s = signals[strategy as keyof typeof signals]
    const numericSignal = signalValues[s.signal] ?? 0
    const weight = weights[strategy as keyof typeof weights]
    const confidence = s.confidence
    weightedSum += numericSignal * weight * confidence
    totalConfidence += weight * confidence
  }

  let finalScore = 0
  if (totalConfidence > 0) {
    finalScore = weightedSum / totalConfidence
  }

  let signal = "neutral"
  if (finalScore > 0.2) {
    signal = "bullish"
  } else if (finalScore < -0.2) {
    signal = "bearish"
  }

  return { signal, confidence: Math.abs(finalScore) }
}

/***** Utility to convert "DataFrame" to plain objects *****/
function normalizePandas(obj: any): any {
  // In Python, this was to convert DataFrame/Series to lists/dicts.
  // Here we just return the original, but you can adapt if needed.
  return obj
}

/***** Math Helpers (replicating rolling, ewm, etc.) *****/

/**
 * Percent change: (val[i] - val[i-1]) / val[i-1]
 */
function pctChange(values: number[]) {
  const out = [0]
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1]
    out.push(prev ? (values[i] - prev) / prev : 0)
  }
  return out
}

/**
 * Rolling mean over window
 */
function rollingMean(values: number[], window: number) {
  const out = []
  let sum = 0
  const queue: number[] = []
  for (let i = 0; i < values.length; i++) {
    queue.push(values[i])
    sum += values[i]
    if (queue.length > window) {
      sum -= queue.shift() as number
    }
    if (i < window - 1) {
      out.push(Number.NaN)
    } else {
      out.push(sum / window)
    }
  }
  return out
}

/**
 * Rolling std dev over window
 */
function rollingStd(values: number[], window: number) {
  const out = []
  const queue: number[] = []
  let sum = 0
  let sumSq = 0
  for (let i = 0; i < values.length; i++) {
    queue.push(values[i])
    sum += values[i]
    sumSq += values[i] * values[i]
    if (queue.length > window) {
      const removed = queue.shift() as number
      sum -= removed
      sumSq -= removed * removed
    }
    if (i < window - 1) {
      out.push(Number.NaN)
    } else {
      const mean = sum / window
      const var_ = sumSq / window - mean * mean
      out.push(Math.sqrt(var_ >= 0 ? var_ : 0))
    }
  }
  return out
}

/**
 * Rolling sum over window
 */
function rollingSum(values: number[], window: number) {
  const out = []
  let sum = 0
  const queue: number[] = []
  for (let i = 0; i < values.length; i++) {
    queue.push(values[i])
    sum += values[i]
    if (queue.length > window) {
      sum -= queue.shift() as number
    }
    if (i < window - 1) {
      out.push(Number.NaN)
    } else {
      out.push(sum)
    }
  }
  return out
}

/**
 * Exponential moving average
 */
function calculateEma(values: number[], span: number) {
  const result = []
  let prevEma = 0
  const alpha = 2 / (span + 1)
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      prevEma = values[0]
    } else {
      prevEma = alpha * values[i] + (1 - alpha) * prevEma
    }
    result.push(prevEma)
  }
  return result
}

/**
 * Calculate ADX (average directional index)
 */
function calculateAdx(df: ReturnType<typeof pricesToDf>, period: number) {
  const high = df.high
  const low = df.low
  const close = df.close

  // True range
  const tr: number[] = []
  const plusDm: number[] = []
  const minusDm: number[] = []

  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      tr.push(0)
      plusDm.push(0)
      minusDm.push(0)
      continue
    }
    const hl = high[i] - low[i]
    const hc = Math.abs(high[i] - close[i - 1])
    const lc = Math.abs(low[i] - close[i - 1])
    const trueRange = Math.max(hl, hc, lc)
    tr.push(trueRange)

    const upMove = high[i] - high[i - 1]
    const downMove = low[i - 1] - low[i]
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

  const trEma = calculateEma(tr, period)
  const plusDmEma = calculateEma(plusDm, period)
  const minusDmEma = calculateEma(minusDm, period)

  const plusDi = []
  const minusDi = []
  const dx = []
  for (let i = 0; i < trEma.length; i++) {
    if (trEma[i] === 0) {
      plusDi.push(0)
      minusDi.push(0)
      dx.push(0)
    } else {
      const pdi = (plusDmEma[i] / trEma[i]) * 100
      const mdi = (minusDmEma[i] / trEma[i]) * 100
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
 * Calculate ATR
 */
function calculateAtr(df: ReturnType<typeof pricesToDf>, period: number) {
  const high = df.high
  const low = df.low
  const close = df.close
  const tr: number[] = []
  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      tr.push(0)
      continue
    }
    const hl = high[i] - low[i]
    const hc = Math.abs(high[i] - close[i - 1])
    const lc = Math.abs(low[i] - close[i - 1])
    tr.push(Math.max(hl, hc, lc))
  }
  return rollingMean(tr, period) // Using simple MA to mimic the example
}

/**
 * Bollinger Bands
 */
function calculateBollingerBands(values: number[], window: number) {
  const sma = rollingMean(values, window)
  const stdDev = rollingStd(values, window)
  const upperBand = []
  const lowerBand = []
  for (let i = 0; i < values.length; i++) {
    const m = sma[i]
    const s = stdDev[i]
    if (Number.isNaN(m) || Number.isNaN(s)) {
      upperBand.push(Number.NaN)
      lowerBand.push(Number.NaN)
    } else {
      upperBand.push(m + 2 * s)
      lowerBand.push(m - 2 * s)
    }
  }
  return { upperBand, lowerBand }
}

/**
 * RSI
 */
function calculateRsi(close: number[], period: number) {
  const rsi: number[] = []
  const gainsQueue: number[] = []
  const lossesQueue: number[] = []
  let avgGain = 0
  let avgLoss = 0

  for (let i = 0; i < close.length; i++) {
    if (i === 0) {
      rsi.push(Number.NaN)
      continue
    }
    const delta = close[i] - close[i - 1]
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? -delta : 0
    gainsQueue.push(gain)
    lossesQueue.push(loss)
    if (gainsQueue.length > period) {
      gainsQueue.shift()
      lossesQueue.shift()
    }
    avgGain = arrayMean(gainsQueue)
    avgLoss = arrayMean(lossesQueue)
    if (avgLoss === 0) {
      rsi.push(100)
    } else {
      const rs = avgGain / avgLoss
      rsi.push(100 - 100 / (1 + rs))
    }
  }
  return rsi
}

function arrayMean(arr: number[]) {
  if (!arr.length) {
    return 0
  }
  let s = 0
  for (const val of arr) {
    s += val
  }
  return s / arr.length
}
