const CheckoutPage = {
  branches: [],
  timeSlots: [],
  selectedBranchId: '',
  selectedPickupSlot: '',
  orderId: null,
  depositAmount: 500,

  async render() {
    if (!Api.token) {
      App.navigate('login');
      Toast.show(I18n.t('toast.loginRequired'), 'warning');
      return;
    }
    if (Cart.items.length === 0) {
      App.navigate('cart');
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <h1 style="font-size:1.5rem;font-weight:800;margin-bottom:24px">Simba 2.0 ${I18n.t('cart.checkout')}</h1>
      <div class="checkout-grid">
        <div>
          <div class="card">
            <h3>1. ${I18n.t('selectBranch')}</h3>
            <p style="color:var(--text-2);margin-bottom:12px">${I18n.t('selectBranch')}</p>
            <div id="branchMeta" style="font-size:0.85rem;color:var(--text-3);margin-bottom:12px">Loading branches...</div>
            <div id="branchSelectionGrid" class="category-grid">
              ${[1, 2, 3, 4].map(() => '<div class="skeleton" style="height:120px;border-radius:12px"></div>').join('')}
            </div>
            <div id="branchRatingSummary" class="delivery-estimate hidden" style="margin-top:16px"></div>
          </div>

          <div class="card">
            <h3>2. ${I18n.t('pickupTime')}</h3>
            <div id="pickupSlots" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px"></div>
          </div>

          <div class="card">
            <h3>3. ${I18n.t('paymentMethod')}</h3>
            <p style="color:var(--text-2);margin-bottom:16px">A non-refundable deposit is required before the branch prepares your order.</p>
            <div class="form-group">
              <label>MTN MoMo ${I18n.t('auth.phone')}</label>
              <input type="tel" id="momoPhone" placeholder="078XXXXXXX" />
            </div>
            <div class="delivery-estimate" id="depositInfo">
              ${I18n.t('cart.total')}: <strong id="depositAmountLabel">500 RWF</strong>
            </div>
          </div>

          <button class="btn btn-primary btn-lg w-full" id="placeOrderBtn" onclick="CheckoutPage.placeOrder()">
            ${I18n.t('placeOrder')}
          </button>
        </div>

        <div>
          <div class="card" style="position:sticky;top:calc(var(--nav-h) + 80px)">
            <h3>${I18n.t('cart.checkout')}</h3>
            <div class="order-summary-items" id="summaryItems"></div>
            <hr class="summary-divider" />
            <div class="summary-item">
              <span class="summary-item-name">${I18n.t('selectBranch')}</span>
              <span class="summary-item-price" id="summaryBranch">${I18n.t('common.items')}</span>
            </div>
            <div class="summary-item">
              <span class="summary-item-name">${I18n.t('pickupTime')}</span>
              <span class="summary-item-price" id="summarySlot">${I18n.t('common.items')}</span>
            </div>
            <div class="summary-item">
              <span class="summary-item-name">${I18n.t('cart.total')}</span>
              <span class="summary-item-price">${formatPrice(Cart.total)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-item-name">${I18n.t('paymentMethod')}</span>
              <span class="summary-item-price" id="summaryDeposit">500 RWF</span>
            </div>
            <hr class="summary-divider" />
            <div class="summary-total">
              <span>${I18n.t('cart.total')}</span>
              <span class="summary-total-price" id="summaryToday">500 RWF</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderSummaryItems();
    await this.loadBranches();
  },

  renderSummaryItems() {
    const el = document.getElementById('summaryItems');
    if (!el) return;
    el.innerHTML = Cart.items.map((item) => `
      <div class="summary-item">
        <span class="summary-item-name">${item.name} x ${item.quantity}</span>
        <span class="summary-item-price">${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');
  },

  async loadBranches() {
    const res = await Api.getBranches();
    const grid = document.getElementById('branchSelectionGrid');
    const meta = document.getElementById('branchMeta');

    if (!res.ok) {
      if (grid) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">📍</span><h3>Branches unavailable</h3><p>${res.data.message || 'Could not load Simba branches right now.'}</p></div>`;
      }
      if (meta) meta.textContent = 'We could not load branch options.';
      Toast.show(res.data.message || 'Could not load branches.', 'error');
      return;
    }

    this.branches = res.data.branches || [];
    this.timeSlots = res.data.pickup_time_slots || [];
    this.selectedBranchId = this.branches[0]?.id || '';
    this.selectedPickupSlot = this.timeSlots[0] || '';
    if (meta) meta.textContent = `${this.branches.length} Simba branches available for pickup`;
    this.renderBranches();
    this.renderTimeSlots();
    this.updateSelectionSummary();
  },

  renderBranches() {
    const el = document.getElementById('branchSelectionGrid');
    if (!el) return;

    if (!this.branches.length) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-icon">📍</span><h3>No branches available</h3><p>Please try again in a moment.</p></div>`;
      return;
    }

    el.innerHTML = this.branches.map((branch) => `
      <button class="category-card" style="text-align:left;border:${this.selectedBranchId === branch.id ? '2px solid var(--orange)' : '1px solid var(--border)'};background:${this.selectedBranchId === branch.id ? 'var(--orange-pale)' : 'var(--card)'}"
        onclick="CheckoutPage.selectBranch('${branch.id}')">
        <div class="cat-name">${branch.name}</div>
        <div class="cat-count">${branch.district} · ${branch.area || 'Pickup'}</div>
        <div class="cat-count">${branch.stocked_products || 0} products available</div>
        <div class="cat-count">Rating: ${Number(branch.average_rating || 0).toFixed(1)} / 5 (${branch.rating_count || 0})</div>
      </button>
    `).join('');
  },

  renderTimeSlots() {
    const el = document.getElementById('pickupSlots');
    if (!el) return;
    el.innerHTML = this.timeSlots.map((slot) => `
      <button class="btn ${this.selectedPickupSlot === slot ? 'btn-primary' : 'btn-ghost'}"
        onclick="CheckoutPage.selectPickupSlot('${slot}')">${slot}</button>
    `).join('');
  },

  selectBranch(branchId) {
    this.selectedBranchId = branchId;
    this.renderBranches();
    this.updateSelectionSummary();
  },

  selectPickupSlot(slot) {
    this.selectedPickupSlot = slot;
    this.renderTimeSlots();
    this.updateSelectionSummary();
  },

  updateSelectionSummary() {
    const branch = this.branches.find((item) => item.id === this.selectedBranchId);
    this.depositAmount = branch && branch.district === 'Gasabo' ? 1000 : 500;

    const summaryBranch = document.getElementById('summaryBranch');
    const summarySlot = document.getElementById('summarySlot');
    const summaryDeposit = document.getElementById('summaryDeposit');
    const summaryToday = document.getElementById('summaryToday');
    const depositAmountLabel = document.getElementById('depositAmountLabel');
    const ratingSummary = document.getElementById('branchRatingSummary');

    if (summaryBranch) summaryBranch.textContent = branch ? branch.name : 'Select one';
    if (summarySlot) summarySlot.textContent = this.selectedPickupSlot || 'Select one';
    if (summaryDeposit) summaryDeposit.textContent = formatPrice(this.depositAmount);
    if (summaryToday) summaryToday.textContent = formatPrice(this.depositAmount);
    if (depositAmountLabel) depositAmountLabel.textContent = formatPrice(this.depositAmount);
    if (ratingSummary && branch) {
      ratingSummary.classList.remove('hidden');
      ratingSummary.innerHTML = `Average branch rating: <strong>${Number(branch.average_rating || 0).toFixed(1)} / 5</strong> from ${branch.rating_count || 0} reviews`;
    }
  },

  async placeOrder() {
    const phone = document.getElementById('momoPhone')?.value.trim();
    if (!this.selectedBranchId) {
      Toast.show('Please select a branch.', 'warning');
      return;
    }
    if (!this.selectedPickupSlot) {
      Toast.show('Please select a pickup time slot.', 'warning');
      return;
    }
    if (!phone) {
      Toast.show('Please enter your MoMo number.', 'warning');
      return;
    }

    const btn = document.getElementById('placeOrderBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing deposit...';
    }

    const orderRes = await Api.createOrder({
      order_type: 'pickup',
      branch_id: this.selectedBranchId,
      pickup_time_slot: this.selectedPickupSlot,
      payment_method: 'MoMo Deposit'
    });

    if (!orderRes.ok) {
      Toast.show(orderRes.data.message || 'Could not create pickup order.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirm Pickup Order';
      }
      return;
    }

    this.orderId = orderRes.data.order.id;
    const payRes = await Api.payMomo({ order_id: this.orderId, phone });
    if (!payRes.ok || !payRes.data.success) {
      Toast.show(payRes.data.message || 'Deposit payment failed.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirm Pickup Order';
      }
      return;
    }

    Toast.show('Pickup order confirmed successfully.', 'success');
    Cart.items = [];
    Cart.total = 0;
    Cart.itemCount = 0;
    if (Api.isStaticMode()) await Api.clearCart();
    Cart.updateBadge();
    Cart.render();
    this.renderSuccessPage();
  },

  renderSuccessPage() {
    const branch = this.branches.find((item) => item.id === this.selectedBranchId);
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="empty-state" style="padding:80px 20px">
        <span class="empty-icon" style="font-size:5rem">🎉</span>
        <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:12px">Pickup Order Confirmed</h2>
        <p style="color:var(--text-2);margin-bottom:8px">Your deposit has been charged and the branch can now prepare your basket.</p>
        <p style="color:var(--text-2);margin-bottom:8px"><strong>Branch:</strong> ${branch ? branch.name : ''}</p>
        <p style="color:var(--text-2);margin-bottom:8px"><strong>Pickup slot:</strong> ${this.selectedPickupSlot}</p>
        <p style="color:var(--text-3);font-size:0.85rem;margin-bottom:32px">Order ID: <strong>${this.orderId}</strong></p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary btn-lg" onclick="App.navigate('orders')">Track Order</button>
          <button class="btn btn-ghost btn-lg" onclick="App.navigate('home')">Continue Shopping</button>
        </div>
      </div>
    `;
  }
};
