/**
 * Data Scope resolver (PRD Bagian 5.2 - 5.3).
 *
 * Returns a Prisma `where` fragment that limits the rows a user can see based
 * on the scopeLevel attached to their role:
 *   - all      -> no restriction (Admin, Corporate)
 *   - division -> restricted to the user's home division (Manager)
 *   - own      -> restricted to rows the user owns (User/Sales)
 *
 * `ownerField` is the column that identifies the owning sales rep / PIC on the
 * given entity (e.g. `salesRepId` on deals/activities, `picId` on jobs).
 */
export interface ScopedUser {
  id: string;
  divisionId?: string;
  scopeLevel?: string;
}

export function buildScopeWhere(
  user: ScopedUser,
  ownerField = 'salesRepId',
): Record<string, any> {
  const scopeLevel = user?.scopeLevel ?? 'own';

  if (scopeLevel === 'all') {
    return {};
  }

  if (scopeLevel === 'division') {
    return user.divisionId ? { divisionId: user.divisionId } : {};
  }

  // own: rows the user owns OR rows in their own division (read-only team view)
  if (user.divisionId) {
    return {
      OR: [{ [ownerField]: user.id }, { divisionId: user.divisionId }],
    };
  }

  return { [ownerField]: user.id };
}
