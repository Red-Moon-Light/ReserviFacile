// server/middleware/auth.ts
import { verifyToken } from '~~/composables/auth';
import { getDb } from '~~/server/database';
import { sendRedirect } from 'h3';

export default defineEventHandler(async (event) => {
  // Разрешаем доступ без токена для главной страницы и API авторизации
  const publicPaths = [
    '', '/', '/api/auth/login', '/api/auth/register',
    '/_nuxt/**', '/favicon.ico', '/api/auth/**'
  ];
  if (publicPaths.includes(event.path!)) {
    return; // Пропускаем проверку
  }

  const token = getCookie(event, 'auth_token');
  if (!token) {
    return sendRedirect(event, '/', 401);
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) throw new Error('Неверный токен');

    // Проверяем существование пользователя в БД
    const db = await getDb();
    const user = await db.get(
      'SELECT id FROM Accounts WHERE id = ?', 
      [decoded.userId]
    );
    
    if (!user) throw new Error('Пользователь не найден');
    
    // Добавляем пользователя в контекст
    event.context.user = user;
    
  } catch (e) {
    deleteCookie(event, 'auth_token');
    return sendRedirect(event, '/', 401);
  }
});