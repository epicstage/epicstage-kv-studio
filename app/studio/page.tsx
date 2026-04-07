import StudioApp from "@/components/studio/studio-app";
import ProjectMenu from "@/components/studio/project-menu";

export const metadata = {
  title: "Studio — Epic-Studio",
  description: "AI 행사 디자인 제작물 생성 스튜디오",
};

export default function StudioPage() {
  return (
    <main className="grow">
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between pb-4 pt-28 md:pt-36">
            <h1 className="font-nacelle text-2xl font-bold text-white">
              Epic<span className="text-indigo-400">-Studio</span>
            </h1>
            <ProjectMenu />
          </div>
          <div className="pb-12">
            <StudioApp />
          </div>
        </div>
      </section>
    </main>
  );
}
