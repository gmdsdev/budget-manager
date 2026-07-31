const DEFAULT_SERVER_URL = "http://localhost:3000";
const DEFAULT_WEB_URL = "http://localhost:3001";
const DEFAULT_PASSWORD = "DemoPass123!";
const DEFAULT_PAST_MONTHS = 12;
const DEFAULT_FUTURE_MONTHS = 3;

export type SeedConfig = {
  serverUrl: string;
  webUrl: string;
  email: string;
  password: string;
  name: string;
  /** How many whole months of history to write, not counting the current one. */
  pastMonths: number;
  /** How many months of scheduled rows to write past the current one. */
  futureMonths: number;
  /** Same seed, same account. */
  randomSeed: number;
};

function trimTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function flag(args: string[], name: string) {
  const prefixed = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefixed));

  if (inline) {
    return inline.slice(prefixed.length);
  }

  const index = args.indexOf(`--${name}`);

  return index === -1 ? undefined : args[index + 1];
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function randomEmail() {
  const stamp = Date.now().toString(36);
  const noise = Math.floor(Math.random() * 1e6).toString(36);

  return `demo-${stamp}-${noise}@example.com`;
}

export function readConfig(argv: string[]): SeedConfig {
  const args = argv.slice(2);

  return {
    serverUrl: trimTrailingSlash(
      flag(args, "server") ?? process.env.DEMO_SERVER_URL ?? DEFAULT_SERVER_URL,
    ),
    webUrl: trimTrailingSlash(
      flag(args, "web") ?? process.env.DEMO_WEB_URL ?? DEFAULT_WEB_URL,
    ),
    email: flag(args, "email") ?? randomEmail(),
    password: flag(args, "password") ?? DEFAULT_PASSWORD,
    name: flag(args, "name") ?? "Demo Account",
    pastMonths: positiveInt(flag(args, "past-months"), DEFAULT_PAST_MONTHS),
    futureMonths: positiveInt(
      flag(args, "future-months"),
      DEFAULT_FUTURE_MONTHS,
    ),
    randomSeed: positiveInt(flag(args, "seed"), Date.now() % 2 ** 31),
  };
}

export const USAGE = `Usage: bun run seed:demo [options]

  --email <address>       account email (default: a random demo-*@example.com)
  --password <password>   account password (default: ${DEFAULT_PASSWORD})
  --name <name>           account display name
  --past-months <n>       months of history to write (default: ${DEFAULT_PAST_MONTHS})
  --future-months <n>     months of scheduled rows (default: ${DEFAULT_FUTURE_MONTHS})
  --seed <n>              PRNG seed, for a reproducible account
  --server <url>          API base URL (default: ${DEFAULT_SERVER_URL})
  --web <url>             web app URL, printed at the end (default: ${DEFAULT_WEB_URL})
`;
