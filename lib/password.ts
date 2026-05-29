import bcrypt from 'bcryptjs';

// bcrypt truncates silently past 72 bytes; reject long inputs rather than
// hashing a quietly-truncated password.
export const MAX_PASSWORD_LENGTH = 72;
export const MIN_PASSWORD_LENGTH = 8;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
