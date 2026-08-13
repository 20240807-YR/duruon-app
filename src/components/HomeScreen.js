import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import DuruLogo from './DuruLogo';
import { useLang } from '../contexts/LanguageContext';
import { fetchAllSpots } from '../services/tourApi';
import { applyApiCoords } from '../data/yeongju';
import { LANG_OPTIONS } from '../i18n/translations';
import AppNav from './AppNav';
import './HomeScreen.css';

const DESTINATION_IDS = [
  { id: 'sosu',   thumbColor: '#c9a06a', thumbColor2: '#a07840',
    distance: { '영주역': '12.5km', '풍기역': '4.1km' },
    duration:  { '영주역': '약 25분', '풍기역': '약 10분' } },
  { id: 'buseok', thumbColor: '#7a9e6a', thumbColor2: '#5a7e50',
    distance: { '영주역': '18.3km', '풍기역': '16.8km' },
    duration:  { '영주역': '약 35분', '풍기역': '약 32분' } },
  { id: 'museom', thumbColor: '#b08060', thumbColor2: '#906040',
    distance: { '영주역': '8.7km',  '풍기역': '19.4km' },
    duration:  { '영주역': '약 18분', '풍기역': '약 38분' } },
];

export default function HomeScreen({ departure, setDeparture, onSelectDest, onNavigate }) {
  const { lang, setLang, t } = useLang();
  const [selected, setSelected]       = useState(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [apiSpots, setApiSpots]       = useState({});
  const langMenuRef = useRef(null);

  // 출발역 바뀌면 선택 초기화
  useEffect(() => { setSelected(null); }, [departure]);

  // 언어 변경 시 관광공사 OpenAPI 호출 (한국어 포함 전 언어)
  useEffect(() => {
    let cancelled = false;

    fetchAllSpots(lang)
      .then((map) => {
        if (cancelled) return;
        setApiSpots(map);
        applyApiCoords(map);
      })
      .catch(() => {
        // 로컬 관광정보와 이미지가 기본값이므로 API 실패는 사용자에게 노출하지 않는다.
        if (!cancelled) setApiSpots({});
      });

    return () => { cancelled = true; };
  }, [lang]);

  // 언어 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getSpotName = (id) => apiSpots[id]?.name || t.spots[id]?.name || id;
  const getSpotDesc = (id) => t.spots[id]?.desc || '';

  const handleCardClick = (dest) => {
    setSelected((prev) => (prev?.id === dest.id ? null : dest));
  };

  const handleCallDRT = () => {
    if (!selected) return;
    onSelectDest({
      ...selected,
      name: getSpotName(selected.id),
    });
  };

  return (
    <div className="home-screen">
      {/* 헤더 */}
      <div className="home-header">
        {/* 언어 선택 */}
        <div className="lang-selector" ref={langMenuRef}>
          <button
            className="lang-btn"
            onClick={() => setShowLangMenu((v) => !v)}
            aria-label="Language"
          >
            <Icon name="globe" size={20} color="rgba(255,255,255,0.9)" />
          </button>
          {showLangMenu && (
            <div className="lang-dropdown">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  className={`lang-item ${lang === l.code ? 'active' : ''}`}
                  onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="header-top">
          <DuruLogo height={40} />
        </div>
        <p className="header-sub">{t.tagline}</p>

        <div className="station-badges">
          {['영주역', '풍기역'].map((station) => (
            <button
              key={station}
              className={`station-badge ${departure === station ? 'active' : ''}`}
              onClick={() => setDeparture(station)}
            >
              <span className="badge-pin"><Icon name="mapPin" size={13} color="currentColor" /></span>
              {t.stationDep(t.stations[station] || station)}
            </button>
          ))}
        </div>
      </div>

      {/* 목적지 목록 */}
      <div className="dest-card-wrap">
        <div className="dest-list">
          {DESTINATION_IDS.map((dest) => (
            <button
              key={dest.id}
              className={`dest-item ${selected?.id === dest.id ? 'selected' : ''}`}
              onClick={() => handleCardClick(dest)}
            >
              <div className="dest-info">
                <p className="dest-name">{getSpotName(dest.id)}</p>
                <p className="dest-desc">{getSpotDesc(dest.id)}</p>
                <p className="dest-meta">
                  {dest.distance[departure]} · {dest.duration[departure]}
                </p>
              </div>
              <div
                className="dest-thumb"
                style={{ background: `linear-gradient(135deg, ${dest.thumbColor} 0%, ${dest.thumbColor2} 100%)` }}
              >
                <img
                  src={`${process.env.PUBLIC_URL}/images/${dest.id}.jpg`}
                  alt={getSpotName(dest.id)}
                  className="dest-thumb-img"
                  onError={(e) => { e.target.style.opacity = '0'; }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DRT 호출 버튼 */}
      <div className="drt-btn-wrap">
        <button
          className={`drt-btn ${!selected ? 'disabled' : ''}`}
          onClick={handleCallDRT}
          disabled={!selected}
        >
          {selected ? t.callDRTTo(getSpotName(selected.id)) : t.callDRT}
        </button>
      </div>

      <AppNav active="home" onNavigate={onNavigate} />
    </div>
  );
}
