import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../response/api-response';

/**
 * Wraps raw return values from controllers in the standard ApiResponse envelope.
 * If a controller already returns an ApiResponse (has `success` key), it is passed through unchanged.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  T | ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T): T | ApiResponse<T> => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return { success: true, data };
      }),
    );
  }
}
