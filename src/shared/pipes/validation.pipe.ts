import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";

type Primitive =
  | StringConstructor
  | BooleanConstructor
  | NumberConstructor
  | ArrayConstructor
  | ObjectConstructor;

@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform<T>(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<T> {
    if (value === null || value === undefined) {
      throw new BadRequestException("No data submitted");
    }

    if (!metatype || this.isPrimitive(metatype as Primitive)) {
      return value as T;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      this.logger.warn("Validation failed", formattedErrors);
      throw new BadRequestException({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    return value as T;
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    return errors.reduce<Record<string, string[]>>((acc, error) => {
      const field = error.property;
      acc[field] = Object.values(error.constraints ?? {});

      // Xử lý nested validation errors
      if (error.children?.length) {
        const nested = this.formatErrors(error.children);
        Object.assign(acc, nested);
      }
      return acc;
    }, {});
  }

  private isPrimitive(metatype: Primitive): boolean {
    return [String, Boolean, Number, Array, Object].includes(metatype);
  }
}
