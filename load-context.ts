import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1"

import * as schema from "./src/shared/lib/database"

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
    database: DrizzleD1Database<typeof schema>
    openai: OpenAIProvider
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
    // biome-ignore lint/style/useNamingConvention: External library
    baseURL: `https://gateway.ai.cloudflare.com/v1/${context.cloudflare.env.ACCOUNT_ID}/${context.cloudflare.env.AI_GATEWAY_ID}/openai`,
    headers: {
      "cf-aig-authorization": `Bearer ${context.cloudflare.env.AI_GATEWAY_TOKEN}`,
    },
  })

  return {
    cloudflare: context.cloudflare,
    database,
    openai,
  }
}
