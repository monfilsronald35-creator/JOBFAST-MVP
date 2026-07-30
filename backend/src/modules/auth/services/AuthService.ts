import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { IAuthRepository } from '../repositories/IAuthRepository.js';
import type { LoginDTOType, RegisterDTOType, ChangePasswordDTOType } from '../dto/index.js';
import type { LoginResult, RefreshResult, AuthenticatedUser } from '../types/index.js';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../../../core/errors/AppError.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import { UserLoggedInEvent, UserRegisteredEvent, PasswordChangedEvent } from '../events/AuthEvents.js';
import type { UUID, UserRole } from '@shared-types';

const BCRYPT_ROUNDS = 12;

interface JWTPayload { sub: UUID; role: string; email: string; type?: string }

export class AuthService {
  constructor(private readonly _repo: IAuthRepository) {}

  private _jwtSecret(): string {
    const s = process.env['JWT_SECRET'];
    if (!s) throw new Error('JWT_SECRET not configured');
    return s;
  }

  private _signToken(payload: JWTPayload, expiresIn = '7d'): string {
    return jwt.sign(payload, this._jwtSecret(), { expiresIn } as jwt.SignOptions);
  }

  private _issueTokenPair(userId: UUID, role: string, email: string) {
    const token        = this._signToken({ sub: userId, role, email }, '7d');
    const refreshToken = this._signToken({ sub: userId, role, email, type: 'refresh' }, '30d');
    const decoded      = jwt.decode(token) as { exp?: number };
    return { token, refreshToken, expiresAt: (decoded.exp ?? 0) * 1000 };
  }

  private _toPublicUser(row: {
    id: UUID; email: string; role: string; full_name: string;
    avatar_url?: string | null; verified_at?: string | null;
  }): AuthenticatedUser {
    return {
      id:         row.id,
      email:      row.email,
      role:       row.role as UserRole,
      fullName:   row.full_name,
      avatarUrl:  row.avatar_url ?? undefined,
      verifiedAt: row.verified_at ? new Date(row.verified_at).getTime() : undefined,
    };
  }

  async login(dto: LoginDTOType, ip?: string): Promise<LoginResult> {
    const profile = await this._repo.findByEmail(dto.email);
    // Use constant-time comparison message to prevent email enumeration
    if (!profile) {
      await bcrypt.compare(dto.password, '$2b$12$invalidhashtopreventtiming00000000000000000');
      throw new UnauthorizedError('Email ou modpas envalid');
    }

    const valid = await bcrypt.compare(dto.password, profile.password_hash);
    if (!valid) throw new UnauthorizedError('Email ou modpas envalid');

    const tokens = this._issueTokenPair(profile.id, profile.role, profile.email);

    TypedEventBus.publish(new UserLoggedInEvent(profile.id, profile.email, profile.role as UserRole, ip));

    return { user: this._toPublicUser(profile), tokens };
  }

  async register(dto: RegisterDTOType): Promise<LoginResult> {
    const existing = await this._repo.findByEmail(dto.email);
    if (existing) throw new ConflictError('Yon kont deja egziste pou email sa a');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const profile      = await this._repo.create(dto, passwordHash);
    const tokens       = this._issueTokenPair(profile.id, profile.role, profile.email);

    TypedEventBus.publish(new UserRegisteredEvent(profile.id, profile.email, profile.role as UserRole, dto.fullName));

    return { user: this._toPublicUser(profile), tokens };
  }

  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    let payload: JWTPayload;
    try {
      payload = jwt.verify(refreshToken, this._jwtSecret()) as JWTPayload;
    } catch {
      throw new UnauthorizedError('Refresh token envalid oswa ekspire');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedError('Token tip envalid');

    const profile = await this._repo.findById(payload.sub);
    if (!profile) throw new NotFoundError('Itilizatè', payload.sub);

    const tokens = this._issueTokenPair(profile.id, profile.role, profile.email);
    return { tokens };
  }

  async changePassword(userId: UUID, dto: ChangePasswordDTOType): Promise<void> {
    const profile = await this._repo.findById(userId);
    if (!profile) throw new NotFoundError('Itilizatè', userId);

    const valid = await bcrypt.compare(dto.currentPassword, profile.password_hash);
    if (!valid) throw new ValidationError('Ansyen modpas envalid');

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this._repo.updatePasswordHash(userId, newHash);

    TypedEventBus.publish(new PasswordChangedEvent(userId));
  }

  async requestPasswordReset(email: string): Promise<string> {
    const profile = await this._repo.findByEmail(email);
    // Always succeed to prevent email enumeration
    if (!profile) return 'check_email';

    const token     = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000;  // 1 hour
    await this._repo.storeResetToken(profile.id, token, expiresAt);
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this._repo.findByResetToken(token);
    if (!record || record.expiresAt < Date.now()) {
      throw new ValidationError('Token reyinisyalizasyon envalid oswa ekspire');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this._repo.updatePasswordHash(record.userId, newHash);
    await this._repo.clearResetToken(record.userId);

    TypedEventBus.publish(new PasswordChangedEvent(record.userId));
  }
}
