const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function supabaseRequest(path, options = {}) {
  if (!hasSupabaseConfig) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${options.accessToken || SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(await response.text() || 'Supabase 요청에 실패했습니다.');
  return response.status === 204 ? null : response.json();
}

export function getServerNow() {
  return new Date().toISOString();
}

