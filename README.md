# Simple Stock Screener

[![Bun Version](https://img.shields.io/badge/Bun-1.2.2-white)](#)
[![Cloudflare Workers](https://img.shields.io/badge/deployed-Cloudflare_Workers-F69334)](https://simple-stock-screener.ctoofeverything.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](#)



A super simple, modern, AI-powered stock screening tool with Notion-style UI. Inspired by a [tweet by QCompounding](https://x.com/QCompounding/status/1870515464801010028).

Visit the live app at: [https://simple-stock-screener.ctoofeverything.dev/](https://simple-stock-screener.ctoofeverything.dev/)

## Features

- **Multi-Dimensional Stock Analysis:**  
  - **Fundamental Analysis:** Evaluate profitability, growth, and financial health using key metrics.
  - **Technical Analysis:** Leverage trend following, mean reversion, momentum, and volatility indicators.
  - **Sentiment Analysis:** Analyze insider trading and news sentiment for a comprehensive market perspective.
  - **Valuation Analysis:** Compare market price with intrinsic value using DCF and owner earnings methods.

- **AI stock comparison:**   AI tools to provide detailed summaries and comparisons between selected stocks.

- **Optimized Performance:**  
  - Deployed on the edge with Cloudflare Workers.
  - Data caching and database with Cloudflare KV and D1 databases.
  - Event-driven processing using Inngest.

## Tech Stack
  - React Router  
  - TypeScript  
  - TailwindCSS
  - Groq `deepseek-r1-distill-llama-70b` (w/ Vercel AI SDK)
  - Cloudflare Workers
  - Bun as a package manager  
  - Inngest for event processing 
  - Drizzle ORM 
  - Financial Datasets for data 

## Installation & Development

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/MonsterDeveloper/simple-stock-screener.git
   cd simple-stock-screener
   ```

2. **Install Dependencies:**

   ```bash
   bun install
   ```

3. **Start the Development Server:**

   ```bash
   bun dev
   ```

   Your application will be available at [http://localhost:5173](http://localhost:5173).

## Thanks

- [Compounding Quality](https://x.com/qcompounding) for the inspiration of the stock screening criteria
- [Virat Singh](https://github.com/virattt) for his amazing work on the stock analysis implementations.


---

Feel free to open issues or submit pull requests!