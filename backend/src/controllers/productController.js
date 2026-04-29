const { db } = require('../config/database');
const { BRANCHES } = require('../config/branches');

function buildConversationResponse(query, products) {
  const lower = String(query || '').toLowerCase();

  if (products.length === 0) {
    return `I could not find a strong match for "${query}". Try mentioning a meal, mood, or product type.`;
  }

  if (lower.includes('breakfast')) {
    return 'Here are a few breakfast-friendly picks from Simba, including quick pantry and dairy options.';
  }
  if (lower.includes('party') || lower.includes('guests')) {
    return 'These items look useful for hosting guests, with a mix of snacks, drinks, and shareable essentials.';
  }
  if (lower.includes('baby')) {
    return 'I found a few baby-focused products that match your request.';
  }
  if (lower.includes('healthy') || lower.includes('wellness')) {
    return 'These products line up with a healthier shopping basket or wellness routine.';
  }

  return `I found ${products.length} product match${products.length === 1 ? '' : 'es'} for "${query}".`;
}

exports.getProducts = (req, res) => {
  const { category, search, minPrice, maxPrice, inStock, sort, branch_id, page = 1, limit = 24 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const hasBranchFilter = Boolean(branch_id);

  let where = [];
  let params = [];

  if (category) {
    where.push('c.name = ?');
    params.push(category);
  }
  if (search) {
    where.push('p.name LIKE ?');
    params.push('%' + search + '%');
  }
  if (minPrice) {
    where.push('p.price >= ?');
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    where.push('p.price <= ?');
    params.push(parseFloat(maxPrice));
  }
  if (inStock === 'true') {
    where.push('p.in_stock = 1');
  }
  if (hasBranchFilter) {
    where.push('COALESCE(bs.stock_count, 0) > 0');
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const branchJoin = hasBranchFilter ? 'LEFT JOIN product_branch_stock bs ON bs.product_id = p.id AND bs.branch_id = ?' : '';
  const branchSelect = hasBranchFilter ? ', COALESCE(bs.stock_count, p.stock_quantity) as branch_stock' : ', p.stock_quantity as branch_stock';
  const branchParams = hasBranchFilter ? [branch_id] : [];

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'name_asc') orderBy = 'p.name ASC';
  else if (sort === 'rating') orderBy = 'avg_rating DESC';

  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${branchJoin}
    ${whereClause}
  `;
  const total = db.prepare(countQuery).get(...branchParams, ...params).total;

  const productsQuery = `
    SELECT p.*, c.name as category_name
           ${branchSelect},
           COALESCE(AVG(r.rating), 0) as avg_rating,
           COUNT(r.id) as review_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${branchJoin}
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const products = db.prepare(productsQuery).all(...branchParams, ...params, parseInt(limit), offset);

  res.json({
    success: true,
    products,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

exports.getProduct = (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name,
           COALESCE(AVG(r.rating), 0) as avg_rating,
           COUNT(r.id) as review_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `).get(req.params.id);

  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all(req.params.id);

  const related = db.prepare(`
    SELECT p.*, COALESCE(AVG(r.rating), 0) as avg_rating
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.category_id = ? AND p.id != ?
    GROUP BY p.id
    ORDER BY RANDOM()
    LIMIT 8
  `).all(product.category_id, product.id);

  const branch_stock = db.prepare(`
    SELECT b.id, b.name, b.district, COALESCE(pbs.stock_count, 0) as stock_count, b.average_rating, b.rating_count
    FROM branches b
    LEFT JOIN product_branch_stock pbs ON pbs.branch_id = b.id AND pbs.product_id = ?
    ORDER BY b.name
  `).all(product.id);

  res.json({ success: true, product, reviews, related, branch_stock });
};

exports.getCategories = (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json({ success: true, categories });
};

exports.getFeatured = (req, res) => {
  const featured = db.prepare(`
    SELECT p.*, c.name as category_name, COALESCE(AVG(r.rating), 0) as avg_rating
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.featured = 1 OR p.in_stock = 1
    GROUP BY p.id
    ORDER BY RANDOM()
    LIMIT 12
  `).all();
  res.json({ success: true, products: featured });
};

exports.conversationalSearch = (req, res) => {
  const { query, branch_id } = req.body;
  if (!query || String(query).trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Please enter a longer search prompt.' });
  }

  const normalized = String(query).trim();
  const words = normalized.toLowerCase().split(/\s+/).filter(Boolean);
  const hasBranchFilter = Boolean(branch_id);
  const keywordFilters = [];
  const params = [];

  for (const word of words.slice(0, 8)) {
    keywordFilters.push('(LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(c.name) LIKE ?)');
    params.push(`%${word}%`, `%${word}%`, `%${word}%`);
  }

  const branchJoin = hasBranchFilter ? 'LEFT JOIN product_branch_stock bs ON bs.product_id = p.id AND bs.branch_id = ?' : '';
  const branchSelect = hasBranchFilter ? 'COALESCE(bs.stock_count, p.stock_quantity)' : 'p.stock_quantity';
  const branchParams = hasBranchFilter ? [branch_id] : [];

  const products = db.prepare(`
    SELECT p.*, c.name as category_name, ${branchSelect} as branch_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${branchJoin}
    ${keywordFilters.length ? `WHERE ${keywordFilters.join(' OR ')}` : ''}
    ORDER BY ${branchSelect} DESC, p.featured DESC, p.created_at DESC
    LIMIT 12
  `).all(...branchParams, ...params);

  res.json({
    success: true,
    response: buildConversationResponse(normalized, products),
    products,
    branches: BRANCHES
  });
};

exports.addReview = (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  try {
    db.prepare(
      'INSERT OR REPLACE INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, productId, rating, comment || null);
    res.json({ success: true, message: 'Review submitted.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Could not submit review.' });
  }
};
