import React, { useState } from 'react';
import DuruLogo from './DuruLogo';
import { Icon } from './Icon';
import { hasSupabaseConfig } from '../config/env';
import { signInDemoUser, signInUser, signUpUser } from '../services/userAuth';
import './LoginScreen.css';

function getRememberedLoginId() {
  try { return localStorage.getItem('duruon-login-id') || 'openapi'; } catch { return 'openapi'; }
}

function rememberLoginId(value) {
  try { localStorage.setItem('duruon-login-id', value); } catch { /* storage is unavailable */ }
}

function forgetLoginId() {
  try { localStorage.removeItem('duruon-login-id'); } catch { /* storage is unavailable */ }
}

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginId, setLoginId] = useState(getRememberedLoginId);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDemoFallback, setShowDemoFallback] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      const user = mode === 'login'
        ? await signInUser(loginId, password)
        : await signUpUser({ loginId, password, name, phone });
      if (remember || mode === 'signup') rememberLoginId(loginId.trim());
      if (!remember && mode === 'login') forgetLoginId();
      onLogin(user);
    } catch (e) {
      const message = e.message || '로그인에 실패했습니다.';
      setError(message);
      setShowDemoFallback(
        process.env.NODE_ENV === 'development'
        && mode === 'login'
        && hasSupabaseConfig
        && /연결|응답|네트워크/.test(message),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFallback = () => {
    setError('개발용 테스트 세션으로 시작했습니다. 실제 예약 데이터는 저장되지 않습니다.');
    onLogin(signInDemoUser());
  };

  return (
    <div className="user-login-screen">
      <section className="user-login-hero">
        <DuruLogo height={68} />
        <p>영주를 두루두루, 두루온</p>
      </section>

      <form className="user-login-card" onSubmit={handleSubmit}>
        <div className="login-card-heading">
          <h1>{mode === 'login' ? '로그인' : '회원가입'}</h1>
          <p>
            {mode === 'login'
              ? '두루온 계정으로 예약과 탑승 내역을 확인할 수 있어요.'
              : '임시 계정으로 바로 두루온을 시작해 보세요.'}
          </p>
        </div>

        {mode === 'signup' && (
          <>
            <label className="login-field">
              <span>이름</span>
              <div className="login-input-wrap">
                <Icon name="person" size={17} color="#7a8a86" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="이름을 입력하세요"
                  autoComplete="name"
                />
              </div>
            </label>

            <label className="login-field">
              <span>전화번호</span>
              <div className="login-input-wrap">
                <Icon name="phone" size={17} color="#7a8a86" />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                />
              </div>
            </label>
          </>
        )}

        <label className="login-field">
          <span>아이디</span>
          <div className="login-input-wrap">
            <Icon name="person" size={17} color="#7a8a86" />
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
            />
          </div>
        </label>

        <label className="login-field">
          <span>비밀번호</span>
          <div className="login-input-wrap">
            <Icon name="lock" size={17} color="#7a8a86" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? '숨김' : '보기'}
            </button>
          </div>
        </label>

        {mode === 'login' && (
          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              아이디 저장
            </label>
            <button
              type="button"
              onClick={() => { setError(''); setNotice('비밀번호 찾기는 고객센터를 통해 진행해 주세요.'); }}
            >
              비밀번호 찾기
            </button>
          </div>
        )}

        {error && <p className="login-error">{error}</p>}
        {notice && <p className="login-notice">{notice}</p>}

        <button className="login-submit" type="submit" disabled={submitting}>
          {submitting ? '처리 중...' : mode === 'login' ? '로그인' : '가입하고 시작하기'}
        </button>

        {showDemoFallback && (
          <button className="demo-fallback-btn" type="button" onClick={handleDemoFallback}>
            연결 없이 테스트하기
          </button>
        )}

        <button
          type="button"
          className="login-mode-toggle"
          onClick={() => {
            const next = mode === 'login' ? 'signup' : 'login';
            setMode(next);
            // 회원가입에는 기억된 아이디를 채우지 않는다 (중복 아이디 오류 방지)
            setLoginId(next === 'signup' ? '' : getRememberedLoginId());
            setError('');
            setNotice('');
            setShowDemoFallback(false);
          }}
        >
          {mode === 'login' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
        </button>

        {!hasSupabaseConfig && (
          <p className="demo-account">
            {mode === 'login'
              ? '임시 계정: user / demo1234 · 로그인 후 새로고침하면 세션이 유지됩니다.'
              : 'MVP 임시 회원가입입니다. 실제 배포 전 Supabase Auth로 교체합니다.'}
          </p>
        )}
      </form>
    </div>
  );
}
