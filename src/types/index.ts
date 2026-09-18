export type Project = {
  id: string;
  title_en: string;
  title_id: string;
  description_en: string | null;
  description_id: string | null;
  category: string;
  year: string | null;
  image_url: string | null;
  link: string | null;
  repo_url: string | null;
  alt_text: string | null;
  slug: string | null;
  content_en: string | null;
  content_id: string | null;
  tech_stack: string[];
  sort_order: number;
  featured: boolean;
  created_at: string;
};

export type Certification = {
  id: string;
  title_en: string;
  title_id: string;
  issuer: string | null;
  category: string;
  date: string | null;
  description_en: string | null;
  description_id: string | null;
  image_url: string | null;
  alt_text: string | null;
  credential_url: string | null;
  sort_order: number;
  created_at: string;
};

export type GalleryPhoto = {
  id: string;
  title_en: string | null;
  title_id: string | null;
  image_url: string;
  alt_text: string | null;
  category: string;
  sort_order: number;
  created_at: string;
};

export type GuestComment = {
  id: string;
  name: string;
  email: string | null;
  message: string;
  rating: number | null;
  approved: boolean;
  created_at: string;
};

export type ContactStatus = "new" | "read" | "replied" | "archived";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  budget: string | null;
  status: ContactStatus;
  created_at: string;
};

export type Experience = {
  id: string;
  role_en: string;
  role_id: string;
  company: string;
  location: string | null;
  period: string | null;
  current: boolean;
  description_en: string | null;
  description_id: string | null;
  sort_order: number;
  created_at: string;
};

export type Testimonial = {
  id: string;
  quote_en: string;
  quote_id: string | null;
  author: string;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
  link: string | null;
  sort_order: number;
  created_at: string;
};

/** Seksi konten situs yang bisa ditimpa dari admin (lihat supabase/tahap3.sql). */
export type SiteContentKey =
  | "nav"
  | "profile"
  | "hero"
  | "about"
  | "whatIDo"
  | "education"
  | "techStack";

export type SiteContentRow = {
  key: SiteContentKey;
  data: unknown;
  updated_at: string;
};

export type Lang = "en" | "id";

export type Localized = { en: string; id: string };
