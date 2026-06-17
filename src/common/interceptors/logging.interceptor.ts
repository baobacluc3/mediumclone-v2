import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();
    const path = request.originalUrl || request.url;

    this.logger.log(`Request ${request.method} ${path}`);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logResponse(
            request.method,
            path,
            response.statusCode,
            startedAt,
          );
        },
        error: (error: unknown) => {
          const statusCode =
            error instanceof HttpException ? error.getStatus() : 500;

          this.logResponse(request.method, path, statusCode, startedAt);
        },
      }),
    );
  }

  private logResponse(
    method: string,
    path: string,
    statusCode: number,
    startedAt: number,
  ): void {
    const durationMs = Date.now() - startedAt;
    const message = `Response ${method} ${path} ${statusCode} - ${durationMs}ms`;

    if (statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
