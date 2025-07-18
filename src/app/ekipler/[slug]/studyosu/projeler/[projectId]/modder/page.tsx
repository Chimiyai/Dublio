//src/app/ekipler/[slug]/studyosu/projeler/[projectId]/modder/page.tsx
import ModderStudioClient from "@/components/projects/ModderStudioClient";

export default async function ModderStudioPage(context: { params: { projectId: string; slug: string }}) {
    const params = await context.params;
    const projectId = parseInt(params.projectId, 10);

    if (isNaN(projectId)) {
        return <p>Geçersiz Proje ID.</p>;
    }

    return (
        <ModderStudioClient projectId={projectId} />
    );
}