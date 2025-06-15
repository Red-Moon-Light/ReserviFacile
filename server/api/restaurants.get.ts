import { getDb } from '~~/server/database';

interface RestaurantDB {
  id: number;
  name: string;
  image: string;
  addresses: string;
}

export default defineEventHandler(async (event) => {
  const db = await getDb();
  
  try {
    const restaurants = await db.all(
      'SELECT * FROM Restaurants'
    ) as RestaurantDB[];

    // Проверка и корректное формирование JSON
    const validRestaurants = restaurants.map(r => {
      try {
        return {
          id: r.id,
          name: r.name,
          image: r.image,
          addresses: JSON.parse(r.addresses.replace(/\\/g, '')) // Удаление экранирования
        };
      } catch (e) {
        console.error(`Invalid addresses format for restaurant ${r.id}:`, r.addresses);
        return null;
      }
    }).filter(Boolean);

    return validRestaurants;

  } catch (e) {
    const message = e instanceof Error ? e.message : "Неизвестная ошибка";
    throw createError({
        statusCode: 500,
        message: 'Ошибка загрузки ресторанов',
        data: { details: message }
    });
}
});