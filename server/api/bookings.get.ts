// server/api/bookings.get.ts
import { getDb } from '~~/server/database';

export default defineEventHandler(async (event) => {
  const db = await getDb();
  const { tableId, date } = getQuery(event);
  
  return await db.all(
    `SELECT * FROM Bookings 
     WHERE table_id = ? AND booking_date = ?`,
    [tableId, date]
  );
});
