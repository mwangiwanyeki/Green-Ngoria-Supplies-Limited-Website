import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class PublishCmsContentDto {
  @ApiProperty({
    enum: ContentStatus,
    description:
      'Target lifecycle state. PUBLISHED stamps publishedAt; anything else clears it.',
  })
  @IsEnum(ContentStatus)
  status: ContentStatus;
}
