import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { YEONGJU_STOPS, DEPARTURE_COORDS, getCoords } from '../data/yeongju';
import internalData from '../data/drtInternalData.json';
import { makeMarkerHtml, Icon } from './Icon';
import { useLang } from '../contexts/LanguageContext';
import AppNav from './AppNav';
import { getPaymentMethods } from '../services/paymentMethods';
import './BookingScreen.css';

const ADULT_FARE = 2500;

// 좌표 조회는 data/yeongju.js의 단일 소스에 위임한다.
// (TourAPI mapx/mapy가 주입되면 자동으로 반영됨)
function getCoordsForName(name) {
  return getCoords(name);
}

const makeIcon = (bg, iconName, iconColor = '#fff') =>
  L.divIcon({
    className: '',
    html: makeMarkerHtml(bg, iconName, iconColor),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });

const depIcon  = makeIcon('#35C8B4', 'train');
const destIcon = makeIcon('#A4CF4A', 'mapPin');

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(null);
  useEffect(() => {
    if (!center) return;
    const key = center.join(',');
    if (prevCenter.current === key) return;
    prevCenter.current = key;
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function getRelativeSlots(t) {
  const now = new Date();
  return [5, 10, 15].map((mins) => {
    const d = new Date(now.getTime() + mins * 60000);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return { id: `${mins}`, label: t.timeSlots[mins], time: `${h}:${m}`, isCustom: false };
  }).concat([{ id: 'custom', label: t.timeSlots.custom, time: null, isCustom: true }]);
}

function getDefaultCustomTime() {
  const d = new Date(Date.now() + 30 * 60000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function toScheduledAt(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);
  if (value.getTime() < Date.now()) value.setDate(value.getDate() + 1);
  return value.toISOString();
}

function findRoute(departureName, destinationName) {
  return internalData.routes.find(
    (r) => r.start_name === departureName && r.end_name === destinationName && r.active === 'Y'
  );
}

export default function BookingScreen({ departure, destination: initialDest, onBack, onConfirm, onNavigate }) {
  const { t } = useLang();

  const initialStop = initialDest
    ? YEONGJU_STOPS.find((s) => s.id === initialDest.id) ?? null
    : null;

  const [depName, setDepName]       = useState(departure);
  const [query, setQuery]           = useState(initialDest?.name ?? '');
  const [selectedStop, setStop]     = useState(initialStop);
  const [showDropdown, setDropdown] = useState(false);
  const [selectedTimeId, setTimeId] = useState('10');
  const [customTime, setCustomTime] = useState(getDefaultCustomTime);
  const [adults, setAdults]         = useState(1);
  const [validationMsg, setValidationMsg] = useState('');
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // 언어 바뀌면 시간 슬롯 라벨 재생성
  const TIME_SLOTS = useMemo(() => getRelativeSlots(t), [t]);
  const selectedTime = TIME_SLOTS.find((slot) => slot.id === selectedTimeId) ?? TIME_SLOTS[1];
  const depCoords  = getCoordsForName(depName) ?? DEPARTURE_COORDS[departure];

  useEffect(() => {
    setPaymentMethods(getPaymentMethods());
  }, [showPaymentSheet]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return YEONGJU_STOPS;
    return YEONGJU_STOPS.filter(
      (s) => s.name.includes(q) || s.address.includes(q)
    );
  }, [query]);

  const mapCenter    = selectedStop ? [selectedStop.lat, selectedStop.lng] : [depCoords.lat, depCoords.lng];
  const mapZoom      = selectedStop ? 14 : 12;
  const total        = ADULT_FARE * adults;
  const resolvedTime = selectedTime?.isCustom ? customTime : selectedTime?.time;
  const canConfirm   = selectedStop && selectedTime && (!selectedTime.isCustom || customTime);

  const handleStopSelect = (stop) => {
    setStop(stop);
    setQuery(stop.name);
    setDropdown(false);
    setValidationMsg('');
  };

  const handleSwap = () => {
    if (!selectedStop) return;
    const oldDepStop = YEONGJU_STOPS.find((s) => s.name === depName) ?? null;
    setDepName(selectedStop.name);
    setStop(oldDepStop);
    setQuery(oldDepStop?.name ?? '');
  };

  const handleConfirm = () => {
    if (!selectedStop) {
      setValidationMsg('목적지를 먼저 선택해 주세요.');
      setDropdown(true);
      return;
    }
    if (!selectedTime || (selectedTime.isCustom && !customTime)) {
      setValidationMsg('탑승 시간을 선택해 주세요.');
      return;
    }
    setValidationMsg('');
    setShowPaymentSheet(true);
  };

  const submitBooking = (paymentMethod, paymentLabel) => {
    const route = findRoute(depName, selectedStop.name);
    onConfirm({
      departure:   depName,
      destination: selectedStop,
      routeId:     route?.route_id ?? null,
      estimatedMinutes: Number(route?.estimated_minutes ?? 8),
      time:        resolvedTime,
      timeLabel:   selectedTime.isCustom ? resolvedTime : selectedTime.label,
      passengers:  adults,
      adults,
      total,
      paymentMethod,
      paymentLabel,
      paymentStatus: paymentMethod === 'onsite' ? '현장 결제 예정' : '결제 완료',
      etaMinutes: Number(selectedTime.id) || 10,
      scheduledAt: toScheduledAt(resolvedTime),
      bookedAt: Date.now(),
    });
  };

  return (
    <div className="booking-screen" onClick={() => setDropdown(false)}>
      {/* 헤더 */}
      <div className="booking-header">
        <button className="back-btn" onClick={onBack}>‹</button>
        <h2 className="booking-title">{t.bookingTitle}</h2>
        <div style={{ width: 40 }} />
      </div>

      {/* 출발 / 목적지 폼 */}
      <div className="route-form-card">
        <div className="route-field-group">
          <p className="route-label">{t.departure}</p>
          <div className="route-input">
            <span className="route-input-text">{depName}</span>
          </div>
        </div>

        <div className="swap-row">
          <button
            className={`swap-btn ${!selectedStop ? 'swap-inactive' : ''}`}
            onClick={handleSwap}
            disabled={!selectedStop}
          >
            <Icon name="swapVert" size={18} color="#35C8B4" />
          </button>
        </div>

        <div className="route-field-group" onClick={(e) => e.stopPropagation()}>
          <p className="route-label">{t.destination}</p>
          <input
            className={`route-search-input ${selectedStop ? 'has-value' : ''}`}
            type="text"
            placeholder={t.destPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdown(true);
              if (!e.target.value) setStop(null);
            }}
            onFocus={() => setDropdown(true)}
          />
          {showDropdown && (
            <div className="search-dropdown">
              {filtered.length === 0 ? (
                <p className="dropdown-empty">{t.noResults}</p>
              ) : (
                filtered.map((stop) => (
                  <button
                    key={stop.id}
                    className={`dropdown-item ${selectedStop?.id === stop.id ? 'active' : ''}`}
                    onClick={() => handleStopSelect(stop)}
                  >
                    <span className="di-name">{stop.name}</span>
                    <span className="di-addr">{stop.address}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 지도 */}
      <div className="booking-map-wrap">
        <MapContainer
          center={[depCoords.lat, depCoords.lng]}
          zoom={12}
          className="booking-map"
          zoomControl={false}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFlyTo center={mapCenter} zoom={mapZoom} />
          <Marker position={[depCoords.lat, depCoords.lng]} icon={depIcon} />
          {selectedStop && (
            <>
              <Marker position={[selectedStop.lat, selectedStop.lng]} icon={destIcon} />
              <Polyline
                positions={[[depCoords.lat, depCoords.lng], [selectedStop.lat, selectedStop.lng]]}
                color="#35C8B4" weight={3} dashArray="8 5"
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* 탑승 시간 */}
      <div className="booking-card">
        <p className="booking-label">{t.boardingTime}</p>
        <div className="time-row">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.id}
              className={`time-chip ${selectedTime?.id === slot.id ? 'active' : ''}`}
              onClick={() => {
                setTimeId(slot.id);
                setValidationMsg('');
              }}
            >
              <span className="chip-mins">{slot.label}</span>
              {!slot.isCustom && <span className="chip-clock">{slot.time}</span>}
            </button>
          ))}
        </div>

        {selectedTime?.isCustom && (
          <div className="custom-time-row">
            <span className="custom-time-label">{t.timeCustomLabel}</span>
            <input
              type="time"
              className="custom-time-input"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          </div>
        )}

        <p className="time-note">{t.timeNote}</p>
      </div>

      {/* 인원 선택 */}
      <div className="booking-card">
        <p className="booking-label">{t.paxSelect}</p>
        <div className="pax-row">
          <span className="pax-type">{t.adult}</span>
          <div className="pax-ctrl">
            <button className="pax-minus" onClick={() => setAdults((a) => Math.max(1, a - 1))} disabled={adults <= 1}>−</button>
            <span className="pax-count">{adults}</span>
            <button className="pax-plus" onClick={() => setAdults((a) => Math.min(8, a + 1))}>+</button>
          </div>
        </div>
      </div>

      {/* 요금 안내 */}
      <div className="fare-info">
        <span className="fare-unit">{t.fareInfo(ADULT_FARE.toLocaleString())}</span>
        <span className="fare-divider">·</span>
        <span className="fare-total"><strong>{t.fareTotal(total.toLocaleString())}</strong></span>
      </div>
      {validationMsg && <p className="booking-validation">{validationMsg}</p>}

      {/* 예약 확정 버튼 */}
      <div className="confirm-wrap">
        <button
          className={`confirm-btn ${!canConfirm ? 'disabled' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            handleConfirm();
          }}
        >
          {t.confirmBtn}
        </button>
      </div>

      <AppNav active="" onNavigate={onNavigate} />

      {showPaymentSheet && (
        <div
          className="payment-sheet-backdrop"
          onClick={(event) => {
            event.stopPropagation();
            setShowPaymentSheet(false);
          }}
        >
          <section className="payment-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="payment-sheet-handle" />
            <h3>결제 방식을 선택하세요</h3>
            <p className="payment-summary">
              {depName} → {selectedStop.name} · {adults}명 · 총 {total.toLocaleString()}원
            </p>

            <button
              type="button"
              className="payment-option primary"
              onClick={() => submitBooking('easy', '간편 결제')}
            >
              <span className="payment-option-icon">
                <Icon name="calendar" size={18} color="#fff" />
              </span>
              <span>
                <strong>간편 결제</strong>
                <small>앱에서 바로 결제하고 예약을 확정합니다.</small>
              </span>
            </button>

            {paymentMethods.map((method) => (
              <button
                type="button"
                className={`payment-option ${method.provider === 'kakao' ? 'kakao' : 'naver'}`}
                onClick={() => submitBooking(method.provider, method.label)}
                key={method.id}
              >
                <span className="payment-option-badge">
                  {method.provider === 'kakao' ? 'K' : 'N'}
                </span>
                <span>
                  <strong>{method.label}</strong>
                  <small>등록된 간편결제로 바로 예약을 확정합니다.</small>
                </span>
              </button>
            ))}

            <button
              type="button"
              className="payment-option"
              onClick={() => submitBooking('onsite', '현장 결제')}
            >
              <span className="payment-option-icon muted">
                <Icon name="trips" size={18} color="#35C8B4" />
              </span>
              <span>
                <strong>현장 결제</strong>
                <small>탑승 시 기사 단말기 또는 교통카드로 결제합니다.</small>
              </span>
            </button>

            {paymentMethods.length === 0 && (
              <p className="payment-register-hint">네이버페이/카카오페이는 마이페이지에서 등록할 수 있습니다.</p>
            )}

            <button
              type="button"
              className="payment-cancel"
              onClick={() => setShowPaymentSheet(false)}
            >
              취소
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
