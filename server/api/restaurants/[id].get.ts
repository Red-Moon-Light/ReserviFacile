// server/api/restaurants/[id].get.ts
import { getDb } from '~~/server/database';

export default defineEventHandler(async (event) => {
  const db = await getDb();
  const id = event.context.params?.id;

  try {
    const restaurant = await db.get(
      'SELECT * FROM Restaurants WHERE id = ?',
      [id]
    );

    if (!restaurant) {
      throw createError({
        statusCode: 404,
        message: 'Ресторан не найден'
      });
    }

    // Парсинг адресов из JSON-строки
    return {
      ...restaurant,
      addresses: JSON.parse(restaurant.addresses.replace(/\\/g, ''))
        .map((addr: string) => 
          addr.replace(/(\d{2}:\d{2})\/(\d{2}:\d{2})/, '$1-$2') // Замена / на -
        )
    };

  } catch (e) {
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера'
    });
  }
});