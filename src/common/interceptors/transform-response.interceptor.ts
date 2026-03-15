import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const STRIPPED_KEYS = new Set(['created_at', 'updated_at', 'deleted_at']);

function toSnakeCase(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toSnakeCase);
  if (value !== null && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([k, v]) => [
          k.replace(/([A-Z])/g, '_$1').toLowerCase(),
          toSnakeCase(v),
        ])
        .filter(([k]) => !STRIPPED_KEYS.has(k as string)),
    );
  }
  return value;
}

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(toSnakeCase));
  }
}
