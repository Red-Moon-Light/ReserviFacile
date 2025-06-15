import { getDb } from '../database';
import { format, parseISO, addHours } from 'date-fns';
import { getCurrentUser } from '~~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event);
  if (!user) throw createError({ statusCode: 401 });

  const db = await getDb();
  const body = await readBody(event);
  
  // Валидация
  if (!body.tableId || !body.date || !body.start || !body.duration) {
    throw createError({ statusCode: 400, message: 'Неверные параметры бронирования' });
  }

  const startTime = parseISO(`${body.date}T${body.start}`);
  const endTime = addHours(startTime, body.duration);

  // Проверка существующих броней
  const existing = await db.get(
    `SELECT * FROM Bookings 
     WHERE table_id = ? AND booking_date = ?
     AND (start_time < ? AND end_time > ?)`,
    [body.tableId, body.date, body.endTime, body.startTime]
  );

  if (existing) throw createError({ statusCode: 409, message: 'Время уже занято' });

  // Создание брони
  await db.run(
    `INSERT INTO Bookings 
     (user_id, table_id, booking_date, start_time, end_time)
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, body.tableId, body.date, 
     format(startTime, 'HH:mm'), format(endTime, 'HH:mm')]
  );

  return { success: true };
});