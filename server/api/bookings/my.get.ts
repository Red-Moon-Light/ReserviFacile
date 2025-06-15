// server/api/bookings/my.get.ts
import { getDb } from '~~/server/database';
import { getCurrentUser } from '~~/server/utils/auth';

interface BookingResult {
  id: number;
  table_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  restaurant_name: string;
  address: string;
  table_number: number;
  price: number;
}

export default defineEventHandler(async (event) => {
  const db = await getDb();
  const user = await getCurrentUser(event);
  if (!user) throw createError({ statusCode: 401 });

  const bookings = await db.all(`
    WITH SplitAddresses AS (
      SELECT 
        r.id as restaurant_id,
        json_each.value as address_entry
      FROM Restaurants r
      JOIN json_each(replace(r.addresses, '\\', '')) 
    )
    SELECT 
      b.id,
      b.table_id,
      b.booking_date,
      b.start_time,
      b.end_time,
      r.name as restaurant_name,
      t.address_code,
      substr(
        sa.address_entry, 
        instr(sa.address_entry, '/') + 1,
        instr(substr(sa.address_entry, instr(sa.address_entry, '/') + 1), '/') - 1
      ) as address,
      t.table_number,
      (t.hourly_rate * (
        CAST(SUBSTR(b.end_time, 1, 2) AS INTEGER) - 
        CAST(SUBSTR(b.start_time, 1, 2) AS INTEGER)
      )) as price
    FROM Bookings b
    JOIN Tables t ON b.table_id = t.id
    JOIN Restaurants r ON r.id = substr(t.address_code, 1, instr(t.address_code, '-') - 1)
    JOIN SplitAddresses sa ON sa.restaurant_id = r.id 
      AND sa.address_entry LIKE t.address_code || '/%'
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC
  `, [user.id]) as BookingResult[];

  return bookings.map(b => ({
    id: b.id,
    restaurantName: b.restaurant_name,
    address: b.address,
    tableNumber: b.table_number,
    booking_date: b.booking_date,
    start_time: b.start_time,
    end_time: b.end_time,
    price: b.price
  }));
});