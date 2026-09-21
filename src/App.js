import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import HomeScreen    from './components/HomeScreen';
import BookingScreen from './components/BookingScreen';
import WaitingScreen from './components/WaitingScreen';
import ReviewScreen  from './components/ReviewScreen';
import SplashScreen  from './components/SplashScreen';
import PopupAd       from './components/PopupAd';
import RideHistoryScreen from './components/RideHistoryScreen';
import MyPageScreen from './components/MyPageScreen';
import LoginScreen from './components/LoginScreen';
import { getStoredUser, signOutUser } from './services/userAuth';
import { createReservation, makeReservationPayload, updateReservationStatus } from './services/reservations';

const ACTIVE_BOOKING_PREFIX = 'duruon-active-booking:';
const PAST_TRIPS_PREFIX = 'duruon-past-trips:';

function storageKey(prefix, userId) {
  return `${prefix}${userId || 'guest'}`;
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    try { localStorage.removeItem(key); } catch { /* storage is unavailable */ }
    return fallback;
  }
}

function removeStoredValue(key) {
  try { localStorage.removeItem(key); } catch { /* storage is unavailable */ }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or disabled browser store must not turn a successful booking into a failed one.
  }
}

export default function App() {
  const [user, setUser]                   = useState(() => getStoredUser());
  const [screen, setScreen]             = useState('home');
  const [departure, setDeparture]       = useState('영주역');
  const [selectedDest, setSelectedDest] = useState(null);
  const [bookingInfo, setBookingInfo]   = useState(null);
  const [pastTrips, setPastTrips]       = useState([]);
  const [navKey, setNavKey]             = useState(0);
  const [showAd, setShowAd]             = useState(true);
  const [showSplash, setShowSplash]     = useState(true);

  useEffect(() => {
    const userId = user?.id || 'guest';
    const savedBooking = readJson(storageKey(ACTIVE_BOOKING_PREFIX, userId), null);
    const savedTrips = readJson(storageKey(PAST_TRIPS_PREFIX, userId), []);
    setBookingInfo(savedBooking && typeof savedBooking === 'object' && !Array.isArray(savedBooking) ? savedBooking : null);
    setPastTrips(Array.isArray(savedTrips) ? savedTrips : []);
  }, [user?.id]);

  // 0.7s 표시 + 0.3s 페이드 = 1s 후 언마운트
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const hasActiveBooking = bookingInfo && !['completed', 'cancelled'].includes(bookingInfo.status);
  const navigate = (newScreen) => {
    const nextScreen = newScreen === 'booking' && hasActiveBooking ? 'ride' : newScreen;
    setNavKey((k) => k + 1);
    setScreen(nextScreen);
  };

  const goToBooking = (dest) => {
    if (hasActiveBooking) {
      navigate('ride');
      return;
    }
    setSelectedDest(dest);
    navigate('booking');
  };
  const goToWaiting = async (info) => {
    const payload = makeReservationPayload({ ...info, userId: user?.id, demoMode: user?.isDemo });
    const saved = await createReservation(payload, user?.accessToken, user?.refreshToken);
    if (!saved?.id) throw new Error('예약 결과를 확인할 수 없습니다. 다시 시도해 주세요.');

    const destination = typeof saved.destination === 'string'
      ? { ...info.destination, name: saved.destination }
      : saved.destination || info.destination;
    const booking = {
      ...info,
      ...saved,
      destination,
      bookedAt: Number.isFinite(saved.created_at ? Date.parse(saved.created_at) : NaN)
        ? Date.parse(saved.created_at)
        : (info.bookedAt || Date.now()),
      scheduledAt: saved.scheduled_at || info.scheduledAt,
      arrivalAt: saved.arrival_at || info.arrivalAt,
      reservationId: saved.id,
      status: saved.status || 'confirmed',
    };
    setBookingInfo(booking);
    writeJson(storageKey(ACTIVE_BOOKING_PREFIX, user?.id), booking);
    navigate('ride');
  };
  const cancelBooking = async () => {
    if (!bookingInfo) return;
    await updateReservationStatus(
      bookingInfo.reservationId || bookingInfo.id,
      'cancelled',
      user?.accessToken,
      user?.refreshToken,
    );
    setBookingInfo(null);
    removeStoredValue(storageKey(ACTIVE_BOOKING_PREFIX, user?.id));
    navigate('home');
  };
  const goHome      = ()     => {
    setSelectedDest(null);
    setBookingInfo(null);
    removeStoredValue(storageKey(ACTIVE_BOOKING_PREFIX, user?.id));
    navigate('home');
  };
  const completeRideAndGoHome = (completedTrip) => {
    if (completedTrip) {
      const nextTrips = [completedTrip, ...pastTrips.filter((item) => item.id !== completedTrip.id)];
      setPastTrips(nextTrips);
      writeJson(storageKey(PAST_TRIPS_PREFIX, user?.id), nextTrips);
    }
    setSelectedDest(null);
    setBookingInfo(null);
    removeStoredValue(storageKey(ACTIVE_BOOKING_PREFIX, user?.id));
    navigate('home');
  };
  const logout = () => {
    signOutUser();
    setUser(null);
    setSelectedDest(null);
    setBookingInfo(null);
    setPastTrips([]);
    setShowAd(false);
    setScreen('home');
  };

  return (
    <LanguageProvider>
      {!user ? (
        <div className="screen-enter">
          <LoginScreen onLogin={setUser} />
        </div>
      ) : (
        <div key={navKey} className="screen-enter">
          {screen === 'home' && (
            <HomeScreen
              departure={departure}
              setDeparture={setDeparture}
              bookingInfo={hasActiveBooking ? bookingInfo : null}
              onSelectDest={goToBooking}
              onNavigate={navigate}
            />
          )}
          {screen === 'booking' && (
            <BookingScreen
              departure={departure}
              destination={selectedDest}
              userId={user?.id}
              onBack={goHome}
              onConfirm={goToWaiting}
              onNavigate={navigate}
            />
          )}
          {screen === 'waiting' && (
            <WaitingScreen
              bookingInfo={bookingInfo}
              onBack={() => navigate('ride')}
              onCancel={cancelBooking}
              onArrived={() => navigate('ride')}
            />
          )}
          {screen === 'review' && (
            <ReviewScreen
              bookingInfo={bookingInfo}
              userId={user?.id}
              onDone={goHome}
            />
          )}
          {screen === 'ride' && (
            <RideHistoryScreen
              bookingInfo={bookingInfo}
              pastTrips={pastTrips}
              accessToken={user?.accessToken}
              refreshToken={user?.refreshToken}
              onCancel={cancelBooking}
              onStatusChange={(status) => {
                if (!bookingInfo) return;
                const nextBooking = { ...bookingInfo, status };
                setBookingInfo(nextBooking);
                writeJson(storageKey(ACTIVE_BOOKING_PREFIX, user?.id), nextBooking);
              }}
              onNavigate={navigate}
              onCompleteRide={completeRideAndGoHome}
            />
          )}
          {screen === 'mypage' && (
            <MyPageScreen
              user={user}
              onLogout={logout}
              onNavigate={navigate}
            />
          )}
        </div>
      )}

      {user && showAd && screen === 'home' && (
        <PopupAd onClose={() => setShowAd(false)} />
      )}

      {/* 스플래시 화면 — 최상단 오버레이 */}
      {showSplash && <SplashScreen />}
    </LanguageProvider>
  );
}
