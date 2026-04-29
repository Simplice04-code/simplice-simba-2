const { db, runTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { decrementBranchStock } = require('../services/branchOps');

function simulatePayment(method, phone, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = true;
      resolve({
        success,
        transaction_reference: success ? 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase() : null,
        message: success ? 'Payment successful' : 'Payment failed. Please try again.'
      });
    }, 1500);
  });
}

function finalizePickupOrder(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order || order.order_type !== 'pickup' || order.deposit_status === 'paid') {
    return;
  }

  const items = db.prepare(`
    SELECT oi.product_id, oi.quantity, p.name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(orderId);

  runTransaction(() => {
    decrementBranchStock(items, order.branch_id);
    db.prepare(`
      UPDATE orders
      SET status = 'confirmed',
          deposit_status = 'paid',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);
  });
}

exports.processMoMo = async (req, res) => {
  const { order_id, phone } = req.body;
  if (!order_id || !phone) {
    return res.status(400).json({ success: false, message: 'order_id and phone are required.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const paymentId = uuidv4();
  const amount = order.order_type === 'pickup' ? Number(order.deposit_amount || 0) : order.total_price;
  db.prepare(
    'INSERT INTO payments (id, order_id, method, status, amount) VALUES (?, ?, ?, ?, ?)'
  ).run(paymentId, order_id, order.order_type === 'pickup' ? 'MoMo Deposit' : 'MoMo', 'processing', amount);

  const result = await simulatePayment('MoMo', phone, amount);

  const status = result.success ? 'paid' : 'failed';
  db.prepare('UPDATE payments SET status = ?, transaction_reference = ? WHERE id = ?').run(status, result.transaction_reference, paymentId);

  if (result.success) {
    if (order.order_type === 'pickup') {
      finalizePickupOrder(order_id);
      db.prepare("UPDATE orders SET payment_method = 'MoMo Deposit', deposit_payment_reference = ? WHERE id = ?").run(result.transaction_reference, order_id);
    } else {
      db.prepare("UPDATE orders SET status = 'confirmed', payment_method = 'MoMo' WHERE id = ?").run(order_id);
    }
  }

  res.json({
    success: result.success,
    message: order.order_type === 'pickup' && result.success
      ? `Deposit paid successfully. Your pickup order is confirmed for ${order.pickup_time_slot}.`
      : result.message,
    payment: {
      id: paymentId,
      method: order.order_type === 'pickup' ? 'MoMo Deposit' : 'MoMo',
      status,
      transaction_reference: result.transaction_reference,
      amount
    }
  });
};

exports.processAirtel = async (req, res) => {
  const { order_id, phone } = req.body;
  if (!order_id || !phone) {
    return res.status(400).json({ success: false, message: 'order_id and phone are required.' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const paymentId = uuidv4();
  db.prepare(
    'INSERT INTO payments (id, order_id, method, status, amount) VALUES (?, ?, ?, ?, ?)'
  ).run(paymentId, order_id, 'Airtel', 'processing', order.total_price);

  const result = await simulatePayment('Airtel', phone, order.total_price);

  const status = result.success ? 'paid' : 'failed';
  db.prepare('UPDATE payments SET status = ?, transaction_reference = ? WHERE id = ?').run(status, result.transaction_reference, paymentId);

  if (result.success) {
    db.prepare("UPDATE orders SET status = 'confirmed', payment_method = 'Airtel' WHERE id = ?").run(order_id);
  }

  res.json({
    success: result.success,
    message: result.message,
    payment: { id: paymentId, method: 'Airtel', status, transaction_reference: result.transaction_reference }
  });
};

exports.confirmCOD = (req, res) => {
  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ success: false, message: 'order_id is required.' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const paymentId = uuidv4();
  db.prepare(
    'INSERT INTO payments (id, order_id, method, status, transaction_reference, amount) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(paymentId, order_id, 'COD', 'pending_delivery', 'COD-' + Date.now(), order.total_price);

  db.prepare("UPDATE orders SET status = 'confirmed', payment_method = 'COD' WHERE id = ?").run(order_id);

  res.json({ success: true, message: 'Order confirmed. Pay on delivery.', payment_id: paymentId });
};
