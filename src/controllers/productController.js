const { pool } = require('../config/database');

const getAllProducts = async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      products: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Ошибка получения продуктов:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении продуктов' 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Продукт не найден' 
      });
    }

    res.json({
      success: true,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка получения продукта:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при получении продукта' 
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, image_url, stock, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Название и цена обязательны' 
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url, stock, category) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, image_url, stock || 0, category]
    );

    res.status(201).json({
      success: true,
      message: 'Продукт успешно создан',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка создания продукта:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при создании продукта' 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, stock, category } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image_url = COALESCE($4, image_url),
           stock = COALESCE($5, stock),
           category = COALESCE($6, category)
       WHERE id = $7 RETURNING *`,
      [name, description, price, image_url, stock, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Продукт не найден' 
      });
    }

    res.json({
      success: true,
      message: 'Продукт успешно обновлен',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Ошибка обновления продукта:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при обновлении продукта' 
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Продукт не найден' 
      });
    }

    res.json({
      success: true,
      message: 'Продукт успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления продукта:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при удалении продукта' 
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
