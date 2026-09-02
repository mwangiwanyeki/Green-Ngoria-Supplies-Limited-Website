import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyProfileSettingsDto {
  @ApiPropertyOptional({ example: 'Green Ngoria Supplies Limited' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ example: 'CPR/2011/56890' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'P051234567Z' })
  @IsOptional()
  @IsString()
  kraPin?: string;

  @ApiPropertyOptional({ example: 'ML-2024-0089' })
  @IsOptional()
  @IsString()
  miningLicenseNumber?: string;

  @ApiPropertyOptional({ example: 'info@greenngoria.com' })
  @IsOptional()
  @IsString()
  officialEmail?: string;

  @ApiPropertyOptional({ example: '+254 700 000 000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+254 711 999 888' })
  @IsOptional()
  @IsString()
  emergencyDispatchPhone?: string;

  @ApiPropertyOptional({ example: 'Nairobi HQ & Bondo Gold Processing Yard' })
  @IsOptional()
  @IsString()
  headquartersAddress?: string;

  @ApiPropertyOptional({ example: 'Siaya County & Nairobi' })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional({ example: 'Kenya' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'https://greenngoria.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'ISO 9001:2015, ISO 14001:2015 certified' })
  @IsOptional()
  @IsString()
  complianceSummary?: string;
}

export class MiningOperationsSettingsDto {
  @ApiPropertyOptional({ example: 92.5 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  defaultRecoveryTargetPct?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(72)
  standardLeachingDurationHours?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  carbonTransferFrequencyHours?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  assayPrecisionDecimals?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  moistureDeductionBaselinePct?: number;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  dayShiftStartTime?: string;

  @ApiPropertyOptional({ example: '15:00' })
  @IsOptional()
  @IsString()
  afternoonShiftStartTime?: string;

  @ApiPropertyOptional({ example: '23:00' })
  @IsOptional()
  @IsString()
  nightShiftStartTime?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  hseInspectionIntervalDays?: number;
}

export class FinanceSettingsDto {
  @ApiPropertyOptional({ example: 'KES' })
  @IsOptional()
  @IsString()
  primaryCurrency?: string;

  @ApiPropertyOptional({ example: 'KSh' })
  @IsOptional()
  @IsString()
  currencySymbol?: string;

  @ApiPropertyOptional({ example: 16.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRatePct?: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  withholdingTaxPct?: number;

  @ApiPropertyOptional({ example: 'Standard Net 30 days upon milestone sign-off.' })
  @IsOptional()
  @IsString()
  defaultPaymentTerms?: string;

  @ApiPropertyOptional({ example: 'Equity Bank Kenya / Standard Chartered' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'Westlands Branch' })
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional({ example: '0123456789012' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'EQBLKENA' })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional({ example: '522522' })
  @IsOptional()
  @IsString()
  mpesaPaybill?: string;

  @ApiPropertyOptional({ example: 'Certified compliant with KRA eTIMS invoice regulation.' })
  @IsOptional()
  @IsString()
  etimsDisclaimer?: string;
}

export class NotificationChannelMatrixDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailRfqSubmissions?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailQuotationApprovals?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailHseIncidents?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailPlantAssessments?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailLowInventoryAlerts?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  smsEmergencySafetyAlarms?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  inAppWorkOrderUpdates?: boolean;

  @ApiPropertyOptional({ example: 'alerts@greenngoria.com' })
  @IsOptional()
  @IsString()
  dispatchEmailRecipient?: string;
}

export class SecurityPolicySettingsDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  autoLogoutEnabled?: boolean;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  idleTimeoutMinutes?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(300)
  warningCountdownSeconds?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  enforceMfaForExecutives?: boolean;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(32)
  minPasswordLength?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  passwordExpiryDays?: number;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  ipAllowlist?: string;
}

export class SystemMaintenanceSettingsDto {
  @ApiPropertyOptional({ example: '180_DAYS' })
  @IsOptional()
  @IsString()
  auditLogRetentionDays?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  automaticNightlyBackups?: boolean;

  @ApiPropertyOptional({ example: 'Africa/Nairobi' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'DD/MM/YYYY' })
  @IsOptional()
  @IsString()
  dateFormat?: string;
}

export class UpdateSystemSettingsDto {
  @ApiPropertyOptional({ type: CompanyProfileSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyProfileSettingsDto)
  companyProfile?: CompanyProfileSettingsDto;

  @ApiPropertyOptional({ type: MiningOperationsSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MiningOperationsSettingsDto)
  miningOperations?: MiningOperationsSettingsDto;

  @ApiPropertyOptional({ type: FinanceSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinanceSettingsDto)
  finance?: FinanceSettingsDto;

  @ApiPropertyOptional({ type: NotificationChannelMatrixDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelMatrixDto)
  notifications?: NotificationChannelMatrixDto;

  @ApiPropertyOptional({ type: SecurityPolicySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SecurityPolicySettingsDto)
  security?: SecurityPolicySettingsDto;

  @ApiPropertyOptional({ type: SystemMaintenanceSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SystemMaintenanceSettingsDto)
  maintenance?: SystemMaintenanceSettingsDto;
}

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @IsOptional()
  @IsNumber()
  expiresInDays?: number;
}

export class CreateWebhookDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];

  @IsOptional()
  @IsString()
  secret?: string;
}

export class TestWebhookDto {
  @IsString()
  url: string;

  @IsString()
  event: string;
}

export class SendTestAlertDto {
  @IsString()
  channel: 'EMAIL' | 'IN_APP' | 'SMS';

  @IsString()
  recipient: string;

  @IsOptional()
  @IsString()
  message?: string;
}
