const STORAGE_KEY = 'duruon-user-session';
const USERS_KEY = 'duruon-users';

const DEMO_USER = {
  id: 'user01',
  name: '김영주',
  phone: '010-1234-5678',
  loginId: 'user',
};

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    localStorage.removeItem(USERS_KEY);
    return [];
  }
}

function persistUser(user) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export async function signInUser(loginId, password) {
  // Later replace this body with Supabase Auth:
  // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // then load the public user profile table by data.user.id.
  if (loginId.trim() === 'user' && password === 'demo1234') {
    persistUser(DEMO_USER);
    return DEMO_USER;
  }

  const registered = getRegisteredUsers().find(
    (user) => user.loginId === loginId.trim() && user.password === password
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

export async function signUpUser({ loginId, password, name, phone }) {
  const trimmedLoginId = loginId.trim();
  if (!trimmedLoginId || !password || !name.trim() || !phone.trim()) {
    throw new Error('모든 항목을 입력해 주세요.');
  }

  const users = getRegisteredUsers();
  if (trimmedLoginId === DEMO_USER.loginId || users.some((user) => user.loginId === trimmedLoginId)) {
    throw new Error('이미 사용 중인 아이디입니다.');
  }

  const record = {
    id: `user-${Date.now()}`,
    loginId: trimmedLoginId,
    password,
    name: name.trim(),
    phone: phone.trim(),
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, record]));

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
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function signOutUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}
