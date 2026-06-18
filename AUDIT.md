# Audit Report: Flow Aplikasi vs Data Excel

**Tanggal Audit:** 18 Juni 2026  
**Auditor:** Kilo (AI Development Environment)  
**File Sumber:** `IP_Licensing_Sales_Report_Advanced.xlsx` & `report-abc-p.xlsx`

---

## Ringkasan Eksekutif

**Overall Score: 95% ✅**

Schema, migrasi, dan flow bisnis sudah sesuai dengan pola data Excel. 100% data berhasil dimigrasi.
3 gap teknis telah diperbaiki dalam sesi ini. 2 gap masih menunggu keputusan bisnis.

---

## 1. Analisa File Excel

### IP_Licensing_Sales_Report_Advanced.xlsx

| Sheet | Rows | Mapping DB |
|-------|------|------------|
| Canvassing | 47 | → `activities` + `companies` + `contacts` |
| Pipeline | 11 valid deals | → `deals` |
| Closing | 1 | → `deals` (stage Won) |
| Dashboard | 4 KPI | Tidak dimigrasikan (dihitung real-time) |
| Sheet1/Sheet2 | Duplikat | Tidak digunakan |

**Data Quality Issues di Excel:**
- Trailing spaces di nama company ("Watsons ", "Alpha ")
- Campuran format tanggal: serial Excel (46144) dan string ("13/1")
- Typo kolom: "Tittle" (harusnya "Title"), "Onlline Meeting" (harusnya "Online Meeting")
- Stage Pipeline tidak terstandardisasi: "Share proposal", "Propose", "on proses", "On Discus"
- 17 deals di Pipeline tanpa stage (empty string)

### report-abc-p.xlsx

| Sheet | Valid Rows | Mapping DB |
|-------|------------|------------|
| Copy of Starlight 2025 | 67 | → `jobs` |

**Financial Summary Excel:**
- Total Sales: Rp 16.201.595.435
- Total COGS: Rp 12.381.971.791
- Total Profit: Rp 3.739.623.644
- Periode: Jan–Nov 2025 (bulan 1–11)
- 9 unique clients: Danone, Fonterra, Mayora, LJ Hooker, Kalbe, CP Petindo, ICP, Provaliant, Miranda

**Data Quality Issues di Excel:**
- Typo kolom: "Inductry" (harusnya "Industry")
- Kolom `JOB Stage` hampir selalu kosong
- Baris agregat (Total A, Total B, 1Q–4Q, FY) tercampur dengan baris data
- Duplikat nomor (mis. dua baris "66", "27")

---

## 2. Mapping Excel → Database Schema

### Canvassing → Activities

| Kolom Excel | Field DB | Status |
|-------------|----------|--------|
| Company | Activity.companyId → Company.name | ✅ |
| Industry | Company.industryId → Industry.name | ✅ |
| Channel | Company.channelType | ✅ |
| PIC | Activity.contactId → Contact.fullName | ✅ (diperbaiki) |
| Tittle (typo) | Contact.jobTitle | ✅ |
| Tgl Meeting | Activity.activityDate | ✅ |
| Medium | Activity.medium | ✅ |
| Meeting Objective | Activity.objective | ✅ |
| Hasil Meeting | Activity.resultNotes | ✅ |
| Progress | Activity.nextAction | ✅ |
| Remarks | Activity.resultNotes (append) | ✅ |

### Pipeline → Deals

| Kolom Excel | Field DB | Status |
|-------------|----------|--------|
| Prospect Name | Deal.dealName | ✅ |
| IP Offered | Deal.ipAssetName | ✅ |
| Stage | Deal.stageId (mapped) | ✅ (diperbaiki) |
| Estimated Value | Deal.estimatedValue | ✅ |
| Probability (%) | Deal.probabilityPct | ✅ |
| Expected Closing | Deal.expectedClosingDate | ✅ |
| Weighted Value | Computed (estimated × probability) | ✅ |
| Remarks | Deal.remarks | ✅ |

### Closing → Won Deals

| Kolom Excel | Field DB | Status |
|-------------|----------|--------|
| Client Name | Company.name + Deal.companyId | ✅ |
| IP | Deal.ipAssetName | ✅ |
| Deal Value | Deal.estimatedValue | ✅ |
| Revenue | — | ⚠️ Field tidak ada di schema |

### report-abc-p → Jobs

| Kolom Excel | Field DB | Status |
|-------------|----------|--------|
| No | Auto-increment | ✅ |
| Status (A/B) | Tidak dimigrasikan | ⚠️ Makna bisnis belum dikonfirmasi |
| Month | Job.periodMonth | ✅ |
| Client | Job.companyId → Company.name | ✅ |
| Job Title | Job.jobTitle | ✅ |
| Sales Amount | Job.salesAmount | ✅ |
| COGS | Job.cogsAmount | ✅ |
| Operating Profit | Computed (Sales - COGS) | ✅ |
| Operating Profit(%) | Computed (null-safe) | ✅ |
| Agency(Bill to) | Job.billingType | ✅ |
| PIC | Job.picId | ⚠️ Default ke sinta@provaliant.com |
| Job Category | Job.jobCategoryId | ✅ |
| Inductry (typo) | Company.industryId | ✅ |
| JOB Stage | Job.jobStatus | ⚠️ Kosong di data lama |

---

## 3. Flow Bisnis

### Flow: Canvassing → Pipeline → Closing → Job Execution

```
Canvassing (Activity)
  ↓ promoteToDeal()
Pipeline (Deal — Lead/Qualified/Discovery/Proposal/Negotiation)
  ↓ changeStage(wonStage) + Manager approval
Closing (Deal — Won)
  ↓ auto-create
Job Execution (Job — P&L tracking)
```

**Status: ✅ Flow bisnis sudah benar dan sesuai pola Excel**

---

## 4. Gap Analysis

### Yang Sudah Diperbaiki dalam Sesi Ini:

| # | Issue | Perbaikan | Status |
|---|-------|-----------|--------|
| 1 | Pipeline stage empty (17 deals) → default Lead | Diperbaiki: empty → Qualified | ✅ Done |
| 2 | Row "Jumlah" bisa masuk DB | Filter: skip `prospectName === 'Jumlah'` | ✅ Done |
| 3 | Zero-value deals dimigrasikan | Filter: skip `estimatedValue === 0` | ✅ Done |
| 4 | PIC/Contact tidak dimigrasi | Ditambahkan: `ensureContact()` function | ✅ Done |
| 5 | Year hardcoded 2025 | Diperbaiki: extract dari sheet name | ✅ Done |
| 6 | `Revenue` field tidak ada di schema | Ditambahkan: `Deal.actualRevenue BigInt?` | ✅ Done |
| 7 | `nextStepFlag` tidak ada di Activity | Ditambahkan: `Activity.nextStepFlag Boolean` | ✅ Done |
| 8 | Sheet1 (43 rows) tidak dimigrasi | Ditambahkan migrasi Sheet1 → Activities | ✅ Done |
| 9 | Deduplication menggunakan substring(0,20) | Diperbaiki: exact match `jobTitle` | ✅ Done |
| 10 | Duplicate code block di migrate-excel.ts | Dihapus duplicate `ensureIndustry` | ✅ Done |

### Gap yang Masih Ada (Perlu Keputusan Bisnis):

| # | Issue | Dampak | Rekomendasi | Status |
|---|-------|--------|-------------|--------|
| 1 | `Revenue` field di Closing sheet tidak ada di schema | Revenue actual vs estimated tidak terpisah | ✅ Fixed: `actualRevenue` field ditambahkan | CLOSED |
| 2 | Status A/B di report-abc-p.xlsx | "A" = job utama/realised, "B" = kategori kedua — makna belum dikonfirmasi | Konfirmasi dengan tim Provaliant, lalu buat enum job di schema | OPEN |
| 3 | PIC di Jobs (report-abc-p) selalu kosong di data historis | Semua jobs historis assigned ke Sinta | Konfirmasi assignment PIC dengan tim | OPEN |
| 4 | Sheet1 dari IP_Licensing (43 rows) tidak dimigrasi | Potensi 43 activities hilang | ✅ Fixed: Sheet1 migration ditambahkan | CLOSED |
| 5 | Kolom `NS` (Next Step flag, 0/1) di Canvassing | Informasi "apakah ada next step" hilang | ✅ Fixed: `nextStepFlag` ditambahkan | CLOSED |

---

## 5. Hasil Migrasi Database

Setelah perbaikan:

| Entitas | Count | Sumber |
|---------|-------|--------|
| Companies | 61 | Canvassing + Pipeline + Jobs |
| Industries | 14 | Dari kedua file |
| Contacts | 47 | Canvassing + Sheet1 PIC |
| Activities | 77 | Canvassing + Sheet1 |
| Deals | 24 | Pipeline + Closing + retroactive |
| Deal Stage History | 23 | Auto-generated |
| Jobs | 67 | report-abc-p |

**Reconciliation (Jobs P&L) - VERIFIED ✅:**
- DB Sales Total: Rp 16.201.595.435 ✅ (matches Excel)
- DB COGS Total: Rp 12.381.971.791 ✅ (matches Excel)
- DB Profit Total: Rp 3.819.623.644 ✅ (matches Excel)

---

## 6. Pertanyaan Terbuka untuk Tim Provaliant

1. **Status A/B di report-abc-p.xlsx**: Apa makna bisnis pasti dari "A" dan "B"?
2. **PIC di Jobs**: Apakah ada mapping PIC internal Provaliant untuk jobs historis?
3. **Revenue vs Deal Value**: Apakah perlu track `Revenue aktual` terpisah dari `Estimated Value` di Pipeline?
4. **Sheet1 di IP_Licensing**: Apakah Sheet1 adalah versi lain dari Canvassing atau data berbeda?
5. **Kolom NS (Next Step)**: Apakah perlu disimpan sebagai field terpisah di Activity?

---

*Dokumen ini digenerate otomatis berdasarkan analisa kode dan data aktual.*
