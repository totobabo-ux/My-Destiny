# 나의 운명 (My Destiny)

생년월일시를 입력하면 사주팔자, 궁합, 오늘의 운세, 만세력을 볼 수 있는 웹앱입니다.

- **사주** — 사주 원국(십신·지장간·12운성·납음), 일간 성격, 오행 분포, 신강/신약, 용신, 신살·합충, 대운, 세운
- **오늘의 운세** — 일진과 내 사주의 관계로 계산한 분야별 점수와 행운의 색·숫자·방향·시간 (날짜 이동 가능)
- **궁합** — 일간 관계, 배우자궁(일지), 띠, 용신 보완, 월지를 종합한 점수와 풀이
- **만세력** — 월별 달력(음력·일진·절기), 날짜별 년·월·일주, 양력↔음력 변환

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
```

## 로컬 실행

```bash
npm install
npm run dev     # http://localhost:3000
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

환경 변수는 필요 없습니다.

## 계산 기준

- 년주는 입춘, 월주는 절입 시각 기준
- 경도 보정(-30분)과 야자시 여부는 입력 폼의 "고급 설정"에서 선택
- 1948~1961년, 1987~1988년 서머타임 기간 출생자는 실제 출생 시각에서 1시간을 빼고 입력해야 정확합니다
