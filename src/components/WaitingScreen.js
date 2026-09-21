import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCoords } from '../data/yeongju';
import internalData from '../data/drtInternalData.json';
import { makeMarkerHtml, Icon } from './Icon';
import { useLang } from '../contexts/LanguageContext';
import './WaitingScreen.css';

const makeIcon = (bg, iconName, iconColor = '#fff') =>
  L.divIcon({
    className: '',
    html: makeMarkerHtml(bg, iconName, iconColor),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const depIcon     = makeIcon('#35C8B4', 'train');
const destIcon    = makeIcon('#A4CF4A', 'mapPin');
const vehicleIcon = makeIcon('#fff', 'bus', '#35C8B4');

function MapFitBounds({ bounds }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

function pickVehicle() {
  return internalData.vehicles.find((v) => v.status === '대기')
    ?? internalData.vehicles[0]
    ?? { plate_no: '배정 중', driver_name: '배정 중' };
}

export default function WaitingScreen({ bookingInfo, onBack, onCancel, onArrived }) {
  const { t } = useLang();
  const departure = bookingInfo?.departure || '영주역';
  const destination = typeof bookingInfo?.destination === 'string'
    ? { name: bookingInfo.destination }
    : bookingInfo?.destination || { name: '목적지' };

  const depCoords  = getCoords(departure);
  const destCoords = Number.isFinite(Number(destination.lat)) && Number.isFinite(Number(destination.lng))
    ? { lat: destination.lat, lng: destination.lng }
    : depCoords;
  const scheduledAtMs = useMemo(() => {
    const value = Date.parse(bookingInfo?.scheduledAt || bookingInfo?.scheduled_at || '');
    return Number.isFinite(value) ? value : null;
  }, [bookingInfo?.scheduledAt, bookingInfo?.scheduled_at]);
  const estimatedMinutes = Number(bookingInfo?.estimatedMinutes ?? 8);
  const fallbackSeconds = (Number.isFinite(estimatedMinutes) ? Math.max(3, estimatedMinutes) : 8) * 60;
  const initialSeconds = useMemo(() => (
    scheduledAtMs === null
      ? fallbackSeconds
      : Math.max(0, Math.ceil((scheduledAtMs - Date.now()) / 1000))
  ), [fallbackSeconds, scheduledAtMs]);
  const totalSeconds = Math.max(1, initialSeconds);
  const vehicle = pickVehicle();

  const [seconds,    setSeconds]    = useState(initialSeconds);
  const [arrived,    setArrived]    = useState(initialSeconds <= 0);
  const [vehiclePos, setVehiclePos] = useState([depCoords.lat, depCoords.lng]);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const tickRef = useRef(initialSeconds);

  const handleCancel = async () => {
    if (cancelPending || !onCancel) return;
    setCancelPending(true);
    setCancelError('');
    try {
      await onCancel();
    } catch (error) {
      setCancelError(error?.message || '예약 취소를 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setCancelPending(false);
    }
  };

  // 카운트다운 + 차량 이동
  useEffect(() => {
    if (arrived) return undefined;

    const tick = () => {
      const remaining = scheduledAtMs === null
        ? Math.max(0, tickRef.current - 1)
        : Math.max(0, Math.ceil((scheduledAtMs - Date.now()) / 1000));
      tickRef.current = remaining;
      const progress = Math.min((totalSeconds - remaining) / totalSeconds, 1);

      setSeconds(remaining);
      setVehiclePos([
        depCoords.lat + (destCoords.lat - depCoords.lat) * progress,
        depCoords.lng + (destCoords.lng - depCoords.lng) * progress,
      ]);

      if (remaining <= 0) {
        clearInterval(id);
        setArrived(true);
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [arrived, depCoords.lat, depCoords.lng, destCoords.lat, destCoords.lng, scheduledAtMs, totalSeconds]);

  // 도착 후 2초 대기 → 리뷰 화면으로 전환
  useEffect(() => {
    if (!arrived || !onArrived) return;
    const timer = setTimeout(onArrived, 2000);
    return () => clearTimeout(timer);
  }, [arrived, onArrived]);

  const mins = Math.ceil(seconds / 60);
  const routeBounds = [
    [depCoords.lat,  depCoords.lng],
    [destCoords.lat, destCoords.lng],
  ];

  return (
    <div className="waiting-screen">
      {/* 헤더 */}
      <div className="waiting-header">
        <button className="back-btn-w" onClick={onBack}>‹</button>
        <h2 className="waiting-title">{t.waitingTitle}</h2>
        <div style={{ width: 40 }} />
      </div>

      {/* 도착 예정 카드 */}
      <div className={`arrival-card ${arrived ? 'arrived' : ''}`}>
        <p className="arrival-time">
          {arrived ? t.arrived : t.arrivalMsg(mins)}
        </p>
        <p className="arrival-sub">
          {arrived ? t.arrivedMsg : t.movingMsg(departure)}
        </p>
        <div className="dots-anim">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>

      {/* 실시간 지도 */}
      <div className="waiting-map-wrap">
        <MapContainer
          center={[depCoords.lat, depCoords.lng]}
          zoom={12}
          className="waiting-map"
          zoomControl={false}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFitBounds bounds={routeBounds} />
          <Polyline positions={routeBounds} color="#35C8B4" weight={3} dashArray="8 5" opacity={0.7} />
          <Marker position={[depCoords.lat,  depCoords.lng]}  icon={depIcon}     />
          <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}    />
          <Marker position={vehiclePos}                       icon={vehicleIcon} />
        </MapContainer>

        <div className="map-legend">
          <span className="legend-item dep">
            <Icon name="train"  size={12} color="#35C8B4" /> {departure}
          </span>
          <span className="legend-item dest">
            <Icon name="mapPin" size={12} color="#6aaa20" /> {destination.name}
          </span>
        </div>
      </div>

      {/* 차량 정보 */}
      <div className="vehicle-info-card">
        <div className="vi-row">
          <span className="vi-label">{t.vehicleNo}</span>
          <span className="vi-value">{vehicle.plate_no}</span>
        </div>
        <div className="vi-row">
          <span className="vi-label">{t.driver}</span>
          <span className="vi-value">{vehicle.driver_name} 기사님</span>
        </div>
        <div className="vi-row">
          <span className="vi-label">{t.eta}</span>
          <span className="vi-value vi-eta">{bookingInfo?.time || bookingInfo?.timeLabel || '--'}</span>
        </div>
      </div>

      {/* 취소 버튼 */}
      <div className="cancel-wrap">
        <button className="cancel-btn" onClick={handleCancel} disabled={cancelPending}>
          {cancelPending ? '취소 처리 중...' : t.cancelBtn}
        </button>
        {cancelError && <p className="cancel-error" role="alert">{cancelError}</p>}
      </div>
    </div>
  );
}
