import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { ValidationError } from "class-validator";

interface FieldValidationError {
  field: string;
  messages: string[];
}

export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          message: "Validation failed",
          errors: AppValidationPipe.flattenErrors(errors),
        }),
    });
  }

  private static flattenErrors(
    errors: ValidationError[],
    parentPath = "",
  ): FieldValidationError[] {
    return errors.flatMap((error) => {
      const fieldPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;
      const currentError = error.constraints
        ? [
            {
              field: fieldPath,
              messages: Object.values(error.constraints),
            },
          ]
        : [];

      return [
        ...currentError,
        ...AppValidationPipe.flattenErrors(error.children ?? [], fieldPath),
      ];
    });
  }
}
