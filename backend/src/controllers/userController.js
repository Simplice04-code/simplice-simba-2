const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

exports.getProfile = (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, gender, district, sector, village, street, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user });
};

exports.updateProfile = (req, res) => {
  const { name, phone, gender, district, sector, village, street, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const newName = name || user.name;
  const newPhone = phone !== undefined ? phone : user.phone;
  const newGender = gender !== undefined ? gender : user.gender;
  const newDistrict = district !== undefined ? district : user.district;
  const newSector = sector !== undefined ? sector : user.sector;
  const newVillage = village !== undefined ? village : user.village;
  const newStreet = street !== undefined ? street : user.street;
  const newPassword = password ? bcrypt.hashSync(password, 10) : user.password;

  db.prepare(
    'UPDATE users SET name=?, phone=?, gender=?, district=?, sector=?, village=?, street=?, password=? WHERE id=?'
  ).run(newName, newPhone, newGender, newDistrict, newSector, newVillage, newStreet, newPassword, req.user.id);

  const updated = db.prepare('SELECT id, name, email, phone, gender, district, sector, village, street, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, message: 'Profile updated.', user: updated });
};

exports.getOrderHistory = (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, GROUP_CONCAT(json_object('product_id', oi.product_id, 'name', p.name, 'quantity', oi.quantity, 'price', oi.price, 'image_url', p.image_url)) as items_json
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  const result = orders.map(o => ({
    ...o,
    items: o.items_json ? JSON.parse('[' + o.items_json + ']') : []
  }));
  delete result.items_json;

  res.json({ success: true, orders: result });
};
