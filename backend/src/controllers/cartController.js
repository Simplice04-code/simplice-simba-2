const { db } = require('../config/database');

function getOrCreateCart(userId) {
  let cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(userId);
  if (!cart) {
    const result = db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
    cart = db.prepare('SELECT * FROM cart WHERE id = ?').get(result.lastInsertRowid);
  }
  return cart;
}

function getCartWithItems(cartId) {
  return db.prepare(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.in_stock, p.unit, c.name as category_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ci.cart_id = ?
  `).all(cartId);
}

exports.getCart = (req, res) => {
  const cart = getOrCreateCart(req.user.id);
  const items = getCartWithItems(cart.id);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, cart: { id: cart.id, items, total, item_count: items.length } });
};

exports.addToCart = (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });
  if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const cart = getOrCreateCart(req.user.id);

  const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cart.id, product_id);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(cart.id, product_id, quantity);
  }

  const items = getCartWithItems(cart.id);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, message: 'Added to cart.', cart: { id: cart.id, items, total, item_count: items.length } });
};

exports.updateCartItem = (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'Valid quantity required.' });

  const cart = getOrCreateCart(req.user.id);
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?').get(req.params.itemId, cart.id);
  if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, item.id);
  const items = getCartWithItems(cart.id);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, cart: { id: cart.id, items, total, item_count: items.length } });
};

exports.removeFromCart = (req, res) => {
  const cart = getOrCreateCart(req.user.id);
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?').get(req.params.itemId, cart.id);
  if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  const items = getCartWithItems(cart.id);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  res.json({ success: true, message: 'Item removed.', cart: { id: cart.id, items, total, item_count: items.length } });
};

exports.clearCart = (req, res) => {
  const cart = getOrCreateCart(req.user.id);
  db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
  res.json({ success: true, message: 'Cart cleared.', cart: { id: cart.id, items: [], total: 0, item_count: 0 } });
};
