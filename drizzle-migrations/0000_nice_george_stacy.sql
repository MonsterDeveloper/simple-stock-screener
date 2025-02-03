CREATE TABLE `ticker_metric_data` (
	`ticker_id` text,
	`report_period` text NOT NULL,
	`period` text NOT NULL,
	`currency` text NOT NULL,
	`revenue` integer NOT NULL,
	`net_income` integer NOT NULL,
	`net_cash_flow_from_operations` integer NOT NULL,
	`capital_expenditure` integer NOT NULL,
	`ebit` integer NOT NULL,
	`income_tax_expense` integer NOT NULL,
	`total_debt` integer NOT NULL,
	`cash_and_equivalents` integer NOT NULL,
	`shareholders_equity` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`ticker_id`, `report_period`),
	FOREIGN KEY (`ticker_id`) REFERENCES `tickers`(`symbol`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tickers` (
	`symbol` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`exchange` text NOT NULL,
	`revenue_growth_percentage` integer NOT NULL,
	`earnings_growth_percentage` integer NOT NULL,
	`fcf_earnings_ratio` integer NOT NULL,
	`roic` integer NOT NULL,
	`net_debt_to_fcf` integer NOT NULL,
	`debt_to_equity` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer
);
