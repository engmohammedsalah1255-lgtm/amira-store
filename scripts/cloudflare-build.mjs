import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const buildStatus = run(process.execPath, ['scripts/generate-prisma-client.mjs', '--postgres']);
if (buildStatus !== 0) process.exit(buildStatus);

const npmExecPath = process.env.npm_execpath;
if (!npmExecPath) {
  console.error('npm_execpath is unavailable; run this script through an npm script.');
  process.exit(1);
}

const openNextStatus = run(npmExecPath, ['exec', '--', 'opennextjs-cloudflare', 'build']);

// CI and local development without a PostgreSQL URL use the SQLite schema.
// Restore that generated client after the Worker bundle has been produced so
// running `npm run dev` after a preview/build does not unexpectedly switch DB providers.
if (!/^(postgres|postgresql):\/\//i.test((process.env.DATABASE_URL ?? '').trim())) {
  const restoreStatus = run(process.execPath, ['scripts/generate-prisma-client.mjs']);
  if (openNextStatus === 0 && restoreStatus !== 0) process.exit(restoreStatus);
}

process.exit(openNextStatus);
