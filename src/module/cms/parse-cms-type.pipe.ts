import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import {
  CMS_CONTENT_TYPES,
  isCmsContentType,
  type CmsContentType,
} from './cms.types';

/** Validates the `:type` route segment against the four CMS content types. */
@Injectable()
export class ParseCmsTypePipe implements PipeTransform<string, CmsContentType> {
  transform(value: string): CmsContentType {
    if (!isCmsContentType(value)) {
      throw new BadRequestException(
        `Unknown CMS content type "${value}". Expected one of: ${CMS_CONTENT_TYPES.join(', ')}`,
      );
    }
    return value;
  }
}
