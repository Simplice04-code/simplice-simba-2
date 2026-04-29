const express = require('express');
const router = express.Router();
const { calculateDelivery, getDistricts } = require('../controllers/deliveryController');

router.post('/calculate', calculateDelivery);
router.get('/districts', getDistricts);

module.exports = router;
