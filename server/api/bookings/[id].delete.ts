import { getDb } from '~~/server/database';
import { getCurrentUser } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const db = await getDb();
  const user = await getCurrentUser(event);
  if (!user) throw createError({ statusCode: 401 });

  const bookingId = event.context.params?.id;
  if (!bookingId) throw createError({ statusCode: 400 });

  // Проверяем принадлежность брони пользователю
  const booking = await db.get(
    'SELECT * FROM Bookings WHERE id = ? AND user_id = ?',
    [bookingId, user.id]
  );

  if (!booking) throw createError({ statusCode: 404 });

  await db.run('DELETE FROM Bookings WHERE id = ?', [bookingId]);
  
  return { success: true };
});