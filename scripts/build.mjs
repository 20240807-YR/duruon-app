import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const env = { ...process.env };

// CRA only exposes REACT_APP_* values to browser code. Bridge the names created
// by Vercel's Supabase integration without printing or persisting any secret.
const aliases = {
  REACT_APP_SUPABASE_URL: env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL,
  REACT_APP_SUPABASE_ANON_KEY: env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY,
};

for (const [name, value] of Object.entries(aliases)) {
  if (value) env[name] = value;
}

const reactScripts = fileURLToPath(new URL('../node_modules/react-scripts/bin/react-scripts.js', import.meta.url));
const result = spawnSync(process.execPath, [reactScripts, 'build'], {
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
