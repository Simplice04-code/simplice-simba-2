const App = {
  user: JSON.parse(localStorage.getItem('simba_user') || 'null'),
  currentRoute: null,
  isDark: localStorage.getItem('simba_dark') === 'true',

  async init() {
    this.applyTheme();
    this.setupNav();
    this.setupSearch();
    this.setupCartSidebar();
    I18n.applyAll();
    I18n.setLang(I18n.lang);
    this.updateNav();

    if (Api.token) {
      await Cart.load();
    }

    await this.loadCategories();

    const hash = location.hash.slice(1) || 'home';
    const [route, queryStr] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryStr || ''));
    await this.navigate(route, params, true);

    window.addEventListener('hashchange', () => {
      const h = location.hash.slice(1) || 'home';
      const [r, qs] = h.split('?');
      const p = Object.fromEntries(new URLSearchParams(qs || ''));
      this.navigate(r, p, true);
    });

    document.getElementById('pageLoader')?.classList.add('hidden');

    // Live Server can run the storefront without the API by using local demo data.
  },

  showStaticModeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'staticModeIndicator';
    indicator.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#000;padding:8px 16px;text-align:center;font-size:13px;z-index:9999;box-shadow:0 2px 4px rgba(0,0,0,0.1);';
    indicator.innerHTML = 'Demo mode: running from static files. Login and cart are saved in this browser. <a href="#" onclick="location.reload()" style="text-decoration:underline;margin-left:8px;">Reload</a>';
    document.body.prepend(indicator);
  },

  async navigate(route, params = {}, fromHash = false) {
    this.currentRoute = route;

    if (!fromHash) {
      const qs = new URLSearchParams(params).toString();
      location.hash = route + (qs ? '?' + qs : '');
    }

    window.scrollTo({ top: 0 });
    document.getElementById('mobileNav')?.classList.add('hidden');

    const showCategoryBar = ['home', 'products'].includes(route);
    document.getElementById('categoryBar').style.display = showCategoryBar ? '' : 'none';

    switch (route) {
      case 'home':       await HomePage.render(params); break;
      case 'products':   await ProductsPage.render(params); break;
      case 'product':    await ProductDetailPage.render(params); break;
      case 'cart':       Cart.open(); break;
      case 'checkout':   await CheckoutPage.render(params); break;
      case 'login':      await AuthPage.render(params); break;
      case 'orders':
        await ProfilePage.render();
        setTimeout(() => ProfilePage.switchTab('orders'), 100);
        break;
      case 'profile':    await ProfilePage.render(params); break;
      default:           await HomePage.render(params); break;
    }

    I18n.applyAll();
  },

  async loadCategories() {
    const res = await Api.getCategories();
    if (!res.ok) return;

    const bar = document.getElementById('categoryBarInner');
    if (!bar) return;

    bar.innerHTML = `<button class="cat-pill active" data-category="" onclick="App.filterCategory('')">All Products</button>` +
      res.data.categories.map(c => `
        <button class="cat-pill" data-category="${c.name}" onclick="App.filterCategory('${encodeURIComponent(c.name)}')">
          ${c.icon || '🛒'} ${c.name}
        </button>
      `).join('');
  },

  filterCategory(category) {
    document.querySelectorAll('.cat-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.category === decodeURIComponent(category));
    });
    this.navigate('products', category ? { category } : {});
  },

  setupNav() {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const route = el.dataset.route;
        if (route === 'cart') { Cart.open(); return; }
        this.navigate(route);
      });
    });

    document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('mobileNav')?.classList.toggle('hidden');
    });

    document.getElementById('userAvatarBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('dropdownMenu')?.classList.toggle('open');
    });
    document.addEventListener('click', () => document.getElementById('dropdownMenu')?.classList.remove('open'));

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.logout();
    });
  },

  setupSearch() {
    const input = document.getElementById('globalSearch');
    const suggestions = document.getElementById('searchSuggestions');
    const mobileInput = document.getElementById('mobileSearch');

    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) {
          this.navigate('products', { aiQuery: val });
          suggestions?.classList.remove('visible');
        }
      }
    };

    input?.addEventListener('keydown', handleEnter);
    mobileInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.navigate('products', { aiQuery: e.target.value.trim() });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) suggestions?.classList.remove('visible');
    });
  },

  setupCartSidebar() {
    document.getElementById('cartOverlay')?.addEventListener('click', () => Cart.close());
    document.getElementById('closeCart')?.addEventListener('click', () => Cart.close());
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
      Cart.close();
      this.navigate('checkout');
    });
  },

  updateNav() {
    const loginBtn = document.getElementById('loginBtn');
    const userDropdown = document.getElementById('userDropdown');
    const userNameNav = document.getElementById('userNameNav');
    const mobileProfileLink = document.getElementById('mobileProfileLink');
    const mobileLoginLink = document.getElementById('mobileLoginLink');

    if (this.user && Api.token) {
      loginBtn?.classList.add('hidden');
      userDropdown?.classList.remove('hidden');
      if (userNameNav) userNameNav.textContent = (this.user.name || '').split(' ')[0];
      mobileProfileLink?.classList.remove('hidden');
      mobileLoginLink?.classList.add('hidden');
    } else {
      loginBtn?.classList.remove('hidden');
      userDropdown?.classList.add('hidden');
      mobileProfileLink?.classList.add('hidden');
      mobileLoginLink?.classList.remove('hidden');
    }
    Cart.updateBadge();
  },

  logout() {
    Api.setToken(null);
    this.user = null;
    localStorage.removeItem('simba_user');
    Cart.items = []; Cart.total = 0; Cart.itemCount = 0;
    Cart.render(); Cart.updateBadge();
    this.updateNav();
    Toast.show('Logged out successfully', 'info');
    this.navigate('home');
  },

  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
    localStorage.setItem('simba_dark', this.isDark);
  },

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = this.isDark ? '☀️' : '🌙';
  },

  formatPrice(n) { return formatPrice(n); }
};

function getProductImageSrc(product) {
  const imageUrl = product?.image_url || product?.image || '';
  if (
    !imageUrl ||
    imageUrl === 'undefined' ||
    imageUrl === 'null' ||
    imageUrl.endsWith('/undefined') ||
    imageUrl.endsWith('/null')
  ) {
    return getProductPlaceholderSrc(product);
  }
  return imageUrl;
}

function getProductPlaceholderSrc(product = {}) {
  const name = String(product.name || 'Simba Product');
  const category = String(product.category_name || product.category || 'Product');
  const initial = name.trim().charAt(0).toUpperCase() || 'S';
  const palette = getPlaceholderPalette(category);
  const safeName = escapeSvgText(name.length > 28 ? `${name.slice(0, 25)}...` : name);
  const safeCategory = escapeSvgText(category.length > 26 ? `${category.slice(0, 23)}...` : category);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <rect width="320" height="320" fill="${palette.bg}"/>
      <circle cx="160" cy="124" r="58" fill="${palette.accent}" opacity="0.16"/>
      <circle cx="160" cy="124" r="40" fill="${palette.accent}"/>
      <text x="160" y="139" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#ffffff">${escapeSvgText(initial)}</text>
      <text x="160" y="222" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="${palette.text}">${safeName}</text>
      <text x="160" y="252" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" fill="${palette.muted}">${safeCategory}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getPlaceholderPalette(seed = '') {
  const palettes = [
    { bg: '#FFF7ED', accent: '#F97316', text: '#7C2D12', muted: '#9A3412' },
    { bg: '#ECFDF5', accent: '#10B981', text: '#064E3B', muted: '#047857' },
    { bg: '#EFF6FF', accent: '#2563EB', text: '#1E3A8A', muted: '#1D4ED8' },
    { bg: '#FEF2F2', accent: '#EF4444', text: '#7F1D1D', muted: '#B91C1C' },
    { bg: '#F8FAFC', accent: '#475569', text: '#0F172A', muted: '#475569' }
  ];
  const total = Array.from(String(seed)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[total % palettes.length];
}

function escapeSvgText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setProductImageFallback(img) {
  img.onerror = null;
  img.src = getProductPlaceholderSrc({ name: img.alt || 'Simba Product' });
}

document.addEventListener('DOMContentLoaded', () => {
  App.init().catch((err) => {
    console.error('Failed to start Simba frontend:', err);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="empty-state" style="min-height:320px">
          <h3>Simba could not start</h3>
          <p>${err?.message || 'Check the browser console for details.'}</p>
        </div>
      `;
    }
  });
});

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => I18n.setLang(btn.dataset.lang));
});
