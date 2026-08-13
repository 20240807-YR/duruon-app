// 영주시 DRT 정류장 · 좌표 단일 소스
//
// ⚠️ 좌표 정합성 정책
//   1순위: 한국관광공사 TourAPI가 내려주는 mapx/mapy (applyApiCoords로 주입)
//   2순위: 아래 하드코딩 값 (API 미응답 시 폴백)
//
//   기존에 앱과 관리자 대시보드의 관광지 좌표가 서로 달랐다(R4).
//   TourAPI를 정본으로 삼아 양쪽을 동일하게 맞춘다.
//   아래 관광지 좌표는 2026-07-19 TourAPI(KorService2) 응답으로 검증 완료.
//   ※ 영주역·풍기역·터미널·전통시장·시민병원은 TourAPI에 등록이 없어 미검증 상태.

export const DEPARTURE_COORDS = {
  영주역: { lat: 36.8003, lng: 128.6285 },
  풍기역: { lat: 36.8171, lng: 128.4854 },
};

export const YEONGJU_STOPS = [
  {
    id: 'yeongju-st',
    name: '영주역',
    address: '영주시 광복로 179',
    lat: 36.8003,
    lng: 128.6285,
  },
  {
    id: 'punggi-st',
    name: '풍기역',
    address: '영주시 풍기읍 동부리 246',
    lat: 36.8171,
    lng: 128.4854,
  },
  {
    id: 'sosu',
    name: '소수서원',
    address: '영주시 순흥면 소백로 2740',
    lat: 36.9252,
    lng: 128.5791,
    coordSource: 'fallback',
  },
  {
    id: 'buseok',
    name: '부석사',
    address: '영주시 부석면 부석사로 345',
    lat: 36.9984,
    lng: 128.6871,
    coordSource: 'fallback',
  },
  {
    id: 'museom',
    name: '무섬마을',
    address: '영주시 문수면 수도리 73',
    lat: 36.7319,
    lng: 128.6216,
    coordSource: 'fallback',
  },
  {
    id: 'seonbi',
    name: '영주 선비세상',
    address: '영주시 순흥면 청구리 산 1-1',
    lat: 36.9309,
    lng: 128.5853,
  },
  {
    id: 'terminal',
    name: '영주 시외버스터미널',
    address: '영주시 광복로 114',
    lat: 36.8052,
    lng: 128.6241,
  },
  {
    id: 'market',
    name: '영주 전통시장',
    address: '영주시 중앙로 93',
    lat: 36.8055,
    lng: 128.6245,
  },
  {
    id: 'hospital',
    name: '영주시민병원',
    address: '영주시 선비로 216',
    lat: 36.8089,
    lng: 128.6309,
  },
];

// 영주시 대략 중심 (지도 초기 위치 폴백)
export const YEONGJU_CENTER = { lat: 36.8056, lng: 128.6241 };

/**
 * TourAPI 응답의 mapx/mapy로 정류장 좌표를 덮어쓴다.
 * HomeScreen에서 API 조회 직후 1회 호출한다.
 *
 * @param {Record<string, {lat:number|null, lng:number|null}|null>} apiSpots
 * @returns {number} 갱신된 정류장 수
 */
export function applyApiCoords(apiSpots) {
  if (!apiSpots) return 0;
  let updated = 0;

  for (const [id, info] of Object.entries(apiSpots)) {
    if (!info || info.lat == null || info.lng == null) continue;

    const stop = YEONGJU_STOPS.find((s) => s.id === id);
    if (!stop) continue;
    if (stop.coordSource === 'api') continue; // 이미 반영됨

    stop.lat = info.lat;
    stop.lng = info.lng;
    stop.coordSource = 'api';
    updated += 1;
  }

  return updated;
}

/** 이름 또는 id로 좌표를 찾는다 (출발지·목적지 공용) */
export function getCoords(nameOrId) {
  if (DEPARTURE_COORDS[nameOrId]) return DEPARTURE_COORDS[nameOrId];
  const stop = YEONGJU_STOPS.find(
    (s) => s.name === nameOrId || s.id === nameOrId
  );
  return stop ? { lat: stop.lat, lng: stop.lng } : YEONGJU_CENTER;
}
