import { inngest } from "@/shared/lib/inngest"
import { serve } from "inngest/remix"
import { processTicker } from "./process-ticker"

const handler = serve({
  client: inngest,
  functions: [processTicker],
})

export { handler as action, handler as loader }
