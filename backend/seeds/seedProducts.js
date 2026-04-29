require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { db, initializeDB, runTransaction } = require('../src/config/database');
const { BRANCHES } = require('../src/config/branches');
const path = require('path');
const fs = require('fs');

initializeDB();

const dataPath = path.resolve(__dirname, '../../simba_products (2).json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const products = data.products;

const CATEGORY_ICONS = {
  'Alcoholic Drinks': '🍷',
  'Baby Products': '🧸',
  'Cleaning & Sanitary': '🧹',
  'Cosmetics & Personal Care': '💄',
  'Food Products': '🥫',
  'General': '📦',
  'Kitchen Storage': '🫙',
  'Kitchenware & Electronics': '🍳',
  'Pet Care': '🐾',
  'Sports & Wellness': '⚽'
};

const FEATURED_CATEGORIES = ['Food Products', 'Alcoholic Drinks', 'Kitchenware & Electronics', 'Cosmetics & Personal Care'];
const categoryNames = [...new Set(products.map(p => p.category))];

const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, icon) VALUES (?, ?)');
const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (id, name, description, price, category_id, image_url, stock_quantity, unit, in_stock, featured)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const upsertBranchStock = db.prepare(`
  INSERT INTO product_branch_stock (product_id, branch_id, stock_count)
  VALUES (?, ?, ?)
  ON CONFLICT(product_id, branch_id) DO UPDATE SET stock_count = excluded.stock_count
`);

runTransaction(() => {
  db.exec('DELETE FROM product_branch_stock');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM categories');

  for (const name of categoryNames) {
    insertCategory.run(name, CATEGORY_ICONS[name] || '🛒');
  }

  const categoryMap = {};
  const cats = db.prepare('SELECT id, name FROM categories').all();
  for (const c of cats) categoryMap[c.name] = Number(c.id);

  let count = 0;
  for (const p of products) {
    const categoryId = categoryMap[p.category] || 1;
    const featured = FEATURED_CATEGORIES.includes(p.category) ? 1 : 0;
    const description = `${p.name}. Category: ${p.category}. Unit: ${p.unit || 'Pcs'}.`;

    insertProduct.run(
      p.id, p.name, description, p.price, categoryId, p.image,
      Math.floor(Math.random() * 200) + 10,
      p.unit || 'Pcs', p.inStock ? 1 : 0, featured
    );

    for (const branch of BRANCHES) {
      const stockCount = p.inStock ? Math.floor(Math.random() * 40) + 5 : 0;
      upsertBranchStock.run(p.id, branch.id, stockCount);
    }
    count++;
  }
  console.log(`✅ Seeded ${count} products across ${categoryNames.length} categories`);
});

const totals = db.prepare('SELECT COUNT(*) as total FROM products').get();
const catTotals = db.prepare('SELECT c.name, COUNT(p.id) as count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id').all();

console.log('\n📊 Database Summary:');
console.log(`   Total products: ${totals.total}`);
catTotals.forEach(c => console.log(`   ${c.name}: ${c.count} products`));
console.log('\n🦁 Simba Supermarket database ready!\n');
