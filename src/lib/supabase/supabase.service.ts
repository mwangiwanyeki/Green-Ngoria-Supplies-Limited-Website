import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.module';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * SupabaseService — wraps the Supabase admin client (service-role key).
 * Used by StorageService for file operations against Supabase Storage.
 * Never expose the service-role key or this client to the browser.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private _client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('supabase.url');
    const serviceKey = this.config.get<string>('supabase.serviceRoleKey');

    if (!url || !serviceKey) {
      this.logger.warn(
        'Supabase URL or SERVICE_ROLE_KEY not configured — storage will fall back to local',
      );
      return;
    }

    this._client = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log(`Supabase client initialised (project: ${url})`);
  }

  get client(): SupabaseClient {
    if (!this._client) {
      throw new Error(
        'Supabase client is not initialised. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    return this._client;
  }

  get isConfigured(): boolean {
    return this._client !== null;
  }
}
