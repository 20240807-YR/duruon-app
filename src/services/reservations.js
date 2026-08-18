import { hasSupabaseConfig, supabaseRequest } from './supabase';

export function makeReservationPayload({ userId, departure, destination, routeId, scheduledAt, estimatedMinutes, passengers, total, paymentMethod, paymentStatus }) {
  return {
    user_id: userId,
    route_id: routeId,
    departure,
    destination: destination.name || destination,
    passengers,
    scheduled_at: scheduledAt,
    arrival_at: new Date(new Date(scheduledAt).getTime() + estimatedMinutes * 60000).toISOString(),
    fare: total,
    payment_method: paymentMethod,
    payment_status: paymentStatus === '현장 결제 예정' ? 'pending' : 'simulated_paid',
    status: 'confirmed',
    idempotency_key: `${userId || 'demo'}-${scheduledAt}-${departure}-${destination.name || destination}`,
  };
}

export async function createReservation(payload, accessToken) {
  if (!hasSupabaseConfig) return { ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
  const routeId = typeof payload.route_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.route_id)
    ? payload.route_id
    : null;
  const rows = await supabaseRequest('rpc/create_reservation', {
    method: 'POST',
    body: JSON.stringify({
      p_route_id: routeId,
      p_departure: payload.departure,
      p_destination: payload.destination,
      p_passengers: payload.passengers,
      p_scheduled_at: payload.scheduled_at,
      p_duration_minutes: Math.max(1, Math.round((new Date(payload.arrival_at) - new Date(payload.scheduled_at)) / 60000)),
      p_fare: payload.fare,
      p_payment_method: payload.payment_method,
      p_payment_status: payload.payment_status,
      p_idempotency_key: payload.idempotency_key,
    }),
    accessToken,
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function getAdminReservations(accessToken) {
  if (!hasSupabaseConfig) return [];
  return supabaseRequest('reservations?select=*&order=scheduled_at.desc', { accessToken });
}

export async function updateReservationStatus(reservationId, status, accessToken) {
  if (!reservationId || !hasSupabaseConfig || String(reservationId).startsWith('local-')) return null;
  return supabaseRequest(`reservations?id=eq.${encodeURIComponent(reservationId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    accessToken,
    headers: { Prefer: 'return=representation' },
  });
}

export function reservationToAdminRow(row) {
  const date = new Date(row.scheduled_at);
  const statusMap = { requested: '대기', confirmed: '예약', boarding: '운행중', completed: '완료', cancelled: '취소' };
  return { id: row.id.slice(0, 8), date: date.toLocaleDateString('ko-KR'), time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }), departure: row.departure, destination: row.destination, passengers: row.passengers, status: statusMap[row.status] || '대기' };
}
