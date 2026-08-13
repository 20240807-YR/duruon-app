// 관광공사 TourAPI(KorService2)에서 영주시 관광지 확정 좌표를 조회해 출력한다.
//   TOUR_API_KEY=xxxx node scripts/fetch-coords.mjs
//
// ⚠️ areaCode 파라미터는 쓰지 않는다. 신규 레코드는 areacode 필드가 비어 있어
//    필터하면 결과가 0건이 된다. 법정동 코드(lDongRegnCd/lDongSignguCd)를 쓴다.

const KEY = process.env.TOUR_API_KEY;
if (!KEY) {
  console.error('TOUR_API_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const SPOTS = {
  sosu: '소수서원',
  buseok: '부석사',
  museom: '무섬마을',
  seonbi: '선비세상',
};

for (const [id, keyword] of Object.entries(SPOTS)) {
  const params = new URLSearchParams({
    serviceKey: KEY,
    numOfRows: '5',
    pageNo: '1',
    MobileOS: 'ETC',
    MobileApp: 'YeongjuDRT',
    _type: 'json',
    keyword,
    contentTypeId: '12',
    lDongRegnCd: '47',  // 경상북도
    lDongSignguCd: '210', // 영주시
  });

  try {
    const res = await fetch(
      `https://apis.data.go.kr/B551011/KorService2/searchKeyword2?${params}`
    );
    const json = await res.json();
    const items = json?.response?.body?.items?.item ?? [];
    const list = Array.isArray(items) ? items : [items];

    console.log(`\n── ${id} (${keyword}) ─────────────────`);
    if (!list.length || !list[0]) {
      console.log('  결과 없음');
      continue;
    }
    for (const it of list) {
      console.log(
        `  ${it.title}\n    addr: ${it.addr1 ?? '-'}\n    lat: ${it.mapy}, lng: ${it.mapx}\n    contentid: ${it.contentid}`
      );
    }
  } catch (e) {
    console.log(`── ${id}: 실패 — ${e.message}`);
  }
}
