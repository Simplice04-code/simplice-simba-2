const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listBranches,
  getManagerOrders,
  listStaffMembers,
  assignOrder,
  getStaffOrders,
  markReadyForPickup,
  submitBranchReview
} = require('../controllers/branchController');

router.get('/', listBranches);
router.get('/manager/orders', auth, getManagerOrders);
router.get('/manager/staff', auth, listStaffMembers);
router.patch('/manager/orders/:id/assign', auth, assignOrder);
router.get('/staff/orders', auth, getStaffOrders);
router.patch('/staff/orders/:id/ready', auth, markReadyForPickup);
router.post('/:id/reviews', auth, submitBranchReview);

module.exports = router;
