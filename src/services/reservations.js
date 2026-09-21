import { hasSupabaseConfig, supabaseRequest } from './supabase';

const VALID_RESERVATION_STATUSES = new Set(['requested', 'confirmed', 'boarding', 'completed', 'cancelled']);

export function makeReservationPayload({ userId, demoMode, departure, destination, routeId, scheduledAt, estimatedMinutes, passengers, total, paymentMethod, paymentStatus } = {}) {
  const destinationName = typeof destination === 'string'
    ? destination.trim()
    : typeof destination?.name === 'string' ? destination.name.trim() : '';
  const departureName = typeof departure === 'string' ? departure.trim() : '';
  const scheduledMs = Date.parse(scheduledAt || '');
  const durationMinutes = Number.isFinite(Number(estimatedMinutes))
    ? Math.max(1, Math.round(Number(estimatedMinutes)))
    : 8;
  const passengerCount = Number.isFinite(Number(passengers))
    ? Math.min(8, Math.max(1, Math.round(Number(passengers))))
    : 1;
  const fare = Number.isFinite(Number(total)) ? Math.max(0, Number(total)) : passengerCount * 2500;

  if (!departureName || !destinationName || !Number.isFinite(scheduledMs)) {
    throw new Error('예약 정보가 올바르지 않습니다. 출발지, 목적지, 시간을 다시 선택해 주세요.');
  }

  return {
    user_id: userId,
    demo_mode: Boolean(demoMode),
    route_id: routeId,
    departure: departureName,
    destination: destinationName,
    passengers: passengerCount,
    scheduled_at: scheduledAt,
    arrival_at: new Date(scheduledMs + durationMinutes * 60000).toISOString(),
    fare,
    payment_method: paymentMethod,
    payment_status: paymentStatus === '현장 결제 예정' ? 'pending' : 'simulated_paid',
    status: 'confirmed',
    idempotency_key: `${userId || 'demo'}-${scheduledAt}-${departureName}-${destinationName}`,
  };
}

export async function createReservation(payload, accessToken, refreshToken) {
  if (!hasSupabaseConfig || payload.demo_mode) return { ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
  const routeId = typeof payload.route_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.route_id)
    ? payload.route_id
    : null;
  const scheduledMs = Date.parse(payload.scheduled_at);
  const arrivalMs = Date.parse(payload.arrival_at);
  const durationMinutes = Number.isFinite(scheduledMs) && Number.isFinite(arrivalMs)
    ? Math.max(1, Math.round((arrivalMs - scheduledMs) / 60000))
    : 8;
  const rows = await supabaseRequest('rpc/create_reservation', {
    method: 'POST',
    body: JSON.stringify({
      p_route_id: routeId,
      p_departure: payload.departure,
      p_destination: payload.destination,
      p_passengers: payload.passengers,
      p_scheduled_at: payload.scheduled_at,
      p_duration_minutes: durationMinutes,
      p_fare: payload.fare,
      p_payment_method: payload.payment_method,
      p_payment_status: payload.payment_status,
      p_idempotency_key: payload.idempotency_key,
    }),
    accessToken,
    refreshToken,
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function getAdminReservations(accessToken) {
  if (!hasSupabaseConfig) return [];
  return supabaseRequest('reservations?select=*&order=scheduled_at.desc', { accessToken });
}

export async function updateReservationStatus(reservationId, status, accessToken, refreshToken) {
  if (!reservationId || !hasSupabaseConfig || String(reservationId).startsWith('local-')) return null;
  if (!VALID_RESERVATION_STATUSES.has(status)) {
    throw new Error('지원하지 않는 예약 상태입니다.');
  }
  const updated = await supabaseRequest(`reservations?id=eq.${encodeURIComponent(reservationId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    accessToken,
    refreshToken,
    headers: { Prefer: 'return=representation' },
  });
  if (Array.isArray(updated) && updated.length === 0) {
    throw new Error('예약 상태를 저장하지 못했습니다. 새로고침 후 다시 시도해 주세요.');
  }
  return updated;
}

export function reservationToAdminRow(row) {
  const parsedDate = new Date(row?.scheduled_at);
  const date = Number.isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate;
  const statusMap = { requested: '대기', confirmed: '예약', boarding: '운행중', completed: '완료', cancelled: '취소' };
  return { id: String(row?.id || '').slice(0, 8), date: date.toLocaleDateString('ko-KR'), time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), departure: row?.departure || '-', destination: row?.destination || '-', passengers: Number(row?.passengers) || 0, status: statusMap[row?.status] || '대기' };
}
