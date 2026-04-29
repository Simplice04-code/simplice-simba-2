const HomePage = {
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">${I18n.t('hero.badge')}</div>
          <h1>${I18n.t('hero.title')}</h1>
          <p>${I18n.t('hero.sub')}</p>
          <div class="hero-actions">
            <button class="btn btn-white btn-lg" onclick="App.navigate('products')">${I18n.t('hero.shop')}</button>
            <button class="btn btn-transparent" onclick="App.navigate('products')">${I18n.t('hero.learn')}</button>
          </div>
        </div>
      </section>

      <!-- Value Props - Trust Signals -->
      <section class="value-props">
        <div class="value-prop">
          <div class="value-icon">🚚</div>
          <div class="value-text">
            <div class="value-title">${I18n.t('value.45min')}</div>
            <div class="value-sub">${I18n.t('value.delivery')}</div>
          </div>
        </div>
        <div class="value-prop">
          <div class="value-icon">🛒</div>
          <div class="value-text">
            <div class="value-title">${I18n.t('value.fresh')}</div>
            <div class="value-sub">${I18n.t('value.products')}</div>
          </div>
        </div>
        <div class="value-prop">
          <div class="value-icon">📱</div>
          <div class="value-text">
            <div class="value-title">${I18n.t('value.momo')}</div>
            <div class="value-sub">${I18n.t('value.payment')}</div>
          </div>
        </div>
        <div class="value-prop">
          <div class="value-icon">📍</div>
          <div class="value-text">
            <div class="value-title">${I18n.t('value.branches')}</div>
            <div class="value-sub">${I18n.t('value.pickup')}</div>
          </div>
        </div>
      </section>

      <!-- Trust Signals -->
      <section class="trust-signals">
        <div class="trust-item">
          <span class="trust-icon">🦁</span>
          <span>Simba Supermarket</span>
        </div>
        <div class="trust-item">
          <span class="trust-icon">📍</span>
          <span>${I18n.t('trust.branches')}</span>
        </div>
        <div class="trust-item">
          <span class="trust-icon">📦</span>
          <span>${I18n.t('trust.products')}</span>
        </div>
      </section>

      <!-- Promo Banners -->
      <div class="promo-banners">
        <div class="promo-banner promo-banner-1">
          <div class="promo-tag">${I18n.t('promo.offer')}</div>
          <div class="promo-title">${I18n.t('promo.freeDelivery')}</div>
          <div class="promo-sub">${I18n.t('promo.freeDeliverySub')}</div>
        </div>
        <div class="promo-banner promo-banner-2">
          <div class="promo-tag">${I18n.t('promo.new')}</div>
          <div class="promo-title">${I18n.t('promo.alcoholic')}</div>
          <div class="promo-sub">${I18n.t('promo.selection')}</div>
        </div>
        <div class="promo-banner promo-banner-3">
          <div class="promo-tag">${I18n.t('promo.fresh')}</div>
          <div class="promo-title">${I18n.t('promo.food')}</div>
          <div class="promo-sub">${I18n.t('promo.delivered')}</div>
        </div>
      </div>

      <!-- Categories -->
      <section class="section" id="homeCategoriesSection">
        <div class="section-header">
          <h2 class="section-title">${I18n.t('section.categories')}</h2>
          <a href="#" class="section-link" onclick="App.navigate('products')">${I18n.t('section.viewAll')}</a>
        </div>
        <div class="category-grid" id="homeCategoryGrid">
          ${[1,2,3,4,5].map(() => '<div class="skeleton" style="height:110px;border-radius:12px"></div>').join('')}
        </div>
      </section>

      <!-- Featured Products -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">${I18n.t('section.featured')}</h2>
          <a href="#" class="section-link" onclick="App.navigate('products')">${I18n.t('section.viewAll')}</a>
        </div>
        <div class="product-grid" id="featuredGrid">
          ${[1,2,3,4,5,6].map(() => '<div class="skeleton" style="height:300px;border-radius:12px"></div>').join('')}
        </div>
      </section>

      <!-- All Products Preview -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">${I18n.t('section.all')}</h2>
          <a href="#" class="section-link" onclick="App.navigate('products')">${I18n.t('section.viewAll')}</a>
        </div>
        <div class="product-grid" id="allProductsGrid">
          ${[1,2,3,4,5,6,7,8].map(() => '<div class="skeleton" style="height:300px;border-radius:12px"></div>').join('')}
        </div>
      </section>
    `;

    await this.loadData();
  },

  async loadData() {
    console.log('Loading home data...');
    const [catsRes, featuredRes, productsRes] = await Promise.all([
      Api.getCategories(),
      Api.getFeatured(),
      Api.getProducts({ limit: 24, page: 1 })
    ]);

    console.log('Categories response:', catsRes);
    console.log('Featured response:', featuredRes);
    console.log('Products response:', productsRes);

    if (catsRes.ok) this.renderCategories(catsRes.data.categories);
    else console.error('Failed to load categories:', catsRes.data);

    if (featuredRes.ok) this.renderFeatured(featuredRes.data.products);
    else console.error('Failed to load featured:', featuredRes.data);

    if (productsRes.ok) this.renderAllProducts(productsRes.data.products);
    else console.error('Failed to load products:', productsRes.data);
  },

  renderCategories(cats) {
    const grid = document.getElementById('homeCategoryGrid');
    if (!grid) return;
    grid.innerHTML = cats.map(c => `
      <div class="category-card" onclick="App.navigate('products', {category:'${encodeURIComponent(c.name)}'})">
        <div class="cat-icon">${c.icon || '🛒'}</div>
        <div class="cat-name">${I18n.tCategory(c.name)}</div>
        <div class="cat-count">${c.product_count} ${I18n.t('common.items')}</div>
      </div>
    `).join('');
  },

  renderFeatured(products) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    grid.innerHTML = products.map(p => renderProductCard(p)).join('');
  },

  renderAllProducts(products) {
    const grid = document.getElementById('allProductsGrid');
    if (!grid) return;
    grid.innerHTML = products.map(p => renderProductCard(p)).join('');
  }
};

function renderProductCard(p) {
  const inStock = p.in_stock === 1 || p.in_stock === true;
  const finalImageSrc = getProductImageSrc(p);

  return `
    <div class="product-card" onclick="App.navigate('product', {id:${p.id}})">
      <div class="product-img-wrap">
        <img src="${finalImageSrc}" alt="${p.name}" loading="lazy"
          onerror="setProductImageFallback(this)" />
        ${!inStock ? `<div class="product-badge out-of-stock">${I18n.t('product.outOfStock')}</div>` : ''}
        ${inStock ? `<div class="product-quick-add" onclick="event.stopPropagation();Cart.add(${p.id})">+ ${I18n.t('product.addCart')}</div>` : ''}
      </div>
      <div class="product-body">
        <div class="product-category">${p.category_name ? tCategory(p.category_name) : ''}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">${renderStars(p.avg_rating || 0, p.review_count || 0)}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">${formatPrice(p.price)}</div>
            <div class="product-unit">${I18n.t('common.per')} ${p.unit || 'Pcs'}</div>
          </div>
          ${inStock ? `<button class="add-btn" onclick="event.stopPropagation();Cart.add(${p.id})" title="${I18n.t('product.addCart')}">+</button>` : ''}
        </div>
      </div>
    </div>
  `;
}
