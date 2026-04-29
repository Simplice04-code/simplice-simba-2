const ProfilePage = {
  activeTab: 'profile',

  async render() {
    if (!Api.token) {
      App.navigate('login');
      return;
    }

    const profileRes = await Api.getProfile();
    const user = profileRes.ok ? profileRes.data.user : (App.user || {});
    App.user = user;
    localStorage.setItem('simba_user', JSON.stringify(user));

    const tabs = [
      { id: 'profile', label: 'Profile' },
      { id: 'orders', label: 'Orders' }
    ];
    if (['manager', 'admin'].includes(user.role)) tabs.push({ id: 'manager', label: 'Manager' });
    if (['staff', 'manager', 'admin'].includes(user.role)) tabs.push({ id: 'staff', label: 'Staff' });

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar-circle">${(user.name || 'U')[0].toUpperCase()}</div>
        <div>
          <div class="profile-name">${user.name || 'User'}</div>
          <div class="profile-email">${user.email || ''}</div>
          <div class="profile-since">Role: ${user.role || 'customer'}</div>
        </div>
      </div>
      <div class="profile-tabs">
        ${tabs.map((tab) => `<button class="profile-tab ${tab.id === this.activeTab ? 'active' : ''}" id="tab-${tab.id}" onclick="ProfilePage.switchTab('${tab.id}')">${tab.label}</button>`).join('')}
      </div>
      <div id="profileContent"></div>
    `;

    await this.switchTab(this.activeTab);
  },

  async switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.profile-tab').forEach((button) => button.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');

    if (tab === 'profile') await this.renderProfileTab();
    if (tab === 'orders') await this.renderOrdersTab();
    if (tab === 'manager') await this.renderManagerTab();
    if (tab === 'staff') await this.renderStaffTab();
  },

  async renderProfileTab() {
    const res = await Api.getProfile();
    const user = res.ok ? res.data.user : (App.user || {});
    const content = document.getElementById('profileContent');
    if (!content) return;

    content.innerHTML = `
      <div class="card">
        <h3>Edit Profile</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="editName" value="${user.name || ''}" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="editPhone" value="${user.phone || ''}" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>District</label>
            <input type="text" id="editDistrict" value="${user.district || ''}" />
          </div>
          <div class="form-group">
            <label>Sector</label>
            <input type="text" id="editSector" value="${user.sector || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label>Street</label>
          <input type="text" id="editStreet" value="${user.street || ''}" />
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="editPassword" placeholder="Leave blank to keep current password" />
        </div>
        <button class="btn btn-primary" onclick="ProfilePage.saveProfile()">Save Changes</button>
      </div>
    `;
  },

  async saveProfile() {
    const payload = {
      name: document.getElementById('editName')?.value,
      phone: document.getElementById('editPhone')?.value,
      district: document.getElementById('editDistrict')?.value,
      sector: document.getElementById('editSector')?.value,
      street: document.getElementById('editStreet')?.value
    };
    const password = document.getElementById('editPassword')?.value;
    if (password) payload.password = password;

    const res = await Api.updateProfile(payload);
    if (!res.ok) {
      Toast.show(res.data.message || 'Could not save your profile.', 'error');
      return;
    }

    App.user = res.data.user;
    localStorage.setItem('simba_user', JSON.stringify(res.data.user));
    App.updateNav();
    Toast.show('Profile updated.', 'success');
  },

  async renderOrdersTab() {
    const content = document.getElementById('profileContent');
    if (!content) return;
    content.innerHTML = `<div class="skeleton" style="height:220px;border-radius:12px"></div>`;

    const res = await Api.getUserOrders();
    if (!res.ok) {
      content.innerHTML = `<p style="color:var(--error)">Failed to load orders.</p>`;
      return;
    }

    const orders = res.data.orders || [];
    if (!orders.length) {
      content.innerHTML = `<div class="empty-state"><span class="empty-icon">📦</span><h3>No orders yet</h3><p>Your pickup and delivery orders will appear here.</p></div>`;
      return;
    }

    content.innerHTML = orders.map((order) => `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div>
            <div style="font-weight:700">Order #${order.id.slice(0, 8).toUpperCase()}</div>
            <div style="font-size:0.85rem;color:var(--text-3)">${new Date(order.created_at).toLocaleString()}</div>
          </div>
          <div style="font-weight:700;color:var(--orange)">${order.status}</div>
        </div>
        <div style="margin-top:12px;color:var(--text-2)">
          ${order.order_type === 'pickup' ? `
            <div><strong>Branch:</strong> ${order.branch_name || 'Not set'}</div>
            <div><strong>Pickup slot:</strong> ${order.pickup_time_slot || 'Not set'}</div>
            <div><strong>Deposit:</strong> ${order.deposit_status} (${formatPrice(order.deposit_amount || 0)})</div>
          ` : `
            <div><strong>Delivery address:</strong> ${order.delivery_address || 'N/A'}</div>
          `}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
          ${order.items.map((item) => `<img src="${getProductImageSrc(item)}" alt="${item.name || 'Order item'}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--border)" onerror="setProductImageFallback(this)" />`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
          <span>${formatPrice(order.total_price)}</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${order.status === 'ready_for_pickup' ? `<button class="btn btn-primary" onclick="ProfilePage.markPickedUp('${order.id}')">Mark Picked Up</button>` : ''}
            ${order.status === 'picked_up' && order.branch_id ? `<button class="btn btn-ghost" onclick="ProfilePage.reviewBranch('${order.branch_id}','${order.id}')">Review Branch</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  async markPickedUp(orderId) {
    const res = await Api.markOrderPickedUp(orderId);
    if (!res.ok) {
      Toast.show(res.data.message || 'Could not mark order as picked up.', 'error');
      return;
    }
    Toast.show('Order marked as picked up.', 'success');
    await this.renderOrdersTab();
  },

  async reviewBranch(branchId, orderId) {
    const rating = window.prompt('Rate this branch from 1 to 5:');
    if (!rating) return;
    const comment = window.prompt('Optional comment for the branch:') || '';
    const res = await Api.addBranchReview(branchId, {
      order_id: orderId,
      rating: Number(rating),
      comment
    });

    if (!res.ok) {
      Toast.show(res.data.message || 'Could not submit branch review.', 'error');
      return;
    }
    Toast.show('Branch review submitted.', 'success');
    await this.renderOrdersTab();
  },

  async renderManagerTab() {
    const content = document.getElementById('profileContent');
    if (!content) return;
    const [ordersRes, staffRes] = await Promise.all([Api.getManagerOrders(), Api.getManagerStaff()]);

    if (!ordersRes.ok) {
      content.innerHTML = `<p style="color:var(--error)">${ordersRes.data.message || 'Failed to load manager orders.'}</p>`;
      return;
    }

    const staffOptions = (staffRes.ok ? staffRes.data.staff : []).map((staff) => `
      <option value="${staff.id}">${staff.name} (${staff.role})</option>
    `).join('');

    content.innerHTML = `
      <div class="card">
        <h3>Pending Pickup Orders</h3>
        ${(ordersRes.data.orders || []).map((order) => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="font-weight:700">${order.branch_name || 'Branch'} · ${order.customer_name}</div>
            <div style="font-size:0.85rem;color:var(--text-3)">Status: ${order.status} · Slot: ${order.pickup_time_slot || 'N/A'}</div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">
              <select id="assign-${order.id}" class="filter-select">
                <option value="">Select staff member</option>
                ${staffOptions}
              </select>
              <button class="btn btn-primary" onclick="ProfilePage.assignOrder('${order.id}')">Assign to Staff</button>
            </div>
          </div>
        `).join('') || '<p>No pickup orders need assignment right now.</p>'}
      </div>
    `;
  },

  async assignOrder(orderId) {
    const staffUserId = document.getElementById(`assign-${orderId}`)?.value;
    if (!staffUserId) {
      Toast.show('Please choose a staff member first.', 'warning');
      return;
    }

    const res = await Api.assignOrder(orderId, { staff_user_id: Number(staffUserId) });
    if (!res.ok) {
      Toast.show(res.data.message || 'Could not assign order.', 'error');
      return;
    }
    Toast.show('Order assigned.', 'success');
    await this.renderManagerTab();
  },

  async renderStaffTab() {
    const content = document.getElementById('profileContent');
    if (!content) return;
    const res = await Api.getStaffOrders();

    if (!res.ok) {
      content.innerHTML = `<p style="color:var(--error)">${res.data.message || 'Failed to load staff orders.'}</p>`;
      return;
    }

    content.innerHTML = `
      <div class="card">
        <h3>Assigned Pickup Orders</h3>
        ${(res.data.orders || []).map((order) => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="font-weight:700">${order.customer_name} · ${order.branch_name || 'Branch'}</div>
            <div style="font-size:0.85rem;color:var(--text-3)">Status: ${order.status} · Slot: ${order.pickup_time_slot || 'N/A'}</div>
            <button class="btn btn-primary" style="margin-top:8px" onclick="ProfilePage.markReady('${order.id}')">Mark Ready for Pick-up</button>
          </div>
        `).join('') || '<p>No assigned orders yet.</p>'}
      </div>
    `;
  },

  async markReady(orderId) {
    const res = await Api.markReadyForPickup(orderId);
    if (!res.ok) {
      Toast.show(res.data.message || 'Could not update order.', 'error');
      return;
    }
    Toast.show('Order marked ready for pickup.', 'success');
    await this.renderStaffTab();
  }
};
