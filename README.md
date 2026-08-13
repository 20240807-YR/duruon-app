# 두루온 (duruon-app)

수요응답형 교통(DRT) 예약 모바일 앱. React Native로 개발합니다.

> DRT(Demand Responsive Transport): 고정 노선·시간표 없이, 이용자의 호출에 맞춰 실시간으로 경로를 짜서 운행하는 대중교통. 두루온은 이 DRT 차량을 앱에서 호출·예약하고 이용 기록을 관리합니다.

## 주요 기능

- DRT 차량 호출 및 예약
- 실시간 예약 상태 확인
- 이용(승·하차) 기록 조회
- 탭 기반 네비게이션

## 기술 스택

- **React Native**
- (상태관리 / 지도 SDK / 백엔드 등은 확정되는 대로 추가)

## 개발 환경

```bash
npm install

# iOS
npx pod-install
npm run ios

# Android
npm run android
```

> React Native 개발 환경(Node, Xcode/Android Studio) 세팅은 [공식 문서](https://reactnative.dev/docs/environment-setup) 참고.

## 디자인

UI 디자인은 Figma에서 관리합니다. (내부 링크)

## 프로젝트 구조

```
duruon-app/
├── src/          # 앱 소스 (TBD)
└── README.md
```

구조는 초기 스캐폴딩 후 정리 예정.
