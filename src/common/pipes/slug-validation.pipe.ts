import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class SlugValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    const fieldName = metadata.data ?? "slug";

    if (!SLUG_PATTERN.test(value)) {
      throw new BadRequestException(
        `${fieldName} must contain lowercase letters, numbers, and single hyphens only`,
      );
    }

    return value;
  }
}
