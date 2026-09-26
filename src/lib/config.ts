import type { Localized } from "@/types";

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
  titleLine1: { en: "FULLSTACK", id: "FULLSTACK" },
  titleLine2: { en: "DEVELOPER", id: "DEVELOPER" },
  lensLine1: { en: "SOFTWARE", id: "SOFTWARE" },
  lensLine2: { en: "ENGINEER", id: "ENGINEER" },
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
  clickToExpand: { en: "Click to expand", id: "Klik untuk memperbesar" },
} as const;

export const gallery = {
  kicker: { en: "Gallery", id: "Galeri" },
  heading: { en: "Photo Gallery", id: "Galeri Foto" },
  description: {
    en: "Moments, events, and behind-the-scenes snapshots.",
    id: "Momen, acara, dan cuplikan di balik layar.",
  },
  allLabel: { en: "All", id: "Semua" },
  emptyFiltered: {
    en: "No photos in this category yet.",
    id: "Belum ada foto di kategori ini.",
  },
  categoryLabels: {
    general: { en: "General", id: "Umum" },
    event: { en: "Events", id: "Acara" },
    campus: { en: "Campus", id: "Kampus" },
    work: { en: "Work", id: "Kerja" },
    personal: { en: "Personal", id: "Pribadi" },
  } as Record<string, Localized>,
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

export const comments = {
  kicker: { en: "Guestbook", id: "Buku Tamu" },  index: "08",
  heading: { en: "Visitor Notes", id: "Catatan Pengunjung" },
  description: {
    en: "Drop a message — say hi, share thoughts, or just leave a trace that you were here.",
    id: "Tinggalkan pesan — sapa, bagikan pikiran, atau tinggalkan jejak bahwa kamu pernah singgah.",
  },
  formTitle: { en: "Leave a Comment", id: "Tinggalkan Komentar" },
  nameLabel: { en: "Name", id: "Nama" },
  namePlaceholder: { en: "Your name", id: "Namamu" },
  emailLabel: { en: "Email (optional)", id: "Email (opsional)" },
  emailPlaceholder: { en: "you@example.com", id: "kamu@contoh.com" },
  messageLabel: { en: "Message", id: "Pesan" },
  messagePlaceholder: {
    en: "Write something nice…",
    id: "Tulis sesuatu yang baik…",
  },
  ratingLabel: { en: "Rating (optional)", id: "Rating (opsional)" },
  submit: { en: "Send Comment", id: "Kirim Komentar" },
  sending: { en: "Sending…", id: "Mengirim…" },
  success: {
    en: "Thanks! Your comment was sent and will appear after review.",
    id: "Terima kasih! Komentarmu terkirim dan akan tampil setelah ditinjau.",
  },
  errorGeneric: {
    en: "Something went wrong. Please try again.",
    id: "Terjadi kesalahan. Silakan coba lagi.",
  },
  empty: {
    en: "No comments yet — be the first to write one.",
    id: "Belum ada komentar — jadilah yang pertama menulis.",
  },
  count: { en: "comments", id: "komentar" },
  backHome: { en: "Back to Home", id: "Kembali ke Beranda" },
  justNow: { en: "just now", id: "baru saja" },
} as const;

export const commentsPage = {
  cta: { en: "Leave a Comment", id: "Tulis Komentar" },
} as const;

export const pageControls = {
  themeLabel: { en: "Theme", id: "Tema" },
  themeDark: { en: "Dark", id: "Gelap" },
  themeLight: { en: "Light", id: "Terang" },
  musicLabel: { en: "Music", id: "Musik" },
  playMusic: { en: "Play music", id: "Putar musik" },
  pauseMusic: { en: "Pause music", id: "Jeda musik" },
} as const;

export const contactForm = {
  openLabel: { en: "Send a Message", id: "Kirim Pesan" },
  closeLabel: { en: "Close", id: "Tutup" },
  heading: { en: "Contact Privately", id: "Hubungi secara pribadi" },
  description: {
    en: "Tell me what you're building. I read every message and usually reply within 1–2 days.",
    id: "Ceritakan apa yang sedang kamu bangun. Saya membaca setiap pesan dan biasanya membalas dalam 1–2 hari.",
  },
  nameLabel: { en: "Name", id: "Nama" },
  namePlaceholder: { en: "Your name", id: "Namamu" },
  emailLabel: { en: "Email", id: "Email" },
  emailPlaceholder: { en: "you@example.com", id: "kamu@contoh.com" },
  subjectLabel: { en: "Subject", id: "Subjek" },
  subjectPlaceholder: {
    en: "Website, app, collaboration…",
    id: "Website, aplikasi, kolaborasi…",
  },
  messageLabel: { en: "Message", id: "Pesan" },
  messagePlaceholder: {
    en: "What do you need built? Any deadline or context helps.",
    id: "Apa yang ingin kamu bangun? Sertakan tenggat atau konteksnya bila ada.",
  },
  submit: { en: "Send Message", id: "Kirim Pesan" },
  sending: { en: "Sending…", id: "Mengirim…" },
  success: {
    en: "Message sent. Thank you — I'll get back to you soon!",
    id: "Pesan terkirim. Terima kasih — saya akan segera membalas!",
  },
  errors: {
    name: {
      en: "Please enter your name (min. 2 characters).",
      id: "Mohon isi nama (min. 2 karakter).",
    },
    email: {
      en: "Please enter a valid email address.",
      id: "Mohon isi alamat email yang valid.",
    },
    message: {
      en: "Please write a message of at least 10 characters.",
      id: "Mohon tulis pesan minimal 10 karakter.",
    },
    rateLimited: {
      en: "You just sent a message. Please wait a moment before sending another.",
      id: "Kamu baru saja mengirim pesan. Tunggu sebentar sebelum mengirim lagi.",
    },
    generic: {
      en: "Something went wrong. Please try again or email me directly.",
      id: "Terjadi kesalahan. Coba lagi atau email saya langsung.",
    },
  },
} as const;

export const caseStudy = {
  back: { en: "All projects", id: "Semua proyek" },
  overview: { en: "Overview", id: "Ringkasan" },
  techStack: { en: "Tech Stack", id: "Teknologi" },
  links: { en: "Links", id: "Tautan" },
  liveDemo: { en: "Live Demo", id: "Demo Langsung" },
  sourceCode: { en: "Source Code", id: "Kode Sumber" },
  yearLabel: { en: "Year", id: "Tahun" },
  categoryLabel: { en: "Category", id: "Kategori" },
  readCaseStudy: { en: "Read case study", id: "Baca studi kasus" },
  notFoundTitle: { en: "Project not found", id: "Proyek tidak ditemukan" },
  notFoundBody: {
    en: "That project doesn't exist or hasn't been published yet.",
    id: "Proyek itu tidak ada atau belum dipublikasikan.",
  },
  otherProjects: { en: "Other projects", id: "Proyek lainnya" },
} as const;

export const notFoundPage = {
  kicker: { en: "Error 404", id: "Error 404" },
  heading: { en: "Page not found", id: "Halaman tidak ditemukan" },
  body: {
    en: "The page you're looking for doesn't exist, or it may have moved.",
    id: "Halaman yang kamu cari tidak ada, atau mungkin sudah dipindahkan.",
  },
  home: { en: "Back to home", id: "Kembali ke beranda" },
  work: { en: "See my work", id: "Lihat karya saya" },
} as const;

export const errorPage = {
  kicker: { en: "Error", id: "Error" },
  heading: { en: "Something broke", id: "Terjadi kesalahan" },
  body: {
    en: "An unexpected error occurred. Try again — if it keeps happening, let me know.",
    id: "Terjadi kesalahan tak terduga. Coba lagi — kalau terus berulang, kabari saya.",
  },
  retry: { en: "Try again", id: "Coba lagi" },
  home: { en: "Back to home", id: "Kembali ke beranda" },
} as const;

export const experienceSection = {
  kicker: { en: "Experience", id: "Pengalaman" },
  heading: { en: "Where I've Worked", id: "Riwayat Kerja" },
  description: {
    en: "Roles, collaborations, and the work behind them.",
    id: "Peran, kolaborasi, dan pekerjaan di baliknya.",
  },
  present: { en: "Present", id: "Sekarang" },
  empty: {
    en: "Experience entries will appear here.",
    id: "Riwayat pengalaman akan tampil di sini.",
  },
} as const;

export const testimonialsSection = {
  kicker: { en: "Testimonials", id: "Testimoni" },
  heading: { en: "What People Say", id: "Kata Mereka" },
  description: {
    en: "Feedback from people I've built things with.",
    id: "Masukan dari orang-orang yang pernah bekerja sama dengan saya.",
  },
  empty: {
    en: "Testimonials will appear here.",
    id: "Testimoni akan tampil di sini.",
  },
} as const;
