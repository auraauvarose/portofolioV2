import HomeClient from "@/components/HomeClient";
import {
  getProjects,
  getCertifications,
  getGalleryPhotos,
  getExperience,
  getTestimonials,
} from "@/lib/data";

export const revalidate = 300;

export default async function HomePage() {
  const [projects, certifications, gallery, experience, testimonials] =
    await Promise.all([
      getProjects(),
      getCertifications(),
      getGalleryPhotos(),
      getExperience(),
      getTestimonials(),
    ]);

  return (
    <HomeClient
      projects={projects}
      certifications={certifications}
      gallery={gallery}
      experience={experience}
      testimonials={testimonials}
    />
  );
}
