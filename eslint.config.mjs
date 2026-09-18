import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// ============================================================================
// ESLint (flat config) — Next.js core-web-vitals + TypeScript.
//
// Sebelumnya lint dimatikan total (`ignoreDuringBuilds: true` tanpa config).
// Sekarang aktif supaya masalah seperti dependency hook yang hilang, `any`
// yang tidak disengaja, atau impor yang tidak ada ketahuan lebih awal.
//
// Catatan: eslint-config-next v16 sudah menyediakan flat config native, jadi
// tidak perlu FlatCompat (dan memakainya justru error "circular structure").
// ============================================================================

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      // Git worktree dari tool lain (duplikat proyek) — bukan sumber kita.
      ".kilo/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Skrip utilitas satu-off — bukan bagian bundle aplikasi.
      "scripts/**",
    ],
  },

  {
    rules: {
      // `any` eksplisit biasanya tidak sengaja — peringatkan, jangan gagalkan.
      "@typescript-eslint/no-explicit-any": "warn",

      // Variabel tak terpakai: izinkan prefiks _ untuk yang sengaja dibuang.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // <img> dipakai sengaja: gambar berasal dari R2 dan disajikan apa adanya.
      // Optimasi gambar ditangani di sisi upload, bukan lewat optimizer Next.
      "@next/next/no-img-element": "off",

      // Aturan "React Compiler" dari eslint-plugin-react-hooks v7. Proyek ini
      // TIDAK memakai React Compiler, dan pola yang ditandai di sini adalah
      // idiom React yang sah (sinkronisasi localStorage di useEffect,
      // membaca ref saat render untuk menentukan arah animasi). Mengubahnya
      // hanya demi aturan ini akan menambah risiko tanpa manfaat nyata.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

export default config;
