import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import './PopupAd.css';

const AD_URL = 'https://map.naver.com/p/search/영주+막국수';

export default function PopupAd({ onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        {/* 우측 상단 닫기 버튼 */}
        <button className="popup-close" onClick={onClose} aria-label="닫기">
          <Icon name="close" size={13} color="#fff" />
        </button>

        {/* 광고 배지 */}
        <span className="popup-badge">영주 소상공인 광고</span>

        {/* 이미지 영역 */}
        <div className="popup-img-area">
          <Icon name="restaurant" size={52} color="rgba(255,255,255,0.9)" />
          <div className="popup-img-sub">오늘의 추천 맛집</div>
        </div>

        {/* 콘텐츠 */}
        <div className="popup-body">
          <p className="popup-store">풍기인삼 막국수 본점</p>
          <p className="popup-desc">43년 전통 · 직접 재배 인삼으로 만든<br />영주 대표 건강 막국수</p>

          <div className="popup-info">
            <span className="popup-info-row">
              <Icon name="mapPin" size={13} color="#999" />
              영주시 풍기읍 성내로 12
            </span>
            <span className="popup-info-row">
              <Icon name="clock" size={13} color="#999" />
              매일 10:00 ~ 20:00
            </span>
            <span className="popup-info-row">
              <Icon name="phone" size={13} color="#999" />
              054-636-XXXX
            </span>
          </div>

          <div className="popup-tags">
            <span className="popup-tag">#풍기인삼</span>
            <span className="popup-tag">#영주맛집</span>
            <span className="popup-tag">#43년전통</span>
          </div>

          <a
            className="popup-learn-btn"
            href={AD_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            자세히 알아보기
            <Icon name="arrowRight" size={16} color="#fff" />
          </a>
        </div>
      </div>
    </div>
  );
}
