const { DatabaseSync } = require('node:sqlite');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { BRANCHES } = require('./branches');

const dbPath = path.resolve(__dirname, '../../simba.db');
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

function initializeDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '🛒',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      google_id TEXT,
      phone TEXT,
      gender TEXT,
      district TEXT,
      sector TEXT,
      village TEXT,
      street TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      district TEXT NOT NULL,
      area TEXT,
      pickup_enabled INTEGER DEFAULT 1,
      average_rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category_id INTEGER,
      image_url TEXT,
      stock_quantity INTEGER DEFAULT 100,
      unit TEXT DEFAULT 'Pcs',
      in_stock INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS product_branch_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      branch_id TEXT NOT NULL,
      stock_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      UNIQUE(product_id, branch_id)
    );

    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      order_type TEXT DEFAULT 'delivery',
      branch_id TEXT,
      pickup_time_slot TEXT,
      assigned_staff_user_id INTEGER,
      deposit_amount REAL DEFAULT 0,
      deposit_status TEXT DEFAULT 'not_required',
      deposit_payment_reference TEXT,
      ready_at DATETIME,
      picked_up_at DATETIME,
      delivery_address TEXT,
      delivery_district TEXT,
      delivery_notes TEXT,
      payment_method TEXT DEFAULT 'COD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (assigned_staff_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS branch_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      order_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      UNIQUE(order_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      transaction_reference TEXT,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_branch_reviews_branch ON branch_reviews(branch_id);
  `);

  const userColumns = db.prepare("PRAGMA table_info(users)").all();
  const orderColumns = db.prepare("PRAGMA table_info(orders)").all();

  if (!userColumns.some((column) => column.name === 'google_id')) {
    db.exec('ALTER TABLE users ADD COLUMN google_id TEXT');
  }

  const requiredOrderColumns = [
    ['order_type', "ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'delivery'"],
    ['branch_id', 'ALTER TABLE orders ADD COLUMN branch_id TEXT'],
    ['pickup_time_slot', 'ALTER TABLE orders ADD COLUMN pickup_time_slot TEXT'],
    ['assigned_staff_user_id', 'ALTER TABLE orders ADD COLUMN assigned_staff_user_id INTEGER'],
    ['deposit_amount', 'ALTER TABLE orders ADD COLUMN deposit_amount REAL DEFAULT 0'],
    ['deposit_status', "ALTER TABLE orders ADD COLUMN deposit_status TEXT DEFAULT 'not_required'"],
    ['deposit_payment_reference', 'ALTER TABLE orders ADD COLUMN deposit_payment_reference TEXT'],
    ['ready_at', 'ALTER TABLE orders ADD COLUMN ready_at DATETIME'],
    ['picked_up_at', 'ALTER TABLE orders ADD COLUMN picked_up_at DATETIME']
  ];

  for (const [columnName, sql] of requiredOrderColumns) {
    if (!orderColumns.some((column) => column.name === columnName)) {
      db.exec(sql);
    }
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id)');

  const insertBranch = db.prepare(`
    INSERT INTO branches (id, name, district, area, pickup_enabled)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      district = excluded.district,
      area = excluded.area,
      pickup_enabled = excluded.pickup_enabled
  `);

  runTransaction(() => {
    for (const branch of BRANCHES) {
      insertBranch.run(branch.id, branch.name, branch.district, branch.area, branch.pickup_enabled);
    }
  });

  const products = db.prepare('SELECT id, in_stock FROM products').all();
  const insertStock = db.prepare(`
    INSERT OR IGNORE INTO product_branch_stock (product_id, branch_id, stock_count)
    VALUES (?, ?, ?)
  `);

  runTransaction(() => {
    for (const product of products) {
      for (const branch of BRANCHES) {
        insertStock.run(product.id, branch.id, product.in_stock ? 20 : 0);
      }
    }
  });

  const ensureUser = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      role = excluded.role
  `);

  const demoPassword = bcrypt.hashSync('simba123', 10);
  runTransaction(() => {
    ensureUser.run('Simba Manager', 'manager@simba.demo', demoPassword, 'manager');
    ensureUser.run('Simba Staff', 'staff@simba.demo', demoPassword, 'staff');
  });

  console.log('Database initialized successfully');
}

function runTransaction(fn) {
  db.exec('BEGIN');
  try {
    fn();
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { db, initializeDB, runTransaction };
