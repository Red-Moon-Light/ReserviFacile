import { defineEventHandler } from 'h3';
import { getDb, hashPassword } from '~~/server/database';
import { generateToken } from '~~/composables/auth';

export default defineEventHandler(async (event) => {
  const db = await getDb();
  const { name, phone, email, password } = await readBody(event);

  // Проверка существующего телефона
  const existingPhone = await db.get(
    'SELECT id FROM Accounts WHERE phone = ?', 
    [phone]
  );
  if (existingPhone) {
    throw createError({
      statusCode: 483,
      message: 'PHONE_EXISTS'
    });
  }

  // Проверка существующего email
  const existingEmail = await db.get(
    'SELECT id FROM Accounts WHERE email = ?', 
    [email]
  );
  if (existingEmail) {
    throw createError({
      statusCode: 484,
      message: 'EMAIL_EXISTS'
    });
  }

  // Хеширование пароля
  const hashedPassword = await hashPassword(password);
  
  // Создание пользователя
  const result = await db.run(
    `INSERT INTO Accounts (name, phone, email, password)
     VALUES (?, ?, ?, ?)`,
    [name, phone, email, hashedPassword]
  );

  // Генерация токена
  const token = generateToken(result.lastID);
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    maxAge: 86400 // 1 день
  });

  return { success: true, userId: result.lastID };
});
