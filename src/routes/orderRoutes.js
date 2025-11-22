const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById
} = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

module.exports = router;
