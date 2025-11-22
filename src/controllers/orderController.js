const { pool } = require('../config/database');

const createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { shipping_address } = req.body;

    if (!shipping_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Адрес доставки обязателен' 
      });
    }

    await client.query('BEGIN');

    const cartResult = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        error: 'Корзина пуста' 
      });
    }

    for (const item of cartResult.rows) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          error: `Недостаточно товара "${item.name}" на складе` 
        });
      }
    }

    const totalAmount = cartResult.rows.reduce(
      (sum, item) => sum + (parseFloat(item.price) * item.quantity), 
      0
    );

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [userId, totalAmount, shipping_address]
    );

    const order = orderResult.rows[0];

    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.price]
      );

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    const orderDetails = await pool.query(
      `SELECT o.*, 
              json_agg(json_build_object(
                'product_id', oi.product_id,
                'name', p.name,
                'quantity', oi.quantity,
                'price', oi.price
              )) as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [order.id]
    );

    res.status(201).json({
      success: true,
      message: 'Заказ успешно создан',
      order: orderDetails.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при создании заказа' 
    });
  } finally {
    client.release();
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT o.*, 
              json_agg(json_build_object(
                'product_id', oi.product_id,
                'name', p.name,
                'quantity', oi.quantity,
                'price', oi.price
              )) as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      orders: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении заказов' 
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, 
              json_agg(json_build_object(
                'product_id', oi.product_id,
                'name', p.name,
                'quantity', oi.quantity,
                'price', oi.price
              )) as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Заказ не найден' 
      });
    }

    res.json({
      success: true,
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении заказа' 
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById
};
