import { analyzeFundamentals } from "@/features/ai-analysis/fundamentals"
import { analyzeSentiment } from "@/features/ai-analysis/sentiment"
import { analyzeTechnicals } from "@/features/ai-analysis/technicals"
import { analyzeValuation } from "@/features/ai-analysis/valuation"
import { streamText } from "ai"
import { z } from "zod"
import type { Route } from "./+types/api.ai-compare"

const systemPrompt = `
You are a friendly but professional financial analyst.

You are given the following information about multiple stock (all in JSON format):
- Technical analysis
- Fundamental analysis
- Sentiment analysis
- Valuation analysis

Analyze the information and provide a detailed summary of each stock. Compare the stocks and provide a detailed summary of the differences.

Respond in Markdown format. Include the ticker and the name of the company (if you know it) in the summary.
`

const dataSchema = z.object({
  prompt: z
    .string()
    .transform((val) => val.split(";"))
    .refine((arr) => arr.length >= 2 && arr.length <= 5, {
      message: "Must select between 2 and 5 stocks",
    }),
})

export async function action({ context, request }: Route.ActionArgs) {
  const { prompt: tickers } = dataSchema.parse(await request.json())

  const endDate = new Date().toISOString().split("T")[0]
  const apiKey = context.cloudflare.env.FINANCIAL_DATASETS_API_KEY

  const analyses = await Promise.all(
    tickers.map(async (ticker) => {
      const [technicals, fundamentals, sentiment, valuation] =
        await Promise.all([
          analyzeTechnicals({ ticker, endDate, apiKey }),
          analyzeFundamentals({ ticker, endDate, apiKey }),
          analyzeSentiment({ ticker, endDate, apiKey }),
          analyzeValuation({ ticker, endDate, apiKey }),
        ])
      return { ticker, technicals, fundamentals, sentiment, valuation }
    }),
  )

  const result = streamText({
    model: context.openai("o1-preview"),
    system: systemPrompt,
    prompt: analyses
      .map(
        ({ ticker, technicals, fundamentals, sentiment, valuation }) => `
# ${ticker}
## Technical analysis
${JSON.stringify(technicals)}

## Fundamental analysis
${JSON.stringify(fundamentals)}

## Sentiment analysis
${JSON.stringify(sentiment)}

## Valuation analysis
${JSON.stringify(valuation)}
`,
      )
      .join("\n\n"),
  })

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      console.error(error)
      return String(error)
    },
  })
}
