import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.module';
import { PrismaService } from '../../lib/database/prisma.service';
import { MailService } from '../../lib/mail/mail.service';
import {
  generateLeadReference,
  generateAssessmentNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { ContactDto } from './dto/contact.dto';
import { RfqDto } from './dto/rfq.dto';
import { PublicPlantAssessmentDto } from './dto/plant-assessment.dto';

interface PublicOrgContext {
  organizationId: string;
  systemUserId: string;
}

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // ─── Contact enquiries ──────────────────────────────────────────────────────

  async submitContact(dto: ContactDto): Promise<{ reference: string }> {
    // Honeypot filled → pretend success without persisting or emailing.
    if (dto.company_website && dto.company_website.trim().length > 0) {
      this.logger.warn('Contact submission rejected by honeypot');
      return { reference: 'GN-CONTACT' };
    }

    const { organizationId, systemUserId } = await this.resolveOrgContext();

    const lead = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const reference = await generateLeadReference(tx);
        return tx.lead.create({
          data: {
            organizationId,
            reference,
            companyName: dto.company,
            contactName: dto.name,
            contactEmail: dto.email,
            contactPhone: dto.phone,
            source: 'WEBSITE',
            status: 'NEW',
            priority: 'MEDIUM',
            projectDescription: `[Website contact enquiry] ${dto.subject}\n\n${dto.message}`,
            createdById: systemUserId,
            ownerId: systemUserId,
          },
        });
      }),
    );

    this.logger.log(
      `Contact enquiry persisted as lead ${lead.reference} (${lead.id})`,
    );

    const submittedAt = new Date().toISOString();

    // Notify internal inboxes (info@ + customercare@) on EVERY submission.
    await this.safeSend('contact-notification', () =>
      this.mail.sendContactNotification(this.internalRecipients(), {
        reference: lead.reference,
        name: dto.name,
        company: dto.company,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
        submittedAt,
      }),
    );

    // Acknowledge the submitter.
    await this.safeSend('contact-acknowledgement', () =>
      this.mail.sendEnquiryAcknowledgement(dto.email, {
        name: dto.name,
        reference: lead.reference,
        kind: 'contact',
      }),
    );

    return { reference: lead.reference };
  }

  // ─── RFQ enquiries ──────────────────────────────────────────────────────────

  async submitRfq(dto: RfqDto): Promise<{ reference: string }> {
    if (dto.company_website && dto.company_website.trim().length > 0) {
      this.logger.warn('RFQ submission rejected by honeypot');
      return { reference: 'GN-RFQ' };
    }

    const { organizationId, systemUserId } = await this.resolveOrgContext();

    const itemsSummary = dto.items
      .map(
        (item, i) =>
          `${i + 1}. ${item.description} — ${item.quantity} ${item.unit}${
            item.notes ? ` (${item.notes})` : ''
          }`,
      )
      .join('\n');

    const projectDescription = [
      '[Website RFQ]',
      dto.description ? `Requirements: ${dto.description}` : null,
      dto.deliveryLocation ? `Delivery: ${dto.deliveryLocation}` : null,
      '',
      'Items requested:',
      itemsSummary,
    ]
      .filter((line) => line !== null)
      .join('\n');

    const lead = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const reference = await generateLeadReference(tx);
        return tx.lead.create({
          data: {
            organizationId,
            reference,
            companyName: dto.companyName,
            contactName: dto.contactName,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhone,
            country: dto.country,
            source: 'WEBSITE',
            status: 'NEW',
            priority: 'HIGH',
            projectDescription,
            createdById: systemUserId,
            ownerId: systemUserId,
          },
        });
      }),
    );

    this.logger.log(`RFQ persisted as lead ${lead.reference} (${lead.id})`);

    const submittedAt = new Date().toISOString();

    await this.safeSend('rfq-notification', () =>
      this.mail.sendRfqNotification(this.internalRecipients(), {
        reference: lead.reference,
        companyName: dto.companyName,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        country: dto.country,
        deliveryLocation: dto.deliveryLocation,
        description: dto.description,
        items: dto.items,
        submittedAt,
      }),
    );

    await this.safeSend('rfq-acknowledgement', () =>
      this.mail.sendEnquiryAcknowledgement(dto.contactEmail, {
        name: dto.contactName,
        reference: lead.reference,
        kind: 'rfq',
      }),
    );

    return { reference: lead.reference };
  }

  // ─── Plant Assessment intake ────────────────────────────────────────────────

  async submitPlantAssessment(
    dto: PublicPlantAssessmentDto,
  ): Promise<{ reference: string; id: string; submittedAt: string }> {
    if (dto.company_website && dto.company_website.trim().length > 0) {
      this.logger.warn('Plant assessment submission rejected by honeypot');
      return {
        reference: 'GN-ASSESSMENT',
        id: '',
        submittedAt: new Date().toISOString(),
      };
    }

    const { organizationId, systemUserId } = await this.resolveOrgContext();

    const summaryLines = [
      `[Technical Plant Assessment Request]`,
      `Client: ${dto.clientName}${dto.contactPerson ? ` (${dto.contactPerson})` : ''}`,
      `Email: ${dto.contactEmail}${dto.contactPhone ? ` | Phone: ${dto.contactPhone}` : ''}`,
      `Project: ${dto.projectName || 'Mining Facility'} | Location: ${dto.miningLocation || 'East Africa'}`,
      `Mineral Type: ${dto.mineralType || 'GOLD'} | Target Throughput: ${dto.estimatedTph ? `${dto.estimatedTph} tph` : 'TBD'}`,
      dto.oreGrade ? `Head Grade: ${dto.oreGrade} g/t Au` : null,
      dto.oreMineralogy ? `Mineralogy: ${dto.oreMineralogy}` : null,
      dto.oreHardness ? `Hardness: ${dto.oreHardness}` : null,
      dto.hasExistingPlant
        ? `Existing Plant: Yes (${dto.existingCapacity || 'N/A'} tph) — ${dto.existingPlantDesc || ''}`
        : `Existing Plant: Greenfields facility`,
      dto.currentRecovery ? `Current Recovery: ${dto.currentRecovery}%` : null,
      dto.targetRecovery ? `Target Recovery: ${dto.targetRecovery}%` : null,
      dto.operationalProblems
        ? `Operational Challenges: ${dto.operationalProblems}`
        : null,
      dto.clientObjectives
        ? `Client Objectives: ${dto.clientObjectives}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    let createdAssessment: {
      id: string;
      reference: string;
      submittedAt: Date | null;
    } = {
      id: '',
      reference: '',
      submittedAt: new Date(),
    };

    await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const leadRef = await generateLeadReference(tx);
        const lead = await tx.lead.create({
          data: {
            organizationId,
            reference: leadRef,
            companyName: dto.clientName,
            contactName: dto.contactPerson || dto.clientName,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhone,
            source: 'WEBSITE',
            status: 'NEW',
            priority: 'HIGH',
            projectDescription: summaryLines,
            createdById: systemUserId,
            ownerId: systemUserId,
          },
        });

        const assessmentRef = await generateAssessmentNumber(tx);
        createdAssessment = await tx.plantAssessment.create({
          data: {
            organizationId,
            reference: assessmentRef,
            leadId: lead.id,
            clientName: dto.clientName,
            projectName: dto.projectName,
            miningLocation: dto.miningLocation,
            mineralType: dto.mineralType || 'GOLD',
            estimatedTph: dto.estimatedTph,
            oreGrade: dto.oreGrade,
            oreMineralogy: dto.oreMineralogy,
            oreHardness: dto.oreHardness,
            oreDescription: dto.oreDescription,
            hasExistingPlant: dto.hasExistingPlant ?? false,
            existingPlantDesc: dto.existingPlantDesc,
            existingCapacity: dto.existingCapacity,
            crushingData: dto.crushingData
              ? (dto.crushingData as object)
              : undefined,
            grindingData: dto.grindingData
              ? (dto.grindingData as object)
              : undefined,
            leachingData: dto.leachingData
              ? (dto.leachingData as object)
              : undefined,
            waterData: dto.waterData ? (dto.waterData as object) : undefined,
            powerData: dto.powerData ? (dto.powerData as object) : undefined,
            currentRecovery: dto.currentRecovery,
            targetRecovery: dto.targetRecovery,
            operationalProblems: dto.operationalProblems,
            hseConstraints: dto.hseConstraints,
            environmentalConstraints: dto.environmentalConstraints,
            clientObjectives: dto.clientObjectives,
            additionalNotes: dto.additionalNotes,
            status: 'SUBMITTED',
            submittedAt: new Date(),
          },
        });
      }),
    );

    this.logger.log(
      `Plant assessment persisted as ${createdAssessment.reference} (${createdAssessment.id})`,
    );

    const submittedAt =
      createdAssessment.submittedAt?.toISOString() || new Date().toISOString();

    await this.safeSend('assessment-notification', () =>
      this.mail.sendContactNotification(this.internalRecipients(), {
        reference: createdAssessment.reference,
        name: dto.contactPerson || dto.clientName,
        company: dto.clientName,
        email: dto.contactEmail,
        phone: dto.contactPhone || '—',
        subject: `Technical Plant Assessment Intake [${createdAssessment.reference}] - ${dto.projectName || dto.clientName}`,
        message: summaryLines,
        submittedAt,
      }),
    );

    await this.safeSend('assessment-acknowledgement', () =>
      this.mail.sendEnquiryAcknowledgement(dto.contactEmail, {
        name: dto.contactPerson || dto.clientName,
        reference: createdAssessment.reference,
        kind: 'assessment' as any,
      }),
    );

    return {
      reference: createdAssessment.reference,
      id: createdAssessment.id,
      submittedAt,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * The internal inboxes that must receive a copy of every public submission.
   * info@greenngoria.com (SUPPORT_EMAIL) is the hard requirement; the
   * customer-care inbox is copied too. De-duplicated in case they collide.
   */
  private internalRecipients(): string[] {
    const support =
      this.config.get<string>('company.supportEmail') ?? 'info@greenngoria.com';
    const customerCare =
      this.config.get<string>('company.customerCareEmail') ??
      'customercare@greenngoria.com';
    return Array.from(new Set([support, customerCare].filter(Boolean)));
  }

  /**
   * Resolve the internal marketing organisation (by known slug) and a system
   * user to attribute the lead's `createdById` to. Cached after first lookup.
   */
  private orgContext: PublicOrgContext | null = null;

  private async resolveOrgContext(): Promise<PublicOrgContext> {
    if (this.orgContext) return this.orgContext;

    const slug = this.config.get<string>('company.orgSlug') ?? 'green-ngoria';

    const org = await this.prisma.organization.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });

    if (!org) {
      throw new Error(
        `Public enquiry organisation not found for slug "${slug}"`,
      );
    }

    // Attribute the lead to the organisation owner (or any member) so the
    // required `createdById`/`ownerId` relations are satisfied.
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId: org.id, removedAt: null },
      orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }],
      select: { userId: true },
    });

    if (!member) {
      throw new Error(
        `Public enquiry organisation "${slug}" has no members to attribute leads to`,
      );
    }

    this.orgContext = {
      organizationId: org.id,
      systemUserId: member.userId,
    };
    return this.orgContext;
  }

  /**
   * Attempt mail delivery without letting an SMTP failure fail the HTTP
   * request. Delivery is attempted on every submission; failures are logged.
   */
  private async safeSend(
    label: string,
    send: () => Promise<void>,
  ): Promise<void> {
    try {
      await send();
    } catch (error) {
      this.logger.error(
        `Public enquiry email (${label}) failed to send`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
