import { analyzeFundamentals } from "@/features/stock-analysis/fundamentals"
import { analyzeSentiment } from "@/features/stock-analysis/sentiment"
import { analyzeTechnicals } from "@/features/stock-analysis/technicals"
import { analyzeValuation } from "@/features/stock-analysis/valuation"
import { streamText } from "ai"
import { z } from "zod"
import type { Route } from "./+types/api.ai-compare"

const instructions = `You are given the following information about multiple stock (all in JSON format):
- Technical analysis
- Fundamental analysis
- Sentiment analysis
- Valuation analysis

Analyze the information and provide a detailed summary of each stock. Compare the stocks and provide a detailed summary of the differences.

Respond in Markdown format. Include the ticker and the name of the company (if you know it) in the summary.`

const systemPrompt =
  "You are a friendly but professional financial analyst. Think about the user request step by step and provide a detailed summary of the results."

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

  const financialDatasets = context.financialDatasets

  const analyses = await Promise.all(
    tickers.map(async (ticker) => {
      const [technicals, fundamentals, sentiment, valuation] =
        await Promise.all([
          analyzeTechnicals({ ticker, financialDatasets }),
          analyzeFundamentals({ ticker, financialDatasets }),
          analyzeSentiment({ ticker, financialDatasets }),
          analyzeValuation({ ticker, financialDatasets }),
        ])
      return { ticker, technicals, fundamentals, sentiment, valuation }
    }),
  )

  const result = streamText({
    model: context.groq("deepseek-r1-distill-llama-70b"),
    system: systemPrompt,
    temperature: 0.5,
    maxTokens: 4096,
    prompt:
      instructions +
      analyses
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
      return String(error)
    },
  })
}
