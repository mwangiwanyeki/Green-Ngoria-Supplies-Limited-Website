import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../../config/config.module';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

export interface UploadedFile {
  key: string;
  bucket: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  publicUrl?: string;
}

export type StorageCategory =
  | 'engineering-documents'
  | 'quotation-documents'
  | 'contracts'
  | 'invoices'
  | 'certificates'
  | 'project-images'
  | 'site-images'
  | 'hse-evidence'
  | 'commissioning-evidence'
  | 'assessment-attachments'
  | 'profile-images'
  | 'company-documents'
  | 'media-library';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.docx',
  '.xlsx',
  '.xls',
  '.doc',
  '.csv',
  '.zip',
]);

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: string;
  private readonly bucket: string;
  private readonly localPath: string;
  private readonly signedUrlExpiry: number;
  private readonly maxFileSizeBytes: number;
  private readonly signingSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
    this.provider = config.get<string>('storage.provider') ?? 'local';
    this.bucket =
      config.get<string>('storage.bucket') ?? 'greenngoria-documents';
    this.localPath = config.get<string>('storage.localPath') ?? './storage';
    this.signedUrlExpiry =
      config.get<number>('storage.signedUrlExpires') ?? 3600;
    this.maxFileSizeBytes =
      config.get<number>('upload.maxFileSize') ?? 52428800;
    this.signingSecret =
      config.get<string>('auth.sessionSecret') ??
      crypto.randomBytes(32).toString('hex');

    if (!config.get<string>('auth.sessionSecret')) {
      this.logger.warn(
        'SESSION_SECRET is not configured; local signed URLs will expire after restart',
      );
    }

    if (this.provider === 'local') {
      this.ensureLocalDirectory();
    }
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  validateFile(file: Express.Multer.File): void {
    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${Math.round(this.maxFileSizeBytes / 1024 / 1024)}MB`,
      );
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not permitted`,
      );
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(`File extension "${ext}" is not permitted`);
    }
  }

  // ─── Key & checksum helpers ────────────────────────────────────────────────

  buildKey(
    organizationId: string,
    category: StorageCategory,
    filename: string,
  ): string {
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ts = Date.now();
    const rand = crypto.randomBytes(8).toString('hex');
    return `${organizationId}/${category}/${ts}-${rand}-${sanitized}`;
  }

  computeChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // ─── Upload ────────────────────────────────────────────────────────────────

  async upload(
    file: Express.Multer.File,
    organizationId: string,
    category: StorageCategory,
  ): Promise<UploadedFile> {
    this.validateFile(file);

    const key = this.buildKey(organizationId, category, file.originalname);
    const checksum = this.computeChecksum(file.buffer);

    if (this.provider === 'supabase' && this.supabase.isConfigured) {
      return this.uploadToSupabase(file, key, checksum);
    }

    if (this.provider === 's3') {
      this.logger.warn(
        'S3 provider not yet implemented — falling back to local',
      );
    }

    return this.uploadLocal(file, key, checksum);
  }

  // ─── Supabase Storage ─────────────────────────────────────────────────────

  private async uploadToSupabase(
    file: Express.Multer.File,
    key: string,
    checksum: string,
  ): Promise<UploadedFile> {
    const { data, error } = await this.supabase.client.storage
      .from(this.bucket)
      .upload(key, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        metadata: {
          originalName: file.originalname,
          checksum,
          size: String(file.size),
        },
      });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }

    this.logger.log(`File uploaded to Supabase: ${key}`);

    return {
      key: data.path,
      bucket: this.bucket,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum,
    };
  }

  // ─── Signed URL ────────────────────────────────────────────────────────────

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    const expires = expiresInSeconds ?? this.signedUrlExpiry;

    if (this.provider === 'supabase' && this.supabase.isConfigured) {
      const { data, error } = await this.supabase.client.storage
        .from(this.bucket)
        .createSignedUrl(key, expires);

      if (error || !data?.signedUrl) {
        this.logger.error(`Supabase signed URL failed: ${error?.message}`);
        throw new BadRequestException('Could not generate download URL');
      }

      return data.signedUrl;
    }

    // Local fallback — HMAC-signed download token
    const expiry = Date.now() + expires * 1000;
    const token = crypto
      .createHmac('sha256', this.signingSecret)
      .update(`${key}:${expiry}`)
      .digest('hex');
    return `/api/v1/files/download?key=${encodeURIComponent(key)}&expires=${expiry}&token=${token}`;
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async delete(key: string): Promise<void> {
    if (this.provider === 'supabase' && this.supabase.isConfigured) {
      const { error } = await this.supabase.client.storage
        .from(this.bucket)
        .remove([key]);

      if (error) {
        this.logger.warn(`Supabase delete warning: ${error.message}`);
      } else {
        this.logger.log(`File deleted from Supabase: ${key}`);
      }
      return;
    }

    // Local delete
    const fullPath = this.resolveLocalPath(key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      this.logger.log(`File deleted locally: ${key}`);
    }
  }

  // ─── Local storage ─────────────────────────────────────────────────────────

  private uploadLocal(
    file: Express.Multer.File,
    key: string,
    checksum: string,
  ): UploadedFile {
    const fullPath = this.resolveLocalPath(key);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.buffer);
    this.logger.log(`File stored locally: ${key}`);

    return {
      key,
      bucket: this.bucket,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum,
    };
  }

  private ensureLocalDirectory(): void {
    if (!fs.existsSync(this.localPath)) {
      fs.mkdirSync(this.localPath, { recursive: true });
    }
  }

  readLocal(key: string): Buffer | null {
    const fullPath = this.resolveLocalPath(key);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath) : null;
  }

  validateSignedToken(key: string, expires: number, token: string): boolean {
    if (!Number.isSafeInteger(expires) || Date.now() >= expires) return false;

    const expected = crypto
      .createHmac('sha256', this.signingSecret)
      .update(`${key}:${expires}`)
      .digest();

    let supplied: Buffer;
    try {
      supplied = Buffer.from(token, 'hex');
    } catch {
      return false;
    }

    return (
      supplied.length === expected.length &&
      crypto.timingSafeEqual(supplied, expected)
    );
  }

  private resolveLocalPath(key: string): string {
    if (!key || path.isAbsolute(key) || key.includes('\0')) {
      throw new BadRequestException('Invalid storage key');
    }

    const storageRoot = path.resolve(this.localPath);
    const resolved = path.resolve(storageRoot, key);
    if (!resolved.startsWith(`${storageRoot}${path.sep}`)) {
      throw new BadRequestException('Invalid storage key');
    }

    return resolved;
  }
}
