import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Sidebars from "@/components/Sidebars";
import CaseStudy from "@/components/CaseStudy";
import { getProjectBySlug, getProjectSlugs, getProjects } from "@/lib/data";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { isValidSlug } from "@/lib/slug";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  const title = project.title_en;
  const description =
    project.description_en?.slice(0, 200) ?? `${title} — a project by ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/work/${slug}`) },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(`/work/${slug}`),
      siteName: SITE_NAME,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;

  if (!isValidSlug(slug)) notFound();

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const others = (await getProjects())
    .filter((p) => p.slug && p.slug !== project.slug)
    .slice(0, 3);

  return (
    <>
      <Nav />
      <Sidebars />
      <CaseStudy project={project} others={others} />
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title_en,
            description: project.description_en ?? undefined,
            url: absoluteUrl(`/work/${project.slug}`),
            image: project.image_url ?? undefined,
            dateCreated: project.year ?? undefined,
            keywords: project.tech_stack.join(", "),
            author: {
              "@type": "Person",
              name: SITE_NAME,
              url: absoluteUrl("/"),
            },
            ...(project.repo_url ? { codeRepository: project.repo_url } : {}),
          }),
        }}
      />
    </>
  );
}
