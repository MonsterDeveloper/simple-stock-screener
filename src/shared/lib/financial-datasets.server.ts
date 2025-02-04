import { type Cache, cachified } from "@epic-web/cachified"

/**
 * Custom error class for Financial Datasets API errors
 */
export class FinancialDatasetsError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = "FinancialDatasetsError"
  }
}

/** The time period for financial data queries */
type FinancialDatasetsPeriod = "annual" | "quarterly" | "ttm"

/** Financial statement line items that can be queried */
type FinancialDatasetsLineItem =
  | "free_cash_flow"
  | "working_capital"
  | "consolidated_income"
  | "cost_of_revenue"
  | "dividends_per_common_share"
  | "earnings_per_share"
  | "earnings_per_share_diluted"
  | "ebit"
  | "ebit_usd"
  | "earnings_per_share_usd"
  | "gross_profit"
  | "income_tax_expense"
  | "interest_expense"
  | "net_income"
  | "net_income_common_stock"
  | "net_income_common_stock_usd"
  | "net_income_discontinued_operations"
  | "net_income_non_controlling_interests"
  | "operating_expense"
  | "operating_income"
  | "preferred_dividends_impact"
  | "research_and_development"
  | "revenue"
  | "revenue_usd"
  | "selling_general_and_administrative_expenses"
  | "weighted_average_shares"
  | "weighted_average_shares_diluted"
  | "accumulated_other_comprehensive_income"
  | "cash_and_equivalents"
  | "cash_and_equivalents_usd"
  | "current_assets"
  | "current_debt"
  | "current_investments"
  | "current_liabilities"
  | "deferred_revenue"
  | "deposit_liabilities"
  | "goodwill_and_intangible_assets"
  | "inventory"
  | "investments"
  | "non_current_assets"
  | "non_current_debt"
  | "non_current_investments"
  | "non_current_liabilities"
  | "outstanding_shares"
  | "property_plant_and_equipment"
  | "retained_earnings"
  | "shareholders_equity"
  | "shareholders_equity_usd"
  | "tax_assets"
  | "tax_liabilities"
  | "total_assets"
  | "total_debt"
  | "total_debt_usd"
  | "total_liabilities"
  | "trade_and_non_trade_payables"
  | "trade_and_non_trade_receivables"
  | "business_acquisitions_and_disposals"
  | "capital_expenditure"
  | "change_in_cash_and_equivalents"
  | "depreciation_and_amortization"
  | "dividends_and_other_cash_distributions"
  | "effect_of_exchange_rate_changes"
  | "investment_acquisitions_and_disposals"
  | "issuance_or_purchase_of_equity_shares"
  | "issuance_or_repayment_of_debt_securities"
  | "net_cash_flow_from_financing"
  | "net_cash_flow_from_investing"
  | "net_cash_flow_from_operations"
  | "share_based_compensation"

/**
 * Financial metrics and ratios for a company
 * Includes valuation, profitability, efficiency, liquidity, leverage, and growth metrics
 */
export interface FinancialDatasetsMetrics {
  ticker: string
  market_cap: number
  enterprise_value: number
  price_to_earnings_ratio: number
  price_to_book_ratio: number
  price_to_sales_ratio: number
  enterprise_value_to_ebitda_ratio: number
  enterprise_value_to_revenue_ratio: number
  free_cash_flow_yield: number
  peg_ratio: number
  gross_margin: number
  operating_margin: number
  net_margin: number
  return_on_equity: number
  return_on_assets: number
  return_on_invested_capital: number
  asset_turnover: number
  inventory_turnover: number
  receivables_turnover: number
  days_sales_outstanding: number
  operating_cycle: number
  working_capital_turnover: number
  current_ratio: number
  quick_ratio: number
  cash_ratio: number
  operating_cash_flow_ratio: number
  debt_to_equity: number
  debt_to_assets: number
  interest_coverage: number
  revenue_growth: number
  earnings_growth: number
  book_value_growth: number
  earnings_per_share_growth: number
  free_cash_flow_growth: number
  operating_income_growth: number
  ebitda_growth: number
  payout_ratio: number
  earnings_per_share: number
  book_value_per_share: number
  free_cash_flow_per_share: number
}

/**
 * Insider trading transaction details
 */
interface FinancialDatasetsInsiderTrade {
  ticker: string
  issuer: string
  name: string
  title: string
  is_board_director: boolean
  transaction_date: Date
  transaction_shares?: number
  transaction_price_per_share: number
  transaction_value: number
  shares_owned_before_transaction: number
  shares_owned_after_transaction: number
  security_title: string
  filing_date: Date
}

/**
 * Company news article details
 */
interface FinancialDatasetsNews {
  ticker: string
  title: string
  author: string
  source: string
  date: Date
  url: string
  sentiment: "positive" | "negative" | "neutral"
}

/**
 * Stock price data point
 */
export interface FinancialDatasetsPrice {
  open: number
  close: number
  high: number
  low: number
  volume: number
  time: string
}

/**
 * Response type for available tickers endpoint
 */
interface FinancialDatasetsAvailableTickers {
  resource: string
  tickers: string[]
}

/** Normalize cache key by sorting array values and object keys */
function normalizeCacheKey(key: unknown): unknown {
  if (Array.isArray(key)) {
    return key.map(normalizeCacheKey).toSorted()
  }
  if (typeof key === "object" && key !== null) {
    return Object.fromEntries(
      Object.entries(key)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, value]) => [key, normalizeCacheKey(value)]),
    )
  }
  return key
}

/** Hash a string using SHA-256 for cache key */
async function hashCacheKey(key: unknown) {
  const encoder = new TextEncoder()
  const normalized = normalizeCacheKey(key)
  const data = encoder.encode(JSON.stringify(normalized))
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

async function composeCacheKey(method: string, params: unknown) {
  return `financial-datasets:${method}:${await hashCacheKey(params)}`
}

/**
 * Client for accessing the Financial Datasets API
 * Provides methods to fetch financial data, metrics, insider trades, news, and prices
 * @see https://docs.financialdatasets.ai/introduction
 */
export class FinancialDatasetsClient {
  private baseUrl = "https://api.financialdatasets.ai"
  private apiKey: string
  private cache: Cache

  constructor(apiKey: string, cache: Cache) {
    this.apiKey = apiKey
    this.cache = cache
  }

  /** Make an API request with error handling */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new FinancialDatasetsError(
        `API request failed: ${response.statusText}`,
        response.status,
        await response.json().catch(() => undefined),
      )
    }

    return response.json() as Promise<T>
  }

  /** Format a date to YYYY-MM-DD string */
  private formatDate(date: Date) {
    return date.toISOString().split("T")[0]!
  }

  /**
   * Get list of available tickers that have financial data

   * @see https://docs.financialdatasets.ai/api-reference/endpoint/financials/all-financial-statements
   */
  getAvailableTickers(): Promise<FinancialDatasetsAvailableTickers> {
    return this.makeRequest("/financials/tickers")
  }

  /**
   * Search for companies by financial line items
   * @param lineItems - List of financial statement line items to retrieve
   * @param tickers - List of stock tickers to search
   * @param limit - Maximum number of results to return
   * @param period - Time period for the data
   * @see https://docs.financialdatasets.ai/api-reference/endpoint/financials/search-by-line-items
   */
  async searchByLineItems<T extends FinancialDatasetsLineItem[]>({
    lineItems,
    tickers,
    limit,
    period,
  }: {
    lineItems: T
    tickers: string[]
    limit?: number
    period?: FinancialDatasetsPeriod
  }) {
    return cachified({
      key: await composeCacheKey("searchByLineItems", {
        lineItems,
        tickers,
        limit,
        period,
      }),
      cache: this.cache,
      getFreshValue: () =>
        this.makeRequest<{
          search_results: ({
            ticker: string
            report_period: string
            period: FinancialDatasetsPeriod
            currency: string
          } & {
            [key in T[number]]: number
          })[]
        }>("/financials/search/line-items", {
          method: "POST",
          body: JSON.stringify({
            line_items: lineItems,
            tickers,
            limit,
            period,
          }),
        }),
    })
  }

  /**
   * Get financial metrics and ratios for a company
   * @param ticker - Stock ticker symbol
   * @param period - Time period for the data
   * @param limit - Maximum number of results to return
   * @param reportPeriodLte - Filter for report period less than or equal to date
   * @param reportPeriodGte - Filter for report period greater than or equal to date
   * @see https://docs.financialdatasets.ai/api-reference/endpoint/financial-metrics/historical
   */
  getFinancialMetrics({
    ticker,
    period,
    limit,
    reportPeriodLte,
    reportPeriodGte,
  }: {
    ticker: string
    period: FinancialDatasetsPeriod
    limit?: number
    reportPeriodLte?: Date
    reportPeriodGte?: Date
  }): Promise<{ financial_metrics: FinancialDatasetsMetrics[] }> {
    const params = new URLSearchParams()

    params.set("ticker", ticker)
    params.set("period", period)

    if (limit) {
      params.set("limit", String(limit))
    }
    if (reportPeriodLte) {
      params.set("report_period_lte", this.formatDate(reportPeriodLte))
    }
    if (reportPeriodGte) {
      params.set("report_period_gte", this.formatDate(reportPeriodGte))
    }

    return this.makeRequest(`/financial-metrics?${params}`)
  }

  /**
   * Get insider trading data for a company
   * @param ticker - Stock ticker symbol
   * @param limit - Maximum number of results to return
   * @param filingDateLte - Filter for filing date less than or equal to date
   * @param filingDateGte - Filter for filing date greater than or equal to date
   * @see https://docs.financialdatasets.ai/api-reference/endpoint/insider-trades
   */
  getInsiderTrades({
    ticker,
    limit,
    filingDateLte,
    filingDateGte,
  }: {
    ticker: string
    limit?: number
    filingDateLte?: Date
    filingDateGte?: Date
  }): Promise<{ insider_trades: FinancialDatasetsInsiderTrade[] }> {
    const params = new URLSearchParams()

    params.set("ticker", ticker)

    if (limit) {
      params.set("limit", String(limit))
    }
    if (filingDateLte) {
      params.set("filing_date_lte", this.formatDate(filingDateLte))
    }
    if (filingDateGte) {
      params.set("filing_date_gte", this.formatDate(filingDateGte))
    }

    return this.makeRequest(`/insider-trades?${params}`)
  }

  /**
   * Get news articles for a company
   *
   * @param ticker - Stock ticker symbol
   * @param startDate - Filter for articles after this date
   * @param endDate - Filter for articles before this date
   * @param limit - Maximum number of results to return
   * @see https://docs.financialdatasets.ai/api-reference/endpoint/news
   */
  getCompanyNews({
    ticker,
    startDate,
    endDate,
    limit,
  }: {
    ticker: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<{ news: FinancialDatasetsNews[] }> {
    const params = new URLSearchParams()

    params.set("ticker", ticker)

    if (startDate) {
      params.set("start_date", this.formatDate(startDate))
    }
    if (endDate) {
      params.set("end_date", this.formatDate(endDate))
    }
    if (limit) {
      params.set("limit", String(limit))
    }

    return this.makeRequest(`/news?${params}`)
  }

  /**
   * Get historical price data for a company
   *
   * @param ticker - Stock ticker symbol
   * @param startDate - Start date for price data
   * @param endDate - End date for price data
   * @see https://docs.financialdatasets.ai/api-reference/endpoint/prices
   */
  getPrices({
    ticker,
    startDate,
    endDate,
  }: {
    ticker: string
    startDate: Date
    endDate: Date
  }): Promise<{ prices: FinancialDatasetsPrice[] }> {
    const params = new URLSearchParams()

    params.set("ticker", ticker)
    params.set("interval", "day")
    params.set("interval_multiplier", "1")
    params.set("start_date", this.formatDate(startDate))
    params.set("end_date", this.formatDate(endDate))

    return this.makeRequest(`/prices?${params}`)
  }
}
