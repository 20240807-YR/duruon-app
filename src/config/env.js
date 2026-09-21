// CRA replaces direct REACT_APP_* references at build time. Do not read them
// through a runtime `process` guard: browsers do not expose Node's `process`.
// scripts/build.mjs maps Vercel's SUPABASE_* names to these CRA-safe aliases.
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
