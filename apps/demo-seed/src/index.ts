import { formatMinorUnits } from "@budget-manager/money";
import { requireServer, signUp } from "./client";
import { readConfig, USAGE } from "./config";
import { seedDemoAccount } from "./seed";

const config = readConfig(process.argv);

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}

const started = Date.now();
const log = (message: string) => {
  console.log(`  ${message}`);
};

await requireServer(config.serverUrl);

console.log(`\nSeeding a demo account on ${config.serverUrl}`);
log(`Signing up ${config.email}…`);

const client = await signUp(config);
const tally = await seedDemoAccount({ client, config, log });

// Read back through the same API the app uses, so the summary is what a user
// would see rather than what the script believes it wrote. Balances are derived,
// so this is also the check that a year of history left the account solvent.
const [dashboard, wallets, cards] = await Promise.all([
  client.dashboard.getSummary.query({}),
  client.wallet.getAll.query({}),
  client.creditCard.getAll.query({}),
]);
const seconds = ((Date.now() - started) / 1000).toFixed(1);

console.log(`\nDone in ${seconds}s.\n`);
console.log("Sign in with");
console.log(`  email     ${config.email}`);
console.log(`  password  ${config.password}`);
console.log(`  app       ${config.webUrl}/login`);
console.log(`  seed      --seed ${config.randomSeed} (re-runs the same data)`);

console.log("\nWritten");

for (const [key, value] of Object.entries(tally)) {
  console.log(`  ${key.padEnd(18)}${value}`);
}

console.log(`\nDashboard for ${dashboard.month}`);

for (const currency of dashboard.currencies) {
  const money = (cents: number) =>
    formatMinorUnits(cents, currency.currencyCode);

  console.log(
    `  ${currency.currencyCode}  in wallets ${money(currency.balanceCents)} · card debt ${money(
      currency.cardOutstandingCents,
    )} · net worth ${money(currency.netWorthCents)}`,
  );
  console.log(
    `        income ${money(currency.incomeCents)} · expenses ${money(
      currency.expenseCents,
    )} · net ${money(currency.netCents)}`,
  );
}

console.log("\nWallets");

for (const wallet of wallets.rows) {
  console.log(
    `  ${wallet.name.padEnd(20)}${formatMinorUnits(wallet.balanceCents, wallet.currencyCode)}`,
  );
}

console.log("\nCards");

for (const card of cards.rows) {
  console.log(
    `  ${card.name.padEnd(20)}owes ${formatMinorUnits(
      card.outstandingCents,
      card.currencyCode,
    )} of ${formatMinorUnits(card.limitCents, card.currencyCode)}`,
  );
}

console.log(
  `\n${dashboard.statements.length} statement(s) to pay, ${dashboard.pending.length} row(s) awaiting payment\n`,
);
