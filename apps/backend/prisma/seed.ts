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
    data: {
      email: 'admin@provaliant.com',
      passwordHash: hashedPassword,
      fullName: 'Admin Provaliant',
      phone: '081234567890',
      divisionId: divisions[0].id,
      jobTitle: 'System Administrator',
      roleId: adminRole.id,
      status: 'active',
    },
  });

  const corporate = await prisma.user.create({
    data: {
      email: 'reynaldo@provaliant.com',
      passwordHash: hashedPassword,
      fullName: 'Reynaldo',
      phone: '081234567891',
      divisionId: divisions[0].id,
      jobTitle: 'Sales Director',
      roleId: corporateRole.id,
      status: 'active',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'andi@provaliant.com',
      passwordHash: hashedPassword,
      fullName: 'Andi',
      phone: '081234567892',
      divisionId: divisions[0].id,
      jobTitle: 'Manager IP Licensing',
      roleId: managerRole.id,
      status: 'active',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sinta@provaliant.com',
      passwordHash: hashedPassword,
      fullName: 'Sinta',
      phone: '081234567893',
      divisionId: divisions[0].id,
      jobTitle: 'Business Development',
      roleId: userRole.id,
      managerId: manager.id,
      status: 'active',
    },
  });

  // 10. Create Sample Companies
  console.log('Creating sample companies...');
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Watsons',
        industryId: industries.find((i) => i.name === 'Retail')!.id,
        channelType: 'Direct',
        createdBy: admin.id,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Danone',
        industryId: industries.find((i) => i.name === 'FMCG')!.id,
        channelType: 'Direct',
        createdBy: admin.id,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Fonterra',
        industryId: industries.find((i) => i.name === 'FMCG')!.id,
        channelType: 'Direct',
        createdBy: admin.id,
      },
    }),
  ]);

  // 11. Create Sample Contacts
  console.log('Creating sample contacts...');
  await prisma.contact.create({
    data: {
      companyId: companies[0].id,
      fullName: 'Alpha',
      jobTitle: 'Brand Marketing',
      isPrimary: true,
    },
  });

  await prisma.contact.create({
    data: {
      companyId: companies[1].id,
      fullName: 'Norma',
      jobTitle: 'Brand Manager',
      isPrimary: true,
    },
  });

  // 12. Create Sample Deal
  console.log('Creating sample deals...');
  await prisma.deal.create({
    data: {
      dealName: 'Watsons - One Piece Run',
      companyId: companies[0].id,
      divisionId: divisions[0].id,
      salesRepId: salesUser.id,
      dealTypeId: dealTypes[0].id,
      stageId: stages[3].id, // Proposal
      estimatedValue: 2000000000,
      probabilityPct: 60,
      ipAssetName: 'One Piece Run',
      expectedClosingDate: new Date('2026-07-17'),
      remarks: 'Run tgl July 17, 2026. Brief untuk Run dan merchandise.',
    },
  });

  console.log('✅ Seeding completed!');
  console.log('\n📧 Login credentials:');
  console.log('Admin: admin@provaliant.com / password123');
  console.log('Corporate: reynaldo@provaliant.com / password123');
  console.log('Manager: andi@provaliant.com / password123');
  console.log('User: sinta@provaliant.com / password123\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
