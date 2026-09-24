import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateUniqueShortCode } from '@/lib/shortcode';
import { PLAN_LIMITS } from '@/lib/plan-limits';

export interface CreateQrCodeInput {
  organizationId: string;
  userId: string;
  name: unknown;
  type: unknown;
  destinationUrl: unknown;
  styleConfig?: unknown;
  scheduledStart?: unknown;
  expiresAt?: unknown;
  routingRules?: unknown;
  geoRules?: unknown;
  campaignId?: unknown;
}

export type QrCodeWithCampaign = Prisma.QrCodeGetPayload<{
  include: { campaign: { select: { id: true; name: true } } };
}>;

export type CreateQrCodeResult =
  | { qrCode: QrCodeWithCampaign; status: 201 }
  | { error: string; status: number };

export interface UpdateQrCodeInput {
  name?: unknown;
  isActive?: unknown;
  destinationUrl?: unknown;
  styleConfig?: unknown;
  scheduledStart?: unknown;
  expiresAt?: unknown;
  routingRules?: unknown;
  geoRules?: unknown;
  campaignId?: unknown;
}

/**
 * Validates payload and creates a new QR code scoped to an organization,
 * enforcing subscription plan limits.
 */
export async function createQrCode(input: CreateQrCodeInput) {
  const {
    organizationId,
    userId,
    name,
    type,
    destinationUrl,
    styleConfig,
    scheduledStart,
    expiresAt,
    routingRules,
    geoRules,
    campaignId,
  } = input;

  // Retrieve organization to evaluate plan limits
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { subscriptionStatus: true },
  });

  if (!org) {
    return { error: 'Organization not found.', status: 404 } as const;
  }

  const limits = PLAN_LIMITS[org.subscriptionStatus] ?? PLAN_LIMITS.FREE;

  if (limits.maxQrCodes !== null) {
    const existingQrCount = await prisma.qrCode.count({
      where: { organizationId },
    });

    if (existingQrCount >= limits.maxQrCodes) {
      return {
        error: 'Free plan limited to 5 QR codes — upgrade to Pro for unlimited',
        status: 403,
      } as const;
    }
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return { error: 'A valid name is required.', status: 400 } as const;
  }

  if (type !== 'STATIC' && type !== 'DYNAMIC') {
    return { error: 'Type must be either STATIC or DYNAMIC.', status: 400 } as const;
  }

  if (!destinationUrl || typeof destinationUrl !== 'string' || !destinationUrl.trim()) {
    return { error: 'A destination URL is required.', status: 400 } as const;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(destinationUrl.trim());
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return {
      error: 'Invalid destination URL. Must be a valid http or https URL.',
      status: 400,
    } as const;
  }

  // Validate optional campaignId — must belong to the same active org
  let validatedCampaignId: string | null = null;
  if (campaignId && typeof campaignId === 'string') {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, organizationId: true },
    });
    if (!campaign || campaign.organizationId !== organizationId) {
      return {
        error: 'Campaign not found or does not belong to this workspace.',
        status: 403,
      } as const;
    }
    validatedCampaignId = campaign.id;
  }

  let shortCode: string | null = null;
  if (type === 'DYNAMIC') {
    shortCode = await generateUniqueShortCode();
  }

  const validatedStyleConfig =
    styleConfig && typeof styleConfig === 'object' && !Array.isArray(styleConfig)
      ? (styleConfig as Prisma.InputJsonValue)
      : undefined;

  let parsedScheduledStart: Date | undefined = undefined;
  let parsedExpiresAt: Date | undefined = undefined;
  let validatedRoutingRules: Prisma.InputJsonValue | undefined = undefined;
  let validatedGeoRules: Prisma.InputJsonValue | undefined = undefined;

  if (type === 'DYNAMIC') {
    if (scheduledStart) {
      const d = new Date(scheduledStart as string | number | Date);
      if (!isNaN(d.getTime())) parsedScheduledStart = d;
    }
    if (expiresAt) {
      const d = new Date(expiresAt as string | number | Date);
      if (!isNaN(d.getTime())) parsedExpiresAt = d;
    }
    if (routingRules && typeof routingRules === 'object' && !Array.isArray(routingRules)) {
      validatedRoutingRules = routingRules as Prisma.InputJsonValue;
    }
    if (geoRules && typeof geoRules === 'object' && !Array.isArray(geoRules)) {
      validatedGeoRules = geoRules as Prisma.InputJsonValue;
    }
  }

  const qrCode = await prisma.qrCode.create({
    data: {
      name: name.trim(),
      type,
      destinationUrl: parsedUrl.toString(),
      shortCode,
      organizationId,
      createdByUserId: userId,
      isActive: true,
      ...(validatedCampaignId ? { campaignId: validatedCampaignId } : {}),
      ...(validatedStyleConfig ? { styleConfig: validatedStyleConfig } : {}),
      ...(validatedRoutingRules ? { routingRules: validatedRoutingRules } : {}),
      ...(validatedGeoRules ? { geoRules: validatedGeoRules } : {}),
      ...(parsedScheduledStart ? { scheduledStart: parsedScheduledStart } : {}),
      ...(parsedExpiresAt ? { expiresAt: parsedExpiresAt } : {}),
    },
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });

  return { qrCode, status: 201 } as const;
}

/**
 * Lists all QR codes for an organization.
 */
export async function listQrCodes(organizationId: string) {
  return prisma.qrCode.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });
}

/**
 * Retrieves a single QR code by ID scoped to an organization.
 */
export async function getQrCodeById(id: string, organizationId: string) {
  return prisma.qrCode.findFirst({
    where: { id, organizationId },
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });
}

/**
 * Updates an existing QR code scoped to an organization.
 */
export async function updateQrCode(
  id: string,
  organizationId: string,
  input: UpdateQrCodeInput
) {
  const existingQr = await prisma.qrCode.findFirst({
    where: { id, organizationId },
  });

  if (!existingQr) {
    return { error: 'QR Code not found', status: 404 } as const;
  }

  const {
    name,
    isActive,
    destinationUrl,
    styleConfig,
    scheduledStart,
    expiresAt,
    routingRules,
    geoRules,
    campaignId,
  } = input;

  const dataToUpdate: Prisma.QrCodeUpdateInput = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return { error: 'Name cannot be empty.', status: 400 } as const;
    }
    dataToUpdate.name = name.trim();
  }

  if (isActive !== undefined) {
    if (typeof isActive !== 'boolean') {
      return { error: 'isActive must be a boolean.', status: 400 } as const;
    }
    dataToUpdate.isActive = isActive;
  }

  if (destinationUrl !== undefined) {
    if (existingQr.type === 'STATIC') {
      return {
        error: 'Static QR code destination URLs cannot be edited once created.',
        status: 400,
      } as const;
    }

    if (typeof destinationUrl !== 'string' || !destinationUrl.trim()) {
      return { error: 'Destination URL cannot be empty.', status: 400 } as const;
    }

    try {
      const parsedUrl = new URL(destinationUrl.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
      dataToUpdate.destinationUrl = parsedUrl.toString();
    } catch {
      return {
        error: 'Invalid destination URL. Must be a valid http or https URL.',
        status: 400,
      } as const;
    }
  }

  if (styleConfig !== undefined) {
    if (styleConfig === null) {
      dataToUpdate.styleConfig = Prisma.JsonNull;
    } else if (typeof styleConfig === 'object' && !Array.isArray(styleConfig)) {
      dataToUpdate.styleConfig = styleConfig as Prisma.InputJsonValue;
    } else {
      return { error: 'styleConfig must be an object or null.', status: 400 } as const;
    }
  }

  if (scheduledStart !== undefined || expiresAt !== undefined) {
    if (existingQr.type === 'STATIC') {
      return {
        error: 'Static QR codes do not support scheduling fields.',
        status: 400,
      } as const;
    }
    if (scheduledStart !== undefined) {
      if (scheduledStart === null) {
        dataToUpdate.scheduledStart = null;
      } else {
        const d = new Date(scheduledStart as string | number | Date);
        if (isNaN(d.getTime())) {
          return { error: 'Invalid scheduledStart date.', status: 400 } as const;
        }
        dataToUpdate.scheduledStart = d;
      }
    }
    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        dataToUpdate.expiresAt = null;
      } else {
        const d = new Date(expiresAt as string | number | Date);
        if (isNaN(d.getTime())) {
          return { error: 'Invalid expiresAt date.', status: 400 } as const;
        }
        dataToUpdate.expiresAt = d;
      }
    }
  }

  if (routingRules !== undefined) {
    if (existingQr.type === 'STATIC') {
      return {
        error: 'Static QR codes do not support routing rules.',
        status: 400,
      } as const;
    }
    if (routingRules === null) {
      dataToUpdate.routingRules = Prisma.JsonNull;
    } else if (typeof routingRules === 'object' && !Array.isArray(routingRules)) {
      dataToUpdate.routingRules = routingRules as Prisma.InputJsonValue;
    } else {
      return { error: 'routingRules must be an object or null.', status: 400 } as const;
    }
  }

  if (geoRules !== undefined) {
    if (existingQr.type === 'STATIC') {
      return {
        error: 'Static QR codes do not support geo rules.',
        status: 400,
      } as const;
    }
    if (geoRules === null) {
      dataToUpdate.geoRules = Prisma.JsonNull;
    } else if (typeof geoRules === 'object' && !Array.isArray(geoRules)) {
      dataToUpdate.geoRules = geoRules as Prisma.InputJsonValue;
    } else {
      return { error: 'geoRules must be an object or null.', status: 400 } as const;
    }
  }

  if (campaignId !== undefined) {
    if (campaignId === null) {
      dataToUpdate.campaign = { disconnect: true };
    } else if (typeof campaignId === 'string') {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true, organizationId: true },
      });
      if (!campaign || campaign.organizationId !== organizationId) {
        return {
          error: 'Campaign not found or does not belong to this workspace.',
          status: 403,
        } as const;
      }
      dataToUpdate.campaign = { connect: { id: campaign.id } };
    } else {
      return { error: 'campaignId must be a string or null.', status: 400 } as const;
    }
  }

  const updated = await prisma.qrCode.update({
    where: { id },
    data: dataToUpdate,
    include: {
      campaign: { select: { id: true, name: true } },
    },
  });

  return { qrCode: updated } as const;
}

/**
 * Deletes a QR code scoped to an organization.
 */
export async function deleteQrCode(id: string, organizationId: string) {
  const existingQr = await prisma.qrCode.findFirst({
    where: { id, organizationId },
  });

  if (!existingQr) {
    return { error: 'QR Code not found', status: 404 } as const;
  }

  await prisma.qrCode.delete({
    where: { id },
  });

  return { success: true } as const;
}
