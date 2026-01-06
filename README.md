# 서울 구 지도 기반 인터랙티브 사운드 MVP

서울 자치구 위험도에 따라 색상과 사운드가 반응하는 인터랙티브 지도 프론트 MVP입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 참고

- 오디오는 브라우저 정책상 사용자 제스처 이후에만 활성화됩니다. 패널의 Audio On 버튼을 먼저 눌러주세요.
- `data/districts.ts`의 mock 데이터는 추후 API로 교체할 수 있습니다.
