# Dashboard Penelitian Pos UKK

Migrasi aplikasi **Filament Dashboard Penelitian UMI** ke **TanStack Start + Turso + Drizzle ORM**, dengan tampilan dashboard yang diadaptasi dari [Mocci Admin Template](https://github.com/fatmuh/mocci-admin-template).

## Tech stack

- TanStack Start + TanStack Router (SSR dan server functions)
- React 19 + TypeScript
- Turso/libSQL melalui `@libsql/client`
- Drizzle ORM + Drizzle Kit
- Tailwind CSS 4
- bcryptjs dan session database ber-cookie `HttpOnly`, `SameSite=Lax`, `Secure` pada production
- Vitest + ESLint + Prettier
- Nitro Node server

## Fitur yang dimigrasikan

- Login Admin/Kader dan session yang disimpan sebagai hash SHA-256
- Role-based access dan scoping data Kader berdasarkan Pos UKK
- Dashboard statistik, data pasien terbaru, distribusi risiko MSD, dan agenda
- CRUD Pos UKK dan pengguna
- CRUD pasien/pengrajin
- Pemeriksaan kesehatan dengan kalkulasi BMI otomatis
- Skrining LBP 20 item dengan kalkulasi skor/kategori otomatis
- Asesmen risiko MSD dengan kalkulasi tingkat risiko otomatis
- Penilaian kemandirian fisik dengan kalkulasi skor/kategori otomatis
- Jadwal kegiatan
- Konten latihan
- Evaluasi aplikasi
- Konfigurasi opsi durasi LBP
- Audit perubahan data kesehatan
- Ekspor CSV dari seluruh tabel
- Light/dark theme dan responsive sidebar dari pola UI Mocci

## Menjalankan lokal

Persyaratan: Node.js 22+ dan npm.

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

Akun seed lokal:

| Role          | Email                 | Password   |
| ------------- | --------------------- | ---------- |
| Administrator | `admin@epos-ukk.test` | `password` |
| Kader         | `kader@epos-ukk.test` | `password` |

> Ganti kata sandi seed sebelum production.

## Konfigurasi Turso

Buat database dan token menggunakan Turso CLI:

```bash
turso db create dashboard-penelitian-posukk
turso db show dashboard-penelitian-posukk --url
turso db tokens create dashboard-penelitian-posukk
```

Isi environment deployment:

```dotenv
TURSO_DATABASE_URL=libsql://dashboard-penelitian-posukk-<organization>.turso.io
TURSO_AUTH_TOKEN=<token-turso>
SESSION_SECRET=<random-secret-minimum-32-character>
NODE_ENV=production
```

Kemudian jalankan:

```bash
npm run db:migrate
npm run db:seed # hanya jika membutuhkan akun/data awal
npm run build
npm start
```

Server production tersedia dari `.output/server/index.mjs` dan membaca `PORT` dari environment.

## Script

| Command                   | Keterangan                           |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Development server port 3000         |
| `npm run generate-routes` | Regenerasi typed route tree          |
| `npm run db:generate`     | Generate SQL migration Drizzle       |
| `npm run db:migrate`      | Terapkan migration ke libSQL/Turso   |
| `npm run db:seed`         | Seed Pos UKK dan akun awal           |
| `npm test`                | Unit/contract test                   |
| `npm run typecheck`       | TypeScript strict check              |
| `npm run lint`            | ESLint                               |
| `npm run check`           | Prettier check                       |
| `npm run build`           | Production build                     |
| `npm start`               | Menjalankan Nitro server hasil build |

## Struktur utama

```text
src/
├── components/       # App shell Mocci, dashboard, tabel, dan form
├── db/               # Drizzle schema dan libSQL client
├── domain/           # Scoring, authorization, session, form config
├── routes/           # File-based routes TanStack
└── server/           # Auth, query dashboard/resource, mutation CRUD
scripts/              # Migration dan seed runner
drizzle/              # SQL migration yang dapat direproduksi
tests/                # Domain dan schema contract tests
```

Detail pemetaan migrasi tersedia di [`docs/migration-map.md`](docs/migration-map.md).

## Security

- Password di-hash menggunakan bcrypt cost 12.
- Token session acak tidak disimpan plaintext; database hanya menyimpan SHA-256 hash.
- Cookie session `HttpOnly`, `SameSite=Lax`, dan `Secure` pada production.
- Kader hanya dapat membaca/mengubah record di Pos UKK sendiri.
- Data kesehatan mencatat audit perubahan.
- Semua input mutation divalidasi pada server function.

## Kredit UI

Struktur visual, design token, pola sidebar/header, card, table, login, dan dark mode diadaptasi dari **Mocci Admin Template** oleh `fatmuh`, kemudian dipindahkan dari Next.js ke TanStack Start tanpa membawa runtime Next.js.
