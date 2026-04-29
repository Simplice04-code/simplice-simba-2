const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getProducts,
  getProduct,
  getCategories,
  getFeatured,
  addReview,
  conversationalSearch
} = require('../controllers/productController');

router.get('/', getProducts);
router.post('/conversational-search', conversationalSearch);
router.get('/featured', getFeatured);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.post('/:id/reviews', auth, addReview);

module.exports = router;
