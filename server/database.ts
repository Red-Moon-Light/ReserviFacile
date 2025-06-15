import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import { format, parseISO, addHours, isBefore, isToday } from 'date-fns';

let db: any = null;

export async function initializeDatabase() {
  try {
    db = await open({
      filename: './reservation.db',
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });

    // Создание таблиц
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT
      );

      CREATE TABLE IF NOT EXISTS Sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES Accounts(id)
      );
      
      CREATE TABLE IF NOT EXISTS Restaurants (
        id INTEGER PRIMARY KEY,
        name TEXT,
        image TEXT,
        addresses TEXT
      );

      CREATE TABLE IF NOT EXISTS Tables (
        id TEXT PRIMARY KEY,
        address_code TEXT,
        table_number INTEGER,
        seats INTEGER,
        hourly_rate INTEGER
      );

      CREATE TABLE IF NOT EXISTS Bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        table_id TEXT,
        booking_date TEXT,
        start_time TEXT,
        end_time TEXT,
        FOREIGN KEY(user_id) REFERENCES Accounts(id),
        FOREIGN KEY(table_id) REFERENCES Tables(id)
      );
    `);

    // Добавление ресторанов
    const restaurants = [
      { 
        id: 1, 
        name: "L'deur | Людэр", 
        image: "/restaurants/Ldeur.png", 
        addresses: ['1-1/Ставрополь, проспект Карла Маркса, 64/12:00-23:00', '1-2/Ставрополь, ул. Западный обход, 58 /16:00-23:00']
      },
      { 
        id: 2, 
        name: "Basilic | Базилик", 
        image: "/restaurants/Basilic.png", 
        addresses: ['2-1/Ставрополь, ул. Доваторцев, 55а/12:00-23:00'] 
      },
      { 
        id: 3, 
        name: "Sushi Garden | Суши Гарден", 
        image: "/restaurants/Sushi_Garden.png", 
        addresses: ['3-1/Ставрополь, проспект Карла Маркса, 37/1/10:00-22:00', '3-2/Ставрополь, ул. Матросова, 2а/10:00-22:00']
      },
      { 
        id: 4, 
        name: "SeaFood | СиФуд", 
        image: "/restaurants/SeaFood.png", 
        addresses: ['4-1/Ставрополь, ул. Пирогова, 11а/9:00-21:00'] 
      },
      { 
        id: 5, 
        name: "Hot Pizza | Хот Пицца", 
        image: "/restaurants/Hot_Pizza.png", 
        addresses: ['5-1/Ставрополь, ул. Мира, 319/8:00-22:00', '5-2/Ставрополь, ул. Рогожникова, 19/8:00-22:00']
      },
      { 
        id: 6, 
        name: "Valencia | Валенсия", 
        image: "/restaurants/Valencia.png", 
        addresses: ['6-1/Ставрополь, ул. ​Дзержинского, 102а/16:00-23:00'] 
      }
    ];

    for (const restaurant of restaurants) {
      await db.run(
        'INSERT OR IGNORE INTO Restaurants VALUES (?, ?, ?, ?)',
        [
          restaurant.id, 
          restaurant.name, 
          restaurant.image, 
          JSON.stringify(restaurant.addresses) // Сохраняем как JSON-строку
        ]
      );
    }

    // Добавление тестовых столиков
    const testTables = [
      // Людэр 1
      { id: '1-1/1', address_code: '1-1', table_number: 1, seats: 4, hourly_rate: 80 },
      { id: '1-1/2', address_code: '1-1', table_number: 2, seats: 4, hourly_rate: 80 },
      { id: '1-1/3', address_code: '1-1', table_number: 3, seats: 4, hourly_rate: 80 },
      { id: '1-1/4', address_code: '1-1', table_number: 4, seats: 2, hourly_rate: 50 },
      { id: '1-1/5', address_code: '1-1', table_number: 5, seats: 2, hourly_rate: 50 },
      { id: '1-1/6', address_code: '1-1', table_number: 6, seats: 6, hourly_rate: 100 },
      { id: '1-1/7', address_code: '1-1', table_number: 7, seats: 8, hourly_rate: 120 },
      { id: '1-1/8', address_code: '1-1', table_number: 8, seats: 10, hourly_rate: 150 },

      // Людэр 2
      { id: '1-2/1', address_code: '1-2', table_number: 1, seats: 4, hourly_rate: 80 },
      { id: '1-2/2', address_code: '1-2', table_number: 2, seats: 4, hourly_rate: 80 },
      { id: '1-2/3', address_code: '1-2', table_number: 3, seats: 2, hourly_rate: 50 },
      { id: '1-2/4', address_code: '1-2', table_number: 4, seats: 2, hourly_rate: 50 },
      { id: '1-2/5', address_code: '1-2', table_number: 5, seats: 6, hourly_rate: 100 },
      { id: '1-2/6', address_code: '1-2', table_number: 6, seats: 8, hourly_rate: 120 },

      // Базилик 1
      { id: '2-1/1', address_code: '2-1', table_number: 1, seats: 4, hourly_rate: 100 },
      { id: '2-1/2', address_code: '2-1', table_number: 2, seats: 4, hourly_rate: 100 },
      { id: '2-1/3', address_code: '2-1', table_number: 3, seats: 2, hourly_rate: 60 },
      { id: '2-1/4', address_code: '2-1', table_number: 4, seats: 2, hourly_rate: 60 },
      { id: '2-1/5', address_code: '2-1', table_number: 5, seats: 6, hourly_rate: 140 },

      // Суши Гарден 1
      { id: '3-1/1', address_code: '3-1', table_number: 1, seats: 4, hourly_rate: 50 },
      { id: '3-1/2', address_code: '3-1', table_number: 2, seats: 4, hourly_rate: 50 },
      { id: '3-1/3', address_code: '3-1', table_number: 3, seats: 4, hourly_rate: 50 },
      { id: '3-1/4', address_code: '3-1', table_number: 4, seats: 2, hourly_rate: 30 },
      { id: '3-1/5', address_code: '3-1', table_number: 5, seats: 2, hourly_rate: 30 },
      { id: '3-1/6', address_code: '3-1', table_number: 6, seats: 6, hourly_rate: 80 },

      // Суши Гарден 2
      { id: '3-2/1', address_code: '3-2', table_number: 1, seats: 4, hourly_rate: 50 },
      { id: '3-2/2', address_code: '3-2', table_number: 2, seats: 4, hourly_rate: 50 },
      { id: '3-2/3', address_code: '3-2', table_number: 3, seats: 4, hourly_rate: 50 },
      { id: '3-2/4', address_code: '3-2', table_number: 4, seats: 2, hourly_rate: 30 },
      { id: '3-2/5', address_code: '3-2', table_number: 5, seats: 2, hourly_rate: 30 },
      { id: '3-2/6', address_code: '3-2', table_number: 6, seats: 6, hourly_rate: 80 },

      // СиФуд 1
      { id: '4-1/1', address_code: '4-1', table_number: 1, seats: 4, hourly_rate: 60 },
      { id: '4-1/2', address_code: '4-1', table_number: 2, seats: 4, hourly_rate: 60 },
      { id: '4-1/3', address_code: '4-1', table_number: 3, seats: 6, hourly_rate: 80 },
      { id: '4-1/4', address_code: '4-1', table_number: 4, seats: 6, hourly_rate: 80 },
      { id: '4-1/5', address_code: '4-1', table_number: 5, seats: 8, hourly_rate: 100 },

      // Хот Пицца 1
      { id: '5-1/1', address_code: '5-1', table_number: 1, seats: 4, hourly_rate: 50 },
      { id: '5-1/2', address_code: '5-1', table_number: 2, seats: 4, hourly_rate: 50 },
      { id: '5-1/3', address_code: '5-1', table_number: 3, seats: 4, hourly_rate: 50 },
      { id: '5-1/4', address_code: '5-1', table_number: 4, seats: 2, hourly_rate: 30 },
      { id: '5-1/5', address_code: '5-1', table_number: 5, seats: 6, hourly_rate: 70 },
      { id: '5-1/6', address_code: '5-1', table_number: 6, seats: 6, hourly_rate: 70 },

      // Хот Пицца 2
      { id: '5-2/1', address_code: '5-2', table_number: 1, seats: 4, hourly_rate: 50 },
      { id: '5-2/2', address_code: '5-2', table_number: 2, seats: 4, hourly_rate: 50 },
      { id: '5-2/3', address_code: '5-2', table_number: 3, seats: 4, hourly_rate: 50 },
      { id: '5-2/4', address_code: '5-2', table_number: 4, seats: 2, hourly_rate: 30 },
      { id: '5-2/5', address_code: '5-2', table_number: 5, seats: 6, hourly_rate: 70 },
      { id: '5-2/6', address_code: '5-2', table_number: 6, seats: 6, hourly_rate: 70 },

      // Валенсия 1
      { id: '6-1/1', address_code: '6-1', table_number: 1, seats: 4, hourly_rate: 100 },
      { id: '6-1/2', address_code: '6-1', table_number: 2, seats: 4, hourly_rate: 100 },
      { id: '6-1/3', address_code: '6-1', table_number: 3, seats: 2, hourly_rate: 50 },
      { id: '6-1/4', address_code: '6-1', table_number: 4, seats: 6, hourly_rate: 150 },
      { id: '6-1/5', address_code: '6-1', table_number: 5, seats: 10, hourly_rate: 200 },
    ];

    for (const table of testTables) {
      await db.run(
        'INSERT OR IGNORE INTO Tables VALUES (?, ?, ?, ?, ?)',
        [table.id, table.address_code, table.table_number, table.seats, table.hourly_rate]
      );
    }

    // // Добавление тестовой брони (только если её нет)
    // const testBookingExists = await db.get(
    //   `SELECT 1 FROM Bookings 
    //   WHERE user_id = 1 
    //     AND table_id = '1-1/1' 
    //     AND booking_date = '2025-05-20' 
    //     AND start_time = '17:00' 
    //   LIMIT 1`
    // );

    // if (!testBookingExists) {
    //   await db.run(
    //     `INSERT INTO Bookings 
    //     (user_id, table_id, booking_date, start_time, end_time) 
    //     VALUES (?, ?, ?, ?, ?)`,
    //     [1, '1-1/1', '2025-06-20', '17:00', '18:00']
    //   );
    // }

    // Добавление тестового пользователя
    await seedTestUser();

  } catch (e) {
    console.error('Database initialization error:', e);
    throw e;
  }
}

async function seedTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('test12345', 10);
    await db.run(
      `INSERT OR IGNORE INTO Accounts (name, phone, email, password) 
       VALUES (?, ?, ?, ?)`,
      ['Тестовый Пользователь', '+7 999 111 22 33', 'test@test.com', hashedPassword]
    );
  } catch (e) {
    console.log('Тестовый пользователь уже существует или ошибка:', e);
  }
}

export async function getDb() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}