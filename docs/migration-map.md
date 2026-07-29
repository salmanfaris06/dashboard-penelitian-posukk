# Pemetaan Migrasi Laravel → TanStack Start

## Arsitektur

| Laravel/Filament      | Implementasi baru                              |
| --------------------- | ---------------------------------------------- |
| Filament Panel        | TanStack file routes + React components        |
| Eloquent              | Drizzle ORM                                    |
| PostgreSQL lokal      | Turso/libSQL (lokal memakai `file:local.db`)   |
| Laravel Auth          | DB-backed session + bcrypt + HttpOnly cookie   |
| Policies/global scope | Server-side role dan `posUkkCenterId` scoping  |
| Filament Resources    | Generic typed resource list + CRUD forms       |
| Services              | Pure TypeScript domain functions dengan Vitest |
| Nginx/PHP-FPM         | Nitro Node server                              |

## Tabel

| Model lama                     | Tabel Drizzle                       |
| ------------------------------ | ----------------------------------- |
| PosUkkCenter                   | `pos_ukk_centers`                   |
| User                           | `users`                             |
| —                              | `sessions`                          |
| Artisan                        | `artisans`                          |
| HealthAssessment               | `health_assessments`                |
| LbpPainDurationOption          | `lbp_pain_duration_options`         |
| ActivitySchedule               | `activity_schedules`                |
| ExerciseContent                | `exercise_contents`                 |
| LbpScreening                   | `lbp_screenings`                    |
| MsdRiskAssessment              | `msd_risk_assessments`              |
| PhysicalIndependenceAssessment | `physical_independence_assessments` |
| ApplicationEvaluation          | `application_evaluations`           |
| HealthDataAudit                | `health_data_audits`                |

Seluruh foreign key, unique constraint, indeks tenant/tanggal, JSON answers/audit, boolean, dan timestamp diterjemahkan ke SQLite/libSQL-compatible Drizzle schema.

## Aturan domain

- **BMI:** `weightKg / (heightM²)`, dibulatkan dua desimal.
- **LBP:** 20 item dibatasi 0–3, total dan rerata dihitung otomatis; kategori lama dipertahankan persis.
- **MSD:** level pain, stiffness, abnormal sensation, fatigue, posture, repetitive motion, exposure, strength/flexibility, inflammation, dan environment dihitung otomatis; kategori akhir memakai risiko tertinggi.
- **Kemandirian fisik:** independent=2, assisted=1, unable=0; `mandiri` ≥8, `perlu_bantuan` ≥4, lainnya `ketergantungan`.
- **Evaluasi aplikasi:** total dan average score dihitung dari jawaban 1–5.

## Authorization

- Administrator dapat mengakses semua Pos UKK dan konfigurasi global.
- Kader wajib memiliki `posUkkCenterId` dan query/mutation dibatasi ke pusat tersebut.
- Kader tidak dapat mengelola Pos UKK, pengguna, atau opsi global LBP.
- Evaluasi Kader dibatasi ke user pemilik.
- Pengguna tidak dapat menghapus akun sendiri.

## UI Mocci

Yang diport ke React/TanStack:

- Responsive collapsible sidebar dan grouped navigation
- Sticky application header dan account display
- Theme token light/dark berbasis CSS `oklch`
- Stats cards dan risk visualization
- Responsive data tables, search, CSV export
- Modal forms dan status badges
- Split-screen login page

Runtime/dependency Next.js dari template tidak digunakan.
