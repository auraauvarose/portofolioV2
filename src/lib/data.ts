import { CACHE_TAGS, createSupabasePublic } from "@/lib/supabase/public";
import type {
  Project,
  Certification,
  GalleryPhoto,
  GuestComment,
  Experience,
  Testimonial,
} from "@/types";

function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

// Data contoh yang tampil saat Supabase belum diisi/kosong.
// `slug` sengaja null: halaman case study hanya boleh ditautkan bila barisnya
// benar-benar ada di database, supaya tidak ada tautan /work/<slug> yang 404.
const DEMO_PROJECTS: Project[] = [
  {
    id: "demo-portfolio",
    title_en: "Portfolio Dashboard",
    title_id: "Dasbor Portofolio",
    description_en:
      "A creative and interactive developer portfolio with custom accent synchronization, terminal shells, live committing timeline feeds, and a clean responsive layout architecture.",
    description_id:
      "Portofolio developer yang kreatif dan interaktif dengan sinkronisasi aksen kustom, shell terminal, umpan timeline komit live, dan arsitektur layout responsif yang bersih.",
    category: "professional",
    year: "2025",
    image_url: null,
    link: null,
    repo_url: null,
    alt_text: null,
    slug: null,
    content_en: null,
    content_id: null,
    tech_stack: ["Next.js", "React", "Supabase", "Tailwind"],
    sort_order: 1,
    featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-arcade",
    title_en: "Retro Game Arcade Hub",
    title_id: "Hub Game Arcade Retro",
    description_en:
      "An interactive 2D web arcade cabinet hosting Tetris, Snake, and Memory cards. Equipped with a synchronized global leaderboard and robust offline cache fallbacks.",
    description_id:
      "Kabinet arcade web 2D interaktif yang menampilkan game Tetris, Snake, dan Memory. Dilengkapi papan peringkat global yang tersinkronisasi dan fallback cache offline yang andal.",
    category: "professional",
    year: "2025",
    image_url: null,
    link: null,
    repo_url: null,
    alt_text: null,
    slug: null,
    content_en: null,
    content_id: null,
    tech_stack: ["React", "JavaScript", "LocalStorage"],
    sort_order: 2,
    featured: true,
    created_at: new Date().toISOString(),
  },
];

const DEMO_CERTIFICATIONS: Certification[] = [
  {
    id: "demo-cert-1",
    title_en: "Frontend Web Developer Specialist",
    title_id: "Spesialis Pengembang Web Frontend",
    issuer: "IT Certification Board",
    category: "professional",
    date: "2025",
    description_en:
      "Certified in modern frontend web development including HTML, CSS, JavaScript, React.js, and responsive design best practices.",
    description_id:
      "Bersertifikat dalam pengembangan web frontend modern termasuk HTML, CSS, JavaScript, React.js, dan praktik terbaik desain responsif.",
    image_url: null,
    alt_text: null,
    credential_url: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-cert-2",
    title_en: "Database Engineering & Systems Administrator",
    title_id: "Rekayasa Database & Administrator Sistem",
    issuer: "Linux Professional Institute",
    category: "professional",
    date: "2025",
    description_en:
      "Certified in database management systems and Linux systems administration, covering PostgreSQL, SQL, and server administration.",
    description_id:
      "Bersertifikat dalam manajemen sistem basis data dan administrasi sistem Linux, mencakup PostgreSQL, SQL, dan administrasi server.",
    image_url: null,
    alt_text: null,
    credential_url: null,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

const DEMO_GALLERY: GalleryPhoto[] = [];

export async function getProjects(): Promise<Project[]> {
  if (!isConfigured()) return DEMO_PROJECTS;
  try {
    const supabase = createSupabasePublic(CACHE_TAGS.projects);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getProjects error:", error.message);
      return DEMO_PROJECTS;
    }
    const rows = (data as Project[]) ?? [];
    return rows.length > 0 ? rows : DEMO_PROJECTS;
  } catch (err) {
    console.error("getProjects failed:", err);
    return DEMO_PROJECTS;
  }
}

export async function getCertifications(): Promise<Certification[]> {
  if (!isConfigured()) return DEMO_CERTIFICATIONS;
  try {
    const supabase = createSupabasePublic(CACHE_TAGS.certifications);
    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("getCertifications error:", error.message);
      return DEMO_CERTIFICATIONS;
    }
    const rows = (data as Certification[]) ?? [];
    return rows.length > 0 ? rows : DEMO_CERTIFICATIONS;
  } catch (err) {
    console.error("getCertifications failed:", err);
    return DEMO_CERTIFICATIONS;
  }
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  if (!isConfigured()) return DEMO_GALLERY;
  try {
    const supabase = createSupabasePublic(CACHE_TAGS.gallery);
    const { data, error } = await supabase
      .from("gallery_photos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getGalleryPhotos error:", error.message);
      return DEMO_GALLERY;
    }
    const rows = (data as GalleryPhoto[]) ?? [];
    return rows.length > 0 ? rows : DEMO_GALLERY;
  } catch (err) {
    console.error("getGalleryPhotos failed:", err);
    return DEMO_GALLERY;
  }
}

export async function getComments(): Promise<GuestComment[]> {
  if (!isConfigured()) return [];
  try {
    const supabase = createSupabasePublic(CACHE_TAGS.comments);
    // Email sengaja tidak diseleksikan — kolom itu hanya untuk admin.
    const { data, error } = await supabase
      .from("comments")
      .select("id,name,message,rating,approved,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("getComments error:", error.message);
      return [];
    }
    return (data as GuestComment[]) ?? [];
  } catch (err) {
    console.error("getComments failed:", err);
    return [];
  }
}

// ============================================================================
// Case study — halaman /work/<slug>
// ============================================================================

/** Satu project berdasarkan slug, atau null kalau tidak ada. */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!isConfigured()) {
    return DEMO_PROJECTS.find((p) => p.slug === slug) ?? null;
  }
  try {
    // Klien publik: dipanggil juga saat build (generateStaticParams), di mana
    // `cookies()` belum tersedia.
    const supabase = createSupabasePublic(CACHE_TAGS.projects);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      console.error("getProjectBySlug error:", error.message);
      return null;
    }
    return (data as Project) ?? null;
  } catch (err) {
    console.error("getProjectBySlug failed:", err);
    return null;
  }
}

/** Semua slug project — dipakai sitemap dan daftar tautan internal. */
export async function getProjectSlugs(): Promise<string[]> {
  if (!isConfigured()) {
    return DEMO_PROJECTS.map((p) => p.slug).filter((s): s is string => Boolean(s));
  }
  try {
    const supabase = createSupabasePublic(CACHE_TAGS.projects);
    const { data, error } = await supabase
      .from("projects")
      .select("slug")
      .not("slug", "is", null);
    if (error) {
      console.error("getProjectSlugs error:", error.message);
      return [];
    }
    return (data ?? [])
      .map((row) => (row as { slug: string | null }).slug)
      .filter((s): s is string => Boolean(s));
  } catch (err) {
    console.error("getProjectSlugs failed:", err);
    return [];
  }
}

// ============================================================================
// Experience & testimonials — dibaca lewat klien publik (tanpa cookies) agar
// bisa dirender saat build maupun di request.
// ============================================================================

export async function getExperience(): Promise<Experience[]> {
  if (!isConfigured()) return [];
  try {
    const supabase = createSupabasePublic(CACHE_TAGS.experience);
    const { data, error } = await supabase
      .from("experience")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("getExperience:", error.message);
      return [];
    }
    return (data as Experience[]) ?? [];
  } catch (err) {
    console.warn("getExperience failed:", err);
    return [];
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!isConfigured()) return [];
  try {
    const supabase = createSupabasePublic(CACHE_TAGS.testimonials);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("getTestimonials:", error.message);
      return [];
    }
    return (data as Testimonial[]) ?? [];
  } catch (err) {
    console.warn("getTestimonials failed:", err);
    return [];
  }
}
