import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1"

import * as schema from "./src/shared/lib/database"
import { FinancialDatasetsClient } from "./src/shared/lib/financial-datasets.server"

import { type OpenAIProvider, createOpenAI } from "@ai-sdk/openai"

import type { ExecutionContext } from "@cloudflare/workers-types"
import type { AppLoadContext } from "react-router"

declare global {
  interface CloudflareEnvironment extends Env {}
}

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnvironment
      ctx: Omit<ExecutionContext, "props">
    }
    env: Pick<
      CloudflareEnvironment,
      "INNGEST_EVENT_KEY" | "INNGEST_SIGNING_KEY"
    > // Fix for Inngest `serve`
    database: DrizzleD1Database<typeof schema>
    openai: OpenAIProvider
    financialDatasets: FinancialDatasetsClient
  }
}

type GetLoadContextArgs = {
  request: Request
  context: Pick<AppLoadContext, "cloudflare">
}

export function getLoadContext({
  context,
}: GetLoadContextArgs): AppLoadContext {
  const database = drizzle(context.cloudflare.env.DB, { schema })
  const openai = createOpenAI({
    apiKey: context.cloudflare.env.OPENAI_API_KEY,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${context.cloudflare.env.ACCOUNT_ID}/${context.cloudflare.env.AI_GATEWAY_ID}/openai`,
    headers: {
      "cf-aig-authorization": `Bearer ${context.cloudflare.env.AI_GATEWAY_TOKEN}`,
    },
  })
  const financialDatasets = new FinancialDatasetsClient(
    context.cloudflare.env.FINANCIAL_DATASETS_API_KEY,
  )

  return {
    cloudflare: context.cloudflare,
    env: {
      INNGEST_EVENT_KEY: context.cloudflare.env.INNGEST_EVENT_KEY,
      INNGEST_SIGNING_KEY: context.cloudflare.env.INNGEST_SIGNING_KEY,
    },
    database,
    openai,
    financialDatasets,
  }
}
