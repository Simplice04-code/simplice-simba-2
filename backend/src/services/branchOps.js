const { db } = require('../config/database');
const { BRANCHES, PICKUP_TIME_SLOTS, branchDepositAmount } = require('../config/branches');

function getBranchesWithRatings() {
  const branches = db.prepare(`
    SELECT b.*,
           COALESCE(SUM(CASE WHEN pbs.stock_count > 0 THEN 1 ELSE 0 END), 0) AS stocked_products
    FROM branches b
    LEFT JOIN product_branch_stock pbs ON pbs.branch_id = b.id
    GROUP BY b.id
  `).all();

  const order = new Map(BRANCHES.map((branch, index) => [branch.id, index]));
  return branches.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

function getOrderItemsForCheckout(userId) {
  const cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(userId);
  if (!cart) return [];

  return db.prepare(`
    SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.image_url
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ?
  `).all(cart.id);
}

function getBranchStock(productId, branchId) {
  return db.prepare(`
    SELECT stock_count
    FROM product_branch_stock
    WHERE product_id = ? AND branch_id = ?
  `).get(productId, branchId);
}

function validateBranchStock(items, branchId) {
  const shortages = [];

  for (const item of items) {
    const row = getBranchStock(item.product_id, branchId);
    const available = row ? Number(row.stock_count) : 0;
    if (available < item.quantity) {
      shortages.push({
        product_id: item.product_id,
        name: item.name,
        requested: item.quantity,
        available
      });
    }
  }

  return shortages;
}

function decrementBranchStock(items, branchId) {
  for (const item of items) {
    const result = db.prepare(`
      UPDATE product_branch_stock
      SET stock_count = stock_count - ?
      WHERE product_id = ? AND branch_id = ? AND stock_count >= ?
    `).run(item.quantity, item.product_id, branchId, item.quantity);

    if (result.changes === 0) {
      throw new Error(`Insufficient stock for product ${item.product_id} at branch ${branchId}`);
    }
  }
}

function refreshBranchRating(branchId) {
  const row = db.prepare(`
    SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS rating_count
    FROM branch_reviews
    WHERE branch_id = ?
  `).get(branchId);

  db.prepare(`
    UPDATE branches
    SET average_rating = ?, rating_count = ?
    WHERE id = ?
  `).run(Number(row.average_rating || 0), Number(row.rating_count || 0), branchId);
}

module.exports = {
  BRANCHES,
  PICKUP_TIME_SLOTS,
  branchDepositAmount,
  getBranchesWithRatings,
  getOrderItemsForCheckout,
  validateBranchStock,
  decrementBranchStock,
  refreshBranchRating
};
