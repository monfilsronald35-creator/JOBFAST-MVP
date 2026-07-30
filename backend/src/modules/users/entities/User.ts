import type { UUID, Email, UserRole, UserStatus, Locale, UnixMs } from '@shared-types';

export class User {
  constructor(
    public readonly id:         UUID,
    public email:               Email,
    public fullName:            string,
    public role:                UserRole,
    public status:              UserStatus,
    public locale:              Locale,
    public phone?:              string,
    public avatarUrl?:          string,
    public bio?:                string,
    public country?:            string,
    public city?:               string,
    public skills?:             string[],
    public verifiedAt?:         UnixMs,
    public readonly createdAt:  UnixMs = Date.now(),
    public updatedAt:           UnixMs = Date.now(),
  ) {}

  isSuspended():         boolean { return this.status === 'suspended'; }
  isPendingVerification(): boolean { return this.status === 'pending_verification'; }
  isActive():            boolean { return this.status === 'active'; }

  suspend(): void {
    this.status    = 'suspended';
    this.updatedAt = Date.now();
  }

  activate(): void {
    this.status    = 'active';
    this.updatedAt = Date.now();
  }

  verify(): void {
    this.verifiedAt = Date.now();
    this.status     = 'active';
    this.updatedAt  = Date.now();
  }

  toPublic(): Omit<User, 'toPublic' | 'isSuspended' | 'isPendingVerification' | 'isActive' | 'suspend' | 'activate' | 'verify'> {
    return this;
  }

  static fromRow(row: Record<string, unknown>): User {
    return new User(
      row['id']          as UUID,
      row['email']       as Email,
      row['full_name']   as string,
      row['role']        as UserRole,
      (row['status'] ?? 'active') as UserStatus,
      (row['locale'] ?? 'ht')     as Locale,
      row['phone']       as string | undefined,
      row['avatar_url']  as string | undefined,
      row['bio']         as string | undefined,
      row['country']     as string | undefined,
      row['city']        as string | undefined,
      row['skills']      as string[] | undefined,
      row['verified_at'] ? new Date(row['verified_at'] as string).getTime() : undefined,
      new Date(row['created_at'] as string).getTime(),
      new Date(row['updated_at'] as string).getTime(),
    );
  }
}
