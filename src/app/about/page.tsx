import type { Metadata } from "next";

export const metadata: Metadata = { title: "서비스 안내 · 개인정보 · 면책" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-2 text-sm leading-relaxed">
      <h2 className="font-serif text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">서비스 안내</h1>

      <Section title="개인정보 처리">
        <p>
          입력한 이름·성별·생년월일시·출생지는 <b>서버로 전송되거나 저장되지 않습니다.</b> 모든 사주 계산은 사용 중인
          브라우저 안에서 이루어지며, 저장한 정보는 이 기기 브라우저의 로컬 저장소(localStorage)에만 남습니다.
        </p>
        <p>브라우저의 사이트 데이터를 지우거나 홈 화면에서 삭제하면 저장된 정보가 즉시 사라집니다.</p>
        <p>
          <b>결과 공유 링크</b>에는 공유한 사람의 이름과 생년월일시가 주소(URL)에 담깁니다. 링크를 받은 사람은 그 정보를 볼 수
          있으니 신뢰할 수 있는 사람에게만 공유하세요.
        </p>
        <p>
          서비스 개선을 위해 Vercel Web Analytics로 방문 페이지·유입 경로·기기 종류 같은 익명 통계를 수집합니다. 쿠키를
          사용하지 않으며 개인을 식별하는 정보나 입력한 생년월일은 수집하지 않습니다.
        </p>
      </Section>

      <Section title="면책 고지">
        <p>
          이 서비스의 사주·궁합·운세 풀이는 전통 명리학의 일반적인 이론을 규칙에 따라 자동으로 적용한 <b>참고용 정보</b>이며,
          과학적으로 검증된 예측이 아닙니다.
        </p>
        <p>
          건강·법률·재정·투자·결혼 등 중요한 결정을 이 결과에만 의존하지 마시고, 필요한 경우 해당 분야의 전문가와
          상담하세요. 풀이 결과로 인해 발생한 결정과 그 결과에 대한 책임은 이용자에게 있습니다.
        </p>
      </Section>

      <Section title="계산 기준">
        <ul className="list-disc space-y-1 pl-5">
          <li>년주는 입춘, 월주는 절입 시각을 기준으로 하며, 절기 시각은 출생 순간(한국 시각)과 비교합니다.</li>
          <li>
            출생 시각은 당시 한국 표준시(1954~61년은 UTC+8:30)와 서머타임(1948~51년, 1955~60년, 1987~88년)을 반영해
            보정한 뒤, 출생지 경도 기준의 평균 태양시로 계산합니다. 고급 설정에서 경도 보정을 끌 수 있습니다.
          </li>
          <li>23시~자정 출생은 기본적으로 다음 날 일주로 보며, 고급 설정에서 야자시(당일 일주)를 선택할 수 있습니다.</li>
          <li>용신은 일간의 강약(억부)을 기본으로 하되, 한여름·한겨울 생으로 계절의 치우침이 심하면 조후를 우선합니다.</li>
          <li>지원 범위는 1900년~2100년입니다.</li>
        </ul>
      </Section>
    </div>
  );
}
