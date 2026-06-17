/**
 * Excel Migration Script (PRD Bagian 11)
 *
 * Migrates data from:
 *   - IP_Licensing_Sales_Report_Advanced.xlsx (Canvassing, Pipeline, Closing)
 *   - report-abc-p.xlsx (Jobs/P&L)
 *
 * Run with: npx ts-node scripts/migrate-excel.ts
 *
 * Prerequisites: database already seeded (npm run db:seed)
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

function trim(s: any): string {
  return typeof s === 'string' ? s.trim() : String(s ?? '');
}

function normalizeCompany(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .replace(/\[.*?\]/g, '')        // remove [direct] etc.
    .trim();
}

/** Excel serial date → JS Date */
function excelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel epoch: Jan 1 1900 = day 1, with leap-year bug offset
    return new Date(Date.UTC(1899, 11, 30) + val * 86400000);
  }
  // String date like "13/1" → assume current year
  if (typeof val === 'string' && val.includes('/')) {
    const parts = val.split('/');
    const m = parseInt(parts[1] ?? parts[0], 10);
    const d = parseInt(parts[0], 10);
    if (!isNaN(m) && !isNaN(d)) {
      return new Date(Date.UTC(2025, m - 1, d));
    }
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ── Company/Contact dedup cache ───────────────────────────────────────────────

const companyCache = new Map<string, string>(); // normalized name → id
const industryCache = new Map<string, string>(); // name → id

async function ensureCompany(
  rawName: string,
  rawIndustry: string,
  channelType: string,
  createdById: string,
): Promise<string> {
  // Always ensure we have an industry (schema requires NOT NULL)
  const name = normalizeCompany(rawName);
  if (!name) return '';

  if (companyCache.has(name)) return companyCache.get(name)!;

  // Look up or create in DB
  let company = await prisma.company.findFirst({ where: { name } });
  if (!company) {
    const industryId = await ensureIndustry(trim(rawIndustry));
    // industryId is always set (ensureIndustry returns 'Other' as fallback)
    const newId = require('crypto').randomUUID();
    const now = new Date().toISOString();
    await prisma.$executeRawUnsafe(
      `INSERT INTO companies (id, name, channelType, industryId, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      newId,
      name,
      channelType || 'Direct',
      industryId,
      createdById,
      now,
      now,
    );
    company = (await prisma.company.findUnique({ where: { id: newId } }))!;
    console.log(`  + Company: ${name}`);
  }

  companyCache.set(name, company.id);
  return company.id;
}

async function ensureIndustry(raw: string): Promise<string> {
  const name = raw.trim() || 'Other';
  if (industryCache.has(name)) return industryCache.get(name)!;

  let ind = await prisma.industry.findFirst({ where: { name } });
  if (!ind) {
    // Try to find close match (trailing spaces)
    ind = await prisma.industry.findFirst({
      where: { name: { contains: name.split(' ')[0] } },
    });
  }
  if (!ind) {
    ind = await prisma.industry.create({ data: { name } });
  }
  industryCache.set(name, ind.id);
  return ind.id;
}


// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📊 Provaliant Excel Migration Script');
  console.log('=====================================\n');

  // Load seed reference data
  const admin = await prisma.user.findFirst({ where: { email: 'admin@provaliant.com' } });
  const salesUser = await prisma.user.findFirst({ where: { email: 'sinta@provaliant.com' } });
  if (!admin || !salesUser) {
    throw new Error('Please run npm run db:seed first before migrating.');
  }

  const defaultDivision = await prisma.division.findFirst({ where: { code: 'IPL' } });
  if (!defaultDivision) throw new Error('Division IPL not found. Run db:seed first.');

  const stages = await prisma.pipelineStage.findMany();
  const stageByName = Object.fromEntries(stages.map((s) => [s.name.toLowerCase(), s]));
  const wonStage = stages.find((s) => s.isWon)!;
  const leadStage = stages.find((s) => s.sortOrder === 1)!;
  const proposalStage = stageByName['proposal'];
  const negotiationStage = stageByName['negotiation'];

  const dealTypes = await prisma.dealType.findMany();
  const ipDealType = dealTypes.find((d) => d.name.includes('IP Licensing'))!;

  const jobCats = await prisma.jobCategory.findMany();
  const jobCatByName = Object.fromEntries(jobCats.map((c) => [c.name.toLowerCase(), c]));

  // ── FILE 1: IP_Licensing_Sales_Report_Advanced.xlsx ─────────────────────────
  const ip1Path = path.resolve(__dirname, '../../../files/IP_Licensing_Sales_Report_Advanced.xlsx');
  const wb1 = XLSX.readFile(ip1Path);

  // ── Sheet: Canvassing → Activities + Companies ───────────────────────────────
  console.log('1. Migrating Canvassing → Activities...');
  const canvRows = XLSX.utils.sheet_to_json<any>(wb1.Sheets['Canvassing'], { defval: '' });
  let actCount = 0;

  for (const row of canvRows) {
    const companyName = trim(row['Company']);
    if (!companyName) continue;

    const companyId = await ensureCompany(
      companyName,
      row['Industry'] ?? '',
      trim(row['Channel']) || 'Direct',
      admin.id,
    );
    if (!companyId) continue;

    const actDate = excelDate(row['Tgl Meeting'] || row['Date']) ?? new Date('2025-01-01');
    const nextActionDate = excelDate(row['Tgl Meeting'] || null);

    const existing = await prisma.activity.findFirst({
      where: {
        companyId,
        objective: { contains: trim(row['Meeting Objective']) || 'Perkenalan' },
      },
    });
    if (existing) continue;

    await prisma.activity.create({
      data: {
        companyId,
        divisionId: defaultDivision.id,
        salesRepId: salesUser.id,
        activityDate: actDate,
        medium: trim(row['Medium']) || 'Offline Meeting',
        objective: trim(row['Meeting Objective']) || 'Perkenalan',
        resultNotes: trim(row['Hasil Meeting']) || null,
        nextAction: trim(row['Progress '] || row['Progress']) || null,
        nextActionDate: nextActionDate ?? null,
      },
    });
    actCount++;
  }
  console.log(`   ✅ ${actCount} activities migrated`);

  // ── Sheet: Pipeline → Deals ──────────────────────────────────────────────────
  console.log('2. Migrating Pipeline → Deals...');
  const pipeRows = XLSX.utils.sheet_to_json<any>(wb1.Sheets['Pipeline'], { defval: '' });
  let dealCount = 0;

  // Map stage free-text → baku
  function mapStage(raw: string) {
    const s = raw.toLowerCase().trim();
    if (s.includes('proposal') || s.includes('propose') || s.includes('share')) return proposalStage;
    if (s.includes('discus') || s.includes('proses') || s.includes('negoti')) return negotiationStage;
    return leadStage;
  }

  for (const row of pipeRows) {
    const prospectName = trim(row['Prospect Name']);
    if (!prospectName) continue;

    const companyId = await ensureCompany(prospectName, '', 'Direct', admin.id);
    const stage = mapStage(trim(row['Stage']));

    const existing = await prisma.deal.findFirst({
      where: { dealName: { contains: prospectName } },
    });
    if (existing) continue;

    const deal = await prisma.deal.create({
      data: {
        dealName: `${prospectName} - ${trim(row['IP Offered']) || 'IP Licensing'}`,
        companyId,
        divisionId: defaultDivision.id,
        salesRepId: salesUser.id,
        dealTypeId: ipDealType.id,
        stageId: stage.id,
        estimatedValue: typeof row['Estimated Value'] === 'number' ? Math.min(Math.round(row['Estimated Value']), 2147483647) : 0,
        probabilityPct: typeof row['Probability (%)'] === 'number' ? Math.round(row['Probability (%)']) : 0,
        ipAssetName: trim(row['IP Offered']) || null,
        expectedClosingDate: excelDate(row['Expected Closing']) ?? null,
      },
    });

    await prisma.dealStageHistory.create({
      data: { dealId: deal.id, fromStageId: null, toStageId: stage.id, changedBy: admin.id, note: 'Migrated from Excel' },
    });
    dealCount++;
  }
  console.log(`   ✅ ${dealCount} deals migrated`);

  // ── Sheet: Closing → Won Deals ───────────────────────────────────────────────
  console.log('3. Migrating Closing → Won Deals...');
  const closeRows = XLSX.utils.sheet_to_json<any>(wb1.Sheets['Closing'], { defval: '' });
  let wonCount = 0;

  for (const row of closeRows) {
    const clientName = trim(row['Client Name']);
    if (!clientName) continue;

    const companyId = await ensureCompany(clientName, '', 'Direct', admin.id);
    const existing = await prisma.deal.findFirst({ where: { companyId, stage: { isWon: true } } });
    if (existing) continue;

    const deal = await prisma.deal.create({
      data: {
        dealName: `${clientName} - ${trim(row['IP']) || 'Closing'}`,
        companyId,
        divisionId: defaultDivision.id,
        salesRepId: salesUser.id,
        dealTypeId: ipDealType.id,
        stageId: wonStage.id,
        estimatedValue: typeof row['Deal Value'] === 'number' ? Math.round(row['Deal Value']) : 0,
        probabilityPct: 100,
        ipAssetName: trim(row['IP']) || null,
        royaltyPct: typeof row['Royalty (%)'] === 'number' ? row['Royalty (%)'] : null,
        minimumGuarantee: typeof row['MG'] === 'number' ? Math.round(row['MG']) : null,
        actualClosingDate: new Date(),
        stageChangedAt: new Date(),
      },
    });
    await prisma.dealStageHistory.create({
      data: { dealId: deal.id, fromStageId: null, toStageId: wonStage.id, changedBy: admin.id, note: 'Migrated from Closing sheet' },
    });
    wonCount++;
  }
  console.log(`   ✅ ${wonCount} closing deals migrated`);

  // ── FILE 2: report-abc-p.xlsx → Jobs ────────────────────────────────────────
  console.log('4. Migrating report-abc-p → Jobs...');
  const ip2Path = path.resolve(__dirname, '../../../files/report-abc-p.xlsx');
  const wb2 = XLSX.readFile(ip2Path);
  const rawRows = XLSX.utils.sheet_to_json<any[]>(wb2.Sheets['Copy of Starlight 2025'], {
    defval: '',
    header: 1,
  });

  // Row 1 = header (index 1), rows 2+ = data
  let jobMigrated = 0;
  for (let i = 2; i < rawRows.length; i++) {
    const row = rawRows[i] as any[];
    const no = row[0];
    const month = row[2];
    const client = row[3];
    // Skip summary/aggregate rows: must have numeric No, numeric Month, and client
    if (typeof no !== 'number' || typeof month !== 'number' || !client) continue;

    const jobTitle = trim(row[4]);
    const salesAmount = typeof row[5] === 'number' ? Math.round(row[5]) : 0;
    const cogsAmount = typeof row[6] === 'number' ? Math.round(row[6]) : 0;
    const billingType = trim(row[9]) || 'Direct';
    const rawCat = trim(row[12]);
    const rawIndustry = trim(row[13]);

    if (!jobTitle || salesAmount === 0) continue;

    const companyId = await ensureCompany(trim(client), rawIndustry, billingType, admin.id);
    if (!companyId) continue;

    // Find or create a retroactive Won deal for this client (PRD 11)
    let deal = await prisma.deal.findFirst({
      where: { companyId, stage: { isWon: true }, dealName: { contains: 'Historis' } },
    });
    if (!deal) {
      deal = await prisma.deal.create({
        data: {
          dealName: `${normalizeCompany(trim(client))} - Historis 2025`,
          companyId,
          divisionId: defaultDivision.id,
          salesRepId: salesUser.id,
          dealTypeId: ipDealType.id,
          stageId: wonStage.id,
          estimatedValue: 0,
          probabilityPct: 100,
          actualClosingDate: new Date('2025-01-01'),
          stageChangedAt: new Date('2025-01-01'),
        },
      });
      await prisma.dealStageHistory.create({
        data: { dealId: deal.id, fromStageId: null, toStageId: wonStage.id, changedBy: admin.id, note: 'Auto-created for job migration' },
      });
    }

    // Resolve job category
    const catKey = rawCat.toLowerCase();
    const cat = jobCatByName[catKey]
      ?? Object.values(jobCatByName).find((c) => catKey.includes(c.name.split(' ')[0].toLowerCase()))
      ?? jobCats[0];

    const existing = await prisma.job.findFirst({
      where: { dealId: deal.id, jobTitle: { contains: jobTitle.substring(0, 20) }, periodMonth: month, periodYear: 2025 },
    });
    if (existing) continue;

    await prisma.job.create({
      data: {
        dealId: deal.id,
        companyId,
        divisionId: defaultDivision.id,
        jobTitle,
        jobCategoryId: cat.id,
        periodMonth: month,
        periodYear: 2025,
        salesAmount,
        cogsAmount,
        billingType: billingType === 'Direct' || billingType === 'Agency' ? billingType : 'Direct',
        jobStatus: 'Completed',
        picId: salesUser.id,
      },
    });
    jobMigrated++;
  }
  console.log(`   ✅ ${jobMigrated} jobs migrated`);

  // ── Reconciliation check ─────────────────────────────────────────────────────
  console.log('\n5. Reconciliation check...');
  const totals = await prisma.job.aggregate({
    _sum: { salesAmount: true, cogsAmount: true },
  });
  const totalSalesNum = Number(totals._sum.salesAmount ?? 0);
  const totalCogsNum = Number(totals._sum.cogsAmount ?? 0);
  const opProfit = totalSalesNum - totalCogsNum;
  console.log(`   Total Sales Amount in DB : Rp ${totalSalesNum.toLocaleString('id-ID')}`);
  console.log(`   Total COGS in DB         : Rp ${totalCogsNum.toLocaleString('id-ID')}`);
  console.log(`   Operating Profit in DB   : Rp ${opProfit.toLocaleString('id-ID')}`);

  const totalDeals = await prisma.deal.count();
  const totalActivities = await prisma.activity.count();
  const totalCompanies = await prisma.company.count();
  console.log(`\n   Companies : ${totalCompanies}`);
  console.log(`   Deals     : ${totalDeals}`);
  console.log(`   Activities: ${totalActivities}`);
  console.log(`   Jobs      : ${jobMigrated}`);

  console.log('\n✅ Migration complete!\n');
}

main()
  .catch((e) => { console.error('\n❌ Migration failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
