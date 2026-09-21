// Vercel Serverless Function — 한국관광공사 TourAPI 프록시
//  - CORS 회피
//  - serviceKey를 서버에서 주입 (브라우저 번들에 키가 남지 않음)
//  - 허용된 파라미터만 전달 (알 수 없는 파라미터가 섞이면 TourAPI가
//    INVALID_REQUEST_PARAMETER_ERROR를 반환하므로 화이트리스트로 차단)
//  - 응답 CDN 캐싱으로 쿼터 절약

const ALLOWED_SERVICES = [
  'KorService2',
  'EngService2',
  'JpnService2',
  'ChsService2',
];

const ALLOWED_OPERATIONS = ['searchKeyword2', 'detailCommon2', 'detailIntro2'];

const ALLOWED_PARAMS = [
  'keyword',
  'numOfRows',
  'pageNo',
  'arrange',
  'contentTypeId',
  'contentId',
  'lDongRegnCd',
  'lDongSignguCd',
  'lclsSystm1',
  'lclsSystm2',
  'lclsSystm3',
];
const UPSTREAM_TIMEOUT_MS = 8000;

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { service, operation = 'searchKeyword2' } = req.query;

  if (typeof service !== 'string' || !ALLOWED_SERVICES.includes(service)) {
    return res.status(400).json({ error: `invalid service: ${service}` });
  }
  if (typeof operation !== 'string' || !ALLOWED_OPERATIONS.includes(operation)) {
    return res.status(400).json({ error: `invalid operation: ${operation}` });
  }

  const serviceKey = process.env.TOUR_API_KEY;
  if (!serviceKey) {
    return res.status(500).json({ error: 'TOUR_API_KEY is not configured' });
  }

  const params = new URLSearchParams();
  for (const name of ALLOWED_PARAMS) {
    const v = req.query[name];
    if (v === undefined || v === '') continue;
    if (typeof v !== 'string') {
      return res.status(400).json({ error: `invalid parameter: ${name}` });
    }
    params.set(name, v);
  }
  params.set('serviceKey', serviceKey);
  params.set('MobileOS', 'ETC');
  params.set('MobileApp', 'YeongjuDRT');
  params.set('_type', 'json');

  const url = `https://apis.data.go.kr/B551011/${service}/${operation}?${params}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const text = await upstream.text();

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: `upstream ${upstream.status}`, body: text.slice(0, 500) });
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res
        .status(502)
        .json({ error: 'upstream returned non-JSON', body: text.slice(0, 500) });
    }

    // 관광공사가 200으로 내려주는 오류(resultCode != 0000)도 오류로 취급
    const code = json?.response?.header?.resultCode ?? json?.resultCode;
    if (code && code !== '0000') {
      return res.status(502).json({
        error: `TourAPI ${code}`,
        message: json?.response?.header?.resultMsg ?? json?.resultMsg ?? '',
      });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(json);
  } catch (e) {
    if (e?.name === 'AbortError') {
      return res.status(504).json({ error: 'TourAPI upstream timeout' });
    }
    return res.status(502).json({ error: e.message });
  } finally {
    clearTimeout(timeout);
  }
}
