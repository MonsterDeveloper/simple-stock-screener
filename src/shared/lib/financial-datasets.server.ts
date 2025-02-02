type FinancialDatasetsPeriod = "annual" | "quarterly" | "ttm"

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

export async function searchByLineItems<T extends FinancialDatasetsLineItem[]>({
  lineItems,
  tickers,
  limit,
  period,
  apiKey,
}: {
  apiKey: string
  lineItems: T
  tickers: string[]
  limit?: number
  period?: FinancialDatasetsPeriod
}): Promise<{
  search_results: ({
    ticker: string
    report_period: string
    period: FinancialDatasetsPeriod
    currency: string
  } & {
    [key in T[number]]: number
  })[]
}> {
  const response = await fetch(
    "https://api.financialdatasets.ai/financials/search/line-items",
    {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line_items: lineItems,
        tickers,
        limit,
        period,
      }),
    },
  )

  return response.json()
}

interface FinancialDatasetsMetrics {
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

export async function getFinancialMetrics({
  apiKey,
  ticker,
  period,
  limit,
  reportPeriodLte,
  reportPeriodGte,
}: {
  apiKey: string
  ticker: string
  period: FinancialDatasetsPeriod
  limit?: number
  reportPeriodLte?: string
  reportPeriodGte?: string
}): Promise<{ financial_metrics: FinancialDatasetsMetrics[] }> {
  const response = await fetch(
    `https://api.financialdatasets.ai/financial-metrics?${new URLSearchParams({
      ticker,
      period,
      ...(limit && { limit: limit.toString() }),
      ...(reportPeriodLte && { report_period_lte: reportPeriodLte }),
      ...(reportPeriodGte && { report_period_gte: reportPeriodGte }),
    })}`,
    {
      headers: {
        "X-API-KEY": apiKey,
      },
    },
  )

  return response.json()
}

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

export async function getInsiderTrades({
  apiKey,
  ticker,
  limit,
  filingDateLte,
  filingDateGte,
}: {
  apiKey: string
  ticker: string
  limit?: number
  filingDateLte?: string
  filingDateGte?: string
}): Promise<{ insider_trades: FinancialDatasetsInsiderTrade[] }> {
  const response = await fetch(
    `https://api.financialdatasets.ai/insider-trades?${new URLSearchParams({
      ticker,
      ...(limit && { limit: limit.toString() }),
      ...(filingDateLte && { filing_date_lte: filingDateLte }),
      ...(filingDateGte && { filing_date_gte: filingDateGte }),
    })}`,
    {
      headers: {
        "X-API-KEY": apiKey,
      },
    },
  )

  return response.json()
}

interface FinancialDatasetsNews {
  ticker: string
  title: string
  author: string
  source: string
  date: Date
  url: string
  sentiment: "positive" | "negative" | "neutral"
}

export async function getCompanyNews({
  apiKey,
  ticker,
  startDate,
  endDate,
  limit,
}: {
  apiKey: string
  ticker: string
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<{ news: FinancialDatasetsNews[] }> {
  const response = await fetch(
    `https://api.financialdatasets.ai/news?${new URLSearchParams({
      ticker,
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(limit && { limit: limit.toString() }),
    })}`,
    {
      headers: {
        "X-API-KEY": apiKey,
      },
    },
  )

  return response.json()
}

interface FinancialDatasetsPrice {
  open: number
  close: number
  high: number
  low: number
  volume: number
  time: string
}

export async function getPrices({
  apiKey,
  ticker,
  startDate,
  endDate,
}: {
  apiKey: string
  ticker: string
  startDate: string
  endDate?: string
}): Promise<{ prices: FinancialDatasetsPrice[] }> {
  const response = await fetch(
    `https://api.financialdatasets.ai/prices?${new URLSearchParams({
      ticker,
      interval: "day",
      interval_multiplier: "1",
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    })}`,
    {
      headers: {
        "X-API-KEY": apiKey,
      },
    },
  )

  return response.json()
}
