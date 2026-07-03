import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends transactional email over SMTP when SMTP_HOST is configured.
 * Without it (local dev, or before credentials are added in production)
 * the message is logged instead, so auth flows stay testable end-to-end:
 * the verification/reset link is readable straight from the server logs.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST");

    this.from = this.configService.get<string>(
      "MAIL_FROM",
      "Conduit <no-reply@mediumclone.local>",
    );

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(this.configService.get<string>("SMTP_PORT", "587")),
          secure:
            this.configService.get<string>("SMTP_SECURE", "false") === "true",
          auth: {
            user: this.configService.get<string>("SMTP_USER"),
            pass: this.configService.get<string>("SMTP_PASS"),
          },
        })
      : null;
  }

  /** Base URL used inside email links; points at the deployed frontend. */
  frontendUrl(): string {
    const configured = this.configService.get<string>("FRONTEND_URL");
    if (configured) return configured.replace(/\/$/, "");

    const firstOrigin = this.configService
      .get<string>("ALLOWED_ORIGINS", "")
      .split(",")[0]
      .trim();

    return (firstOrigin || "http://localhost:5173").replace(/\/$/, "");
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `SMTP not configured — email to ${message.to} logged instead:\n` +
          `Subject: ${message.subject}\n${message.text}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
