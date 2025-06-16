import { defineEventHandler } from 'h3';
import { getDb } from '~~/server/database';
import bcrypt from 'bcrypt';
import { generateToken } from '~~/composables/auth';

export default defineEventHandler(async (event) => {
    const db = await getDb();
    const { phone, password } = await readBody(event);
  
    // Поиск пользователя по номеру телефона
    const user = await db.get('SELECT * FROM Accounts WHERE phone = ?', [phone]);
    // Если пользователь не найден
    if (!user) {
        throw createError({
        statusCode: 481,
        message: 'USER_NOT_FOUND'
        });
    }

    const valid = await bcrypt.compare(password, user.password);
    // Проверка пароля
    if (!valid) {
        throw createError({
        statusCode: 482,
        message: 'INVALID_PASSWORD'
        });
    }


    const token = generateToken(user.id);
    await db.run(
      'INSERT INTO Sessions (user_id, token) VALUES (?, ?)',
      [user.id, token]
    );
      // Устанавливаем Cookie
    setCookie(event, 'auth_token', token, {
        httpOnly: true,
        secure: true,
        maxAge: 86400, // 1 день
        secure: false, // Для HTTP
    });
  
    return { success: true };

    // return { 
    //     success: true,
    //     user: {id: user.id,name: user.name },
    //     token // Возвращаем токен в ответе
    // };
});

