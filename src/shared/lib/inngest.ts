import { EventSchemas, Inngest, InngestMiddleware } from "inngest"
import type { AppLoadContext } from "react-router"

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
              context: AppLoadContext
            }
            return {
              ctx: {
                // Return the env object to the function handler's input args
                env: reqArg.context.cloudflare.env,
                database: reqArg.context.database,
                financialDatasets: reqArg.context.financialDatasets,
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
