import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

@Injectable()
export class RequiredBodyPipe implements PipeTransform {
  constructor(private readonly fieldName?: string) {}

  transform<T>(value: T, metadata: ArgumentMetadata): T {
    const name = this.fieldName ?? metadata.data ?? "body";

    if (value === undefined || value === null) {
      throw new BadRequestException(`${name} is required`);
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      throw new BadRequestException(`${name} must be an object`);
    }

    return value;
  }
}
