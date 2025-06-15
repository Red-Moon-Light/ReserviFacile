// server/api/restaurants/[id]/tables.get.ts
import { getDb } from '~~/server/database';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) throw createError({ statusCode: 400, message: 'Missing restaurant ID' });

  const { address } = getQuery(event);
  const db = await getDb();
  
  return await db.all(
    `SELECT * FROM Tables WHERE address_code = ?`,
    [address]
  );
});