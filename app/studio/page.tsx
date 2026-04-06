import StudioApp from "@/components/studio/studio-app";

export const metadata = {
  title: "Studio — Epic-Studio",
  description: "AI 행사 디자인 제작물 생성 스튜디오",
};

export default function StudioPage() {
  return (
    <main className="grow">
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="pb-12 pt-32 md:pb-20 md:pt-40">
            <StudioApp />
          </div>
        </div>
      </section>
    </main>
  );
}
