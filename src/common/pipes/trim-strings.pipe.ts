import { Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class TrimStringsPipe implements PipeTransform {
  transform<T>(value: T): T {
    return this.trimValue(value) as T;
  }

  private trimValue(value: unknown): unknown {
    if (typeof value === "string") {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.trimValue(item));
    }

    if (this.isPlainObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, this.trimValue(item)]),
      );
    }

    return value;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null &&
      Object.getPrototypeOf(value) === Object.prototype
    );
  }
}
