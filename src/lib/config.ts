import type { Localized } from "@/types";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const profile = {
  name: "Aurose",
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
      en: "I'm Aurose, a first-semester Informatics student in Indonesia. I started in visual design: layout, typography, color. Moved to code in 2022.",
      id: "Saya Aurose, mahasiswa semester satu Informatika di Indonesia. Saya mulai dari desain visual: layout, tipografi, warna. Pindah ke kode pada 2022.",
      highlight: {
        en: ["visual", "design"],
        id: ["desain", "visual"],
      },
    },
    {
      en: "I build with Next.js, React, TypeScript, and Supabase. This site is one of those builds: the guestbook, certificate requests, and admin panel all run for real. The rest is on GitHub.",
      id: "Saya membangun dengan Next.js, React, TypeScript, dan Supabase. Situs ini salah satunya: buku tamu, permintaan sertifikat, dan panel admin benar-benar berjalan. Sisanya ada di GitHub.",
      highlight: {
        en: ["Next.js", "React", "Supabase"],
        id: ["Next.js", "Supabase"],
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
        en: "Layout, typography, and interaction decided before the first component. References first, then rebuilt until it looks like mine.",
        id: "Layout, tipografi, dan interaksi diputuskan sebelum komponen pertama. Referensi dulu, lalu dibangun ulang sampai terasa milik sendiri.",
      },
    },
    {
      title: { en: "Website", id: "Website" },
      description: {
        en: "Next.js, React, and TypeScript. Server-rendered pages, responsive layout, and a build that has to pass typecheck before it ships.",
        id: "Next.js, React, dan TypeScript. Halaman server-rendered, layout responsif, dan build yang wajib lolos typecheck sebelum rilis.",
      },
    },
    {
      title: { en: "Mobile", id: "Mobile" },
      description: {
        en: "The same interfaces reworked for small screens: touch targets, gestures, and layouts that never depend on hover.",
        id: "Antarmuka yang sama, dirancang ulang untuk layar kecil: target sentuh, gesture, dan layout yang tidak bergantung pada hover.",
      },
    },
    {
      title: { en: "Backend", id: "Backend" },
      description: {
        en: "Supabase and PostgreSQL: schema, queries, row-level security, and the API routes in between.",
        id: "Supabase dan PostgreSQL: skema, query, row-level security, dan API route di antaranya.",
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
        en: "Bachelor of Informatics. Most of what I use daily comes from self-study: Linux, the shell, and projects that have to actually run.",
        id: "S1 Informatika. Sebagian besar yang saya pakai sehari-hari datang dari belajar sendiri: Linux, shell, dan proyek yang harus benar-benar jalan.",
      },
    },
  ],
} as const;

export const certifications = {
  kicker: { en: "Certifications", id: "Sertifikasi" },
  heading: { en: "Credentials & Courses", id: "Kredensial & Kursus" },
  description: {
    en: "Internship certificates, professional courses, and technical exams. Click a card to open the scan.",
    id: "Sertifikat magang, kursus profesional, dan ujian teknis. Klik kartu untuk membuka hasil pindainya.",
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
      items: ["Docker", "Git & GitHub", "Linux Fedora"],
    },
    {
      title: { en: "Development Tools", id: "Alat Pengembangan" },
      items: ["VS Code", "Arch Linux", "C++"],
    },
  ],
} as const;

export const techDescriptions: Record<string, Localized> = {
  JavaScript: {
    en: "The language every browser runs. Used here for UI and the API layer.",
    id: "Bahasa yang dijalankan semua browser. Dipakai di sini untuk UI dan lapisan API.",
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
    en: "Scripting, automation, data processing, and the occasional backend.",
    id: "Scripting, otomasi, pengolahan data, dan sesekali backend.",
  },
  Supabase: {
    en: "Open-source Firebase alternative: Postgres database, auth, and storage.",
    id: "Alternatif open-source Firebase: database Postgres, auth, dan storage.",
  },
  PostgreSQL: {
    en: "Relational database with SQL. Supabase runs on it.",
    id: "Database relasional dengan SQL. Supabase berjalan di atasnya.",
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
    en: "App plus its environment, packaged as one image.",
    id: "Aplikasi beserta lingkungannya, dikemas jadi satu image.",
  },
  "Git & GitHub": {
    en: "Version control and collaboration platform for tracking code and teamwork.",
    id: "Version control dan platform kolaborasi untuk melacak kode dan kerja tim.",
  },
  "Linux Fedora": {
    en: "My daily Linux distro for development, servers, and shell work.",
    id: "Distro Linux harian saya untuk development, server, dan kerja shell.",
  },
  "VS Code": {
    en: "My editor: extensions, debugging, Git.",
    id: "Editor saya: ekstensi, debugging, Git.",
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
    en: "Photos from events, campus, and build sessions.",
    id: "Foto dari acara, kampus, dan sesi ngoding.",
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
    en: "Leave your name and a note. Everything is stored in Supabase.",
    id: "Tinggalkan nama dan pesan. Semuanya disimpan di Supabase.",
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
    en: "Messages come straight to my inbox. I reply within 1–2 days.",
    id: "Pesan langsung masuk ke inbox saya. Saya balas dalam 1–2 hari.",
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
