import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's role with permissions
    const userRole = await this.prisma.role.findUnique({
      where: { id: user.roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!userRole) {
      throw new ForbiddenException('User role not found');
    }

    // Check if user has all required permissions
    const userPermissions = userRole.rolePermissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`,
    );

    const hasAllPermissions = requiredPermissions.every((req) => {
      const permString = `${req.resource}:${req.action}`;
      return userPermissions.includes(permString);
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Attach scope level to request and user for data filtering
    request.scopeLevel = userRole.scopeLevel;
    if (request.user) {
      request.user.scopeLevel = userRole.scopeLevel;
    }

    return true;
  }
}
