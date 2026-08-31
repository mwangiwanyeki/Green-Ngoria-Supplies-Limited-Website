import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Validates that a route parameter is a valid UUID.
 * Prevents invalid IDs from reaching the database layer.
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  private readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string): string {
    if (!this.UUID_REGEX.test(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }
    return value;
  }
}
