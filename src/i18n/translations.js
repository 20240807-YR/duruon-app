// 받침 유무에 따라 '으로' / '로' 반환
function ro(word) {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return '으로';
  const jong = (code - 0xAC00) % 28;
  return jong === 0 || jong === 8 ? '로' : '으로';
}

export const TRANSLATIONS = {
  ko: {
    apiError: '관광 정보를 불러오지 못했습니다.',
    retry: '다시 시도',
    appName:  '두루온',
    tagline:  '영주를 두루두루, 두루온',
    departure:   '출발',
    destination: '목적지',
    callDRT:     'DRT 호출하기',
    callDRTTo:   (name) => `${name}${ro(name)} DRT 호출하기`,
    stationDep:  (name) => `${name} 출발`,
    stations:    { '영주역': '영주역', '풍기역': '풍기역' },
    navHome: '홈', navBooking: '예약', navRide: '내 탑승', navMypage: '마이페이지',

    bookingTitle:     'DRT 예약',
    boardingTime:     '탑승 시간',
    paxSelect:        '인원 선택',
    adult:            '어른',
    fareInfo:         (u) => `1인 ${u}원`,
    fareTotal:        (t) => `총 ${t}원`,
    confirmBtn:       '예약 확정하기',
    destPlaceholder:  '목적지 검색 (예: 소수서원)',
    timeNote:         'KTX 도착 후 약 10분 내 배차',
    timeCustomLabel:  '시간 직접 설정',
    noResults:        '검색 결과가 없습니다',
    timeSlots:        { 5: '5분 후', 10: '10분 후', 15: '15분 후', custom: '20분 이후' },

    waitingTitle: '탑승 대기중',
    arrivalMsg:   (m) => `${m}분 후 도착`,
    arrived:      '도착!',
    movingMsg:    (dep) => `차량이 ${dep}${ro(dep)} 이동 중입니다`,
    arrivedMsg:   '차량이 도착했습니다. 탑승해 주세요!',
    vehicleNo: '차량번호', driver: '기사님', eta: '예상 도착',
    cancelBtn: '예약 취소',

    reviewTitle:        '탑승은 어떠셨나요?',
    reviewSub:          '소중한 의견은 서비스 개선에 도움이 됩니다',
    commentPlaceholder: '한 줄 코멘트 (선택사항)',
    submitReview:       '리뷰 제출',
    skipReview:         '건너뛰기',

    spots: {
      sosu:   { name: '소수서원', desc: '조선시대 선비 문화의 보고' },
      buseok: { name: '부석사',   desc: '천년 역사의 문화재와 뛰어난 경관' },
      museom: { name: '무섬마을', desc: '내성천이 굽이쳐 감싸안은 물 위의 섬' },
    },
  },

  en: {
    apiError: 'Could not load tourism information.',
    retry: 'Retry',
    appName:  'Duruon',
    tagline:  'All around Yeongju, with Duruon',
    departure:   'Departure',
    destination: 'Destination',
    callDRT:     'Call DRT',
    callDRTTo:   (name) => `Call DRT to ${name}`,
    stationDep:  (name) => `From ${name}`,
    stations:    { '영주역': 'Yeongju Station', '풍기역': 'Punggi Station' },
    navHome: 'Home', navBooking: 'Booking', navRide: 'My Ride', navMypage: 'My Page',

    bookingTitle:     'DRT Booking',
    boardingTime:     'Boarding Time',
    paxSelect:        'Passengers',
    adult:            'Adult',
    fareInfo:         (u) => `${u} KRW / person`,
    fareTotal:        (t) => `Total  ${t} KRW`,
    confirmBtn:       'Confirm Booking',
    destPlaceholder:  'Search destination (e.g. Sosuseowon)',
    timeNote:         'Dispatched within 10 min of KTX arrival',
    timeCustomLabel:  'Set custom time',
    noResults:        'No results found',
    timeSlots:        { 5: 'In 5 min', 10: 'In 10 min', 15: 'In 15 min', custom: '20+ min' },

    waitingTitle: 'Waiting for Ride',
    arrivalMsg:   (m) => `Arriving in ${m} min`,
    arrived:      'Arrived!',
    movingMsg:    (dep) => `Vehicle is heading to ${dep}`,
    arrivedMsg:   'Your vehicle has arrived. Please board!',
    vehicleNo: 'Vehicle No.', driver: 'Driver', eta: 'Est. Arrival',
    cancelBtn: 'Cancel Booking',

    reviewTitle:        'How was your ride?',
    reviewSub:          'Your feedback helps us improve the service',
    commentPlaceholder: 'Leave a comment (optional)',
    submitReview:       'Submit Review',
    skipReview:         'Skip',

    spots: {
      sosu:   { name: 'Sosuseowon Confucian Academy', desc: 'A sanctuary of Joseon Confucian culture' },
      buseok: { name: 'Buseoksa Temple',              desc: 'Millennium heritage with breathtaking scenery' },
      museom: { name: 'Museom Village',               desc: 'An island embraced by the winding Naeseongcheon' },
    },
  },

  ja: {
    apiError: '観光情報を読み込めませんでした。',
    retry: '再試行',
    appName:  '두루온',
    tagline:  '栄州をくまなく、두루온で',
    departure:   '出発',
    destination: '目的地',
    callDRT:     'DRTを呼ぶ',
    callDRTTo:   (name) => `${name}へ DRTを呼ぶ`,
    stationDep:  (name) => `${name}発`,
    stations:    { '영주역': '栄州駅', '풍기역': '豊基駅' },
    navHome: 'ホーム', navBooking: '予約', navRide: '乗車中', navMypage: 'マイページ',

    bookingTitle:     'DRT 予約',
    boardingTime:     '乗車時間',
    paxSelect:        '人数選択',
    adult:            '大人',
    fareInfo:         (u) => `1人 ${u}ウォン`,
    fareTotal:        (t) => `合計 ${t}ウォン`,
    confirmBtn:       '予約を確定する',
    destPlaceholder:  '目的地を検索（例：紹修書院）',
    timeNote:         'KTX到着後、約10分以内に配車',
    timeCustomLabel:  '時間を指定',
    noResults:        '検索結果がありません',
    timeSlots:        { 5: '5分後', 10: '10分後', 15: '15分後', custom: '20分以降' },

    waitingTitle: '乗車待ち',
    arrivalMsg:   (m) => `${m}分後到着`,
    arrived:      '到着！',
    movingMsg:    (dep) => `車両が${dep}へ向かっています`,
    arrivedMsg:   '車両が到着しました。ご乗車ください！',
    vehicleNo: '車両番号', driver: '運転手', eta: '到着予定',
    cancelBtn: '予約をキャンセル',

    reviewTitle:        '乗車はいかがでしたか？',
    reviewSub:          'ご意見はサービス改善に役立てます',
    commentPlaceholder: 'コメント（任意）',
    submitReview:       'レビューを送信',
    skipReview:         'スキップ',

    spots: {
      sosu:   { name: '紹修書院', desc: '朝鮮時代の儒学文化の宝庫' },
      buseok: { name: '浮石寺',   desc: '千年の歴史と絶景の名刹' },
      museom: { name: '舞剣村',   desc: '内城川が蛇行して囲む水上の島' },
    },
  },

  zh: {
    apiError: '无法加载旅游信息。',
    retry: '重试',
    appName:  '두루온',
    tagline:  '遍游荣州，乘坐두루온',
    departure:   '出发地',
    destination: '目的地',
    callDRT:     '呼叫 DRT',
    callDRTTo:   (name) => `呼叫前往${name}的DRT`,
    stationDep:  (name) => `从${name}出发`,
    stations:    { '영주역': '荣州站', '풍기역': '丰基站' },
    navHome: '首页', navBooking: '预约', navRide: '乘车', navMypage: '我的',

    bookingTitle:     'DRT 预约',
    boardingTime:     '乘车时间',
    paxSelect:        '人数选择',
    adult:            '成人',
    fareInfo:         (u) => `每人 ${u}韩元`,
    fareTotal:        (t) => `合计 ${t}韩元`,
    confirmBtn:       '确认预约',
    destPlaceholder:  '搜索目的地（例：绍修书院）',
    timeNote:         'KTX到达后约10分钟内调度',
    timeCustomLabel:  '自定义时间',
    noResults:        '未找到搜索结果',
    timeSlots:        { 5: '5分钟后', 10: '10分钟后', 15: '15分钟后', custom: '20分钟以后' },

    waitingTitle: '等待乘车',
    arrivalMsg:   (m) => `${m}分钟后到达`,
    arrived:      '已到达！',
    movingMsg:    (dep) => `车辆正在前往${dep}`,
    arrivedMsg:   '车辆已到达，请上车！',
    vehicleNo: '车牌号', driver: '司机', eta: '预计到达',
    cancelBtn: '取消预约',

    reviewTitle:        '您的乘车体验如何？',
    reviewSub:          '您的反馈有助于改善服务',
    commentPlaceholder: '留下评论（可选）',
    submitReview:       '提交评价',
    skipReview:         '跳过',

    spots: {
      sosu:   { name: '绍修书院', desc: '朝鲜时代儒学文化的宝库' },
      buseok: { name: '浮石寺',   desc: '千年历史与壮观景色的名刹' },
      museom: { name: '舞剑村',   desc: '内城川蜿蜒环绕的水上岛屿' },
    },
  },
};

export const LANG_OPTIONS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];
