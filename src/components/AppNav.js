import React from 'react';
import { Icon } from './Icon';
import './AppNav.css';

const NAV_ITEMS = [
  { key: 'home', label: '홈', icon: 'home' },
  { key: 'booking', label: '예약', icon: 'calendar' },
  { key: 'ride', label: '내 탑승', icon: 'bus' },
  { key: 'mypage', label: '마이페이지', icon: 'person' },
];

export default function AppNav({ active = 'home', onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`nav-item ${active === item.key ? 'active' : ''}`}
          onClick={() => onNavigate?.(item.key)}
          type="button"
        >
          <span className="nav-icon">
            <Icon name={item.icon} size={20} color="currentColor" />
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
