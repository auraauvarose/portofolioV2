import HomeClient from "@/components/HomeClient";
import {
  getProjects,
  getCertifications,
  getGalleryPhotos,
  getExperience,
  getTestimonials,
} from "@/lib/data";

// Halaman di-cache; data dibaca dengan tag sehingga admin bisa memaksa segar
// lewat revalidateTag() setelah menyimpan. TTL di bawah hanya jaring pengaman.
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
