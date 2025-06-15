// server/utils/auth.ts
import { getDb } from '~~/server/database';

export async function getCurrentUser(event: any) {
  const db = await getDb();
  const token = getCookie(event, 'auth_token');
  
  if (!token) return null;
  
  return await db.get(`
    SELECT Accounts.* 
    FROM Accounts
    JOIN Sessions ON Accounts.id = Sessions.user_id
    WHERE Sessions.token = ?`,
    [token]
  );
}