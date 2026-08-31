import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

/**
 * Public, unauthenticated endpoints backing the marketing website's forms
 * (contact + RFQ). PrismaService and MailService are provided by their
 * respective @Global() modules, so no explicit imports are needed here.
 */
@Module({
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
