const ProductDetailPage = {
  product: null,
  qty: 1,

  async render(params = {}) {
    const id = params.id;
    if (!id) { App.navigate('products'); return; }

    const app = document.getElementById('app');
    app.innerHTML = `
      <nav style="font-size:0.82rem;color:var(--text-3);margin-bottom:20px">
        <a href="#" onclick="App.navigate('home')" style="color:var(--orange)">Home</a> ›
        <a href="#" onclick="App.navigate('products')" style="color:var(--orange)">Products</a> ›
        <span id="detailBreadcrumb">Loading...</span>
      </nav>
      <div id="detailContent">
        <div class="product-detail">
          <div class="skeleton" style="aspect-ratio:1;border-radius:12px"></div>
          <div>
            <div class="skeleton" style="height:24px;margin-bottom:12px;border-radius:6px"></div>
            <div class="skeleton" style="height:40px;margin-bottom:16px;border-radius:6px"></div>
            <div class="skeleton" style="height:200px;border-radius:6px"></div>
          </div>
        </div>
      </div>`;

    const res = await Api.getProduct(id);
    if (!res.ok) {
      document.getElementById('detailContent').innerHTML = `<div class="empty-state"><span class="empty-icon">😞</span><h3>${I18n.t('search.noResults')}</h3><button class="btn btn-primary mt-4" onclick="App.navigate('products')">${I18n.t('hero.shop')}</button></div>`;
      return;
    }

    this.product = res.data.product;
    this.qty = 1;
    this.renderProduct(res.data);
  },

  renderProduct({ product: p, reviews, related }) {
    const inStock = p.in_stock === 1 || p.in_stock === true;
    document.getElementById('detailBreadcrumb').textContent = p.name;

    document.getElementById('detailContent').innerHTML = `
      <div class="product-detail">
        <div class="detail-gallery">
          <img class="detail-main-img" id="detailMainImg" src="${getProductImageSrc(p)}" alt="${p.name}"
            onerror="setProductImageFallback(this)" />
        </div>
        <div class="detail-info">
          <div class="detail-category">${p.category_name || ''}</div>
          <h1 class="detail-name">${p.name}</h1>
          <div class="detail-rating">
            ${renderStars(p.avg_rating || p.avg_rating || 0, p.review_count || 0)}
            <span style="font-size:0.82rem;color:var(--text-3)">${(p.review_count || 0)} ${I18n.t('product.reviews')}</span>
          </div>
          <div class="detail-price">${formatPrice(p.price)}</div>
          <div class="detail-unit">per ${p.unit || 'Pcs'} · ${inStock ? `<span style="color:var(--success)">✅ ${I18n.t('product.inStock')}</span>` : `<span style="color:var(--error)">❌ ${I18n.t('product.outOfStock')}</span>`}</div>

          ${inStock ? `
          <div class="qty-control">
            <button class="qty-btn" onclick="ProductDetailPage.setQty(ProductDetailPage.qty - 1)">−</button>
            <span class="qty-value" id="detailQty">1</span>
            <button class="qty-btn" onclick="ProductDetailPage.setQty(ProductDetailPage.qty + 1)">+</button>
          </div>
          <div class="detail-actions">
            <button class="btn btn-primary btn-lg" onclick="ProductDetailPage.addToCart()">🛒 ${I18n.t('product.addCart')}</button>
            <button class="btn btn-ghost btn-lg" onclick="ProductDetailPage.buyNow()">⚡ Buy Now</button>
          </div>` : ''}

          <p class="detail-description">${p.description || 'No description available.'}</p>

          <div style="margin-top:20px;padding:16px;background:var(--surface-2);border-radius:var(--radius-sm);font-size:0.82rem;color:var(--text-2)">
            <div style="margin-bottom:6px">🚚 <strong>Free delivery</strong> on orders over 100,000 RWF</div>
            <div style="margin-bottom:6px">📦 <strong>Stock:</strong> ${p.stock_quantity} units available</div>
            <div>💳 <strong>Pay:</strong> MoMo, Airtel Money, or Cash on Delivery</div>
          </div>
        </div>
      </div>

      <!-- Reviews -->
      <section class="section">
        <h2 class="section-title">${I18n.t('product.reviews')}</h2>
        ${Api.token ? `
        <div class="review-form">
          <h3>Write a Review</h3>
          <div class="star-rating" id="starRating">
            ${[1,2,3,4,5].map(i => `<span class="star-pick" data-val="${i}" onclick="ProductDetailPage.setRating(${i})">★</span>`).join('')}
          </div>
          <div class="form-group">
            <textarea id="reviewComment" placeholder="Share your experience..." rows="3"></textarea>
          </div>
          <button class="btn btn-primary" onclick="ProductDetailPage.submitReview()">Submit Review</button>
        </div>` : `<div style="padding:16px;background:var(--surface);border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:20px;font-size:0.875rem;color:var(--text-2)">
          <a href="#" onclick="App.navigate('login')" style="color:var(--orange);font-weight:600">Login</a> to write a review
        </div>`}
        <div id="reviewsList">
          ${reviews && reviews.length > 0 ? reviews.map(r => `
            <div class="review-card">
              <div class="review-meta">
                <span class="reviewer-name">👤 ${r.user_name}</span>
                <span class="review-date">${new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div>${renderStars(r.rating)}</div>
              ${r.comment ? `<p class="review-text" style="margin-top:8px">${r.comment}</p>` : ''}
            </div>
          `).join('') : '<p style="color:var(--text-3);font-size:0.875rem">No reviews yet. Be the first!</p>'}
        </div>
      </section>

      <!-- Related Products -->
      ${related && related.length > 0 ? `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">${I18n.t('product.related')}</h2>
        </div>
        <div class="product-grid">
          ${related.map(p => renderProductCard(p)).join('')}
        </div>
      </section>` : ''}
    `;
  },

  selectedRating: 0,

  setQty(val) {
    this.qty = Math.max(1, Math.min(99, val));
    const el = document.getElementById('detailQty');
    if (el) el.textContent = this.qty;
  },

  setRating(val) {
    this.selectedRating = val;
    document.querySelectorAll('.star-pick').forEach((star, i) => {
      star.classList.toggle('active', i < val);
    });
  },

  addToCart() {
    if (!this.product) return;
    Cart.add(this.product.id, this.qty);
  },

  buyNow() {
    if (!Api.token) { App.navigate('login'); return; }
    this.addToCart();
    setTimeout(() => { Cart.close(); App.navigate('checkout'); }, 400);
  },

  async submitReview() {
    if (!this.selectedRating) { Toast.show('Please select a rating', 'warning'); return; }
    const comment = document.getElementById('reviewComment')?.value || '';
    const res = await Api.addReview(this.product.id, { rating: this.selectedRating, comment });
    if (res.ok) {
      Toast.show('Review submitted!', 'success');
      this.render({ id: this.product.id });
    } else {
      Toast.show(res.data.message, 'error');
    }
  }
};
