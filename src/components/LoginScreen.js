import React, { useState } from 'react';
import DuruLogo from './DuruLogo';
import { Icon } from './Icon';
import { signInUser, signUpUser } from '../services/userAuth';
import './LoginScreen.css';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginId, setLoginId] = useState(() => localStorage.getItem('duruon-login-id') || 'user');
  const [password, setPassword] = useState('demo1234');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = mode === 'login'
        ? await signInUser(loginId, password)
        : await signUpUser({ loginId, password, name, phone });
      if (remember || mode === 'signup') localStorage.setItem('duruon-login-id', loginId);
      if (!remember && mode === 'login') localStorage.removeItem('duruon-login-id');
      onLogin(user);
    } catch (e) {
      setError(e.message || '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
              autoComplete="current-password"
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
            <button type="button">비밀번호 찾기</button>
          </div>
        )}

        {error && <p className="login-error">{error}</p>}

        <button className="login-submit" type="submit" disabled={submitting}>
          {submitting ? '처리 중...' : mode === 'login' ? '로그인' : '가입하고 시작하기'}
        </button>

        <button
          type="button"
          className="login-mode-toggle"
          onClick={() => {
            setMode((value) => value === 'login' ? 'signup' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
        </button>

        <p className="demo-account">
          {mode === 'login'
            ? '임시 계정: user / demo1234 · 로그인한 상태로 새로고침해도 연결이 그대로 유지돼요.'
            : 'MVP 임시 회원가입입니다. 실제 배포 전 Supabase Auth로 교체합니다.'}
        </p>
      </form>
    </div>
  );
}
