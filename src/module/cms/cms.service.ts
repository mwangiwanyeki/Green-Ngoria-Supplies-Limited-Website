import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateCmsContentDto } from './dto/create-cms-content.dto';
import { UpdateCmsContentDto } from './dto/update-cms-content.dto';
import {
  CMS_ENTITY_NAME,
  CMS_LABEL,
  type CmsContentType,
} from './cms.types';

/** Normalised row shape so the admin UI can render one table for all four types. */
export interface CmsContentView {
  id: string;
  type: CmsContentType;
  title: string;
  slug: string;
  status: ContentStatus;
  excerpt: string | null;
  imageKey: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  authorId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Type-specific columns that have no place in the shared shape. */
  extra: Record<string, unknown>;
}

interface CmsRecordShape {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  excerpt?: string | null;
  description?: string | null;
  imageKey?: string | null;
  featuredImageKey?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  authorId?: string | null;
  [key: string]: unknown;
}

const SHARED_KEYS = new Set([
  'id',
  'title',
  'slug',
  'status',
  'excerpt',
  'imageKey',
  'featuredImageKey',
  'seoTitle',
  'seoDesc',
  'authorId',
  'publishedAt',
  'createdAt',
  'updatedAt',
  'deletedAt',
]);

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Serialisation ─────────────────────────────────────────────────────────

  private toView(type: CmsContentType, record: CmsRecordShape): CmsContentView {
    const extra: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (!SHARED_KEYS.has(key) && key !== 'content') extra[key] = value;
    }

    return {
      id: record.id,
      type,
      title: record.title,
      slug: record.slug,
      status: record.status,
      excerpt: record.excerpt ?? record.description ?? null,
      imageKey: record.imageKey ?? record.featuredImageKey ?? null,
      seoTitle: record.seoTitle ?? null,
      seoDesc: record.seoDesc ?? null,
      authorId: record.authorId ?? null,
      publishedAt: record.publishedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      extra,
    };
  }

  // ─── Shared helpers ────────────────────────────────────────────────────────

  private buildWhere(
    pagination: PaginationDto,
    status?: ContentStatus,
  ): { status?: ContentStatus; OR?: { [k: string]: unknown }[] } {
    const where: { status?: ContentStatus; OR?: { [k: string]: unknown }[] } =
      {};
    if (status) where.status = status;
    if (pagination.search) {
      where.OR = [
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { slug: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    if (value === undefined || value === null) return {};
    return value as Prisma.InputJsonValue;
  }

  private async assertSlugAvailable(
    type: CmsContentType,
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    let existing: { id: string } | null = null;

    switch (type) {
      case 'pages':
        existing = await this.prisma.cmsPage.findUnique({
          where: { slug },
          select: { id: true },
        });
        break;
      case 'services':
        existing = await this.prisma.cmsService.findUnique({
          where: { slug },
          select: { id: true },
        });
        break;
      case 'case-studies':
        existing = await this.prisma.cmsCaseStudy.findUnique({
          where: { slug },
          select: { id: true },
        });
        break;
      case 'articles':
        existing = await this.prisma.cmsArticle.findUnique({
          where: { slug },
          select: { id: true },
        });
        break;
    }

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `${CMS_LABEL[type]} slug "${slug}" is already in use`,
      );
    }
  }

  private requireFields(
    dto: CreateCmsContentDto,
    fields: (keyof CreateCmsContentDto)[],
    type: CmsContentType,
  ): void {
    const missing = fields.filter((f) => {
      const value = dto[f];
      return value === undefined || value === null || value === '';
    });
    if (missing.length > 0) {
      throw new BadRequestException(
        `${CMS_LABEL[type]} requires: ${missing.join(', ')}`,
      );
    }
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  async findAll(
    organizationId: string,
    type: CmsContentType,
    userId: string,
    pagination: PaginationDto,
    filters?: { status?: ContentStatus },
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination, 'updatedAt');
    const where = this.buildWhere(pagination, filters?.status);

    let items: CmsRecordShape[] = [];
    let total = 0;

    switch (type) {
      case 'pages': {
        const pageWhere: Prisma.CmsPageWhereInput = {
          ...(where as Prisma.CmsPageWhereInput),
          deletedAt: null,
        };
        [items, total] = await Promise.all([
          this.prisma.cmsPage.findMany({
            where: pageWhere,
            skip,
            take,
            orderBy,
          }) as unknown as Promise<CmsRecordShape[]>,
          this.prisma.cmsPage.count({ where: pageWhere }),
        ]);
        break;
      }
      case 'services': {
        const serviceWhere = where as Prisma.CmsServiceWhereInput;
        [items, total] = await Promise.all([
          this.prisma.cmsService.findMany({
            where: serviceWhere,
            skip,
            take,
            orderBy,
          }) as unknown as Promise<CmsRecordShape[]>,
          this.prisma.cmsService.count({ where: serviceWhere }),
        ]);
        break;
      }
      case 'case-studies': {
        const caseWhere = where as Prisma.CmsCaseStudyWhereInput;
        [items, total] = await Promise.all([
          this.prisma.cmsCaseStudy.findMany({
            where: caseWhere,
            skip,
            take,
            orderBy,
          }) as unknown as Promise<CmsRecordShape[]>,
          this.prisma.cmsCaseStudy.count({ where: caseWhere }),
        ]);
        break;
      }
      case 'articles': {
        const articleWhere = where as Prisma.CmsArticleWhereInput;
        [items, total] = await Promise.all([
          this.prisma.cmsArticle.findMany({
            where: articleWhere,
            skip,
            take,
            orderBy,
          }) as unknown as Promise<CmsRecordShape[]>,
          this.prisma.cmsArticle.count({ where: articleWhere }),
        ]);
        break;
      }
    }

    return {
      items: items.map((item) => this.toView(type, item)),
      meta: buildPaginatedMeta(total, pagination),
    };
  }

  /** Returns the raw row (including the `content` JSON) for the editor. */
  async findRaw(
    organizationId: string,
    type: CmsContentType,
    id: string,
    userId: string,
  ): Promise<CmsRecordShape> {
    await this.orgsService.assertMembership(organizationId, userId);

    let record: CmsRecordShape | null = null;

    switch (type) {
      case 'pages':
        record = (await this.prisma.cmsPage.findFirst({
          where: { id, deletedAt: null },
        })) as CmsRecordShape | null;
        break;
      case 'services':
        record = (await this.prisma.cmsService.findUnique({
          where: { id },
        })) as CmsRecordShape | null;
        break;
      case 'case-studies':
        record = (await this.prisma.cmsCaseStudy.findUnique({
          where: { id },
        })) as CmsRecordShape | null;
        break;
      case 'articles':
        record = (await this.prisma.cmsArticle.findUnique({
          where: { id },
        })) as CmsRecordShape | null;
        break;
    }

    if (!record) throw new NotFoundException(`${CMS_LABEL[type]} not found`);
    return record;
  }

  async findById(
    organizationId: string,
    type: CmsContentType,
    id: string,
    userId: string,
  ) {
    const record = await this.findRaw(organizationId, type, id, userId);
    return { ...this.toView(type, record), content: record.content ?? null };
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  async create(
    organizationId: string,
    type: CmsContentType,
    dto: CreateCmsContentDto,
    authorId: string,
  ): Promise<CmsContentView> {
    await this.orgsService.assertMembership(organizationId, authorId);
    await this.assertSlugAvailable(type, dto.slug);

    const status = dto.status ?? ContentStatus.DRAFT;
    const publishedAt =
      status === ContentStatus.PUBLISHED ? new Date() : undefined;

    let record: CmsRecordShape;

    switch (type) {
      case 'pages':
        record = (await this.prisma.cmsPage.create({
          data: {
            title: dto.title,
            slug: dto.slug,
            content: this.toJson(dto.content),
            excerpt: dto.excerpt,
            status,
            seoTitle: dto.seoTitle,
            seoDesc: dto.seoDesc,
            featuredImageKey: dto.featuredImageKey,
            publishedAt,
            authorId,
          },
        })) as CmsRecordShape;
        break;

      case 'services':
        this.requireFields(dto, ['description'], type);
        record = (await this.prisma.cmsService.create({
          data: {
            title: dto.title,
            slug: dto.slug,
            description: dto.description as string,
            content: this.toJson(dto.content),
            icon: dto.icon,
            imageKey: dto.imageKey,
            status,
            sortOrder: dto.sortOrder ?? 0,
            seoTitle: dto.seoTitle,
            seoDesc: dto.seoDesc,
            publishedAt,
          },
        })) as CmsRecordShape;
        break;

      case 'case-studies':
        this.requireFields(dto, ['challenge', 'solution'], type);
        record = (await this.prisma.cmsCaseStudy.create({
          data: {
            title: dto.title,
            slug: dto.slug,
            client: dto.client,
            location: dto.location,
            mineralType: dto.mineralType,
            challenge: dto.challenge as string,
            solution: dto.solution as string,
            outcome: dto.outcome,
            content: this.toJson(dto.content),
            imageKey: dto.imageKey,
            status,
            seoTitle: dto.seoTitle,
            seoDesc: dto.seoDesc,
            publishedAt,
          },
        })) as CmsRecordShape;
        break;

      case 'articles':
        record = (await this.prisma.cmsArticle.create({
          data: {
            title: dto.title,
            slug: dto.slug,
            excerpt: dto.excerpt,
            content: this.toJson(dto.content),
            category: dto.category,
            tags: dto.tags ?? [],
            imageKey: dto.imageKey,
            status,
            seoTitle: dto.seoTitle,
            seoDesc: dto.seoDesc,
            publishedAt,
            authorId,
          },
        })) as CmsRecordShape;
        break;
    }

    await this.auditService.log({
      userId: authorId,
      organizationId,
      action: AuditAction.CMS_CONTENT_CREATED,
      entity: CMS_ENTITY_NAME[type],
      entityId: record.id,
      newValues: { title: record.title, slug: record.slug, status },
    });

    return this.toView(type, record);
  }

  async update(
    organizationId: string,
    type: CmsContentType,
    id: string,
    dto: UpdateCmsContentDto,
    userId: string,
  ): Promise<CmsContentView> {
    const existing = await this.findRaw(organizationId, type, id, userId);

    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugAvailable(type, dto.slug, id);
    }

    const statusChanged = dto.status && dto.status !== existing.status;
    const publishedAt = statusChanged
      ? dto.status === ContentStatus.PUBLISHED
        ? new Date()
        : null
      : undefined;

    const common = {
      title: dto.title,
      slug: dto.slug,
      status: dto.status,
      seoTitle: dto.seoTitle,
      seoDesc: dto.seoDesc,
      ...(publishedAt !== undefined ? { publishedAt } : {}),
      ...(dto.content !== undefined ? { content: this.toJson(dto.content) } : {}),
    };

    let record: CmsRecordShape;

    switch (type) {
      case 'pages':
        record = (await this.prisma.cmsPage.update({
          where: { id },
          data: {
            ...common,
            excerpt: dto.excerpt,
            featuredImageKey: dto.featuredImageKey,
          },
        })) as CmsRecordShape;
        break;

      case 'services':
        record = (await this.prisma.cmsService.update({
          where: { id },
          data: {
            ...common,
            description: dto.description,
            icon: dto.icon,
            imageKey: dto.imageKey,
            sortOrder: dto.sortOrder,
          },
        })) as CmsRecordShape;
        break;

      case 'case-studies':
        record = (await this.prisma.cmsCaseStudy.update({
          where: { id },
          data: {
            ...common,
            client: dto.client,
            location: dto.location,
            mineralType: dto.mineralType,
            challenge: dto.challenge,
            solution: dto.solution,
            outcome: dto.outcome,
            imageKey: dto.imageKey,
          },
        })) as CmsRecordShape;
        break;

      case 'articles':
        record = (await this.prisma.cmsArticle.update({
          where: { id },
          data: {
            ...common,
            excerpt: dto.excerpt,
            category: dto.category,
            tags: dto.tags,
            imageKey: dto.imageKey,
          },
        })) as CmsRecordShape;
        break;
    }

    await this.auditService.log({
      userId,
      organizationId,
      action: statusChanged
        ? AuditAction.CMS_CONTENT_STATUS_CHANGED
        : AuditAction.CMS_CONTENT_UPDATED,
      entity: CMS_ENTITY_NAME[type],
      entityId: id,
      oldValues: {
        title: existing.title,
        slug: existing.slug,
        status: existing.status,
      },
      newValues: {
        title: record.title,
        slug: record.slug,
        status: record.status,
      },
    });

    return this.toView(type, record);
  }

  /** Publish / unpublish (or move to REVIEW / ARCHIVED). */
  async setStatus(
    organizationId: string,
    type: CmsContentType,
    id: string,
    status: ContentStatus,
    userId: string,
  ): Promise<CmsContentView> {
    const existing = await this.findRaw(organizationId, type, id, userId);

    if (existing.status === status) {
      throw new BadRequestException(
        `${CMS_LABEL[type]} is already ${status}`,
      );
    }

    const publishedAt = status === ContentStatus.PUBLISHED ? new Date() : null;
    const data = { status, publishedAt };

    let record: CmsRecordShape;

    switch (type) {
      case 'pages':
        record = (await this.prisma.cmsPage.update({
          where: { id },
          data,
        })) as CmsRecordShape;
        break;
      case 'services':
        record = (await this.prisma.cmsService.update({
          where: { id },
          data,
        })) as CmsRecordShape;
        break;
      case 'case-studies':
        record = (await this.prisma.cmsCaseStudy.update({
          where: { id },
          data,
        })) as CmsRecordShape;
        break;
      case 'articles':
        record = (await this.prisma.cmsArticle.update({
          where: { id },
          data,
        })) as CmsRecordShape;
        break;
    }

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.CMS_CONTENT_STATUS_CHANGED,
      entity: CMS_ENTITY_NAME[type],
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
    });

    return this.toView(type, record);
  }

  async remove(
    organizationId: string,
    type: CmsContentType,
    id: string,
    userId: string,
  ) {
    const existing = await this.findRaw(organizationId, type, id, userId);

    switch (type) {
      // CmsPage is the only CMS model carrying a soft-delete column.
      case 'pages':
        await this.prisma.cmsPage.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        break;
      case 'services':
        await this.prisma.cmsService.delete({ where: { id } });
        break;
      case 'case-studies':
        await this.prisma.cmsCaseStudy.delete({ where: { id } });
        break;
      case 'articles':
        await this.prisma.cmsArticle.delete({ where: { id } });
        break;
    }

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.CMS_CONTENT_DELETED,
      entity: CMS_ENTITY_NAME[type],
      entityId: id,
      oldValues: { title: existing.title, slug: existing.slug },
    });

    return { message: `${CMS_LABEL[type]} "${existing.title}" deleted` };
  }
}
