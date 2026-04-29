const ProductsPage = {
  currentPage: 1,
  currentCategory: '',
  currentSort: '',
  currentSearch: '',
  currentAiQuery: '',
  totalPages: 1,

  async render(params = {}) {
    this.currentCategory = params.category ? decodeURIComponent(params.category) : '';
    this.currentSearch = params.search || '';
    this.currentAiQuery = params.aiQuery || '';
    this.currentPage = 1;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="filters-bar">
        <span class="filter-label">${I18n.t('filter.sort')}:</span>
        <select class="filter-select" id="sortSelect" onchange="ProductsPage.applyFilters()">
          <option value="">${I18n.t('filter.newest')}</option>
          <option value="price_asc">${I18n.t('filter.price_asc')}</option>
          <option value="price_desc">${I18n.t('filter.price_desc')}</option>
          <option value="rating">${I18n.t('filter.rating')}</option>
        </select>
        <select class="filter-select" id="stockFilter" onchange="ProductsPage.applyFilters()">
          <option value="">All Stock</option>
          <option value="true">In Stock Only</option>
        </select>
        <span class="results-count" id="resultsCount"></span>
      </div>
      <div id="conversationPanel"></div>
      <div class="product-grid" id="productsGrid">
        ${[1,2,3,4,5,6,7,8,9,10,11,12].map(() => '<div class="skeleton" style="height:300px;border-radius:12px"></div>').join('')}
      </div>
      <div class="pagination" id="pagination"></div>
    `;

    await this.loadProducts();
  },

  async loadProducts() {
    const grid = document.getElementById('productsGrid');
    const panel = document.getElementById('conversationPanel');
    const count = document.getElementById('resultsCount');

    if (this.currentAiQuery) {
      const res = await Api.conversationalSearch({ query: this.currentAiQuery });
      if (!res.ok) {
        if (grid) grid.innerHTML = `<p style="color:var(--error)">${res.data.message}</p>`;
        return;
      }

      const products = res.data.products || [];
      if (panel) {
        panel.innerHTML = `
          <div class="card" style="margin-bottom:16px">
            <h3>Simba AI Search</h3>
            <p style="color:var(--text-2);margin-top:8px">${res.data.response}</p>
          </div>
        `;
      }
      if (count) count.textContent = `${products.length} matched products`;
      this.totalPages = 1;
      if (grid) {
        grid.innerHTML = products.length
          ? products.map((product) => renderProductCard(product)).join('')
          : `<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">🔎</span><h3>${I18n.t('search.noResults')}</h3></div>`;
      }
      const pagination = document.getElementById('pagination');
      if (pagination) pagination.innerHTML = '';
      return;
    }

    if (panel) panel.innerHTML = '';

    const params = {
      page: this.currentPage,
      limit: 24,
      sort: document.getElementById('sortSelect')?.value || '',
      inStock: document.getElementById('stockFilter')?.value || ''
    };
    if (this.currentCategory) params.category = this.currentCategory;
    if (this.currentSearch) params.search = this.currentSearch;

    Object.keys(params).forEach((key) => { if (!params[key]) delete params[key]; });

    const res = await Api.getProducts(params);
    if (!res.ok) {
      if (grid) grid.innerHTML = `<p style="color:var(--error)">${res.data.message}</p>`;
      return;
    }

    const { products, pagination } = res.data;
    this.totalPages = pagination.pages;
    if (count) count.textContent = `${pagination.total} products`;

    if (!grid) return;
    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-icon">🔎</span>
          <h3>${I18n.t('search.noResults')}</h3>
          <p>Try a different category or ask Simba AI a broader question.</p>
          <button class="btn btn-primary mt-4" onclick="ProductsPage.render()">Clear Filters</button>
        </div>`;
      return;
    }

    grid.innerHTML = products.map((product) => renderProductCard(product)).join('');
    this.renderPagination(pagination);
  },

  renderPagination({ page, pages }) {
    const el = document.getElementById('pagination');
    if (!el || pages <= 1 || this.currentAiQuery) {
      if (el) el.innerHTML = '';
      return;
    }

    let html = '';
    if (page > 1) html += `<button class="page-btn" onclick="ProductsPage.goTo(${page - 1})">‹</button>`;

    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn${i === page ? ' active' : ''}" onclick="ProductsPage.goTo(${i})">${i}</button>`;
    }

    if (page < pages) html += `<button class="page-btn" onclick="ProductsPage.goTo(${page + 1})">›</button>`;
    el.innerHTML = html;
  },

  async goTo(page) {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await this.loadProducts();
  },

  async applyFilters() {
    this.currentPage = 1;
    this.currentAiQuery = '';
    await this.loadProducts();
  }
};
