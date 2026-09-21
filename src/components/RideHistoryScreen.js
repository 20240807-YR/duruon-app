import React, { useEffect, useMemo, useState } from 'react';
import DuruLogo from './DuruLogo';
import AppNav from './AppNav';
import { Icon } from './Icon';
import './RideHistoryScreen.css';
import { updateReservationStatus } from '../services/reservations';

const PAST_TRIPS = [
  { id: 'seed-1', date: '10.25', time: '09:15', from: '풍기역', to: '소수서원', fare: 2500, payment: '현장 결제' },
  { id: 'seed-2', date: '10.25', time: '11:40', from: '소수서원', to: '부석사', fare: 2500, payment: '현장 결제' },
];

function makePastTrip(trip, fallbackDate) {
  const dateMatch = fallbackDate.match(/(\d+)월\s+(\d+)일/);
  const destination = typeof trip.destination === 'string'
    ? trip.destination
    : trip.destination?.name || '목적지';
  return {
    id: `completed-${trip.reservationId || trip.id || Date.now()}`,
    date: dateMatch ? `${dateMatch[1]}.${dateMatch[2]}` : fallbackDate,
    time: trip.time || trip.timeLabel || '방금',
    from: trip.departure || '영주역',
    to: destination,
    fare: trip.total ?? 2500,
    payment: trip.paymentLabel || '결제',
  };
}

function toRideStatus(status) {
  if (status === 'boarding') return 'boarding';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'reserved';
}

export default function RideHistoryScreen({ bookingInfo, pastTrips = [], onNavigate, onCompleteRide, onCancel, accessToken, refreshToken, onStatusChange }) {
  const [selectedPastTrip, setSelectedPastTrip] = useState(null);
  const [rideStatus, setRideStatus] = useState(() => bookingInfo ? toRideStatus(bookingInfo.status) : 'waiting');
  const [nowMs, setNowMs] = useState(Date.now());
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const trip = bookingInfo;
  const hasRealBooking = Boolean(bookingInfo);
  const destinationName = typeof trip?.destination === 'string'
    ? trip.destination
    : trip?.destination?.name ?? '무섬마을';
  const passengerCount = trip?.passengers ?? trip?.adults ?? 1;
  const now = new Date();
  const scheduledDateValue = trip?.scheduledAt || trip?.scheduled_at;
  const scheduledDate = scheduledDateValue ? new Date(scheduledDateValue) : now;
  const displayDate = Number.isNaN(scheduledDate.getTime()) ? now : scheduledDate;
  const dateLabel = `${displayDate.getMonth() + 1}월 ${displayDate.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][displayDate.getDay()]})`;
  const timeLabel = trip?.time || trip?.timeLabel || '14:30';
  const plateNo = trip?.vehiclePlate || '경북 72바 1234';
  const totalFare = trip?.total ?? passengerCount * 2500;
  const paymentLabel = trip?.paymentStatus
    ? `${trip.paymentLabel || '결제'} · ${trip.paymentStatus}`
    : '현장 결제 예정';
  const statusCopy = {
    reserved: '예약 완료',
    boarding: '탑승 중',
    completed: '이용 완료',
    cancelled: '예약 취소',
    waiting: '탑승 대기',
  };
  const visiblePastTrips = [...pastTrips, ...PAST_TRIPS];
  const etaTotalSeconds = useMemo(() => {
    if (!trip) return 0;
    const scheduledMs = scheduledDateValue ? new Date(scheduledDateValue).getTime() : NaN;
    if (Number.isFinite(scheduledMs)) return Math.max(0, Math.floor((scheduledMs - nowMs) / 1000));
    const etaMinutes = Number(trip.etaMinutes ?? parseInt(trip.timeLabel, 10) ?? 10);
    const bookedAt = Number(trip.bookedAt ?? nowMs);
    return Math.max(0, etaMinutes * 60 - Math.floor((nowMs - bookedAt) / 1000));
  }, [trip, nowMs, scheduledDateValue]);
  const etaMinutesLeft = Math.floor(etaTotalSeconds / 60);
  const etaSecondsLeft = etaTotalSeconds % 60;
  const etaText = etaTotalSeconds > 0
    ? `${etaMinutesLeft}분 ${etaSecondsLeft.toString().padStart(2, '0')}초 후 도착`
    : '곧 도착';

  useEffect(() => {
    if (!hasRealBooking || rideStatus !== 'reserved') return undefined;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasRealBooking, rideStatus]);

  useEffect(() => {
    setRideStatus(bookingInfo ? toRideStatus(bookingInfo.status) : 'waiting');
    setActionError('');
  }, [bookingInfo?.reservationId, bookingInfo?.status]);

  const changeRideStatus = async (nextStatus) => {
    if (actionPending) return;
    setActionPending(true);
    setActionError('');
    try {
      await updateReservationStatus(trip.reservationId || trip.id, nextStatus, accessToken, refreshToken);
      setRideStatus(nextStatus);
      onStatusChange?.(nextStatus);
    } catch (error) {
      setActionError(error?.message || '탑승 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setActionPending(false);
    }
  };

  const cancelRide = async () => {
    if (actionPending || !onCancel) return;
    setActionPending(true);
    setActionError('');
    try {
      await onCancel();
    } catch (error) {
      setActionError(error?.message || '예약 취소를 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="ride-screen">
      <header className="ride-topbar">
        <DuruLogo height={50} style={{ filter: 'none' }} />
      </header>

      <main className="ride-content">
        <section className="ride-heading">
          <h1>내 탑승</h1>
          <p>다가오는 여정과 다녀온 기록을 볼 수 있어요.</p>
        </section>

        <section className="ride-section">
          <h2>예정된 여정</h2>
          {hasRealBooking ? (
            <article className="upcoming-card">
              <div className="status-badge">
                <span />
                {statusCopy[rideStatus] || '예약 완료'}
              </div>

              <div className={`eta-panel ${rideStatus}`}>
                <span>
                  {rideStatus === 'reserved'
                    ? '차량 도착까지'
                    : rideStatus === 'boarding'
                      ? '현재 상태'
                      : '이용 상태'}
                </span>
                <strong>
                  {rideStatus === 'reserved'
                    ? etaText
                    : rideStatus === 'boarding'
                      ? '탑승 중'
                      : rideStatus === 'cancelled'
                        ? '예약이 취소되었습니다.'
                      : '이용 완료'}
                </strong>
                {rideStatus === 'reserved' && <small>실시간으로 남은 시간이 줄어들어요.</small>}
              </div>

              <div className="date-row">
                <Icon name="calendar" size={20} color="#078b82" />
                <span>{dateLabel} {timeLabel}</span>
              </div>

              <div className="route-timeline">
                <div className="timeline-line" />
                <div className="route-point origin">
                  <span className="point-dot" />
                  <div>
                    <p>출발지</p>
                    <strong>{trip.departure || '영주역'}</strong>
                  </div>
                </div>
                <div className="route-point destination">
                  <span className="point-pin">
                    <Icon name="mapPin" size={14} color="#fff" />
                  </span>
                  <div>
                    <p>도착지</p>
                    <strong>{destinationName}</strong>
                  </div>
                </div>
              </div>

              <div className="ride-divider" />

              <div className="trip-meta">
                <div className="vehicle-meta">
                  <span className="vehicle-icon">
                    <Icon name="trips" size={19} color="#6c7a76" />
                  </span>
                  <div>
                    <p>차량 정보</p>
                    <strong>{plateNo}</strong>
                  </div>
                </div>
                <div className="passenger-meta">
                  <p>탑승 인원</p>
                  <strong>{passengerCount}명</strong>
                </div>
              </div>
              <div className="booking-confirm-note">
                <strong>
                  {rideStatus === 'completed'
                    ? '탑승이 완료되었습니다.'
                    : rideStatus === 'boarding'
                      ? '차량 탑승이 시작되었습니다.'
                      : rideStatus === 'cancelled'
                        ? '예약이 취소되었습니다.'
                      : '예약이 확정되었습니다.'}
                </strong>
                <span>{trip.timeLabel || timeLabel} 탑승 · 총 {totalFare.toLocaleString()}원</span>
                <span>{paymentLabel}</span>
              </div>
              <div className="ride-action-row">
                {rideStatus === 'reserved' && (
                  <>
                    <button type="button" disabled={actionPending} onClick={() => changeRideStatus('boarding')}>
                      {actionPending ? '처리 중...' : '탑승 시작'}
                    </button>
                    {onCancel && (
                      <button type="button" className="secondary" disabled={actionPending} onClick={cancelRide}>
                        예약 취소
                      </button>
                    )}
                  </>
                )}
                {rideStatus === 'boarding' && (
                  <button type="button" disabled={actionPending} onClick={() => changeRideStatus('completed')}>
                    {actionPending ? '처리 중...' : '하차 완료'}
                  </button>
                )}
                {rideStatus === 'completed' && (
                  <button type="button" onClick={() => onCompleteRide?.(makePastTrip(trip, dateLabel))}>
                    홈으로 가기
                  </button>
                )}
                {rideStatus === 'cancelled' && (
                  <button type="button" onClick={() => onNavigate?.('home')}>
                    홈으로 가기
                  </button>
                )}
              </div>
              {actionError && <p className="ride-action-error" role="alert">{actionError}</p>}
            </article>
          ) : (
            <article className="empty-upcoming-card">
              <Icon name="calendar" size={26} color="#9bb8b2" />
              <strong>아직 예정된 여정이 없어요.</strong>
              <p>홈에서 관광지를 고르고 예약하면 여기에 나타나요.</p>
              <button type="button" onClick={() => onNavigate?.('home')}>예약하러 가기</button>
            </article>
          )}
        </section>

        <section className="ride-section past-section">
          <h2>지난 탑승 내역</h2>
          <div className="past-list">
            {visiblePastTrips.map((item) => (
              <div className="past-item-wrap" key={item.id || `${item.from}-${item.to}-${item.time}`}>
                <button
                  className={`past-card ${selectedPastTrip === item ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedPastTrip((current) => (current === item ? null : item))}
                >
                  <span className="past-date">
                    <small>{item.date}</small>
                    <strong>{item.time}</strong>
                  </span>
                  <span className="past-route">
                    {item.from}
                    <Icon name="arrowRight" size={16} color="#3c4946" />
                    {item.to}
                    <em>이용 완료</em>
                  </span>
                  <Icon name="arrowRight" size={22} color="#6c7a76" />
                </button>
                {selectedPastTrip === item && (
                  <div className="past-detail">
                    <strong>{item.from}에서 {item.to}</strong>
                    <p>{item.date} {item.time} 탑승 완료 · {item.payment} {Number(item.fare ?? 2500).toLocaleString()}원</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <AppNav active="ride" onNavigate={onNavigate} />
    </div>
  );
}
