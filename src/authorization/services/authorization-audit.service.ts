import { Injectable, Logger } from "@nestjs/common";

/**
 * Centralised, structured logging for authorization-relevant events. Keeping
 * this in one place makes it easy to later forward these records to a SIEM or
 * dedicated audit store instead of the application log.
 */
@Injectable()
export class AuthorizationAuditService {
  private readonly logger = new Logger("Authorization");

  accessDenied(params: {
    userId?: number;
    method: string;
    path: string;
    reason: string;
  }): void {
    const subject = params.userId ? `user #${params.userId}` : "anonymous";
    this.logger.warn(
      `Access denied for ${subject} on ${params.method} ${params.path}: ${params.reason}`,
    );
  }

  rolesAssigned(params: {
    actorId?: number;
    targetUserId: number;
    roles: string[];
  }): void {
    this.logger.log(
      `Roles [${params.roles.join(", ")}] assigned to user #${params.targetUserId} by ${this.actor(params.actorId)}`,
    );
  }

  roleCreated(params: { actorId?: number; role: string }): void {
    this.logger.log(
      `Role "${params.role}" created by ${this.actor(params.actorId)}`,
    );
  }

  roleUpdated(params: {
    actorId?: number;
    role: string;
    detail: string;
  }): void {
    this.logger.log(
      `Role "${params.role}" updated (${params.detail}) by ${this.actor(params.actorId)}`,
    );
  }

  roleDeleted(params: { actorId?: number; role: string }): void {
    this.logger.log(
      `Role "${params.role}" deleted by ${this.actor(params.actorId)}`,
    );
  }

  private actor(actorId?: number): string {
    return actorId ? `user #${actorId}` : "system";
  }
}
