const Cart = {
  items: [],
  total: 0,
  itemCount: 0,
  _listeners: [],

  formatPrice(n) {
    return Number(n).toLocaleString('fr-RW') + ' RWF';
  },

  onChange(fn) { this._listeners.push(fn); },

  _notify() { this._listeners.forEach(fn => fn(this.items, this.total, this.itemCount)); },

  async load() {
    if (!Api.token) { this.items = []; this.total = 0; this.itemCount = 0; this._notify(); this.render(); return; }
    const res = await Api.getCart();
    if (res.ok) {
      this.items = res.data.cart.items || [];
      this.total = res.data.cart.total || 0;
      this.itemCount = res.data.cart.item_count || 0;
      this._notify();
      this.updateBadge();
      this.render();
    }
  },

  async add(productId, qty = 1) {
    if (!Api.token) { App.navigate('login'); Toast.show(I18n.t('toast.loginRequired'), 'warning'); return; }
    const res = await Api.addToCart({ product_id: productId, quantity: qty });
    if (res.ok) {
      this.items = res.data.cart.items;
      this.total = res.data.cart.total;
      this.itemCount = res.data.cart.item_count;
      this.updateBadge();
      this.render();
      this._notify();
      Toast.show(I18n.t('toast.addedCart'), 'success');
    } else {
      Toast.show(res.data.message || 'Failed to add', 'error');
    }
  },

  async update(itemId, qty) {
    const res = await Api.updateCartItem(itemId, { quantity: qty });
    if (res.ok) {
      this.items = res.data.cart.items;
      this.total = res.data.cart.total;
      this.itemCount = res.data.cart.item_count;
      this.updateBadge();
      this.render();
      this._notify();
    }
  },

  async remove(itemId) {
    const res = await Api.removeFromCart(itemId);
    if (res.ok) {
      this.items = res.data.cart.items;
      this.total = res.data.cart.total;
      this.itemCount = res.data.cart.item_count;
      this.updateBadge();
      this.render();
      this._notify();
      Toast.show(I18n.t('toast.removedCart'), 'info');
    }
  },

  updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    badge.textContent = this.itemCount;
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 300);
  },

  render() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');
    if (!body) return;

    if (this.items.length === 0) {
      body.innerHTML = `<div class="empty-state"><span class="empty-icon">🛒</span><p>${I18n.t('cart.empty')}</p></div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    body.innerHTML = this.items.map(item => `
      <div class="cart-item" data-item-id="${item.id}">
        <img class="cart-item-img" src="${getProductImageSrc(item)}" alt="${item.name}" onerror="setProductImageFallback(this)" />
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${this.formatPrice(item.price * item.quantity)}</div>
          <div class="cart-item-controls">
            <button class="qty-mini-btn" onclick="Cart.update(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
            <span class="qty-mini-val">${item.quantity}</span>
            <button class="qty-mini-btn" onclick="Cart.update(${item.id}, ${item.quantity + 1})">+</button>
            <button class="remove-btn" onclick="Cart.remove(${item.id})">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');

    if (footer) {
      footer.style.display = 'block';
      if (totalEl) totalEl.textContent = this.formatPrice(this.total);
    }
  },

  open() {
    this.render();
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
};

const Toast = {
  show(message, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: '🔔' };
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '🔔'}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};

function formatPrice(n) {
  return Number(n).toLocaleString('fr-RW') + ' RWF';
}

function renderStars(rating, count = 0) {
  const r = Math.round(rating * 2) / 2;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= r ? '★' : '☆';
  }
  return `<span class="stars">${stars}</span>${count ? `<span class="rating-count">(${count})</span>` : ''}`;
}
