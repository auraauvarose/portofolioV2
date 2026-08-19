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
  sort_order: number;
  created_at: string;
};

export type GalleryPhoto = {
  id: string;
  title_en: string | null;
  title_id: string | null;
  image_url: string;
  category: string;
  sort_order: number;
  created_at: string;
};

export type Lang = "en" | "id";

export type Localized = { en: string; id: string };
