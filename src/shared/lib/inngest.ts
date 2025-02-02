import type * as schema from "@/shared/lib/database"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { EventSchemas, Inngest, InngestMiddleware } from "inngest"

const bindings = new InngestMiddleware({
  name: "Cloudflare Workers bindings",
  init() {
    return {
      onFunctionRun({ reqArgs }) {
        return {
          transformInput() {
            // reqArgs is the array of arguments passed to the Worker's fetch event handler
            // ex. fetch(request, env, ctx)
            // We cast the argument to the global Env var that Wrangler generates:
            const reqArg = reqArgs[0] as {
              context: {
                cloudflare: { env: CloudflareEnvironment }
                database: DrizzleD1Database<typeof schema>
              }
            }
            return {
              ctx: {
                // Return the env object to the function handler's input args
                env: reqArg.context.cloudflare.env,
                database: reqArg.context.database,
              },
            }
          },
        }
      },
    }
  },
})

type Events = {
  "ticker.process": {
    data: {
      ticker: string
    }
  }
}

export const inngest = new Inngest({
  id: "simple-stock-screener",
  middleware: [bindings],
  schemas: new EventSchemas().fromRecord<Events>(),
})
