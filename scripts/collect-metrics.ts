/**
 * Collect daily GA4 metrics and append to metrics/daily.json.
 *
 * Usage:
 *   npx tsx scripts/collect-metrics.ts                  # 2 days ago (GA4 delay)
 *   npx tsx scripts/collect-metrics.ts --date 2026-02-18  # specific date
 *
 * Env:
 *   GA4_CREDENTIALS   — service account JSON key (entire content)
 *   GA4_PROPERTY_ID   — GA4 property ID (numeric)
 */

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import * as fs from "node:fs";
import * as path from "node:path";

const EVENTS = [
  "page_view",
  "session_start",
  "first_visit",
  "card_click",
  "vote_cast",
  "comment_created",
  "post_created",
  "post_updated",
] as const;

type EventName = (typeof EVENTS)[number];

interface DailyEntry {
  date: string;
  [event: string]: { count: number; users: number } | string;
}

const METRICS_PATH = path.resolve(process.cwd(), "metrics/daily.json");

function parseArgs(): string {
  const idx = process.argv.indexOf("--date");
  if (idx !== -1 && process.argv[idx + 1]) {
    const d = process.argv[idx + 1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      console.error(`Invalid date format: ${d}. Expected YYYY-MM-DD.`);
      process.exit(1);
    }
    return d;
  }
  // Default: 2 days ago (GA4 data processing delay)
  const dt = new Date();
  dt.setDate(dt.getDate() - 2);
  return dt.toISOString().slice(0, 10);
}

function loadMetrics(): DailyEntry[] {
  if (!fs.existsSync(METRICS_PATH)) return [];
  const raw = fs.readFileSync(METRICS_PATH, "utf-8");
  return JSON.parse(raw) as DailyEntry[];
}

function saveMetrics(entries: DailyEntry[]): void {
  entries.sort((a, b) => a.date.localeCompare(b.date));
  fs.mkdirSync(path.dirname(METRICS_PATH), { recursive: true });
  fs.writeFileSync(METRICS_PATH, JSON.stringify(entries, null, 2) + "\n");
}

async function fetchEventMetrics(
  client: BetaAnalyticsDataClient,
  propertyId: string,
  date: string,
  eventName: EventName,
): Promise<{ count: number; users: number }> {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: date, endDate: date }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: { matchType: "EXACT", value: eventName },
      },
    },
  });

  const row = response.rows?.[0];
  if (!row) return { count: 0, users: 0 };

  return {
    count: Number(row.metricValues?.[0]?.value ?? 0),
    users: Number(row.metricValues?.[1]?.value ?? 0),
  };
}

async function main() {
  const date = parseArgs();
  console.log(`Collecting GA4 metrics for ${date}...`);

  const credentialsFile = process.env.GA4_CREDENTIALS_FILE;
  const credentials = credentialsFile
    ? fs.readFileSync(path.resolve(credentialsFile), "utf-8")
    : process.env.GA4_CREDENTIALS;
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!credentials) {
    console.error("Missing GA4_CREDENTIALS or GA4_CREDENTIALS_FILE env var");
    process.exit(1);
  }
  if (!propertyId) {
    console.error("Missing GA4_PROPERTY_ID env var");
    process.exit(1);
  }

  const client = new BetaAnalyticsDataClient({
    credentials: JSON.parse(credentials),
  });

  const entry: DailyEntry = { date };

  // Fetch all events in parallel
  const results = await Promise.all(EVENTS.map((e) => fetchEventMetrics(client, propertyId, date, e)));

  for (let i = 0; i < EVENTS.length; i++) {
    entry[EVENTS[i]] = results[i];
  }

  // Merge into existing data
  const metrics = loadMetrics();
  const existingIdx = metrics.findIndex((m) => m.date === date);
  if (existingIdx !== -1) {
    metrics[existingIdx] = entry;
    console.log(`Updated existing entry for ${date}`);
  } else {
    metrics.push(entry);
    console.log(`Added new entry for ${date}`);
  }

  saveMetrics(metrics);
  console.log(`Saved to ${METRICS_PATH}`);
  console.log(JSON.stringify(entry, null, 2));
}

main().catch((err) => {
  console.error("Failed to collect metrics:", err);
  process.exit(1);
});
