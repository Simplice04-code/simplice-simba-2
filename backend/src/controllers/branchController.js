const { db } = require('../config/database');
const {
  getBranchesWithRatings,
  PICKUP_TIME_SLOTS,
  refreshBranchRating
} = require('../services/branchOps');

exports.listBranches = (req, res) => {
  const branches = getBranchesWithRatings();
  res.json({ success: true, branches, pickup_time_slots: PICKUP_TIME_SLOTS });
};

exports.getManagerOrders = (req, res) => {
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Manager access required.' });
  }

  const orders = db.prepare(`
    SELECT o.*, u.name AS customer_name, u.phone AS customer_phone, b.name AS branch_name, s.name AS assigned_staff_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN branches b ON b.id = o.branch_id
    LEFT JOIN users s ON s.id = o.assigned_staff_user_id
    WHERE o.order_type = 'pickup' AND o.status IN ('confirmed', 'assigned', 'preparing')
    ORDER BY o.created_at DESC
  `).all();

  res.json({ success: true, orders });
};

exports.listStaffMembers = (req, res) => {
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Manager access required.' });
  }

  const staff = db.prepare(`
    SELECT id, name, email, role
    FROM users
    WHERE role IN ('staff', 'manager', 'admin')
    ORDER BY name
  `).all();

  res.json({ success: true, staff });
};

exports.assignOrder = (req, res) => {
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Manager access required.' });
  }

  const { staff_user_id } = req.body;
  if (!staff_user_id) {
    return res.status(400).json({ success: false, message: 'staff_user_id is required.' });
  }

  const staff = db.prepare('SELECT id, role, name FROM users WHERE id = ?').get(staff_user_id);
  if (!staff || !['staff', 'manager', 'admin'].includes(staff.role)) {
    return res.status(404).json({ success: false, message: 'Selected staff member was not found.' });
  }

  const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  db.prepare(`
    UPDATE orders
    SET assigned_staff_user_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(staff_user_id, req.params.id);

  res.json({ success: true, message: `Order assigned to ${staff.name}.` });
};

exports.getStaffOrders = (req, res) => {
  if (!['staff', 'manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff access required.' });
  }

  const orders = db.prepare(`
    SELECT o.*, u.name AS customer_name, u.phone AS customer_phone, b.name AS branch_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN branches b ON b.id = o.branch_id
    WHERE o.order_type = 'pickup' AND o.assigned_staff_user_id = ? AND o.status IN ('assigned', 'preparing', 'ready_for_pickup')
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json({ success: true, orders });
};

exports.markReadyForPickup = (req, res) => {
  if (!['staff', 'manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff access required.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (req.user.role === 'staff' && order.assigned_staff_user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only update your assigned orders.' });
  }

  db.prepare(`
    UPDATE orders
    SET status = 'ready_for_pickup', ready_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: 'Order marked ready for pickup.' });
};

exports.submitBranchReview = (req, res) => {
  const { order_id, rating, comment } = req.body;
  if (!order_id || !rating) {
    return res.status(400).json({ success: false, message: 'order_id and rating are required.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  const order = db.prepare(`
    SELECT id, branch_id, status, user_id
    FROM orders
    WHERE id = ? AND user_id = ?
  `).get(order_id, req.user.id);

  if (!order || order.branch_id !== req.params.id) {
    return res.status(404).json({ success: false, message: 'Eligible branch order not found.' });
  }
  if (order.status !== 'picked_up') {
    return res.status(400).json({ success: false, message: 'You can review a branch only after the order is marked picked up.' });
  }

  db.prepare(`
    INSERT INTO branch_reviews (branch_id, user_id, order_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(order_id, user_id) DO UPDATE SET
      rating = excluded.rating,
      comment = excluded.comment
  `).run(req.params.id, req.user.id, order_id, rating, comment || null);

  refreshBranchRating(req.params.id);
  const branch = db.prepare('SELECT average_rating, rating_count FROM branches WHERE id = ?').get(req.params.id);
  res.json({ success: true, message: 'Branch review saved.', branch });
};
