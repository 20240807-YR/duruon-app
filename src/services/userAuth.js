import { hasSupabaseConfig, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/env';
import { supabaseRequest } from './supabase';

const STORAGE_KEY = 'duruon-user-session';
const USERS_KEY = 'duruon-users';

const DEMO_USER = {
  id: 'user01',
  name: '김영주',
  phone: '010-1234-5678',
  loginId: 'user',
};

const AUTH_TIMEOUT_MS = 8000;
const PROFILE_FALLBACK_PHONE = '미등록';
const toAuthEmail = (value = '') => {
  const normalized = String(value).trim();
  return normalized.includes('@') ? normalized : `${normalized}@duruon.app`;
};

async function supabaseAuth(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const bodyText = await response.text();
      try {
        const bodyJson = JSON.parse(bodyText);
        throw new Error(bodyJson.msg || bodyJson.message || bodyJson.error_description || '인증에 실패했습니다.');
      } catch (error) {
        if (error instanceof Error && error.message !== 'Unexpected end of JSON input') throw error;
        throw new Error('인증에 실패했습니다.');
      }
    }
    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('인증 서버 응답이 없습니다. 잠시 후 다시 시도해 주세요.');
    if (error instanceof TypeError || ['Failed to fetch', 'NetworkError', 'Load failed'].includes(error?.message)) {
      throw new Error('인증 서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.');
    }
    if (error?.message) throw error;
    throw new Error('인증 서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.');
  } finally {
    clearTimeout(timeout);
  }
}

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    try { localStorage.removeItem(USERS_KEY); } catch { /* storage is unavailable */ }
    return [];
  }
}

function persistUser(user) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Keep the in-memory session working even when private-mode storage is blocked.
  }
}

function clearStoredUser() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* storage is unavailable */ }
}

function sessionFromAuthData(data, fallback = {}) {
  return {
    ...fallback,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  };
}

async function ensureUserProfile({ id, name, phone, accessToken, refreshToken }) {
  if (!id || !hasSupabaseConfig) return;

  try {
    // Ignore duplicate ids so an existing profile is never overwritten by sparse
    // Auth metadata from a later login.
    await supabaseRequest('user_profiles', {
      method: 'POST',
      body: JSON.stringify({
        id,
        name: String(name || '두루온 사용자').trim(),
        phone: String(phone || PROFILE_FALLBACK_PHONE).trim(),
      }),
      accessToken,
      refreshToken,
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
    });
  } catch (error) {
    // The on_auth_user_created trigger already provisions the profile, so this
    // call is a safety net. Blocking sign-in when it fails would be worse than
    // the gap it covers.
    console.warn('user_profiles 사전 생성 실패(무시됨):', error);
  }
}

export async function signInUser(loginId, password) {
  const trimmedLoginId = String(loginId ?? '').trim();
  if (!trimmedLoginId || !password) throw new Error('아이디와 비밀번호를 입력해 주세요.');

  if (hasSupabaseConfig) {
    const data = await supabaseAuth('token?grant_type=password', { email: toAuthEmail(trimmedLoginId), password });
    if (!data?.user?.id || !data?.access_token) throw new Error('로그인 결과가 올바르지 않습니다. 다시 시도해 주세요.');
    const name = data.user.user_metadata?.name || trimmedLoginId;
    const phone = data.user.user_metadata?.phone || '';
    await ensureUserProfile({ id: data.user.id, name, phone, accessToken: data.access_token, refreshToken: data.refresh_token });
    const user = sessionFromAuthData(data, { id: data.user.id, name, phone, loginId: data.user.email });
    persistUser(user);
    return user;
  }
  if (trimmedLoginId === 'user' && password === 'demo1234') {
    persistUser(DEMO_USER);
    return DEMO_USER;
  }

  const registered = getRegisteredUsers().find(
    (user) => user.loginId === trimmedLoginId && user.password === password
  );
  if (registered) {
    const user = {
      id: registered.id,
      name: registered.name,
      phone: registered.phone,
      loginId: registered.loginId,
    };
    persistUser(user);
    return user;
  }

  throw new Error('아이디 또는 비밀번호를 확인해 주세요.');
}

// Supabase가 끊긴 localhost에서만 명시적으로 선택할 수 있는 테스트 세션.
export function signInDemoUser() {
  const user = { ...DEMO_USER, isDemo: true };
  persistUser(user);
  return user;
}

export async function signUpUser({ loginId, password, name, phone } = {}) {
  const trimmedLoginId = String(loginId ?? '').trim();
  const trimmedName = String(name ?? '').trim();
  const trimmedPhone = String(phone ?? '').trim();
  if (!trimmedLoginId || !password || !trimmedName || !trimmedPhone) {
    throw new Error('모든 항목을 입력해 주세요.');
  }

  if (hasSupabaseConfig) {
    const data = await supabaseAuth('signup', { email: toAuthEmail(trimmedLoginId), password, data: { name: trimmedName, phone: trimmedPhone } });
    if (!data?.user || !data?.access_token) throw new Error('가입 확인 메일을 확인한 뒤 로그인해 주세요.');
    await ensureUserProfile({ id: data.user.id, name: trimmedName, phone: trimmedPhone, accessToken: data.access_token, refreshToken: data.refresh_token });
    const user = sessionFromAuthData(data, { id: data.user.id, name: trimmedName, phone: trimmedPhone, loginId: trimmedLoginId });
    persistUser(user);
    return user;
  }

  const users = getRegisteredUsers();
  if (trimmedLoginId === DEMO_USER.loginId || users.some((user) => user.loginId === trimmedLoginId)) {
    throw new Error('이미 사용 중인 아이디입니다.');
  }

  const record = {
    id: `user-${Date.now()}`,
    loginId: trimmedLoginId,
    password,
    name: trimmedName,
    phone: trimmedPhone,
  };
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, record]));
  } catch {
    throw new Error('브라우저 저장소를 사용할 수 없어 회원가입을 완료하지 못했습니다.');
  }

  const user = {
    id: record.id,
    name: record.name,
    phone: record.phone,
    loginId: record.loginId,
  };
  persistUser(user);
  return user;
}

export function getStoredUser() {
  let raw;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    if (!user || typeof user.id !== 'string' || !user.id) {
      clearStoredUser();
      return null;
    }
    return user;
  } catch {
    clearStoredUser();
    return null;
  }
}

export function signOutUser() {
  clearStoredUser();
}
