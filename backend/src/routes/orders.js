const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus,
  markPickedUp
} = require('../controllers/orderController');

router.post('/', auth, createOrder);
router.get('/user', auth, getUserOrders);
router.patch('/:id/picked-up', auth, markPickedUp);
router.get('/:id', auth, getOrder);
router.patch('/:id/status', auth, updateOrderStatus);

module.exports = router;
