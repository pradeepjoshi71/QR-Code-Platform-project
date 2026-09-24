import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface LogActionParams {
  organizationId: string;
  actorUserId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue | Record<string, unknown> | null;
}

/**
 * Records a sensitive organizational activity into the AuditLog table.
 * Executed in a fire-and-forget, non-blocking manner.
 * Wrapped in try/catch and promise catch handler so that logging failures
 * never interrupt or break the primary business operation.
 */
export function logAction({
  organizationId,
  actorUserId,
  action,
  targetType,
  targetId,
  metadata,
}: LogActionParams): void {
  try {
    prisma.auditLog
      .create({
        data: {
          organizationId,
          actorUserId,
          action,
          targetType: targetType ?? null,
          targetId: targetId ?? null,
          ...(metadata !== undefined && metadata !== null
            ? { metadata: metadata as Prisma.InputJsonValue }
            : {}),
        },
      })
      .catch((err: unknown) => {
        console.error('Failed to record audit log:', err);
      });
  } catch (err: unknown) {
    console.error('Synchronous error during audit log dispatch:', err);
  }
}
