import {
  Controller,
  Get,
  Query,
  Res,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorageService } from '../../lib/storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  /**
   * Serve a privately stored file using a signed HMAC token (local provider only).
   * Supabase signed URLs are served directly from Supabase Storage — this endpoint
   * is used only when STORAGE_PROVIDER=local.
   */
  @Get('download')
  @Public()
  @ApiOperation({
    summary: 'Download a file using a signed token (local provider)',
  })
  download(
    @Query('key') key: string,
    @Query('expires') expires: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!key || !expires || !token) {
      throw new UnauthorizedException('Invalid download parameters');
    }

    const expiresNum = parseInt(expires, 10);
    const valid = this.storage.validateSignedToken(key, expiresNum, token);

    if (!valid) {
      throw new UnauthorizedException(
        'Download link has expired or is invalid',
      );
    }

    const buffer = this.storage.readLocal(key);
    if (!buffer) {
      throw new NotFoundException('File not found');
    }

    const filename = (key.split('/').pop() ?? 'download').replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, no-cache');
    res.send(buffer);
  }
}
