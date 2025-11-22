const { pool } = require('../config/database');

const sampleProducts = [
  {
    name: 'Беспроводные наушники AirPods Pro',
    description: 'Премиальные беспроводные наушники с активным шумоподавлением и пространственным звуком',
    price: 24999.00,
    image_url: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
    stock: 50,
    category: 'Электроника'
  },
  {
    name: 'iPhone 15 Pro',
    description: 'Новейший флагманский смартфон с чипом A17 Pro и титановым корпусом',
    price: 99999.00,
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    stock: 30,
    category: 'Электроника'
  },
  {
    name: 'MacBook Pro 14"',
    description: 'Мощный ноутбук с чипом M3 Pro для профессионалов',
    price: 189999.00,
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    stock: 15,
    category: 'Компьютеры'
  },
  {
    name: 'Sony PlayStation 5',
    description: 'Игровая консоль нового поколения с поддержкой 4K и ray tracing',
    price: 54999.00,
    image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
    stock: 25,
    category: 'Игры'
  },
  {
    name: 'Samsung 4K Smart TV 55"',
    description: 'Современный телевизор с HDR и Smart TV функциями',
    price: 69999.00,
    image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    stock: 20,
    category: 'Электроника'
  },
  {
    name: 'Apple Watch Series 9',
    description: 'Умные часы с мониторингом здоровья и фитнес-трекингом',
    price: 39999.00,
    image_url: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400',
    stock: 40,
    category: 'Носимая электроника'
  },
  {
    name: 'iPad Air',
    description: 'Легкий и мощный планшет для работы и творчества',
    price: 64999.00,
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
    stock: 35,
    category: 'Планшеты'
  },
  {
    name: 'Canon EOS R6',
    description: 'Профессиональная беззеркальная камера для фото и видео',
    price: 159999.00,
    image_url: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400',
    stock: 10,
    category: 'Фототехника'
  },
  {
    name: 'Nike Air Max 270',
    description: 'Стильные спортивные кроссовки с максимальной амортизацией',
    price: 12999.00,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    stock: 100,
    category: 'Обувь'
  },
  {
    name: 'Робот-пылесос Xiaomi',
    description: 'Умный пылесос с навигацией и влажной уборкой',
    price: 29999.00,
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
    stock: 45,
    category: 'Бытовая техника'
  }
];

const seedProducts = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Начинаем заполнение базы данных продуктами...');

    const checkResult = await client.query('SELECT COUNT(*) FROM products');
    const count = parseInt(checkResult.rows[0].count);

    if (count > 0) {
      console.log(`ℹ️  В базе уже есть ${count} продуктов. Пропускаем заполнение.`);
      return;
    }

    for (const product of sampleProducts) {
      await client.query(
        `INSERT INTO products (name, description, price, image_url, stock, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [product.name, product.description, product.price, product.image_url, product.stock, product.category]
      );
    }

    console.log(`✅ Успешно добавлено ${sampleProducts.length} продуктов!`);
  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

seedProducts();
