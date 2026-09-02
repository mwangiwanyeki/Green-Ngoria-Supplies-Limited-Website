import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  UpdateSystemSettingsDto,
  CreateApiKeyDto,
  CreateWebhookDto,
  TestWebhookDto,
  SendTestAlertDto,
} from './dto/update-system-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { successResponse } from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('System Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/system-settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGING_DIRECTOR')
  @ApiOperation({ summary: 'Get unified enterprise system settings' })
  async getSettings(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const data = await this.settingsService.getSettings(orgId, actor.id);
    return successResponse(data);
  }

  @Patch()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update unified enterprise system settings' })
  async updateSettings(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: UpdateSystemSettingsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const data = await this.settingsService.updateSettings(
      orgId,
      dto,
      actor.id,
    );
    return successResponse(data, 'System settings updated successfully');
  }

  // ─── API Keys ─────────────────────────────────────────────────────────────

  @Get('api-keys')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List developer API keys' })
  async listApiKeys(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const keys = await this.settingsService.listApiKeys(orgId, actor.id);
    return successResponse(keys);
  }

  @Post('api-keys')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new developer API key' })
  async createApiKey(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const key = await this.settingsService.createApiKey(orgId, dto, actor.id);
    return successResponse(key, 'API key created');
  }

  @Delete('api-keys/:keyId')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeApiKey(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('keyId') keyId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.settingsService.revokeApiKey(
      orgId,
      keyId,
      actor.id,
    );
    return successResponse(result, result.message);
  }

  // ─── Webhooks ─────────────────────────────────────────────────────────────

  @Get('webhooks')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'List registered webhook endpoints' })
  async listWebhooks(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const hooks = await this.settingsService.listWebhooks(orgId, actor.id);
    return successResponse(hooks);
  }

  @Post('webhooks')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a webhook endpoint' })
  async createWebhook(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateWebhookDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const hook = await this.settingsService.createWebhook(orgId, dto, actor.id);
    return successResponse(hook, 'Webhook endpoint registered');
  }

  @Delete('webhooks/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  async deleteWebhook(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id') id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.settingsService.deleteWebhook(
      orgId,
      id,
      actor.id,
    );
    return successResponse(result, result.message);
  }

  @Post('webhooks/test')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch test payload to webhook URL' })
  async testWebhook(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: TestWebhookDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.settingsService.testWebhook(orgId, dto, actor.id);
    return successResponse(result);
  }

  // ─── Diagnostics & Actions ────────────────────────────────────────────────

  @Get('diagnostics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGING_DIRECTOR')
  @ApiOperation({
    summary: 'Fetch system health, database latency & storage status',
  })
  async getDiagnostics(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const diag = await this.settingsService.getSystemDiagnostics(
      orgId,
      actor.id,
    );
    return successResponse(diag);
  }

  @Post('test-alert')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a live diagnostic test alert (Email/SMS/In-App)',
  })
  async sendTestAlert(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: SendTestAlertDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.settingsService.sendTestAlert(
      orgId,
      dto,
      actor.id,
    );
    return successResponse(result, result.message);
  }

  @Post('purge-cache')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flush Redis cache & query tags' })
  async purgeCache(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.settingsService.purgeCache(orgId, actor.id);
    return successResponse(result, result.message);
  }
}
