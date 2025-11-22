const { pool } = require('../config/database');

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.description, 
              p.price, p.image_url, p.stock,
              (ci.quantity * p.price) as subtotal
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [userId]
    );

    const total = result.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      cart: result.rows,
      total: total.toFixed(2),
      items_count: result.rows.length
    });
  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении корзины' 
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID продукта обязателен' 
      });
    }

    const productCheck = await pool.query('SELECT stock FROM products WHERE id = $1', [product_id]);
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Продукт не найден' 
      });
    }

    const existingCart = await pool.query(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    const currentQuantity = existingCart.rows.length > 0 ? existingCart.rows[0].quantity : 0;
    const newQuantity = currentQuantity + quantity;

    if (productCheck.rows[0].stock < newQuantity) {
      return res.status(400).json({ 
        success: false, 
        error: `Недостаточно товара на складе. Доступно: ${productCheck.rows[0].stock}, в корзине: ${currentQuantity}` 
      });
    }

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [userId, product_id, quantity]
    );

    res.status(201).json({
      success: true,
      message: 'Товар добавлен в корзину',
      cart_item: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при добавлении в корзину' 
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Количество должно быть больше 0' 
      });
    }

    const cartItem = await pool.query(
      'SELECT product_id FROM cart_items WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Товар в корзине не найден' 
      });
    }

    const productCheck = await pool.query(
      'SELECT stock FROM products WHERE id = $1',
      [cartItem.rows[0].product_id]
    );

    if (productCheck.rows[0].stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: `Недостаточно товара на складе. Доступно: ${productCheck.rows[0].stock}` 
      });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, userId]
    );

    res.json({
      success: true,
      message: 'Количество обновлено',
      cart_item: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления корзины:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при обновлении корзины' 
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Товар в корзине не найден' 
      });
    }

    res.json({
      success: true,
      message: 'Товар удален из корзины'
    });
  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при удалении из корзины' 
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: 'Корзина очищена'
    });
  } catch (error) {
    console.error('Ошибка очистки корзины:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при очистке корзины' 
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
