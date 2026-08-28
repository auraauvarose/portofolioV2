import type { Localized } from "@/types";

export const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "aura2007").trim();
export const ADMIN_COOKIE_SECRET =
  process.env.ADMIN_COOKIE_SECRET ?? "";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const profile = {
  name: "Aura Auvarose",
  email: "auraauvaroseendica@gmail.com",
  location: {
    en: "Indonesia",
    id: "Indonesia",
  },
  cvUrl: "/cv.pdf",
  socials: [
    { label: "Github", href: "https://github.com/auraauvarose" },
    { label: "Instagram", href: "https://www.instagram.com/aura_auvarose_/" },
    { label: "Email", href: "mailto:auraauvaroseendica@gmail.com" },
    { label: "Discord", href: "https://discord.com/users/862306063054667786" },
    { label: "TikTok", href: "https://www.tiktok.com/@au.rose" },
  ],
} as const;

export const nav: { en: string; id: string }[] = [
  { en: "About", id: "Tentang" },
  { en: "Work", id: "Karya" },
  { en: "Contact", id: "Kontak" },
];

export const hero = {
  role: { en: "Fullstack Developer", id: "Fullstack Developer" },
  tagline: {
    en: "Available For Projects Freelance",
    id: "Tersedia Untuk Proyek Freelance",
  },
  locationPrefix: { en: "Located in", id: "Berlokasi di" },
  line1: "AURA",
  line2: "AUVAROSE",
  line3: "",
} as const;

export const about = {
  kicker: { en: "About Me", id: "Tentang Saya" },
  paragraphs: [
    {
      en: "Hi! I'm Aura Auvarose, a first-semester Informatics student carving my path in the tech world. My journey isn't about ease — it's about persistence through limitations.",
      id: "Hai! Saya Aura Auvarose, seorang mahasiswa Informatika semester 1 yang sedang meniti jalan di dunia teknologi. Perjalanan saya bukan tentang kemudahan, melainkan tentang ketekunan di tengah keterbatasan.",
      highlight: {
        en: ["Aura", "Auvarose"],
        id: ["Aura", "Auvarose"],
      },
    },
    {
      en: "Currently I'm actively exploring Arch Linux and building this personal portfolio as real proof of my growth. My focus is on mastering strong programming logic and staying consistent — learning every night to reach a professional level.",
      id: "Saat ini, saya sedang aktif mendalami Arch Linux dan membangun portofolio pribadi sebagai bukti nyata perkembangan saya. Fokus saya saat ini adalah menguasai logika pemrograman yang kuat dan terus konsisten belajar setiap malam demi mencapai level profesional.",
      highlight: {
        en: [
          "Arch",
          "Linux",
          "consistent",
          "learning",
          "every",
          "night",
          "to",
          "reach",
          "a",
          "professional",
          "level",
        ],
        id: [
          "Arch",
          "Linux",
          "konsisten",
          "belajar",
          "setiap",
          "malam",
          "mencapai",
          "level",
          "profesional",
        ],
      },
    },
  ],
  cta: { en: "Download CV", id: "Unduh CV" },
} as const;

export const whatIDo = {
  kicker: { en: "What I Do", id: "Yang Saya Kerjakan" },
  heading: { en: "Services & Expertise", id: "Layanan & Keahlian" },
  items: [
    {
      title: { en: "UI UX", id: "UI UX" },
      description: {
        en: "I search the internet for visual references and then combine them to create my own work.",
        id: "Saya mencari referensi visual di internet lalu menggabungkannya untuk menciptakan karya saya sendiri.",
      },
    },
    {
      title: { en: "Website", id: "Website" },
      description: {
        en: "Building responsive and high-performance websites using the latest technologies.",
        id: "Membangun website responsif dan berkinerja tinggi menggunakan teknologi terkini.",
      },
    },
    {
      title: { en: "Mobile", id: "Mobile" },
      description: {
        en: "Crafting intuitive mobile experiences for both iOS and Android platforms.",
        id: "Merancang pengalaman mobile yang intuitif untuk platform iOS dan Android.",
      },
    },
    {
      title: { en: "Backend", id: "Backend" },
      description: {
        en: "Developing robust server-side logic and scalable database architectures.",
        id: "Mengembangkan logika server-side yang andal dan arsitektur basis data yang skalabel.",
      },
    },
  ],
} as const;

export const education = {
  kicker: { en: "Education", id: "Pendidikan" },
  items: [
    {
      period: "2021 - 2025",
      school: "Learning Experience",
      degree: {
        en: "Visual Communication Design",
        id: "Desain Komunikasi Visual",
      },
      detail: {
        en: "Design Fundamentals",
        id: "Dasar Desain",
      },
      location: {
        en: "Indonesia",
        id: "Indonesia",
      },
      description: {
        en: "Built a strong foundation in design fundamentals, then moved into web development. Started learning programming with JavaScript and Python in 2022.",
        id: "Membangun dasar yang kuat di bidang desain, lalu beralih ke pengembangan web. Mulai belajar pemrograman menggunakan JavaScript dan Python pada 2022.",
      },
    },
    {
      period: "2025 - Present",
      school: "Informatics Degree",
      degree: {
        en: "S1 Informatics Student",
        id: "Mahasiswa S1 Informatika",
      },
      detail: {
        en: "Informatics",
        id: "Informatika",
      },
      location: {
        en: "Indonesia",
        id: "Indonesia",
      },
      description: {
        en: "Enrolled in a Bachelor of Informatics degree. Actively exploring Arch Linux, mastering strong programming logic, and building real projects to reach a professional level.",
        id: "Menempuh pendidikan S1 Informatika. Aktif mendalami Arch Linux, menguasai logika pemrograman yang kuat, dan membangun proyek nyata untuk mencapai level profesional.",
      },
    },
  ],
} as const;

export const certifications = {
  kicker: { en: "Certifications", id: "Sertifikasi" },
  heading: { en: "Credentials & Courses", id: "Kredensial & Kursus" },
  description: {
    en: "Certifications and credentials I've earned along the way.",
    id: "Sertifikasi dan kredensial yang telah saya raih.",
  },
  categories: {
    internship: { en: "Internship", id: "Magang" },
    professional: { en: "Professional", id: "Profesional" },
    technical: { en: "Technical", id: "Teknis" },
  } as Record<string, Localized>,
} as const;

export const techStack = {
  kicker: { en: "Tools & Workflow", id: "Alat & Alur Kerja" },
  heading: { en: "Tech Stack", id: "Tech Stack" },
  categories: [
    {
      title: { en: "Development Stack", id: "Development Stack" },
      items: [
        "JavaScript",
        "TypeScript",
        "React.js",
        "Next.js",
        "Node.js",
        "Python",
      ],
    },
    {
      title: { en: "Databases & Backend", id: "Database & Backend" },
      items: ["Supabase", "PostgreSQL", "SQL", "Express"],
    },
    {
      title: { en: "DevOps & Cloud", id: "DevOps & Cloud" },
      items: ["Docker", "Git & GitHub", "Linux Fedora", "Bash CLI"],
    },
    {
      title: { en: "Development Tools", id: "Alat Pengembangan" },
      items: ["VS Code", "Arch Linux", "C++"],
    },
  ],
} as const;

export const techDescriptions: Record<string, Localized> = {
  JavaScript: {
    en: "The programming language of the web — powers interactive pages and server logic.",
    id: "Bahasa pemrograman untuk web — menggerakkan halaman interaktif dan logika server.",
  },
  TypeScript: {
    en: "A typed superset of JavaScript that catches errors at compile time.",
    id: "Superset JavaScript dengan tipe statis yang menangkap error saat kompilasi.",
  },
  "React.js": {
    en: "A UI library for building component-based, interactive interfaces.",
    id: "Library UI untuk membangun antarmuka interaktif berbasis komponen.",
  },
  "Next.js": {
    en: "A React framework with routing, SSR, and static optimization for production.",
    id: "Framework React dengan routing, SSR, dan optimasi statis untuk produksi.",
  },
  "Node.js": {
    en: "A JavaScript runtime that runs JS on the server and builds APIs.",
    id: "Runtime JavaScript untuk menjalankan JS di server dan membangun API.",
  },
  Python: {
    en: "A versatile language for scripting, automation, data processing, and backends.",
    id: "Bahasa serbaguna untuk scripting, otomasi, pengolahan data, dan backend.",
  },
  Supabase: {
    en: "Open-source Firebase alternative: Postgres database, auth, and storage.",
    id: "Alternatif open-source Firebase: database Postgres, auth, dan storage.",
  },
  PostgreSQL: {
    en: "A powerful open-source relational database built on SQL.",
    id: "Database relasional open-source yang kuat, dibangun di atas SQL.",
  },
  SQL: {
    en: "The standard language for querying and managing relational databases.",
    id: "Bahasa standar untuk mengelola dan mengkueri database relasional.",
  },
  Express: {
    en: "A minimal Node.js framework for building REST APIs and web servers.",
    id: "Framework Node.js minimal untuk membangun REST API dan web server.",
  },
  Docker: {
    en: "Containerization — packages apps with their environment for consistent deploys.",
    id: "Kontainerisasi — mengemas aplikasi beserta lingkungannya agar deploy konsisten.",
  },
  "Git & GitHub": {
    en: "Version control and collaboration platform for tracking code and teamwork.",
    id: "Version control dan platform kolaborasi untuk melacak kode dan kerja tim.",
  },
  "Linux Fedora": {
    en: "My daily Linux distro for development, servers, and shell work.",
    id: "Distro Linux harian saya untuk development, server, dan kerja shell.",
  },
  "Bash CLI": {
    en: "Shell scripting and command-line automation for fast, repeatable workflows.",
    id: "Shell scripting dan otomasi command-line untuk alur kerja cepat dan berulang.",
  },
  "VS Code": {
    en: "My code editor — extensions, debugging, and Git integration.",
    id: "Editor kode saya — ekstensi, debugging, dan integrasi Git.",
  },
  "Arch Linux": {
    en: "A minimal rolling-release distro I use to learn Linux internals and customize everything.",
    id: "Distro minimal rolling-release yang saya gunakan untuk memahami internal Linux dan mengkustomisasi semuanya.",
  },
  "C++": {
    en: "A compiled language for performance-critical systems and deep programming fundamentals.",
    id: "Bahasa terkompilasi untuk sistem yang kritis terhadap performa dan dasar pemrograman yang dalam.",
  },
};

export const techLinks: Record<string, string> = {
  JavaScript: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  TypeScript: "https://www.typescriptlang.org/",
  "React.js": "https://react.dev/",
  "Next.js": "https://nextjs.org/",
  "Node.js": "https://nodejs.org/",
  Python: "https://www.python.org/",
  Supabase: "https://supabase.com/",
  PostgreSQL: "https://www.postgresql.org/",
  SQL: "https://www.w3schools.com/sql/",
  Express: "https://expressjs.com/",
  Docker: "https://www.docker.com/",
  "Git & GitHub": "https://github.com/",
  "Linux Fedora": "https://fedoraproject.org/",
  "Bash CLI": "https://www.gnu.org/software/bash/manual/bash.html",
  "VS Code": "https://code.visualstudio.com/",
  "Arch Linux": "https://archlinux.org/",
  "C++": "https://isocpp.org/",
};

export const work = {
  kicker: { en: "Selected Works", id: "Karya Terpilih" },
  heading: { en: "Projects", id: "Proyek" },
  allLabel: { en: "All", id: "Semua" },
  professionalLabel: { en: "Professional Work", id: "Karya Profesional" },
  viewCaseStudy: { en: "View Case Study", id: "Lihat Studi Kasus" },
  clickToExpand: { en: "Click to expand", id: "Klik untuk memperbesar" },
} as const;

export const gallery = {
  kicker: { en: "Gallery", id: "Galeri" },
  heading: { en: "Photo Gallery", id: "Galeri Foto" },
  description: {
    en: "Moments, events, and behind-the-scenes snapshots.",
    id: "Momen, acara, dan cuplikan di balik layar.",
  },
} as const;

export const showcase = {
  kicker: { en: "Selected Works", id: "Karya Terpilih" },
  heading: { en: "Works & Gallery", id: "Karya & Galeri" },
  workTab: { en: "Projects", id: "Proyek" },
  galleryTab: { en: "Photo Gallery", id: "Galeri Foto" },
} as const;

export const contact = {
  kicker: { en: "Get in Touch", id: "Hubungi Saya" },
  available: { en: "Available for work", id: "Tersedia untuk bekerja" },
  line1: { en: "LET'S", id: "MARI" },
  line2: { en: "WORK", id: "BEKERJA" },
  line3: { en: "TOGETHER.", id: "BERSAMA." },
  emailLabel: { en: "Email", id: "Email" },
  locationLabel: { en: "Location", id: "Lokasi" },
  timeLabel: { en: "Local Time", id: "Waktu Lokal" },
  socialsLabel: { en: "Socials", id: "Sosial" },
  timezone: "GMT+7",
} as const;

export const footer = {
  status: { en: "System Active", id: "Sistem Aktif" },
  backToTop: { en: "Back to Top", id: "Kembali ke Atas" },
} as const;
