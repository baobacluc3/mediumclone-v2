import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

type ErrorMessage = string | string[];

interface ErrorResponseBody {
  error?: string;
  message?: ErrorMessage;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : undefined;
    const body = this.buildResponseBody(
      statusCode,
      request.url,
      exceptionResponse,
    );

    if (!isHttpException) {
      this.logger.error(
        exception instanceof Error ? exception.message : "Unexpected error",
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json(body);
  }

  private buildResponseBody(
    statusCode: number,
    path: string,
    exceptionResponse: string | object | undefined,
  ) {
    const normalized = this.normalizeExceptionResponse(
      statusCode,
      exceptionResponse,
    );

    return {
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      error: normalized.error,
      message: normalized.message,
    };
  }

  private normalizeExceptionResponse(
    statusCode: number,
    exceptionResponse: string | object | undefined,
  ): Required<ErrorResponseBody> {
    if (typeof exceptionResponse === "string") {
      return {
        error: HttpStatus[statusCode] ?? "Error",
        message: exceptionResponse,
      };
    }

    if (exceptionResponse && typeof exceptionResponse === "object") {
      const responseBody = exceptionResponse as ErrorResponseBody;

      return {
        error: responseBody.error ?? HttpStatus[statusCode] ?? "Error",
        message: responseBody.message ?? "Request failed.",
      };
    }

    return {
      error: "Internal Server Error",
      message: "An unexpected error occurred.",
    };
  }
}
