import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.module';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

export type MailTemplate =
  | 'welcome'
  | 'email-verification'
  | 'password-reset'
  | 'password-changed'
  | 'rfq-received'
  | 'quotation-sent'
  | 'quotation-approved'
  | 'quotation-rejected'
  | 'assessment-received'
  | 'project-invitation'
  | 'document-approval-required'
  | 'invoice-issued'
  | 'payment-received'
  | 'support-ticket-created'
  | 'support-ticket-updated'
  | 'maintenance-reminder'
  | 'warranty-expiring'
  | 'hse-incident-created'
  | 'commissioning-approved'
  | 'login-alert';

interface MailConfiguration {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;

  constructor(private readonly config: ConfigService) {
    this.createTransporter();
  }

  private createTransporter(): void {
    const mailConfig = this.config.get<MailConfiguration>('mail') ?? {
      host: 'localhost',
      port: 1025,
      secure: false,
    };

    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: mailConfig.user
        ? {
            user: mailConfig.user,
            pass: mailConfig.password,
          }
        : undefined,
    });
  }

  async sendMail(options: MailOptions): Promise<void> {
    const from = this.config.get<string>('mail.from');

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      this.logger.log(
        `Email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}: ${options.subject}`,
      );
    } catch (error) {
      const recipients = Array.isArray(options.to)
        ? options.to.join(', ')
        : options.to;
      this.logger.error(
        `Failed to send email to ${recipients}: ${options.subject}`,
        error,
      );
      throw error;
    }
  }

  // ─── Pre-built template methods ───────────────────────────────────────────

  async sendWelcome(
    to: string,
    data: { name: string; loginUrl: string },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome to Green Ngoria Supplies Limited',
      html: this.buildWelcomeTemplate(data),
    });
  }

  async sendEmailVerification(
    to: string,
    data: { name: string; verificationUrl: string; expiresIn: string },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Verify Your Email Address — Green Ngoria',
      html: this.buildEmailVerificationTemplate(data),
    });
  }

  async sendPasswordReset(
    to: string,
    data: { name: string; resetUrl: string; expiresIn: string },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Password Reset Request — Green Ngoria',
      html: this.buildPasswordResetTemplate(data),
    });
  }

  async sendPasswordChanged(
    to: string,
    data: { name: string; timestamp: string; ipAddress: string },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Your Password Has Been Changed — Green Ngoria',
      html: this.buildPasswordChangedTemplate(data),
    });
  }

  async sendLoginAlert(
    to: string,
    data: {
      name: string;
      ipAddress: string;
      userAgent: string;
      timestamp: string;
    },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'New Login Detected — Green Ngoria',
      html: this.buildLoginAlertTemplate(data),
    });
  }

  async sendQuotation(
    to: string | string[],
    data: {
      clientName: string;
      quoteNumber: string;
      quoteUrl: string;
      validUntil: string;
    },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Quotation ${data.quoteNumber} — Green Ngoria Supplies Limited`,
      html: this.buildQuotationTemplate(data),
    });
  }

  async sendInvoice(
    to: string | string[],
    data: {
      clientName: string;
      invoiceNumber: string;
      amount: string;
      dueDate: string;
      invoiceUrl: string;
    },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Invoice ${data.invoiceNumber} — Green Ngoria Supplies Limited`,
      html: this.buildInvoiceTemplate(data),
    });
  }

  async sendSupportTicket(
    to: string,
    data: {
      name: string;
      ticketNumber: string;
      subject: string;
      portalUrl: string;
    },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Support Ticket #${data.ticketNumber} — Green Ngoria`,
      html: this.buildSupportTicketTemplate(data),
    });
  }

  // ─── Public website enquiries ──────────────────────────────────────────────

  /**
   * Internal notification sent to the company inboxes for every public
   * "Contact us" submission. `to` is expected to include info@greenngoria.com.
   */
  async sendContactNotification(
    to: string | string[],
    data: {
      reference: string;
      name: string;
      company: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
      submittedAt: string;
    },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `New Contact Enquiry ${data.reference} — ${data.subject}`,
      html: this.buildContactNotificationTemplate(data),
    });
  }

  /**
   * Internal notification sent to the company inboxes for every public RFQ
   * submission. `to` is expected to include info@greenngoria.com.
   */
  async sendRfqNotification(
    to: string | string[],
    data: {
      reference: string;
      companyName: string;
      contactName: string;
      contactEmail: string;
      contactPhone?: string;
      country?: string;
      deliveryLocation?: string;
      description?: string;
      items: Array<{
        description: string;
        quantity: number;
        unit: string;
        notes?: string;
      }>;
      submittedAt: string;
    },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `New RFQ ${data.reference} — ${data.companyName}`,
      html: this.buildRfqNotificationTemplate(data),
    });
  }

  /**
   * Branded acknowledgement sent back to the person who submitted a public
   * enquiry ("we've received your enquiry").
   */
  async sendEnquiryAcknowledgement(
    to: string,
    data: {
      name: string;
      reference: string;
      kind: 'contact' | 'rfq';
    },
  ): Promise<void> {
    await this.sendMail({
      to,
      subject:
        data.kind === 'rfq'
          ? `We've received your request for quotation (${data.reference})`
          : `We've received your enquiry (${data.reference})`,
      html: this.buildEnquiryAcknowledgementTemplate(data),
    });
  }

  // ─── Template builders ────────────────────────────────────────────────────
  // These produce a consistent, professionally branded HTML email.
  // In production these would be replaced by a templating engine (Handlebars / MJML).

  private wrapInLayout(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f4; font-family: Arial, Helvetica, sans-serif; }
    .container { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a5c2a; padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .header p { color: #a8d5b0; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px 24px; color: #333333; font-size: 15px; line-height: 1.6; }
    .footer { background: #f9f9f9; border-top: 1px solid #e9e9e9; padding: 16px 24px; text-align: center; color: #888888; font-size: 12px; }
    .btn { display: inline-block; padding: 12px 28px; background: #1a5c2a; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 16px 0; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
    .divider { border: none; border-top: 1px solid #e9e9e9; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Green Ngoria Supplies Limited</h1>
      <p>Mining &amp; Mineral Processing Solutions</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>Green Ngoria Supplies Limited | Kenya &amp; East Africa</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private buildWelcomeTemplate(data: {
    name: string;
    loginUrl: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.name},</p>
      <p>Welcome to the Green Ngoria Supplies Limited platform. Your account has been created successfully.</p>
      <p>You can now log in to access your dashboard, project information, and documents.</p>
      <p><a href="${data.loginUrl}" class="btn">Log In to Your Account</a></p>
      <p>If you have any questions, please contact your account manager.</p>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      'Welcome to Green Ngoria',
    );
  }

  private buildEmailVerificationTemplate(data: {
    name: string;
    verificationUrl: string;
    expiresIn: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.name},</p>
      <p>Please verify your email address to activate your Green Ngoria account.</p>
      <p><a href="${data.verificationUrl}" class="btn">Verify Email Address</a></p>
      <p>This link expires in <strong>${data.expiresIn}</strong>.</p>
      <div class="alert">If you did not create an account, please disregard this email.</div>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      'Verify Your Email',
    );
  }

  private buildPasswordResetTemplate(data: {
    name: string;
    resetUrl: string;
    expiresIn: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.name},</p>
      <p>A password reset was requested for your Green Ngoria account.</p>
      <p><a href="${data.resetUrl}" class="btn">Reset Your Password</a></p>
      <p>This link expires in <strong>${data.expiresIn}</strong>.</p>
      <div class="alert">If you did not request a password reset, please secure your account immediately and contact support.</div>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      'Password Reset Request',
    );
  }

  private buildPasswordChangedTemplate(data: {
    name: string;
    timestamp: string;
    ipAddress: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.name},</p>
      <p>Your password was successfully changed at <strong>${data.timestamp}</strong> from IP <strong>${data.ipAddress}</strong>.</p>
      <div class="alert">If you did not make this change, contact support immediately.</div>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      'Password Changed',
    );
  }

  private buildLoginAlertTemplate(data: {
    name: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.name},</p>
      <p>A new login to your account was detected.</p>
      <ul>
        <li><strong>Time:</strong> ${data.timestamp}</li>
        <li><strong>IP Address:</strong> ${data.ipAddress}</li>
        <li><strong>Device:</strong> ${data.userAgent}</li>
      </ul>
      <div class="alert">If this was not you, change your password immediately and contact support.</div>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      'New Login Detected',
    );
  }

  private buildQuotationTemplate(data: {
    clientName: string;
    quoteNumber: string;
    quoteUrl: string;
    validUntil: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.clientName},</p>
      <p>Please find your quotation <strong>${data.quoteNumber}</strong> from Green Ngoria Supplies Limited.</p>
      <p>This quotation is valid until <strong>${data.validUntil}</strong>.</p>
      <p><a href="${data.quoteUrl}" class="btn">View Quotation</a></p>
      <p>For any queries regarding this quotation, please contact our sales team.</p>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      `Quotation ${data.quoteNumber}`,
    );
  }

  private buildInvoiceTemplate(data: {
    clientName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    invoiceUrl: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.clientName},</p>
      <p>Invoice <strong>${data.invoiceNumber}</strong> for <strong>${data.amount}</strong> has been issued.</p>
      <p>Payment due date: <strong>${data.dueDate}</strong>.</p>
      <p><a href="${data.invoiceUrl}" class="btn">View Invoice</a></p>
      <p>For payment queries, please contact our finance team.</p>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      `Invoice ${data.invoiceNumber}`,
    );
  }

  private buildSupportTicketTemplate(data: {
    name: string;
    ticketNumber: string;
    subject: string;
    portalUrl: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>Dear ${data.name},</p>
      <p>Your support ticket <strong>#${data.ticketNumber}</strong> has been received.</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p>Our team will respond within 1–2 business days.</p>
      <p><a href="${data.portalUrl}" class="btn">View Ticket</a></p>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      `Support Ticket #${data.ticketNumber}`,
    );
  }

  /** Escape user-submitted values before interpolating into email HTML. */
  private escapeHtml(value: string | undefined | null): string {
    if (value === undefined || value === null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildContactNotificationTemplate(data: {
    reference: string;
    name: string;
    company: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    submittedAt: string;
  }): string {
    return this.wrapInLayout(
      `
      <p>A new enquiry was submitted through the public website.</p>
      <p><strong>Reference:</strong> ${this.escapeHtml(data.reference)}</p>
      <hr class="divider" />
      <ul>
        <li><strong>Name:</strong> ${this.escapeHtml(data.name)}</li>
        <li><strong>Company:</strong> ${this.escapeHtml(data.company)}</li>
        <li><strong>Email:</strong> ${this.escapeHtml(data.email)}</li>
        <li><strong>Telephone:</strong> ${this.escapeHtml(data.phone) || '—'}</li>
        <li><strong>Subject:</strong> ${this.escapeHtml(data.subject)}</li>
        <li><strong>Submitted:</strong> ${this.escapeHtml(data.submittedAt)}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${this.escapeHtml(data.message)}</p>
      <hr class="divider" />
      <p>This enquiry has been filed in the CRM as lead <strong>${this.escapeHtml(data.reference)}</strong>.</p>
    `,
      `New Contact Enquiry ${data.reference}`,
    );
  }

  private buildRfqNotificationTemplate(data: {
    reference: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    country?: string;
    deliveryLocation?: string;
    description?: string;
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      notes?: string;
    }>;
  }): string {
    const rows = data.items
      .map(
        (item, i) => `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e9e9e9;">${i + 1}</td>
          <td style="padding:6px 8px;border:1px solid #e9e9e9;">${this.escapeHtml(item.description)}</td>
          <td style="padding:6px 8px;border:1px solid #e9e9e9;text-align:right;">${this.escapeHtml(String(item.quantity))}</td>
          <td style="padding:6px 8px;border:1px solid #e9e9e9;">${this.escapeHtml(item.unit)}</td>
          <td style="padding:6px 8px;border:1px solid #e9e9e9;">${this.escapeHtml(item.notes) || '—'}</td>
        </tr>`,
      )
      .join('');

    return this.wrapInLayout(
      `
      <p>A new request for quotation was submitted through the public website.</p>
      <p><strong>Reference:</strong> ${this.escapeHtml(data.reference)}</p>
      <hr class="divider" />
      <ul>
        <li><strong>Company:</strong> ${this.escapeHtml(data.companyName)}</li>
        <li><strong>Contact:</strong> ${this.escapeHtml(data.contactName)}</li>
        <li><strong>Email:</strong> ${this.escapeHtml(data.contactEmail)}</li>
        <li><strong>Telephone:</strong> ${this.escapeHtml(data.contactPhone) || '—'}</li>
        <li><strong>Country:</strong> ${this.escapeHtml(data.country) || '—'}</li>
        <li><strong>Delivery location:</strong> ${this.escapeHtml(data.deliveryLocation) || '—'}</li>
      </ul>
      ${
        data.description
          ? `<p><strong>Project / technical requirements:</strong></p>
             <p style="white-space: pre-wrap;">${this.escapeHtml(data.description)}</p>`
          : ''
      }
      <p><strong>Items requested:</strong></p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:6px 8px;border:1px solid #e9e9e9;text-align:left;">#</th>
            <th style="padding:6px 8px;border:1px solid #e9e9e9;text-align:left;">Description</th>
            <th style="padding:6px 8px;border:1px solid #e9e9e9;text-align:right;">Qty</th>
            <th style="padding:6px 8px;border:1px solid #e9e9e9;text-align:left;">Unit</th>
            <th style="padding:6px 8px;border:1px solid #e9e9e9;text-align:left;">Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <hr class="divider" />
      <p>This RFQ has been filed in the CRM as lead <strong>${this.escapeHtml(data.reference)}</strong>.</p>
    `,
      `New RFQ ${data.reference}`,
    );
  }

  private buildEnquiryAcknowledgementTemplate(data: {
    name: string;
    reference: string;
    kind: 'contact' | 'rfq';
  }): string {
    const what = data.kind === 'rfq' ? 'request for quotation' : 'enquiry';
    return this.wrapInLayout(
      `
      <p>Dear ${this.escapeHtml(data.name)},</p>
      <p>Thank you for contacting Green Ngoria Supplies Limited. We have received your ${what} and our team will be in touch, normally within one to two business days.</p>
      <p>Your reference is <strong>${this.escapeHtml(data.reference)}</strong> — please quote it in any follow-up correspondence.</p>
      <p>Regards,<br/>Green Ngoria Supplies Limited</p>
    `,
      "We've received your enquiry",
    );
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
