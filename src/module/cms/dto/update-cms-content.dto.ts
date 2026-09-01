import { PartialType } from '@nestjs/swagger';
import { CreateCmsContentDto } from './create-cms-content.dto';

export class UpdateCmsContentDto extends PartialType(CreateCmsContentDto) {}
