// composables/auth.ts
import jwt from 'jsonwebtoken';

const SECRET = 'секретный_ключ';

export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): { userId: number } | null => {
  try {
    return jwt.verify(token, SECRET) as { userId: number };
  } catch (e) {
    return null;
  }
};