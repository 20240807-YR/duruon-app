import React, { useState } from 'react';
import DuruLogo from './DuruLogo';
import AppNav from './AppNav';
import { Icon } from './Icon';
import { getPaymentMethods, registerPaymentMethod, removePaymentMethod } from '../services/paymentMethods';
import './MyPageScreen.css';

const MENU_ITEMS = [
  { title: '결제수단 관리', desc: '카드 및 간편결제 등록', icon: 'card', featured: true, detail: '등록된 간편결제 수단은 예약 시 결제 방식으로 선택할 수 있습니다.' },
  { title: '이용가이드', desc: 'DRT 서비스 이용 방법', icon: 'book', detail: '출발역과 관광지를 선택한 뒤 탑승 시간과 인원을 정하면 예약할 수 있습니다.' },
  { title: '공지사항', desc: '새로운 소식 및 업데이트', icon: 'megaphone', detail: '영주 관광 DRT 시범 운영 기간에는 주요 관광지 노선을 우선 운행합니다.' },
  { title: '고객센터', desc: '문의하기 및 자주 묻는 질문', icon: 'headset', detail: '운영 문의는 영주시 관광 DRT 고객센터 054-636-XXXX로 접수됩니다.' },
];

export default function MyPageScreen({ user, onLogout, onNavigate }) {
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(() => getPaymentMethods(user?.id));

  const handleRegisterPayment = (provider) => {
    setPaymentMethods(registerPaymentMethod(provider, user?.id));
    setSelectedMenu(MENU_ITEMS[0]);
  };

  const handleRemovePayment = (id) => {
    setPaymentMethods(removePaymentMethod(id, user?.id));
  };

  const renderMenuDetail = (menu) => (
    <section className={`mypage-detail-card ${menu.title === '결제수단 관리' ? 'payment-detail' : ''}`}>
      {menu.title === '결제수단 관리' ? (
        <>
          <strong>결제수단 관리</strong>
          <p>간편결제 수단을 등록하면 예약 시 결제 방식으로 선택할 수 있습니다.</p>

          <div className="registered-payments">
            {paymentMethods.length === 0 ? (
              <span>등록된 간편결제 수단이 없습니다.</span>
            ) : (
              paymentMethods.map((method) => (
                <div className="registered-payment" key={method.id}>
                  <strong>{method.label}</strong>
                  <button type="button" onClick={() => handleRemovePayment(method.id)}>삭제</button>
                </div>
              ))
            )}
          </div>

          <div className="payment-register-actions">
            <button type="button" className="naver-pay-btn" onClick={() => handleRegisterPayment('naver')}>
              네이버페이 등록
            </button>
            <button type="button" className="kakao-pay-btn" onClick={() => handleRegisterPayment('kakao')}>
              카카오페이 등록
            </button>
          </div>
          <button type="button" onClick={() => setSelectedMenu(null)}>닫기</button>
        </>
      ) : (
        <>
          <strong>{menu.title}</strong>
          <p>{menu.detail}</p>
          <button type="button" onClick={() => setSelectedMenu(null)}>닫기</button>
        </>
      )}
    </section>
  );

  return (
    <div className="mypage-screen">
      <header className="mypage-topbar">
        <DuruLogo height={50} style={{ filter: 'none' }} />
      </header>

      <main className="mypage-content">
        <section className="profile-card">
          <div>
            <h1>{user?.name || '김영주'}</h1>
            <p>
              <Icon name="phone" size={13} color="#3c4946" />
              {user?.phone || '010-1234-5678'}
            </p>
          </div>
          <button
            className={`edit-profile-btn ${editingProfile ? 'active' : ''}`}
            type="button"
            aria-label="프로필 수정"
            onClick={() => setEditingProfile((value) => !value)}
          >
            <Icon name="edit" size={17} color="#3c4946" />
          </button>
        </section>

        {editingProfile && (
          <section className="mypage-detail-card">
            <strong>프로필 수정</strong>
            <p>이름과 연락처 변경은 관리자 확인 후 반영됩니다.</p>
            <button type="button" onClick={() => setEditingProfile(false)}>확인</button>
          </section>
        )}

        <section className="mypage-menu" aria-label="마이페이지 메뉴">
          {MENU_ITEMS.map((item) => (
            <React.Fragment key={item.title}>
              <button
                className={`mypage-menu-item ${selectedMenu?.title === item.title ? 'selected' : ''}`}
                type="button"
                onClick={() => setSelectedMenu(item)}
              >
                <span className={`menu-icon ${item.featured ? 'featured' : ''}`}>
                  <Icon name={item.icon} size={22} color="#3c4946" />
                </span>
                <span className="menu-copy">
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
                <Icon name="arrowRight" size={22} color="#b6c9c4" />
              </button>
              {selectedMenu?.title === item.title && renderMenuDetail(item)}
            </React.Fragment>
          ))}
        </section>

        <button className="logout-btn" type="button" onClick={onLogout}>
          로그아웃
        </button>

        <a
          href="https://yeongju-drt-admin.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#999', textDecoration: 'underline' }}
        >
          지자체 관리자용 데모 보기
        </a>
      </main>

      <AppNav active="mypage" onNavigate={onNavigate} />
    </div>
  );
}
