import { hasSupabaseConfig, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/env';

export { hasSupabaseConfig } from '../config/env';

const SESSION_KEY = 'duruon-user-session';
const REQUEST_TIMEOUT_MS = 10000;

async function refreshAccessToken(refreshToken) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    const data = await response.json();
    if (!data?.access_token) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    return data;
  } catch (error) {
    if (error?.message?.includes('세션이 만료')) throw error;
    if (error?.name === 'AbortError') throw new Error('로그인 서버 응답이 없습니다. 잠시 후 다시 시도해 주세요.');
    throw new Error('로그인 서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.');
  } finally {
    clearTimeout(timeout);
  }
}

function persistRefreshedSession(data) {
  try {
    const current = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...current,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || current.refreshToken,
      expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : current.expiresAt,
    }));
  } catch {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage is unavailable */ }
  }
}

function errorMessage(response, body) {
  try {
    const parsed = JSON.parse(body);
    return parsed.message || parsed.msg || parsed.error_description || body;
  } catch {
    return body;
  }
}

function getStoredSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage is unavailable */ }
    return null;
  }
}

export async function supabaseRequest(path, options = {}) {
  if (!hasSupabaseConfig) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  const { accessToken, refreshToken, headers: customHeaders, signal: externalSignal, ...requestOptions } = options;
  const stored = getStoredSession();
  const currentAccessToken = stored?.accessToken || accessToken;
  const currentRefreshToken = stored?.refreshToken || refreshToken;
  const request = async (token) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const abortFromCaller = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener('abort', abortFromCaller, { once: true });
    }
    try {
      return await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...requestOptions,
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          ...(customHeaders || {}),
        },
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('서버 응답이 없습니다. 잠시 후 다시 시도해 주세요.');
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.');
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', abortFromCaller);
    }
  };

  let response = await request(currentAccessToken);
  if (response.status === 401 && currentRefreshToken) {
    const refreshed = await refreshAccessToken(currentRefreshToken);
    persistRefreshedSession(refreshed);
    response = await request(refreshed.access_token);
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(errorMessage(response, body) || 'Supabase 요청에 실패했습니다.');
  }
  return response.status === 204 ? null : response.json();
}

export function getServerNow() {
  return new Date().toISOString();
}
