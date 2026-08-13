# 두루온 (duruon-app)

영주 관광지를 목적지로 선택하고 DRT를 예약한 뒤, 탑승 상태와 이용 내역을 확인하는 모바일 앱 프로토타입입니다.

현재 버전은 React 기반 웹 프로토타입이며, 아이폰형 목업 프레임 안에서 사용자 앱 흐름을 시연할 수 있도록 구현했습니다.

## 주요 기능

- 사용자 로그인 및 임시 회원가입
- 영주역/풍기역 출발 선택
- 소수서원, 부석사, 무섬마을 관광지 카드 표시
- DRT 예약, 탑승 시간 선택, 인원 선택
- 현장 결제 및 간편결제 선택 흐름
- 네이버페이, 카카오페이 임시 등록
- 예약 완료 후 내 탑승 화면 이동
- 차량 도착까지 남은 시간 실시간 카운트다운
- 탑승 시작, 하차 완료 상태 전환
- 완료된 예약을 지난 탑승 내역으로 이동
- 마이페이지 메뉴 및 상세 패널

## 기술 스택

- React
- Create React App
- React Leaflet
- Vercel Serverless Function 구조
- Local/session storage 기반 MVP 상태 저장

## 실행 방법

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 빌드

```bash
npm run build
```

## 임시 로그인 계정

```text
아이디: user
비밀번호: demo1234
```

## 환경변수

관광공사 API 프록시를 사용하려면 `.env`에 다음 값을 설정합니다.

```bash
TOUR_API_KEY=your_data_go_kr_service_key
```

로컬 CRA 개발 서버에서는 `/api/tour` 서버리스 함수가 붙지 않으므로 API 실패가 자연스러울 수 있습니다. 현재 화면은 API 실패와 관계없이 로컬 관광지 데이터를 표시합니다.

## 문서

구현 범위, 대표 시나리오, 남은 작업은 아래 문서에 정리했습니다.

- [PROTOTYPE_SUMMARY.md](./PROTOTYPE_SUMMARY.md)

## 배포 방향

팀 공유는 Vercel 배포 링크를 기준으로 진행하는 것이 가장 적합합니다. Figma에는 배포 링크, QR 코드, 주요 화면 캡처, 대표 시나리오를 붙이면 됩니다.
