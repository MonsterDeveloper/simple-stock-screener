import { IconExternalLink, IconLink } from "@tabler/icons-react";
import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simple Stock Screener" },
    { name: "description", content: "Simple stock screener to find quality stocks. Made by the CTO of Everything." },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function IndexPage({ loaderData }: Route.ComponentProps) {
  return <main className="max-w-4xl mx-auto mt-40">
  <h1 className="text-3xl font-bold">Simple Stock Screener</h1>

  <p className="mt-5">
  Criteria to screen for quality stocks:<br />

- Revenue growth &gt; 5%<br />
- Earnings growth &gt; 7%<br />
- FCF / earnings &gt; 80%<br />
- ROIC &gt; 15%<br />
- Net debt / FCFF &lt; 5<br />
- Debt/equity &lt; 80%
  </p>
  <a href="https://x.com/QCompounding/status/1870515464801010028" rel="noreferrer nofollow" target="_blank" className="inline-block mt-2.5 after:content-[''] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px dark:after:bg-white/10 relative after:transition-colors after:duration-100 dark:hover:after:bg-white/20">@QCompounding on X <IconExternalLink className="size-4 inline-block align-middle ml-0.5" /></a>
  </main>;
}
