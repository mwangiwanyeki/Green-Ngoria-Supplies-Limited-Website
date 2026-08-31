import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { successResponse } from '../../common/response/api-response';
import { PublicService } from './public.service';
import { ContactDto } from './dto/contact.dto';
import { RfqDto } from './dto/rfq.dto';

// Stricter than the global limit — a handful of submissions per minute per IP
// to blunt spam/abuse of the unauthenticated public endpoints.
const PUBLIC_THROTTLE = {
  default: {
    ttl: parseInt(process.env.PUBLIC_THROTTLE_TTL_SECONDS ?? '60', 10) * 1000,
    limit: parseInt(process.env.PUBLIC_THROTTLE_LIMIT ?? '5', 10),
  },
};

@ApiTags('Public Website')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Post('contact')
  @Public()
  @Throttle(PUBLIC_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a public "Contact us" enquiry' })
  async contact(@Body() dto: ContactDto) {
    const result = await this.publicService.submitContact(dto);
    return successResponse(
      result,
      'Thank you — your enquiry has been received.',
    );
  }

  @Post('rfq')
  @Public()
  @Throttle(PUBLIC_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a public request for quotation (RFQ)' })
  async rfq(@Body() dto: RfqDto) {
    const result = await this.publicService.submitRfq(dto);
    return successResponse(
      result,
      'Thank you — your request for quotation has been received.',
    );
  }
}
