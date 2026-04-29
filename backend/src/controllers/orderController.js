const { db, runTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const {
  getOrderItemsForCheckout,
  validateBranchStock,
  branchDepositAmount
} = require('../services/branchOps');

const ORDER_STATUSES = ['pending', 'pending_deposit', 'confirmed', 'assigned', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];

exports.createOrder = (req, res) => {
  const {
    order_type = 'pickup',
    branch_id,
    pickup_time_slot,
    delivery_address,
    delivery_district,
    delivery_notes,
    payment_method = 'MoMo',
    items
  } = req.body;

  if (order_type === 'pickup') {
    if (!branch_id) {
      return res.status(400).json({ success: false, message: 'Please select a Simba branch for pickup.' });
    }
    if (!pickup_time_slot) {
      return res.status(400).json({ success: false, message: 'Please select a pickup time slot.' });
    }
  }

  if (order_type !== 'pickup' && !delivery_address) {
    return res.status(400).json({ success: false, message: 'Delivery address is required.' });
  }

  let orderItems = items;

  if (!orderItems || orderItems.length === 0) {
    orderItems = getOrderItemsForCheckout(req.user.id).map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.price,
      name: i.name
    }));
  }

  if (orderItems.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty.' });

  if (order_type === 'pickup') {
    const shortages = validateBranchStock(orderItems, branch_id);
    if (shortages.length > 0) {
      const first = shortages[0];
      return res.status(400).json({
        success: false,
        message: `${first.name} only has ${first.available} left at the selected branch.`,
        shortages
      });
    }
  }

  const total_price = orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const deposit_amount = order_type === 'pickup' ? branchDepositAmount(branch_id) : 0;
  const orderId = uuidv4();

  runTransaction(() => {
    db.prepare(
      `INSERT INTO orders (
        id, user_id, total_price, status, order_type, branch_id, pickup_time_slot,
        deposit_amount, deposit_status, delivery_address, delivery_district, delivery_notes, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      orderId,
      req.user.id,
      total_price,
      order_type === 'pickup' ? 'pending_deposit' : 'pending',
      order_type,
      branch_id || null,
      pickup_time_slot || null,
      deposit_amount,
      order_type === 'pickup' ? 'pending' : 'not_required',
      delivery_address || null,
      delivery_district || null,
      delivery_notes || null,
      payment_method
    );

    for (const item of orderItems) {
      db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(orderId, item.product_id, item.quantity, item.price);
    }

    const cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.user.id);
    if (cart) db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
  });

  const order = db.prepare(`
    SELECT o.*, b.name as branch_name
    FROM orders o
    LEFT JOIN branches b ON b.id = o.branch_id
    WHERE o.id = ?
  `).get(orderId);
  const orderItemsList = db.prepare(`
    SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
  `).all(orderId);

  res.status(201).json({
    success: true,
    message: order_type === 'pickup' ? 'Pickup order created. Deposit payment is required to confirm it.' : 'Order placed successfully!',
    order: { ...order, items: orderItemsList }
  });
};

exports.getOrder = (req, res) => {
  const order = db.prepare(`
    SELECT o.*, b.name as branch_name, b.average_rating as branch_average_rating
    FROM orders o
    LEFT JOIN branches b ON b.id = o.branch_id
    WHERE o.id = ? AND o.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const items = db.prepare(`
    SELECT oi.*, p.name, p.image_url, p.unit FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
  `).all(order.id);

  res.json({ success: true, order: { ...order, items } });
};

exports.getUserOrders = (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, b.name as branch_name, b.average_rating as branch_average_rating, b.rating_count as branch_rating_count
    FROM orders o
    LEFT JOIN branches b ON b.id = o.branch_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  const result = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  res.json({ success: true, orders: result });
};

exports.updateOrderStatus = (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, order.id);
  res.json({ success: true, message: 'Order status updated.', status });
};

exports.markPickedUp = (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (order.status !== 'ready_for_pickup') {
    return res.status(400).json({ success: false, message: 'This order is not ready for pickup yet.' });
  }

  db.prepare(`
    UPDATE orders
    SET status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(order.id);

  res.json({ success: true, message: 'Order marked as picked up.' });
};
