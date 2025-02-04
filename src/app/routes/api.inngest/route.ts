import { inngest } from "@/shared/lib/inngest"
import { serve } from "inngest/remix"
import { processTicker } from "./process-ticker"
import { scheduledProcessing } from "./scheduled-processing"

const handler = serve({
  client: inngest,
  functions: [processTicker, scheduledProcessing],
})

export { handler as action, handler as loader }
