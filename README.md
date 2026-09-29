# 나의 운명 (My Destiny)

생년월일시를 입력하면 사주팔자, 궁합, 오늘의 운세, 만세력을 볼 수 있는 웹앱입니다.

- **사주** — 사주 원국(십신·지장간·12운성·납음), 일주론(60갑자), 일간 성격, 오행 분포, 신강/신약, 억부·조후 용신,
  십신 개별 해석, 신살·합충, 초년·중년·말년운, 대운, 세운. 결과 공유 링크 지원
- **오늘의 운세** — 일진과 내 사주의 관계로 계산한 분야별 점수, 날마다 바뀌는 행운의 색·숫자·방향(희신·재신 방위)·시간(황도길시)
- **신년·월별 운세** — 올해 총운·분야별 운세·삼재, 절기 기준 12개월 흐름 차트
- **궁합** — 종합 점수, 분야별 궁합(연애·결혼·소통·금전), 앞으로 30년 두 사람의 대운 흐름 비교
- **만세력** — 월별 달력(음력·일진·절기), 날짜별 년·월·일주와 절입 시각(한국 시각), 양력↔음력 변환

모든 계산은 브라우저에서 실행되고, 입력한 정보는 `localStorage`에만 저장됩니다. 서버·DB·API 키가 필요 없습니다.

## 기술 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- [lunar-javascript](https://github.com/6tail/lunar-javascript) — 음양력 변환, 절기 기준 간지, 대운 계산

## 폴더 구조

```
src/
  app/               페이지 (/, /saju, /today, /gunghap, /manse)
  components/        공통 UI (입력 폼, 사주표, 오행 막대 등)
  lib/profiles.ts    localStorage 프로필 저장소
  lib/saju/
    constants.ts     천간·지지·오행·십신·12운성·합충·신살 테이블
    calc.ts          사주 계산 (원국, 신강약, 용신, 대운, 신살)
    interpret.ts     해석 문장
    compat.ts        궁합
    daily.ts         오늘의 운세
    yearly.ts        신년·월별 운세
    lifestages.ts    초년·중년·말년운
    daypillars.ts    일주론 60갑자
    time.ts          출생 시각 보정 (표준시 이력·서머타임·출생지 경도)
    saju.test.ts     계산 검증 테스트
  lib/share.ts       결과 공유 링크
```

## 로컬 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 계산 검증 테스트 (vitest)
```

## Vercel 배포

**방법 1 — GitHub 연동 (권장, push할 때마다 자동 배포)**

1. GitHub에 저장소를 만들고 push
2. https://vercel.com/new 에서 저장소 Import → Framework가 Next.js로 자동 인식됨 → Deploy
3. `https://<프로젝트명>.vercel.app` 주소로 서비스됨

**방법 2 — CLI**

```bash
npm i -g vercel
vercel login
vercel          # 미리보기 배포
vercel --prod   # 운영 배포
```

환경 변수는 필요 없습니다. 공유 미리보기(OG) 이미지의 주소는 Vercel 운영 도메인을 자동으로 사용하며,
커스텀 도메인을 쓰면 `NEXT_PUBLIC_SITE_URL`에 지정하세요. 방문자 통계를 보려면 Vercel 프로젝트의 Analytics 탭에서 Web Analytics를 켜세요.

## 계산 기준

- 년주는 입춘, 월주는 절입 시각 기준. 라이브러리의 절기 시각이 베이징 시간(UTC+8)이라 출생 순간을 같은 기준으로 바꿔 비교합니다
- 출생 시각은 당시 한국 표준시(1908~11년·1954~61년 UTC+8:30 등)와 서머타임(1948~51년, 1955~60년, 1987~88년)을
  반영한 뒤 출생지 경도 기준 평균 태양시로 변환합니다. 표준시·서머타임 표는 IANA tz 데이터와 매일 단위로 대조해 테스트합니다
- 23시~자정 출생은 기본적으로 다음 날 일주, 고급 설정에서 야자시 선택 가능
- 용신은 억부를 기본으로 하되, 한여름·한겨울 생으로 계절이 치우치면 조후를 우선합니다
