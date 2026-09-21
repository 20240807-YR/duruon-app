const env = typeof process !== 'undefined' && process.env ? process.env : {};

// Vercel's Supabase integration uses SUPABASE_*; local CRA builds use REACT_APP_*.
export const SUPABASE_URL = env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
