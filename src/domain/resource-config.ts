import type { ResourceName } from '#/server/data'

export type FormOptions = {
  centers: Array<{ value: number; label: string }>
  artisans: Array<{ value: number; label: string; centerId: number }>
  durations: Array<{ value: number; label: string }>
}
export type ResourceField = {
  name: string
  label: string
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'date'
    | 'datetime-local'
    | 'textarea'
    | 'select'
    | 'checkbox'
  required?: boolean
  placeholder?: string
  optionSource?: keyof FormOptions
  options?: Array<{ value: string; label: string }>
  full?: boolean
}

const status = (options: string[]): ResourceField['options'] =>
  options.map((value) => ({ value, label: value.replaceAll('_', ' ') }))
const assessmentBase: ResourceField[] = [
  {
    name: 'artisanId',
    label: 'Pasien',
    type: 'select',
    optionSource: 'artisans',
    required: true,
  },
]
const independence = status(['independent', 'assisted', 'unable'])

export const resourceFields: Partial<Record<ResourceName, ResourceField[]>> = {
  centers: [
    { name: 'name', label: 'Nama Pos UKK', required: true },
    { name: 'code', label: 'Kode' },
    { name: 'leaderName', label: 'Nama Ketua' },
    { name: 'contactPhone', label: 'Telepon' },
    { name: 'district', label: 'Kecamatan' },
    { name: 'city', label: 'Kota', required: true },
    { name: 'address', label: 'Alamat', type: 'textarea', full: true },
    { name: 'cadreCount', label: 'Jumlah Kader', type: 'number' },
    { name: 'isActive', label: 'Pos UKK aktif', type: 'checkbox' },
  ],
  users: [
    { name: 'name', label: 'Nama', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'password',
      label: 'Kata sandi',
      type: 'password',
      placeholder: 'Kosongkan saat edit agar tidak berubah',
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: status(['administrator', 'cadre']),
      required: true,
    },
    {
      name: 'posUkkCenterId',
      label: 'Pos UKK',
      type: 'select',
      optionSource: 'centers',
    },
    { name: 'phone', label: 'Telepon' },
    { name: 'isActive', label: 'Akun aktif', type: 'checkbox' },
  ],
  artisans: [
    {
      name: 'posUkkCenterId',
      label: 'Pos UKK',
      type: 'select',
      optionSource: 'centers',
      required: true,
    },
    { name: 'respondentNumber', label: 'Nomor Responden' },
    { name: 'identityNumber', label: 'Nomor Identitas' },
    { name: 'name', label: 'Nama Pasien', required: true },
    { name: 'birthDate', label: 'Tanggal Lahir', type: 'date' },
    { name: 'age', label: 'Usia', type: 'number' },
    {
      name: 'sex',
      label: 'Jenis Kelamin',
      type: 'select',
      options: status(['laki-laki', 'perempuan']),
    },
    { name: 'educationLevel', label: 'Pendidikan' },
    { name: 'occupation', label: 'Pekerjaan' },
    { name: 'monthlyIncome', label: 'Pendapatan Bulanan', type: 'number' },
    { name: 'workTenureYears', label: 'Masa Kerja (tahun)', type: 'number' },
    { name: 'workHoursPerDay', label: 'Jam Kerja/hari', type: 'number' },
    { name: 'restHoursPerDay', label: 'Jam Istirahat/hari', type: 'number' },
    { name: 'address', label: 'Alamat', type: 'textarea', full: true },
    { name: 'notes', label: 'Catatan', type: 'textarea', full: true },
  ],
  'health-assessments': [
    ...assessmentBase,
    {
      name: 'assessedAt',
      label: 'Tanggal Pemeriksaan',
      type: 'date',
      required: true,
    },
    { name: 'heightCm', label: 'Tinggi (cm)', type: 'number' },
    { name: 'weightKg', label: 'Berat (kg)', type: 'number' },
    { name: 'bloodPressure', label: 'Tekanan Darah' },
    { name: 'cholesterolMgDl', label: 'Kolesterol (mg/dL)', type: 'number' },
    { name: 'bloodGlucoseMgDl', label: 'Gula Darah (mg/dL)', type: 'number' },
    { name: 'uricAcidMgDl', label: 'Asam Urat (mg/dL)', type: 'number' },
    { name: 'complaintDuration', label: 'Durasi Keluhan' },
    {
      name: 'currentComplaint',
      label: 'Keluhan Saat Ini',
      type: 'textarea',
      full: true,
    },
    { name: 'painLocation', label: 'Lokasi Nyeri' },
    { name: 'painType', label: 'Jenis Nyeri' },
    {
      name: 'therapyPlan',
      label: 'Rencana Terapi',
      type: 'textarea',
      full: true,
    },
    { name: 'notes', label: 'Catatan', type: 'textarea', full: true },
  ],
  'lbp-screenings': [
    ...assessmentBase,
    {
      name: 'screenedAt',
      label: 'Tanggal Skrining',
      type: 'date',
      required: true,
    },
    {
      name: 'lbpPainDurationOptionId',
      label: 'Durasi Keluhan',
      type: 'select',
      optionSource: 'durations',
    },
    {
      name: 'scores',
      label: '20 skor item (0–3, pisahkan koma)',
      required: true,
      placeholder: '0,1,2,3,...',
      full: true,
    },
    { name: 'notes', label: 'Catatan', type: 'textarea', full: true },
  ],
  'msd-assessments': [
    ...assessmentBase,
    {
      name: 'screenedAt',
      label: 'Tanggal Skrining',
      type: 'date',
      required: true,
    },
    { name: 'painScale', label: 'Skala Nyeri (0–10)', type: 'number' },
    { name: 'painLocation', label: 'Lokasi Nyeri' },
    {
      name: 'stiffnessFrequency',
      label: 'Frekuensi Kaku',
      type: 'select',
      options: status(['jarang', 'kadang', 'sering']),
    },
    {
      name: 'abnormalSensationStatus',
      label: 'Sensasi Abnormal',
      type: 'select',
      options: status(['tidak', 'ada_ringan', 'ada_berat']),
    },
    {
      name: 'muscleFatigueStatus',
      label: 'Kelelahan Otot',
      type: 'select',
      options: status(['ringan', 'sedang', 'berat']),
    },
    { name: 'postureMethod', label: 'Metode Postur' },
    { name: 'postureScore', label: 'Skor Postur', type: 'number' },
    {
      name: 'repetitiveMotionPerHour',
      label: 'Gerakan Repetitif/jam',
      type: 'number',
    },
    {
      name: 'exposureDurationHours',
      label: 'Durasi Pajanan (jam)',
      type: 'number',
    },
    {
      name: 'strengthFlexibilityStatus',
      label: 'Kekuatan/Fleksibilitas',
      type: 'select',
      options: status(['normal', 'sedikit_berkurang', 'berkurang']),
    },
    {
      name: 'inflammationSignStatus',
      label: 'Tanda Inflamasi',
      type: 'select',
      options: status(['tidak', 'ada_ringan', 'ada_jelas']),
    },
    {
      name: 'environmentWorkloadStatus',
      label: 'Lingkungan/Beban Kerja',
      type: 'select',
      options: status(['aman', 'kurang_aman', 'tidak_aman']),
    },
    { name: 'notes', label: 'Catatan', type: 'textarea', full: true },
  ],
  'physical-independence': [
    ...assessmentBase,
    {
      name: 'assessedAt',
      label: 'Tanggal Penilaian',
      type: 'date',
      required: true,
    },
    {
      name: 'walkingStatus',
      label: 'Berjalan',
      type: 'select',
      options: independence,
      required: true,
    },
    {
      name: 'sittingStatus',
      label: 'Duduk',
      type: 'select',
      options: independence,
      required: true,
    },
    {
      name: 'standingStatus',
      label: 'Berdiri',
      type: 'select',
      options: independence,
      required: true,
    },
    {
      name: 'workActivityStatus',
      label: 'Aktivitas Kerja',
      type: 'select',
      options: independence,
      required: true,
    },
    {
      name: 'sitToStandStatus',
      label: 'Duduk ke Berdiri',
      type: 'select',
      options: independence,
      required: true,
    },
    { name: 'notes', label: 'Catatan', type: 'textarea', full: true },
  ],
  schedules: [
    {
      name: 'posUkkCenterId',
      label: 'Pos UKK',
      type: 'select',
      optionSource: 'centers',
      required: true,
    },
    { name: 'title', label: 'Judul Kegiatan', required: true },
    { name: 'location', label: 'Lokasi' },
    {
      name: 'startsAt',
      label: 'Mulai',
      type: 'datetime-local',
      required: true,
    },
    { name: 'endsAt', label: 'Selesai', type: 'datetime-local' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: status(['scheduled', 'completed', 'cancelled']),
    },
    { name: 'description', label: 'Deskripsi', type: 'textarea', full: true },
  ],
  'exercise-content': [
    { name: 'title', label: 'Judul', required: true },
    { name: 'bodyArea', label: 'Area Tubuh' },
    { name: 'category', label: 'Kategori' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: status(['draft', 'published']),
    },
    { name: 'mediaUrl', label: 'URL Media' },
    { name: 'summary', label: 'Ringkasan', type: 'textarea', full: true },
    {
      name: 'instructions',
      label: 'Instruksi',
      type: 'textarea',
      required: true,
      full: true,
    },
  ],
  evaluations: [
    { name: 'submittedAt', label: 'Tanggal', type: 'date', required: true },
    {
      name: 'answers',
      label: 'Skor jawaban (1–5, pisahkan koma)',
      required: true,
      full: true,
      placeholder: '5,4,5,4,5',
    },
    { name: 'notes', label: 'Catatan', type: 'textarea', full: true },
  ],
  'lbp-options': [
    { name: 'label', label: 'Label', required: true },
    { name: 'sortOrder', label: 'Urutan', type: 'number' },
    { name: 'isActive', label: 'Aktif', type: 'checkbox' },
  ],
}

export const canMutateResource = (
  resource: ResourceName,
  role: 'administrator' | 'cadre',
) =>
  resource !== 'audit-log' &&
  (role === 'administrator' ||
    !['centers', 'users', 'lbp-options'].includes(resource))
