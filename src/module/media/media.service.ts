import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { StorageService } from '../../lib/storage/storage.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { UploadMediaDto } from './dto/upload-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

const UPLOADER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Upload ────────────────────────────────────────────────────────────────

  async upload(
    organizationId: string,
    dto: UploadMediaDto,
    file: Express.Multer.File,
    uploadedById: string,
  ) {
    await this.orgsService.assertMembership(organizationId, uploadedById);

    // Validates size, MIME type and extension, then persists to the configured
    // provider (Supabase Storage or the local fallback).
    const uploaded = await this.storage.upload(
      file,
      organizationId,
      'media-library',
    );

    const asset = await this.prisma.mediaAsset.create({
      data: {
        organizationId,
        filename: dto.filename ?? uploaded.originalName,
        storageKey: uploaded.key,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.size,
        width: dto.width,
        height: dto.height,
        altText: dto.altText,
        uploadedById,
      },
      include: { uploadedBy: { select: UPLOADER_SELECT } },
    });

    await this.auditService.log({
      userId: uploadedById,
      organizationId,
      action: AuditAction.MEDIA_ASSET_UPLOADED,
      entity: 'MediaAsset',
      entityId: asset.id,
      newValues: {
        filename: asset.filename,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
      },
    });

    return this.withUrl(asset);
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    filters?: { mimeType?: string },
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);

    const where: Prisma.MediaAssetWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filters?.mimeType) {
      // Accepts an exact type ("image/png") or a family prefix ("image").
      where.mimeType = filters.mimeType.includes('/')
        ? filters.mimeType
        : { startsWith: `${filters.mimeType}/` };
    }

    if (pagination.search) {
      where.OR = [
        { filename: { contains: pagination.search, mode: 'insensitive' } },
        { altText: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { uploadedBy: { select: UPLOADER_SELECT } },
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    const withUrls = await Promise.all(
      items.map((item) => this.withUrl(item)),
    );

    return { items: withUrls, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { uploadedBy: { select: UPLOADER_SELECT } },
    });

    if (!asset) throw new NotFoundException('Media asset not found');
    return this.withUrl(asset);
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async update(
    organizationId: string,
    id: string,
    dto: UpdateMediaDto,
    userId: string,
  ) {
    const existing = await this.findById(organizationId, id, userId);

    const updated = await this.prisma.mediaAsset.update({
      where: { id },
      data: { filename: dto.filename, altText: dto.altText },
      include: { uploadedBy: { select: UPLOADER_SELECT } },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.MEDIA_ASSET_UPDATED,
      entity: 'MediaAsset',
      entityId: id,
      oldValues: { filename: existing.filename, altText: existing.altText },
      newValues: { filename: updated.filename, altText: updated.altText },
    });

    return this.withUrl(updated);
  }

  /**
   * Removes the object from storage and soft-deletes the row, matching the
   * codebase-wide `deletedAt` convention so the audit trail keeps its referent.
   */
  async remove(organizationId: string, id: string, userId: string) {
    const asset = await this.findById(organizationId, id, userId);

    await this.storage.delete(asset.storageKey);

    await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.MEDIA_ASSET_DELETED,
      entity: 'MediaAsset',
      entityId: id,
      oldValues: {
        filename: asset.filename,
        storageKey: asset.storageKey,
      },
    });

    return { message: `"${asset.filename}" deleted` };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Attaches a time-limited download URL, matching how `files` serves objects. */
  private async withUrl<T extends { storageKey: string }>(asset: T) {
    let url: string | null = null;
    try {
      url = await this.storage.getSignedUrl(asset.storageKey);
    } catch (error) {
      this.logger.warn(
        `Could not sign URL for media asset key ${asset.storageKey}`,
        error,
      );
    }
    return { ...asset, url };
  }
}
