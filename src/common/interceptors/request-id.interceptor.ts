import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const suppliedRequestId = request.header('x-request-id');
    const requestId =
      suppliedRequestId && /^[a-zA-Z0-9._:-]{1,128}$/.test(suppliedRequestId)
        ? suppliedRequestId
        : randomUUID();
    request.requestId = requestId;
    response.setHeader('X-Request-ID', requestId);

    return next.handle().pipe(
      tap(() => {
        // Could add timing headers here
      }),
    );
  }
}
