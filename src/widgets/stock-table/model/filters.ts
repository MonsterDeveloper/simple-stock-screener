import type { Ticker } from "@/entities/ticker"
import type { Row } from "@tanstack/react-table"

export const textFilterFn = (
  row: Row<Ticker>,
  columndId: string,
  filterValue: FilterValue,
) => {
  const value = row.original[columndId as keyof typeof row.original]

  if (typeof value !== "string") {
    return false
  }

  return value.includes(String(filterValue))
}

export const numberFilterFn = (
  row: Row<Ticker>,
  columndId: string,
  filterValue: FilterValue,
) => {
  const value = row.original[columndId as keyof typeof row.original]

  if (typeof value !== "number" || !filterValue.value) {
    return false
  }

  if (filterValue.operator === "eq") {
    return value === filterValue.value
  }

  if (filterValue.operator === "ne") {
    return value !== filterValue.value
  }

  if (filterValue.operator === "gt") {
    return value > filterValue.value
  }

  if (filterValue.operator === "lt") {
    return value < filterValue.value
  }

  if (filterValue.operator === "gte") {
    return value >= filterValue.value
  }

  if (filterValue.operator === "lte") {
    return value <= filterValue.value
  }

  throw new Error(`Unknown filter operator: ${filterValue.operator}`)
}

export type TextFilterValue = {
  operator: "contains" | "notContains" | "eq" | "ne"
  value?: string
}

export type NumberFilterValue = {
  operator: "gt" | "lt" | "gte" | "lte" | "eq" | "ne"
  value?: number
}

export type FilterValue = TextFilterValue | NumberFilterValue

export type FilterValueOperator = FilterValue["operator"]
