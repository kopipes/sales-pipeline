import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildScopeWhere, ScopedUser } from '../../common/utils/scope.util';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Global search across Companies, Contacts, Deals, Jobs (PRD 6.6)
   * Results respect the user's data scope.
   */
  async globalSearch(user: ScopedUser, query: string, limit = 5) {
    if (!query || query.trim().length < 2) return { companies: [], contacts: [], deals: [], jobs: [] };

    const q = query.trim();
    const dealScope = buildScopeWhere(user, 'salesRepId');
    const jobScope = buildScopeWhere(user, 'picId');

    const [companies, contacts, deals, jobs] = await Promise.all([
      this.prisma.company.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, industry: { select: { name: true } } },
        take: limit,
      }),

      this.prisma.contact.findMany({
        where: { fullName: { contains: q } },
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          company: { select: { id: true, name: true } },
        },
        take: limit,
      }),

      this.prisma.deal.findMany({
        where: { ...dealScope, dealName: { contains: q } },
        select: {
          id: true,
          dealName: true,
          stage: { select: { name: true } },
          company: { select: { name: true } },
          estimatedValue: true,
        },
        take: limit,
      }),

      this.prisma.job.findMany({
        where: { ...jobScope, jobTitle: { contains: q } },
        select: {
          id: true,
          jobTitle: true,
          company: { select: { name: true } },
          periodMonth: true,
          periodYear: true,
          jobStatus: true,
        },
        take: limit,
      }),
    ]);

    return { companies, contacts, deals, jobs };
  }
}
