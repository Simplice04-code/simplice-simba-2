function resolveApiBase() {
  if (window.SIMBA_API_BASE) {
    return String(window.SIMBA_API_BASE).replace(/\/+$/, '');
  }

  const { protocol, hostname, port } = window.location;

  // When the app is opened directly from disk, there is no host to infer from.
  if (protocol === 'file:') {
    return 'http://localhost:5000/api';
  }

  // When frontend is served by the backend itself, use same-origin requests.
  if (port === '5000') {
    return `${window.location.origin}/api`;
  }

  const apiHost = hostname || 'localhost';
  return `http://${apiHost}:5000/api`;
}

const API_BASE = resolveApiBase();
let useStaticFallback = !window.SIMBA_API_BASE && (
  window.location.protocol === 'file:' ||
  window.location.protocol === 'https:' ||
  (window.location.protocol === 'http:' && window.location.port !== '5000')
);
const STATIC_CART_KEY = 'simba_static_cart';

const Api = {
  token: localStorage.getItem('simba_token'),

  isStaticMode() {
    return useStaticFallback;
  },

  async request(method, endpoint, body = null) {
    if (useStaticFallback) {
      return Api.handleStaticFallback(method, endpoint, body);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + endpoint, opts);
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      // Fall back to static data when API is unreachable
      if (!useStaticFallback) {
        useStaticFallback = true;
        console.info('API unreachable, falling back to static data mode.');
      }
      return Api.handleStaticFallback(method, endpoint, body);
    }
  },

  async handleStaticFallback(method, endpoint, body) {
    const staticData = await Api.resolveStaticData(endpoint, method, body);
    if (staticData) {
      return { ok: true, status: 200, data: staticData };
    }
    const message = window.location.protocol === 'https:'
      ? 'Network error. Open the frontend over http://localhost:5000 or file:// because the API is served over HTTP.'
      : 'Network error. Is the server running on http://localhost:5000?';
    return { ok: false, status: 0, data: { message } };
  },

  async loadStaticData(file) {
    if (window.SIMBA_STATIC_DATA?.[file]) {
      return window.SIMBA_STATIC_DATA[file];
    }

    const paths = [
      `data/${file}.json`,
      `../frontend/data/${file}.json`,
      `/frontend/data/${file}.json`,
      `/data/${file}.json`
    ];

    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (res.ok) return await res.json();
      } catch {
        // Try the next path.
      }
    }
    return null;
  },

  async resolveStaticData(endpoint, method, body) {
    if (endpoint === '/products/conversational-search' && method === 'POST') {
      const data = await Api.loadStaticData('products');
      const query = String(body?.query || '').toLowerCase();
      const products = (data?.data || [])
        .map((product) => ({
          ...product,
          category_name: product.category_name || product.category,
          avg_rating: product.avg_rating ?? product.rating ?? 0
        }))
        .filter((product) => {
          const haystack = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
          return !query || haystack.includes(query);
        })
        .slice(0, 12);

      return {
        success: true,
        response: products.length
          ? `I found ${products.length} product match${products.length === 1 ? '' : 'es'} for "${body?.query || ''}".`
          : `I could not find a strong match for "${body?.query || ''}". Try a broader search.`,
        products,
        branches: []
      };
    }

    // Categories - app expects { categories: [...] }
    if (endpoint === '/products/categories' && method === 'GET') {
      const data = await Api.loadStaticData('categories');
      if (data && data.data) {
        return { success: true, categories: data.data };
      }
      return null;
    }

    // Products
    if (endpoint.startsWith('/products') && method === 'GET') {
      const data = await Api.loadStaticData('products');
      if (!data) return null;
      const products = (data.data || []).map((product) => ({
        ...product,
        category_name: product.category_name || product.category,
        avg_rating: product.avg_rating ?? product.rating ?? 0
      }));

      if (endpoint === '/products/featured') {
        const featured = products.filter((product) => product.featured);
        return { success: true, products: featured.length ? featured : products.slice(0, 12) };
      }

      const match = endpoint.match(/^\/products\/(\d+)$/);
      if (match) {
        const product = products.find((item) => String(item.id) === match[1]);
        const related = product
          ? products.filter((item) => item.category_id === product.category_id && item.id !== product.id).slice(0, 8)
          : [];
        return product
          ? { success: true, product, reviews: [], related, branch_stock: [] }
          : { success: false, message: 'Product not found' };
      }

      // Filter by category
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const category = params.get('category');
      const search = String(params.get('search') || '').toLowerCase();
      const inStock = params.get('inStock');
      const page = parseInt(params.get('page') || '1', 10);
      const limit = parseInt(params.get('limit') || '24', 10);
      const filtered = category
        ? products.filter((product) => product.category_id === parseInt(category, 10) || product.category === category)
        : products;
      const searched = search
        ? filtered.filter((product) => String(product.name || '').toLowerCase().includes(search))
        : filtered;
      const stockFiltered = inStock === 'true'
        ? searched.filter((product) => product.in_stock === 1 || product.in_stock === true)
        : searched;
      const start = (page - 1) * limit;
      const paged = stockFiltered.slice(start, start + limit);
      return {
        success: true,
        products: paged,
        pagination: {
          total: stockFiltered.length,
          page,
          limit,
          pages: Math.max(1, Math.ceil(stockFiltered.length / limit))
        }
      };
    }

    // Branches
    if (endpoint === '/branches' && method === 'GET') {
      const data = await Api.loadStaticData('branches');
      const branches = (data?.branches || data?.data || []).map((branch) => ({
        ...branch,
        average_rating: branch.average_rating ?? branch.rating ?? 0,
        rating_count: branch.rating_count ?? 0,
        stocked_products: branch.stocked_products ?? 789
      }));
      return {
        success: true,
        branches,
        pickup_time_slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00']
      };
    }

    // Delivery districts
    if (endpoint === '/delivery/districts' && method === 'GET') {
      return { success: true, data: ['Gasabo', 'Nyarugenge', 'Kicukiro', 'Nyanza'] };
    }

    // Auth endpoints - simulate success with mock token.
    if (endpoint === '/auth/register' && method === 'POST') {
      const mockUser = {
        id: 'mock-user-1',
        name: body.name || 'Demo User',
        email: body.email,
        phone: body.phone || '+250788000000',
        district: body.district || '',
        sector: body.sector || ''
      };
      Api.setToken('mock-token-123');
      return { success: true, token: 'mock-token-123', user: mockUser };
    }

    if (endpoint === '/auth/login' && method === 'POST') {
      const mockUser = { id: 'mock-user-1', name: 'Demo User', email: body.email, phone: '+250788000000' };
      Api.setToken('mock-token-123');
      return { success: true, token: 'mock-token-123', user: mockUser };
    }

    if (endpoint === '/auth/google' && method === 'POST') {
      const mockUser = {
        id: 'mock-user-1',
        name: body.name || 'Demo User',
        email: body.email,
        phone: '+250788000000'
      };
      Api.setToken('mock-token-123');
      return { success: true, token: 'mock-token-123', user: mockUser };
    }

    if (endpoint === '/auth/forgot-password' && method === 'POST') {
      const token = `demo-reset-${Date.now()}`;
      return {
        success: true,
        reset_token: token,
        reset_link: `${window.location.origin}${window.location.pathname}#reset?token=${token}`
      };
    }

    if (endpoint === '/auth/reset-password' && method === 'POST') {
      const mockUser = { id: 'mock-user-1', name: 'Demo User', email: 'demo@example.com', phone: '+250788000000' };
      Api.setToken('mock-token-123');
      return { success: true, token: 'mock-token-123', user: mockUser };
    }

    // Profile
    if (endpoint === '/users/profile' && method === 'GET') {
      return {
        success: true,
        user: JSON.parse(localStorage.getItem('simba_user') || 'null') || {
          id: 'mock-user-1',
          name: 'Demo User',
          email: 'demo@example.com',
          phone: '+250788000000',
          role: 'customer'
        }
      };
    }

    if (endpoint === '/users/profile' && method === 'PUT') {
      const current = JSON.parse(localStorage.getItem('simba_user') || 'null') || {};
      const user = { ...current, ...body, id: current.id || 'mock-user-1', role: current.role || 'customer' };
      localStorage.setItem('simba_user', JSON.stringify(user));
      return { success: true, user };
    }

    // Cart
    if (endpoint === '/cart' && method === 'GET') {
      return { success: true, cart: Api.getStaticCart() };
    }

    if (endpoint === '/cart' && method === 'POST') {
      const cart = await Api.addStaticCartItem(body.product_id, body.quantity || 1);
      return { success: true, cart };
    }

    const cartItemMatch = endpoint.match(/^\/cart\/(.+)$/);
    if (cartItemMatch && method === 'PUT') {
      const cart = Api.updateStaticCartItem(cartItemMatch[1], body.quantity);
      return { success: true, cart };
    }

    if (cartItemMatch && method === 'DELETE') {
      const cart = cartItemMatch[1] === 'clear'
        ? Api.saveStaticCart([])
        : Api.removeStaticCartItem(cartItemMatch[1]);
      return { success: true, cart };
    }

    // Orders
    if (endpoint === '/orders' && method === 'POST') {
      const order = this.createStaticOrder(body);
      return { success: true, order };
    }

    if (endpoint === '/orders/user' && method === 'GET') {
      return { success: true, orders: this.getStaticOrders() };
    }

    const orderPickedUpMatch = endpoint.match(/^\/orders\/(.+)\/picked-up$/);
    if (orderPickedUpMatch && method === 'PATCH') {
      return { success: true, order: this.updateStaticOrder(orderPickedUpMatch[1], { status: 'picked_up' }) };
    }

    if (endpoint === '/payments/momo' && method === 'POST') {
      if (body?.order_id) {
        this.updateStaticOrder(body.order_id, { deposit_status: 'paid', payment_status: 'paid', status: 'confirmed' });
      }
      return { success: true, message: 'Demo MoMo payment accepted.' };
    }

    if (endpoint === '/payments/airtel' && method === 'POST') {
      return { success: true, message: 'Demo Airtel payment accepted.' };
    }

    if (endpoint === '/payments/cod' && method === 'POST') {
      return { success: true, message: 'Demo cash-on-delivery order accepted.' };
    }

    return null;
  },

  get: (ep) => Api.request('GET', ep),
  post: (ep, body) => Api.request('POST', ep, body),
  put: (ep, body) => Api.request('PUT', ep, body),
  patch: (ep, body) => Api.request('PATCH', ep, body),
  delete: (ep) => Api.request('DELETE', ep),

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('simba_token', token);
    else localStorage.removeItem('simba_token');
  },

  getStaticCart() {
    const items = JSON.parse(localStorage.getItem(STATIC_CART_KEY) || '[]');
    return this.buildStaticCart(items);
  },

  saveStaticCart(items) {
    localStorage.setItem(STATIC_CART_KEY, JSON.stringify(items));
    return this.buildStaticCart(items);
  },

  buildStaticCart(items) {
    const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return { items, total, item_count: itemCount };
  },

  async addStaticCartItem(productId, quantity = 1) {
    const productsRes = await this.resolveStaticData(`/products/${productId}`, 'GET');
    if (!productsRes?.product) return this.getStaticCart();

    const items = this.getStaticCart().items;
    const existing = items.find((item) => String(item.product_id || item.id) === String(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      const product = productsRes.product;
      items.push({
        id: product.id,
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image_url: product.image_url,
        image: product.image,
        category: product.category,
        category_name: product.category_name
      });
    }
    return this.saveStaticCart(items);
  },

  updateStaticCartItem(itemId, quantity) {
    const nextQuantity = Math.max(1, Number(quantity || 1));
    const items = this.getStaticCart().items.map((item) => (
      String(item.id) === String(itemId) ? { ...item, quantity: nextQuantity } : item
    ));
    return this.saveStaticCart(items);
  },

  removeStaticCartItem(itemId) {
    const items = this.getStaticCart().items.filter((item) => String(item.id) !== String(itemId));
    return this.saveStaticCart(items);
  },

  getStaticOrders() {
    return JSON.parse(localStorage.getItem('simba_static_orders') || '[]');
  },

  saveStaticOrders(orders) {
    localStorage.setItem('simba_static_orders', JSON.stringify(orders));
    return orders;
  },

  createStaticOrder(data = {}) {
    const user = JSON.parse(localStorage.getItem('simba_user') || 'null') || {};
    const cart = this.getStaticCart();
    const order = {
      id: `demo-${Date.now()}`,
      user_id: user.id || 'mock-user-1',
      customer_name: user.name || 'Demo User',
      total_price: cart.total,
      status: 'pending',
      order_type: data.order_type || 'pickup',
      branch_id: data.branch_id || '',
      branch_name: data.branch_id || '',
      pickup_time_slot: data.pickup_time_slot || '',
      deposit_amount: data.branch_id && String(data.branch_id).includes('gasabo') ? 1000 : 500,
      deposit_status: 'pending',
      payment_status: 'pending',
      items: cart.items,
      created_at: new Date().toISOString()
    };
    const orders = [order, ...this.getStaticOrders()];
    this.saveStaticOrders(orders);
    return order;
  },

  updateStaticOrder(orderId, patch) {
    const orders = this.getStaticOrders();
    const updated = orders.map((order) => String(order.id) === String(orderId) ? { ...order, ...patch } : order);
    this.saveStaticOrders(updated);
    return updated.find((order) => String(order.id) === String(orderId)) || null;
  },

  // Auth
  async register(data) { return this.post('/auth/register', data); },
  async login(data) { return this.post('/auth/login', data); },
  async googleLogin(data) { return this.post('/auth/google', data); },
  async forgotPassword(data) { return this.post('/auth/forgot-password', data); },
  async resetPassword(data) { return this.post('/auth/reset-password', data); },

  // Users
  async getProfile() { return this.get('/users/profile'); },
  async updateProfile(data) { return this.put('/users/profile', data); },

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get('/products' + (query ? '?' + query : ''));
  },
  async conversationalSearch(data) { return this.post('/products/conversational-search', data); },
  async getProduct(id) { return this.get('/products/' + id); },
  async getFeatured() { return this.get('/products/featured'); },
  async getCategories() { return this.get('/products/categories'); },
  async addReview(productId, data) { return this.post('/products/' + productId + '/reviews', data); },

  // Branches
  async getBranches() { return this.get('/branches'); },
  async getManagerOrders() { return this.get('/branches/manager/orders'); },
  async getManagerStaff() { return this.get('/branches/manager/staff'); },
  async assignOrder(orderId, data) { return this.patch('/branches/manager/orders/' + orderId + '/assign', data); },
  async getStaffOrders() { return this.get('/branches/staff/orders'); },
  async markReadyForPickup(orderId) { return this.patch('/branches/staff/orders/' + orderId + '/ready', {}); },
  async addBranchReview(branchId, data) { return this.post('/branches/' + branchId + '/reviews', data); },

  // Cart
  async getCart() { return this.get('/cart'); },
  async addToCart(data) { return this.post('/cart', data); },
  async updateCartItem(itemId, data) { return this.put('/cart/' + itemId, data); },
  async removeFromCart(itemId) { return this.delete('/cart/' + itemId); },
  async clearCart() { return this.delete('/cart/clear'); },

  // Orders
  async createOrder(data) { return this.post('/orders', data); },
  async getOrder(id) { return this.get('/orders/' + id); },
  async getUserOrders() { return this.get('/orders/user'); },
  async markOrderPickedUp(id) { return this.patch('/orders/' + id + '/picked-up', {}); },
  async updateOrderStatus(id, status) { return this.patch('/orders/' + id + '/status', { status }); },

  // Delivery
  async calculateDelivery(data) { return this.post('/delivery/calculate', data); },
  async getDistricts() { return this.get('/delivery/districts'); },

  // Payments
  async payMomo(data) { return this.post('/payments/momo', data); },
  async payAirtel(data) { return this.post('/payments/airtel', data); },
  async payCOD(data) { return this.post('/payments/cod', data); },

  // Check if running in static fallback mode
  isStaticMode() { return useStaticFallback; }
};
