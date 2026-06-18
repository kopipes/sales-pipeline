import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.dealStageHistory.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.job.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.target.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.division.deleteMany();
  await prisma.jobCategory.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.dealType.deleteMany();
  await prisma.industry.deleteMany();

  // 1. Create Industries
  console.log('Creating industries...');
  const industries = await Promise.all([
    prisma.industry.create({ data: { name: 'FMCG' } }),
    prisma.industry.create({ data: { name: 'Beauty & Body Care' } }),
    prisma.industry.create({ data: { name: 'F&B' } }),
    prisma.industry.create({ data: { name: 'Apparel' } }),
    prisma.industry.create({ data: { name: 'Pharmaceutical' } }),
    prisma.industry.create({ data: { name: 'Property' } }),
    prisma.industry.create({ data: { name: 'Technology' } }),
    prisma.industry.create({ data: { name: 'Automotive' } }),
    prisma.industry.create({ data: { name: 'TellCo' } }),
    prisma.industry.create({ data: { name: 'Pet Food' } }),
    prisma.industry.create({ data: { name: 'Retail' } }),
    prisma.industry.create({ data: { name: 'Sport' } }),
  ]);

  // 2. Create Pipeline Stages
  console.log('Creating pipeline stages...');
  const stages = await Promise.all([
    prisma.pipelineStage.create({ data: { name: 'Lead', sortOrder: 1 } }),
    prisma.pipelineStage.create({ data: { name: 'Qualified', sortOrder: 2 } }),
    prisma.pipelineStage.create({ data: { name: 'Discovery', sortOrder: 3 } }),
    prisma.pipelineStage.create({ data: { name: 'Proposal', sortOrder: 4 } }),
    prisma.pipelineStage.create({ data: { name: 'Negotiation', sortOrder: 5 } }),
    prisma.pipelineStage.create({ data: { name: 'Won', sortOrder: 6, isWon: true } }),
    prisma.pipelineStage.create({ data: { name: 'Lost', sortOrder: 7, isLost: true } }),
  ]);

  // 3. Create Deal Types
  console.log('Creating deal types...');
  const dealTypes = await Promise.all([
    prisma.dealType.create({
      data: {
        name: 'IP Licensing/Sponsorship',
        description: 'IP licensing and sponsorship deals',
      },
    }),
    prisma.dealType.create({
      data: {
        name: 'Job/Project',
        description: 'Project-based jobs and services',
      },
    }),
  ]);

  // 4. Create Job Categories
  console.log('Creating job categories...');
  const jobCategories = await Promise.all([
    prisma.jobCategory.create({ data: { name: 'Operational & Production' } }),
    prisma.jobCategory.create({ data: { name: 'Operational' } }),
    prisma.jobCategory.create({ data: { name: 'Production' } }),
    prisma.jobCategory.create({ data: { name: 'Video Production' } }),
  ]);

  // 5. Create Divisions
  console.log('Creating divisions...');
  const divisions = await Promise.all([
    prisma.division.create({
      data: {
        name: 'IP Licensing',
        code: 'IPL',
        colorTag: '#3B82F6',
      },
    }),
    prisma.division.create({
      data: {
        name: 'IP Events',
        code: 'IPE',
        colorTag: '#8B5CF6',
      },
    }),
    prisma.division.create({
      data: {
        name: 'Mall Activation',
        code: 'MLA',
        colorTag: '#EC4899',
      },
    }),
    prisma.division.create({
      data: {
        name: 'Brand Collaboration',
        code: 'BRC',
        colorTag: '#10B981',
      },
    }),
    prisma.division.create({
      data: {
        name: 'Merchandise',
        code: 'MRC',
        colorTag: '#F59E0B',
      },
    }),
  ]);

  // 6. Create Roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full system access',
        scopeLevel: 'all',
      },
    }),
    prisma.role.create({
      data: {
        name: 'Corporate',
        description: 'Executive/Director level access',
        scopeLevel: 'all',
      },
    }),
    prisma.role.create({
      data: {
        name: 'Manager',
        description: 'Division manager access',
        scopeLevel: 'division',
      },
    }),
    prisma.role.create({
      data: {
        name: 'User',
        description: 'Sales/Staff user access',
        scopeLevel: 'own',
      },
    }),
  ]);

  // 7. Create Permissions
  console.log('Creating permissions...');
  const resources = ['users', 'divisions', 'companies', 'contacts', 'deals', 'jobs', 'activities', 'dashboard'];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export'];

  const permissions: Array<{ id: string; resource: string; action: string }> = [];
  for (const resource of resources) {
    for (const action of actions) {
      const permission = await prisma.permission.create({
        data: {
          resource,
          action,
          description: `${action} ${resource}`,
        },
      });
      permissions.push(permission);
    }
  }

  // 8. Assign Permissions to Roles
  console.log('Assigning permissions to roles...');

  // Admin - all permissions
  const adminRole = roles[0];
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Corporate - read and export all
  const corporateRole = roles[1];
  const corporatePermissions = permissions.filter(
    (p) => p.action === 'read' || p.action === 'export'
  );
  for (const permission of corporatePermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: corporateRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Manager - CRUD on division data + approve
  const managerRole = roles[2];
  const managerPermissions = permissions.filter(
    (p) =>
      ['create', 'read', 'update', 'delete', 'approve', 'export'].includes(p.action) &&
      ['companies', 'contacts', 'deals', 'jobs', 'activities', 'dashboard'].includes(p.resource)
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // User - CRUD own data
  const userRole = roles[3];
  const userPermissions = permissions.filter(
    (p) =>
      ['create', 'read', 'update'].includes(p.action) &&
      ['companies', 'contacts', 'deals', 'jobs', 'activities', 'dashboard'].includes(p.resource)
  );
  for (const permission of userPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  // 9. Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@provaliant.com', passwordHash: hashedPassword, fullName: 'Admin Provaliant', phone: '081234567890', divisionId: divisions[0].id, jobTitle: 'System Administrator', roleId: adminRole.id, status: 'active' },
  });
  await prisma.user.create({
    data: { email: 'reynaldo@provaliant.com', passwordHash: hashedPassword, fullName: 'Reynaldo', phone: '081234567891', divisionId: divisions[0].id, jobTitle: 'Sales Director', roleId: corporateRole.id, status: 'active' },
  });
  const managerIPL = await prisma.user.create({
    data: { email: 'andi@provaliant.com', passwordHash: hashedPassword, fullName: 'Andi Kurniawan', phone: '081234567892', divisionId: divisions[0].id, jobTitle: 'Manager IP Licensing', roleId: managerRole.id, status: 'active' },
  });
  const managerIPE = await prisma.user.create({
    data: { email: 'budi@provaliant.com', passwordHash: hashedPassword, fullName: 'Budi Santoso', phone: '081234567893', divisionId: divisions[1].id, jobTitle: 'Manager IP Events', roleId: managerRole.id, status: 'active' },
  });
  const managerMLA = await prisma.user.create({
    data: { email: 'citra@provaliant.com', passwordHash: hashedPassword, fullName: 'Citra Dewi', phone: '081234567894', divisionId: divisions[2].id, jobTitle: 'Manager Mall Activation', roleId: managerRole.id, status: 'active' },
  });
  const sinta = await prisma.user.create({
    data: { email: 'sinta@provaliant.com', passwordHash: hashedPassword, fullName: 'Sinta Rahma', phone: '081234567895', divisionId: divisions[0].id, jobTitle: 'Business Development', roleId: userRole.id, managerId: managerIPL.id, status: 'active' },
  });
  const doni = await prisma.user.create({
    data: { email: 'doni@provaliant.com', passwordHash: hashedPassword, fullName: 'Doni Prasetyo', phone: '081234567896', divisionId: divisions[1].id, jobTitle: 'Business Development', roleId: userRole.id, managerId: managerIPE.id, status: 'active' },
  });
  const rini = await prisma.user.create({
    data: { email: 'rini@provaliant.com', passwordHash: hashedPassword, fullName: 'Rini Wulandari', phone: '081234567897', divisionId: divisions[2].id, jobTitle: 'Account Executive', roleId: userRole.id, managerId: managerMLA.id, status: 'active' },
  });
  const hendra = await prisma.user.create({
    data: { email: 'hendra@provaliant.com', passwordHash: hashedPassword, fullName: 'Hendra Saputra', phone: '081234567898', divisionId: divisions[3].id, jobTitle: 'Business Development', roleId: userRole.id, status: 'active' },
  });
  const maya = await prisma.user.create({
    data: { email: 'maya@provaliant.com', passwordHash: hashedPassword, fullName: 'Maya Sari', phone: '081234567899', divisionId: divisions[4].id, jobTitle: 'Sales Executive', roleId: userRole.id, status: 'active' },
  });

  // 10. Create Companies — varied channelType for lead source diversity
  console.log('Creating companies...');
  const industries_map = Object.fromEntries(industries.map((i) => [i.name, i.id]));
  const companies = await Promise.all([
    prisma.company.create({ data: { name: 'Watsons', industryId: industries_map['Retail'], channelType: 'Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Danone', industryId: industries_map['FMCG'], channelType: 'Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Fonterra', industryId: industries_map['FMCG'], channelType: 'Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Unilever Indonesia', industryId: industries_map['FMCG'], channelType: 'Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Wardah Cosmetics', industryId: industries_map['Beauty & Body Care'], channelType: 'Agency', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Sido Muncul', industryId: industries_map['Pharmaceutical'], channelType: 'Agency', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Astra International', industryId: industries_map['Automotive'], channelType: 'In-Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Telkom Indonesia', industryId: industries_map['TellCo'], channelType: 'In-Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Indofood', industryId: industries_map['F&B'], channelType: 'Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Mayora Group', industryId: industries_map['F&B'], channelType: 'Agency', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Eiger Adventure', industryId: industries_map['Sport'], channelType: 'In-Direct', createdBy: admin.id } }),
    prisma.company.create({ data: { name: 'Erha Clinic', industryId: industries_map['Beauty & Body Care'], channelType: 'Direct', createdBy: admin.id } }),
  ]);
  // idx: 0=Watsons 1=Danone 2=Fonterra 3=Unilever 4=Wardah 5=SidoMuncul 6=Astra 7=Telkom 8=Indofood 9=Mayora 10=Eiger 11=Erha

  // 11. Contacts
  console.log('Creating contacts...');
  await Promise.all([
    prisma.contact.create({ data: { companyId: companies[0].id, fullName: 'Alpha Susanto', jobTitle: 'Brand Marketing', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[1].id, fullName: 'Norma Wijaya', jobTitle: 'Brand Manager', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[2].id, fullName: 'Rizky Halim', jobTitle: 'Marketing Director', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[3].id, fullName: 'Dewi Anggraini', jobTitle: 'Head of Sponsorship', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[4].id, fullName: 'Fauzan Arief', jobTitle: 'Brand Activation Manager', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[5].id, fullName: 'Lestari Putri', jobTitle: 'Marketing Manager', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[6].id, fullName: 'Bambang Wahyudi', jobTitle: 'Event Coordinator', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[7].id, fullName: 'Sari Puspita', jobTitle: 'Sponsorship Lead', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[8].id, fullName: 'Teguh Haryanto', jobTitle: 'Trade Marketing', isPrimary: true } }),
    prisma.contact.create({ data: { companyId: companies[9].id, fullName: 'Nining Rahayu', jobTitle: 'Brand Director', isPrimary: true } }),
  ]);

  // 12. Deals — all 5 divisions, all stages, won deals with actualRevenue
  console.log('Creating deals...');
  const d = (days: number) => new Date(Date.now() - days * 86400000);
  const f = (days: number) => new Date(Date.now() + days * 86400000);

  // ── IP Licensing ──────────────────────────────────────────────────
  await prisma.deal.create({ data: { dealName: 'Watsons - One Piece Run', companyId: companies[0].id, divisionId: divisions[0].id, salesRepId: sinta.id, dealTypeId: dealTypes[0].id, stageId: stages[3].id, estimatedValue: 2000000000n, probabilityPct: 60, ipAssetName: 'One Piece Run', expectedClosingDate: f(30), stageChangedAt: d(5), remarks: 'Run tgl July 17, 2026.' } });
  await prisma.deal.create({ data: { dealName: 'Unilever - Naruto Sponsorship', companyId: companies[3].id, divisionId: divisions[0].id, salesRepId: sinta.id, dealTypeId: dealTypes[0].id, stageId: stages[4].id, estimatedValue: 3500000000n, probabilityPct: 75, ipAssetName: 'Naruto', expectedClosingDate: f(14), stageChangedAt: d(10) } });
  await prisma.deal.create({ data: { dealName: 'Danone - Dragon Ball Activation', companyId: companies[1].id, divisionId: divisions[0].id, salesRepId: sinta.id, dealTypeId: dealTypes[0].id, stageId: stages[5].id, estimatedValue: 1800000000n, probabilityPct: 100, ipAssetName: 'Dragon Ball', actualClosingDate: d(20), actualRevenue: 1800000000n, stageChangedAt: d(20) } });
  await prisma.deal.create({ data: { dealName: 'Fonterra - Slam Dunk Campaign', companyId: companies[2].id, divisionId: divisions[0].id, salesRepId: sinta.id, dealTypeId: dealTypes[0].id, stageId: stages[6].id, estimatedValue: 900000000n, probabilityPct: 0, lostReason: 'Budget tidak disetujui klien', stageChangedAt: d(45) } });
  await prisma.deal.create({ data: { dealName: 'Fonterra - Kimetsu no Yaiba Pack', companyId: companies[2].id, divisionId: divisions[0].id, salesRepId: sinta.id, dealTypeId: dealTypes[0].id, stageId: stages[0].id, estimatedValue: 600000000n, probabilityPct: 15, expectedClosingDate: f(100), stageChangedAt: d(1) } });

  // ── IP Events ────────────────────────────────────────────────────
  await prisma.deal.create({ data: { dealName: 'Wardah - Anime Fest 2026', companyId: companies[4].id, divisionId: divisions[1].id, salesRepId: doni.id, dealTypeId: dealTypes[0].id, stageId: stages[2].id, estimatedValue: 4200000000n, probabilityPct: 45, ipAssetName: 'Anime Fest 2026', expectedClosingDate: f(60), stageChangedAt: d(8) } });
  await prisma.deal.create({ data: { dealName: 'Telkom - J-Culture Festival', companyId: companies[7].id, divisionId: divisions[1].id, salesRepId: doni.id, dealTypeId: dealTypes[0].id, stageId: stages[5].id, estimatedValue: 5000000000n, probabilityPct: 100, ipAssetName: 'J-Culture Festival', actualClosingDate: d(35), actualRevenue: 5200000000n, stageChangedAt: d(35) } });
  await prisma.deal.create({ data: { dealName: 'Sido Muncul - Cosplay Championship', companyId: companies[5].id, divisionId: divisions[1].id, salesRepId: doni.id, dealTypeId: dealTypes[0].id, stageId: stages[1].id, estimatedValue: 1500000000n, probabilityPct: 30, ipAssetName: 'Cosplay Championship', expectedClosingDate: f(90), stageChangedAt: d(3) } });
  await prisma.deal.create({ data: { dealName: 'Astra - JKT48 Mall Tour', companyId: companies[6].id, divisionId: divisions[1].id, salesRepId: doni.id, dealTypeId: dealTypes[0].id, stageId: stages[4].id, estimatedValue: 3200000000n, probabilityPct: 80, expectedClosingDate: f(10), stageChangedAt: d(15) } });

  // ── Mall Activation ─────────────────────────────────────────────
  await prisma.deal.create({ data: { dealName: 'Astra - Mall Pop-up Activation', companyId: companies[6].id, divisionId: divisions[2].id, salesRepId: rini.id, dealTypeId: dealTypes[1].id, stageId: stages[3].id, estimatedValue: 800000000n, probabilityPct: 65, expectedClosingDate: f(21), stageChangedAt: d(12) } });
  await prisma.deal.create({ data: { dealName: 'Indofood - Ramadan Bazaar', companyId: companies[8].id, divisionId: divisions[2].id, salesRepId: rini.id, dealTypeId: dealTypes[1].id, stageId: stages[5].id, estimatedValue: 650000000n, probabilityPct: 100, actualClosingDate: d(15), actualRevenue: 650000000n, stageChangedAt: d(15) } });
  await prisma.deal.create({ data: { dealName: 'Mayora - School Holiday Activation', companyId: companies[9].id, divisionId: divisions[2].id, salesRepId: rini.id, dealTypeId: dealTypes[1].id, stageId: stages[6].id, estimatedValue: 400000000n, probabilityPct: 0, lostReason: 'Klien memilih vendor lain', stageChangedAt: d(60) } });
  await prisma.deal.create({ data: { dealName: 'Telkom - Digital Activation', companyId: companies[7].id, divisionId: divisions[2].id, salesRepId: rini.id, dealTypeId: dealTypes[1].id, stageId: stages[2].id, estimatedValue: 1100000000n, probabilityPct: 50, expectedClosingDate: f(40), stageChangedAt: d(4) } });

  // ── Brand Collaboration ─────────────────────────────────────────
  await prisma.deal.create({ data: { dealName: 'Eiger - Outdoor Brand Collab', companyId: companies[10].id, divisionId: divisions[3].id, salesRepId: hendra.id, dealTypeId: dealTypes[1].id, stageId: stages[0].id, estimatedValue: 1200000000n, probabilityPct: 20, expectedClosingDate: f(120), stageChangedAt: d(2) } });
  await prisma.deal.create({ data: { dealName: 'Unilever - Dove x Local Brand', companyId: companies[3].id, divisionId: divisions[3].id, salesRepId: hendra.id, dealTypeId: dealTypes[1].id, stageId: stages[5].id, estimatedValue: 2800000000n, probabilityPct: 100, actualClosingDate: d(10), actualRevenue: 2800000000n, stageChangedAt: d(10) } });
  await prisma.deal.create({ data: { dealName: 'Erha - Skincare x Anime Collab', companyId: companies[11].id, divisionId: divisions[3].id, salesRepId: hendra.id, dealTypeId: dealTypes[0].id, stageId: stages[2].id, estimatedValue: 1600000000n, probabilityPct: 50, expectedClosingDate: f(45), stageChangedAt: d(7) } });
  await prisma.deal.create({ data: { dealName: 'Wardah - Influencer Brand Kit', companyId: companies[4].id, divisionId: divisions[3].id, salesRepId: hendra.id, dealTypeId: dealTypes[1].id, stageId: stages[1].id, estimatedValue: 750000000n, probabilityPct: 35, expectedClosingDate: f(70), stageChangedAt: d(6) } });

  // ── Merchandise ────────────────────────────────────────────────────
  await prisma.deal.create({ data: { dealName: 'Watsons - One Piece Merchandise', companyId: companies[0].id, divisionId: divisions[4].id, salesRepId: maya.id, dealTypeId: dealTypes[1].id, stageId: stages[1].id, estimatedValue: 750000000n, probabilityPct: 35, expectedClosingDate: f(50), stageChangedAt: d(6) } });
  await prisma.deal.create({ data: { dealName: 'Danone - Naruto Collector Set', companyId: companies[1].id, divisionId: divisions[4].id, salesRepId: maya.id, dealTypeId: dealTypes[1].id, stageId: stages[5].id, estimatedValue: 1100000000n, probabilityPct: 100, actualClosingDate: d(25), actualRevenue: 1050000000n, stageChangedAt: d(25) } });
  await prisma.deal.create({ data: { dealName: 'Mayora - Anime Snack Packaging', companyId: companies[9].id, divisionId: divisions[4].id, salesRepId: maya.id, dealTypeId: dealTypes[1].id, stageId: stages[3].id, estimatedValue: 500000000n, probabilityPct: 55, expectedClosingDate: f(35), stageChangedAt: d(9) } });
  await prisma.deal.create({ data: { dealName: 'Indofood - Branded Packaging Collab', companyId: companies[8].id, divisionId: divisions[4].id, salesRepId: maya.id, dealTypeId: dealTypes[1].id, stageId: stages[0].id, estimatedValue: 380000000n, probabilityPct: 20, expectedClosingDate: f(80), stageChangedAt: d(1) } });

  // 13. Activities
  console.log('Creating activities...');
  await Promise.all([
    prisma.activity.create({ data: { companyId: companies[0].id, divisionId: divisions[0].id, salesRepId: sinta.id, activityDate: d(2), medium: 'Offline Meeting', objective: 'Presentasi proposal One Piece Run ke tim marketing Watsons', resultNotes: 'Klien tertarik, minta revisi budget', nextAction: 'Kirim revisi proposal', nextActionDate: f(3) } }),
    prisma.activity.create({ data: { companyId: companies[3].id, divisionId: divisions[0].id, salesRepId: sinta.id, activityDate: d(5), medium: 'Online Meeting', objective: 'Follow up Naruto Sponsorship', resultNotes: 'Legal review sedang berjalan', nextAction: 'Konfirmasi kontrak', nextActionDate: f(7) } }),
    prisma.activity.create({ data: { companyId: companies[4].id, divisionId: divisions[1].id, salesRepId: doni.id, activityDate: d(1), medium: 'Offline Meeting', objective: 'Pitching Anime Fest 2026 ke Wardah', resultNotes: 'Respon positif dari tim brand', nextAction: 'Submit proposal resmi', nextActionDate: f(5) } }),
    prisma.activity.create({ data: { companyId: companies[7].id, divisionId: divisions[1].id, salesRepId: doni.id, activityDate: d(40), medium: 'Online Meeting', objective: 'Negosiasi final J-Culture Festival', resultNotes: 'Deal closed', nextAction: '-' } }),
    prisma.activity.create({ data: { companyId: companies[6].id, divisionId: divisions[2].id, salesRepId: rini.id, activityDate: d(3), medium: 'WA', objective: 'Follow up Mall Pop-up Activation Astra', resultNotes: 'Menunggu approval internal Astra', nextAction: 'Follow up minggu depan', nextActionDate: f(7) } }),
    prisma.activity.create({ data: { companyId: companies[8].id, divisionId: divisions[2].id, salesRepId: rini.id, activityDate: d(18), medium: 'Offline Meeting', objective: 'Closing Ramadan Bazaar Indofood', resultNotes: 'Deal selesai dan tanda tangan kontrak', nextAction: '-' } }),
    prisma.activity.create({ data: { companyId: companies[10].id, divisionId: divisions[3].id, salesRepId: hendra.id, activityDate: d(2), medium: 'Call', objective: 'Intro Eiger untuk Brand Collab', resultNotes: 'Mereka tertarik untuk meeting lanjutan', nextAction: 'Set meeting', nextActionDate: f(10) } }),
    prisma.activity.create({ data: { companyId: companies[11].id, divisionId: divisions[3].id, salesRepId: hendra.id, activityDate: d(9), medium: 'Online Meeting', objective: 'Presentasi konsep Erha x Anime', resultNotes: 'Klien minta deck revisi', nextAction: 'Kirim deck revisi', nextActionDate: f(4) } }),
    prisma.activity.create({ data: { companyId: companies[0].id, divisionId: divisions[4].id, salesRepId: maya.id, activityDate: d(7), medium: 'Offline Meeting', objective: 'Diskusi konsep One Piece merchandise Watsons', resultNotes: 'Klien ingin lihat mock-up produk', nextAction: 'Kirim mock-up', nextActionDate: f(6) } }),
    prisma.activity.create({ data: { companyId: companies[9].id, divisionId: divisions[4].id, salesRepId: maya.id, activityDate: d(11), medium: 'Email', objective: 'Proposal Anime Snack Packaging Mayora', resultNotes: 'Menunggu balasan', nextAction: 'Follow up email', nextActionDate: f(3) } }),
  ]);

  // 14. Targets
  console.log('Creating targets...');
  const year = new Date().getFullYear();
  await Promise.all([
    prisma.target.create({ data: { divisionId: divisions[0].id, periodYear: year, targetRevenue: 20000000000n } }),
    prisma.target.create({ data: { divisionId: divisions[1].id, periodYear: year, targetRevenue: 25000000000n } }),
    prisma.target.create({ data: { divisionId: divisions[2].id, periodYear: year, targetRevenue: 10000000000n } }),
    prisma.target.create({ data: { divisionId: divisions[3].id, periodYear: year, targetRevenue: 15000000000n } }),
    prisma.target.create({ data: { divisionId: divisions[4].id, periodYear: year, targetRevenue: 8000000000n } }),
  ]);

  console.log('\u2705 Seeding completed!');
  console.log('\n\uD83D\uDCE7 Login credentials:');
  console.log('Admin:     admin@provaliant.com / password123');
  console.log('Corporate: reynaldo@provaliant.com / password123');
  console.log('Manager:   andi@provaliant.com / password123');
  console.log('User:      sinta@provaliant.com / password123\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
