import { UserEntity } from "@/user/user.entity";
import { UserService } from "../user/user.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { createHash, randomBytes } from "crypto";
import { RegisterDto } from "./dto/register.dto";
import { LoginUserDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";
import { AuthenticatedUser } from "./auth.types";
import { DEFAULT_ROLE_NAME } from "@/authorization/domain/rbac.catalog";
import { RolesService } from "@/authorization/services/roles.service";
import { MailService } from "@/mail/mail.service";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly rolesService: RolesService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username?.trim() || email.split("@")[0];

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException("email already exists");
      }

      throw new ConflictException("username already exists");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const defaultRoles = await this.rolesService.findByNames([
      DEFAULT_ROLE_NAME,
    ]);

    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        username,
        passwordHash: hashedPassword,
        roles: defaultRoles,
      }),
    );

    // A failed email must not fail the registration itself; the user can
    // always hit "resend verification" later.
    try {
      await this.sendVerificationEmail(user);
    } catch (error) {
      this.logger.warn(
        `Could not send verification email to ${user.email}: ${String(error)}`,
      );
    }

    const tokens = await this.userService.issueTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        roles: this.roleNames(user),
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async login(dto: LoginUserDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException("Invalid email or password");
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException("Invalid email or password");

    const tokens = await this.userService.issueTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: this.roleNames(user),
      },
      ...tokens,
    };
  }

  refresh(refreshToken: string) {
    return this.userService.refreshTokens(refreshToken);
  }

  /** Marks the account verified when the emailed token matches and is fresh. */
  async verifyEmail(token: string) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.emailVerificationExpiresAt")
      .where("user.emailVerificationTokenHash = :hash", {
        hash: this.hashToken(token),
      })
      .getOne();

    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        "This verification link is invalid or has expired.",
      );
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    });

    return { message: "Email verified — you're all set." };
  }

  /** Always answers the same way so the endpoint can't be used to probe
   * which emails are registered. */
  async resendVerification(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user && !user.emailVerified) {
      try {
        await this.sendVerificationEmail(user);
      } catch (error) {
        this.logger.warn(
          `Could not resend verification email to ${user.email}: ${String(error)}`,
        );
      }
    }

    return {
      message:
        "If that email is registered and unverified, a new link is on its way.",
    };
  }

  /** Same non-revealing contract as resendVerification. */
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user) {
      const token = this.generateToken();

      await this.userRepository.update(user.id, {
        passwordResetTokenHash: this.hashToken(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
      });

      try {
        await this.mailService.send({
          to: user.email,
          subject: "Reset your password",
          text:
            `Hi ${user.username},\n\n` +
            `Someone (hopefully you) asked to reset the password for this account. ` +
            `The link below is valid for 1 hour:\n\n` +
            `${this.mailService.frontendUrl()}/reset-password?token=${token}\n\n` +
            `If you didn't ask for this, you can safely ignore this email.`,
        });
      } catch (error) {
        this.logger.warn(
          `Could not send password reset email to ${user.email}: ${String(error)}`,
        );
      }
    }

    return {
      message:
        "If that email is registered, a password reset link is on its way.",
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordResetExpiresAt")
      .where("user.passwordResetTokenHash = :hash", {
        hash: this.hashToken(token),
      })
      .getOne();

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        "This reset link is invalid or has expired.",
      );
    }

    await this.userRepository.update(user.id, {
      passwordHash: await bcrypt.hash(password, 10),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      // Sign out every existing session: whoever holds the old password (or a
      // stolen refresh token) is locked out from this moment.
      refreshTokenHash: null,
    });

    return {
      message: "Password updated. You can sign in with your new password now.",
    };
  }

  /** Stores only the token's hash; the raw value exists solely in the email. */
  private async sendVerificationEmail(user: UserEntity): Promise<void> {
    const token = this.generateToken();

    await this.userRepository.update(user.id, {
      emailVerificationTokenHash: this.hashToken(token),
      emailVerificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });

    await this.mailService.send({
      to: user.email,
      subject: "Verify your email",
      text:
        `Hi ${user.username},\n\n` +
        `Welcome to Conduit! Confirm your email address by opening the link ` +
        `below (valid for 24 hours):\n\n` +
        `${this.mailService.frontendUrl()}/verify-email?token=${token}\n\n` +
        `If you didn't create this account, you can safely ignore this email.`,
    });
  }

  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  logout(user: AuthenticatedUser) {
    return this.userService.logout(user.id);
  }

  private roleNames(user: UserEntity): string[] {
    return user.roles?.length
      ? user.roles.map((role) => role.name)
      : [DEFAULT_ROLE_NAME];
  }
}
