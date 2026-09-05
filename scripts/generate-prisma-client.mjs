import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const databaseUrl = process.env.DATABASE_URL ?? '';
const isPostgres = args.has('--postgres') || /^(postgres|postgresql):\/\//i.test(databaseUrl);
const schema = isPostgres
  ? 'prisma/schema.postgresql.prisma'
  : 'prisma/schema.prisma';

const prismaCli = resolve('node_modules/prisma/build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'generate', `--schema=${schema}`], {
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(`Failed to run Prisma generate: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
