import HomeClient from "@/components/HomeClient";
import { getProjects, getCertifications, getGalleryPhotos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, certifications, gallery] = await Promise.all([
    getProjects(),
    getCertifications(),
    getGalleryPhotos(),
  ]);

  return (
    <HomeClient
      projects={projects}
      certifications={certifications}
      gallery={gallery}
    />
  );
}
