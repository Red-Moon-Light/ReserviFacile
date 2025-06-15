// server/api/auth/logout.post.ts
import { getDb } from '~~/server/database';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token');
  if (token) {
    const db = await getDb();
    await db.run('DELETE FROM Sessions WHERE token = ?', [token]);
  }
  deleteCookie(event, 'auth_token');
  return { success: true };
});