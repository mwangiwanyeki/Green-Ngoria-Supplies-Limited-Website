import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

// Config
import { ConfigModule, ConfigService } from './config/config.module';

// Infrastructure (global)
import { PrismaModule } from './lib/database/prisma.module';
import { MailModule } from './lib/mail/mail.module';
import { StorageModule } from './lib/storage/storage.module';
import { SupabaseModule } from './lib/supabase/supabase.module';
import { QueueModule } from './lib/queue/queue.module';
import { AuditModule } from './lib/audit/audit.module';
import { CacheModule } from './lib/cache/cache.module';
import { NotificationsModule } from './lib/notifications/notifications.module';
import { HealthModule } from './lib/health/health.module';

// Feature modules — Phase 1 Foundation
import { AuthModule } from './module/auth/auth.module';
import { UsersModule } from './module/users/users.module';
import { OrganizationsModule } from './module/organizations/organizations.module';
import { FilesModule } from './module/files/files.module';
import { NotificationsApiModule } from './module/notifications/notifications.module';
import { PublicModule } from './module/public/public.module';

// Feature modules — Phase 2 Business foundation
import { ClientsModule } from './module/clients/clients.module';
import { LeadsModule } from './module/leads/leads.module';
import { MiningSitesModule } from './module/mining-sites/mining-sites.module';

// Feature modules — Phase 3 Technical differentiator
import { PlantAssessmentsModule } from './module/plant-assessments/plant-assessments.module';

// Feature modules — Phase 4 Commercial engine
import { EquipmentModule } from './module/equipment/equipment.module';
import { RfqsModule } from './module/rfqs/rfqs.module';
import { QuotationsModule } from './module/quotations/quotations.module';

// Feature modules — Phase 5 Project delivery
import { ProjectsModule } from './module/projects/projects.module';
import { EngineeringModule } from './module/engineering/engineering.module';
import { ProcurementModule } from './module/procurement/procurement.module';
import { SiteOperationsModule } from './module/site-operations/site-operations.module';
import { HseModule } from './module/hse/hse.module';
import { CommissioningModule } from './module/commissioning/commissioning.module';
import { AssetsModule } from './module/assets/assets.module';
import { SupportModule } from './module/support/support.module';
import { ContractsModule } from './module/contracts/contracts.module';
import { FinanceModule } from './module/finance/finance.module';
import { AnalyticsModule } from './module/analytics/analytics.module';

// Feature modules — Phase 9 Operations ERP
import { InventoryModule } from './module/inventory/inventory.module';
import { SalesModule } from './module/sales/sales.module';
import { ErpCustomersModule } from './module/erp-customers/erp-customers.module';
import { DebtModule } from './module/debt/debt.module';
import { ExpensesModule } from './module/expenses/expenses.module';
import { AccountsModule } from './module/accounts/accounts.module';
import { BranchesModule } from './module/branches/branches.module';
import { VatLeachModule } from './module/vat-leach/vat-leach.module';
import { StockPilesModule } from './module/stock-piles/stock-piles.module';
import { SiteSecurityModule } from './module/site-security/site-security.module';
import { HrModule } from './module/hr/hr.module';
import { VisitorsModule } from './module/visitors/visitors.module';
import { ErpReportsModule } from './module/erp-reports/erp-reports.module';

// Feature modules — Platform administration
import { RolesModule } from './module/roles/roles.module';
import { CmsModule } from './module/cms/cms.module';
import { MediaModule } from './module/media/media.module';
import { AuditLogsModule } from './module/audit/audit-logs.module';

// Cross-cutting
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './module/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TenantGuard } from './common/guards/tenant.guard';

interface SerializedHttpRequest {
  id?: string;
  method?: string;
  url?: string;
  remoteAddress?: string;
}

@Module({
  imports: [
    // ── Configuration ─────────────────────────────────────────────────────────
    ConfigModule,

    // ── Structured logging ────────────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.mfaSecret',
          ],
          remove: true,
        },
        serializers: {
          req(req: SerializedHttpRequest) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              remoteAddress: req.remoteAddress,
            };
          },
        },
        autoLogging: {
          ignore: (req) =>
            req.url === '/health/live' || req.url === '/health/ready',
        },
      },
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
      },
    ]),

    // ── Infrastructure (all @Global) ──────────────────────────────────────────
    PrismaModule,
    MailModule,
    SupabaseModule,
    StorageModule,
    QueueModule.forRoot(),
    AuditModule,
    CacheModule,
    NotificationsModule,
    HealthModule,

    // ── Feature modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    OrganizationsModule,
    NotificationsApiModule,
    FilesModule,
    PublicModule,

    // Phase 2 — Business foundation
    ClientsModule,
    LeadsModule,
    MiningSitesModule,

    // Phase 3 — Technical differentiator
    PlantAssessmentsModule,

    // Phase 4 — Commercial engine
    EquipmentModule,
    RfqsModule,
    QuotationsModule,

    // Phase 5 — Project delivery
    ProjectsModule,
    EngineeringModule,
    ProcurementModule,

    // Phase 6 — Construction & commissioning
    SiteOperationsModule,
    HseModule,
    CommissioningModule,

    // Phase 7 — Long-term customer lifecycle
    AssetsModule,
    SupportModule,

    // Phase 8 — Enterprise management
    ContractsModule,
    FinanceModule,
    AnalyticsModule,

    // Phase 9 — Operations ERP
    InventoryModule,
    SalesModule,
    ErpCustomersModule,
    DebtModule,
    ExpensesModule,
    AccountsModule,
    BranchesModule,
    VatLeachModule,
    StockPilesModule,
    SiteSecurityModule,
    HrModule,
    VisitorsModule,
    ErpReportsModule,

    // Platform administration
    RolesModule,
    CmsModule,
    MediaModule,
    AuditLogsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,

    // Authentication and authorization are secure-by-default. Routes must
    // explicitly opt out with @Public(). Guard order is significant.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },

    // ── Global exception filter ───────────────────────────────────────────────
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // ── Global request ID interceptor ─────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },

    // ── Global response transform interceptor ─────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // ── Global rate limiting guard ────────────────────────────────────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
