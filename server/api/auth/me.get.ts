// server/api/auth/me.get.ts
import { getDb } from '~~/server/database';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) throw createError({ statusCode: 401 });

  const db = await getDb();
  return db.get('SELECT id, name, phone, email FROM Accounts WHERE id = ?', [user.id]);
});