//src/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page.tsx
import ModderStudioClient from "@/components/projects/ModderStudioClient";

export default function ModderStudioPage({ params }: { params: { projectId: string; slug: string }}) {
    // DÜZELTME: projectId'yi burada tanımlıyoruz.
    const projectId = parseInt(params.projectId, 10);

    if (isNaN(projectId)) {
        return <p>Geçersiz Proje ID.</p>;
    }

    return (
        <ModderStudioClient projectId={projectId} />
    );
}