import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '../../lib/notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { successResponse } from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user' })
  async findAll(
    @CurrentUser() actor: AuthUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('unreadOnly') unreadOnly = false,
  ) {
    const result = await this.service.findForUser(actor.id, {
      page: Number(page),
      limit: Number(limit),
      unreadOnly: String(unreadOnly) === 'true',
    });
    return { success: true, ...result };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.service.markRead(id, actor.id);
    return successResponse(null, 'Notification marked as read');
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() actor: AuthUser) {
    await this.service.markAllRead(actor.id);
    return successResponse(null, 'All notifications marked as read');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss (delete) a single notification' })
  async dismiss(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.service.dismiss(id, actor.id);
    return successResponse(null, 'Notification dismissed');
  }

  @Delete('read/clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear every already-read notification' })
  async clearRead(@CurrentUser() actor: AuthUser) {
    const removed = await this.service.clearRead(actor.id);
    return successResponse({ removed }, `Cleared ${removed} read notifications`);
  }
}
