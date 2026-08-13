// 한국관광공사 TourAPI 클라이언트
//
// 모든 호출은 /api/tour 서버리스 프록시를 경유한다.
//  - serviceKey는 서버(Vercel 환경변수 TOUR_API_KEY)에서 주입되므로
//    이 파일에는 인증키가 존재하지 않는다.
//  - 한국어(ko)를 포함한 4개 언어 전부 OpenAPI를 호출한다.
//
// ⚠️ 지역 필터 주의
//   과거 코드는 areaCode=37을 썼으나 두 가지가 잘못돼 있었다.
//     1) 37은 전라북도이고 경상북도는 35다.
//     2) 신규 KorService2 레코드는 areacode 필드가 비어 있어
//        areaCode로 필터하면 결과가 0건이 된다.
//   → 법정동 코드(lDongRegnCd=47 경북 / lDongSignguCd=210 영주시)로 필터한다.

const SERVICE_BY_LANG = {
  ko: 'KorService2',
  en: 'EngService2',
  ja: 'JpnService2',
  zh: 'ChsService2',
};

// 관광지 콘텐츠 타입: 국문 서비스는 12, 외국어 서비스는 76
const CONTENT_TYPE_BY_LANG = { ko: '12', en: '76', ja: '76', zh: '76' };

// 영주시 법정동 코드
const L_DONG_REGN_CD = '47';   // 경상북도
const L_DONG_SIGNGU_CD = '210'; // 영주시

// 검색 키워드는 언어와 무관하게 한국어를 사용 (API가 한국어 검색을 지원)
const KEYWORDS = {
  sosu: '소수서원',
  buseok: '부석사',
  museom: '무섬마을',
};

export const SPOT_IDS = ['sosu', 'buseok', 'museom'];

const cache = {};

function toNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * API 원본 제목에서 부가 설명을 제거한다.
 *  "부석사 [유네스코 세계유산]"                                  → "부석사"
 *  "Buseoksa Temple [UNESCO World Heritage] (부석사[...])"       → "Buseoksa Temple"
 */
function cleanTitle(title) {
  if (!title) return null;
  return title
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * 관광지 1곳의 정보를 조회한다.
 * @returns {Promise<{name, rawName, addr, contentId, lat, lng, image} | null>}
 */
export async function fetchSpotInfo(lang, spotId) {
  const service = SERVICE_BY_LANG[lang];
  if (!service || !KEYWORDS[spotId]) return null;

  const cacheKey = `${lang}_${spotId}`;
  if (cache[cacheKey] !== undefined) return cache[cacheKey];

  const params = new URLSearchParams({
    service,
    operation: 'searchKeyword2',
    numOfRows: '5',
    pageNo: '1',
    keyword: KEYWORDS[spotId],
    contentTypeId: CONTENT_TYPE_BY_LANG[lang],
    lDongRegnCd: L_DONG_REGN_CD,
    lDongSignguCd: L_DONG_SIGNGU_CD,
  });

  try {
    const res = await fetch(`/api/tour?${params}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items = data?.response?.body?.items?.item;
    const list = Array.isArray(items) ? items : items ? [items] : [];

    // 좌표가 있는 첫 항목을 채택
    const item = list.find((i) => i.mapx && i.mapy) ?? list[0];

    if (!item) {
      cache[cacheKey] = null; // "결과 없음"은 확정된 사실이므로 캐싱
      return null;
    }

    const result = {
      name: cleanTitle(item.title),
      rawName: item.title ?? null,
      addr: item.addr1 ?? null,
      contentId: item.contentid ?? null,
      // TourAPI는 mapx=경도(lng), mapy=위도(lat)
      lat: toNumber(item.mapy),
      lng: toNumber(item.mapx),
      image: item.firstimage || item.firstimage2 || null,
    };
    cache[cacheKey] = result;
    return result;
  } catch (e) {
    console.warn(`[TourAPI] ${lang}/${spotId}:`, e.message);
    // 네트워크/일시 장애는 캐싱하지 않는다 → 다음 시도에 복구 가능
    return null;
  }
}

/** 3개 관광지 정보를 병렬 조회 */
export async function fetchAllSpots(lang) {
  const results = await Promise.all(
    SPOT_IDS.map((id) => fetchSpotInfo(lang, id))
  );
  return Object.fromEntries(SPOT_IDS.map((id, i) => [id, results[i]]));
}

/** 최소 1건이라도 API 응답을 받았는지 (에러 UI 판단용) */
export function hasAnyResult(spotMap) {
  return Object.values(spotMap || {}).some((v) => v !== null && v !== undefined);
}
