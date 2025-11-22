require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./src/config/database');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛒 E-Commerce API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Регистрация пользователя',
        'POST /api/auth/login': 'Вход пользователя'
      },
      products: {
        'GET /api/products': 'Получить все продукты (query: category, search, limit, offset)',
        'GET /api/products/:id': 'Получить продукт по ID',
        'POST /api/products': 'Создать продукт (требуется авторизация)',
        'PUT /api/products/:id': 'Обновить продукт (требуется авторизация)',
        'DELETE /api/products/:id': 'Удалить продукт (требуется авторизация)'
      },
      cart: {
        'GET /api/cart': 'Получить корзину (требуется авторизация)',
        'POST /api/cart': 'Добавить в корзину (требуется авторизация)',
        'PUT /api/cart/:id': 'Обновить количество (требуется авторизация)',
        'DELETE /api/cart/:id': 'Удалить из корзины (требуется авторизация)',
        'DELETE /api/cart': 'Очистить корзину (требуется авторизация)'
      },
      orders: {
        'POST /api/orders': 'Создать заказ (требуется авторизация)',
        'GET /api/orders': 'Получить все заказы (требуется авторизация)',
        'GET /api/orders/:id': 'Получить заказ по ID (требуется авторизация)'
      }
    },
    instructions: {
      authorization: 'Добавьте заголовок: Authorization: Bearer <token>',
      example: 'curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/cart'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ E-Commerce сервер запущен на http://0.0.0.0:${PORT}`);
      console.log(`📚 Документация API: http://0.0.0.0:${PORT}/\n`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

startServer();
