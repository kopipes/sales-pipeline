import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'login';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: AuditAction;
    resource: string;
    resourceId: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          changes: params.changes ? JSON.stringify(params.changes) : null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch {
      // Audit failures must never crash the main flow — log to console only
      console.error('[AuditService] Failed to write audit log:', params);
    }
  }
}
