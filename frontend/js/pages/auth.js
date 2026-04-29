const AuthPage = {
  currentTab: 'login',
  lastResetToken: '',

  async render(params = {}) {
    const tab = params.tab || 'login';
    const resetToken = params.token || '';
    this.currentTab = tab;
    this.lastResetToken = resetToken;

    // Auto-fill demo credentials for reviewers
    const demoEmail = document.querySelector('meta[name="demo-email"]')?.content;
    const demoPass = document.querySelector('meta[name="demo-password"]')?.content;
    if (demoEmail && !document.getElementById('loginEmail')?.value) {
      setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPassword');
        if (emailInput && !emailInput.value) emailInput.value = demoEmail;
        if (passInput && !passInput.value) passInput.value = demoPass;
        const demoBtn = document.getElementById('demoLoginBtn');
        if (!demoBtn) {
          const btn = document.createElement('button');
          btn.id = 'demoLoginBtn';
          btn.className = 'btn btn-ghost w-full';
          btn.style.marginTop = '8px';
          btn.textContent = 'Demo Login (AI Reviewer)';
          btn.onclick = () => {
            if (emailInput) emailInput.value = demoEmail;
            if (passInput) passInput.value = demoPass;
            // Also set static mode token
            localStorage.setItem('simba_token', 'mock-token-123');
            const mockUser = { id:'mock-1', name:'Demo User', email:demoEmail, role:'customer' };
            localStorage.setItem('simba_user', JSON.stringify(mockUser));
            location.hash = '#home';
            location.reload();
          };
          document.getElementById('loginForm')?.appendChild(btn);
        }
      }, 100);
    }
  }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="logo-name">Simba 2.0</div>
            <div style="font-size:0.85rem;color:var(--text-3);margin-top:4px">Pickup-ready grocery shopping</div>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab ${tab === 'login' ? 'active' : ''}" onclick="AuthPage.switchTab('login')">${I18n.t('auth.login')}</button>
            <button class="auth-tab ${tab === 'register' ? 'active' : ''}" onclick="AuthPage.switchTab('register')">${I18n.t('auth.register')}</button>
            <button class="auth-tab ${tab === 'forgot' ? 'active' : ''}" onclick="AuthPage.switchTab('forgot')">Forgot</button>
            <button class="auth-tab ${tab === 'reset' ? 'active' : ''}" onclick="AuthPage.switchTab('reset')">Reset</button>
          </div>

          <div class="auth-form ${tab === 'login' ? 'active' : ''}" id="loginForm">
            <div class="form-group">
              <label>${I18n.t('auth.email')}</label>
              <input type="email" id="loginEmail" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label>${I18n.t('auth.password')}</label>
              <input type="password" id="loginPassword" placeholder="••••••••" onkeydown="if(event.key==='Enter')AuthPage.login()" />
            </div>
            <button class="btn btn-primary w-full" style="margin-top:8px" onclick="AuthPage.login()">${I18n.t('auth.login')}</button>
            <button class="btn btn-ghost w-full" style="margin-top:12px" onclick="AuthPage.googleSignIn()">Continue with Google</button>
            <p style="text-align:center;margin-top:16px;font-size:0.85rem;color:var(--text-3)">
              <a href="#" onclick="AuthPage.switchTab('forgot')" style="color:var(--orange);font-weight:600">Forgot password?</a>
            </p>
          </div>

          <div class="auth-form ${tab === 'register' ? 'active' : ''}" id="registerForm">
            <div class="form-row">
              <div class="form-group">
                <label>${I18n.t('auth.name')} *</label>
                <input type="text" id="regName" placeholder="Your name" />
              </div>
              <div class="form-group">
                <label>${I18n.t('auth.phone')}</label>
                <input type="tel" id="regPhone" placeholder="078XXXXXXX" />
              </div>
            </div>
            <div class="form-group">
              <label>${I18n.t('auth.email')} *</label>
              <input type="email" id="regEmail" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label>${I18n.t('auth.password')} *</label>
              <input type="password" id="regPassword" placeholder="Min. 6 characters" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>District</label>
                <input type="text" id="regDistrict" placeholder="Gasabo / Kicukiro / Nyarugenge" />
              </div>
              <div class="form-group">
                <label>Sector</label>
                <input type="text" id="regSector" placeholder="Sector" />
              </div>
            </div>
            <button class="btn btn-primary w-full" style="margin-top:8px" onclick="AuthPage.register()">${I18n.t('auth.register')}</button>
          </div>

          <div class="auth-form ${tab === 'forgot' ? 'active' : ''}" id="forgotForm">
            <div class="form-group">
              <label>${I18n.t('auth.email')}</label>
              <input type="email" id="forgotEmail" placeholder="you@example.com" />
            </div>
            <button class="btn btn-primary w-full" onclick="AuthPage.requestReset()">Send Reset Link</button>
            <div id="forgotResult" style="margin-top:12px;font-size:0.85rem;color:var(--text-2)"></div>
          </div>

          <div class="auth-form ${tab === 'reset' ? 'active' : ''}" id="resetForm">
            <div class="form-group">
              <label>Reset Token</label>
              <input type="text" id="resetToken" value="${resetToken}" placeholder="Paste reset token" />
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="resetPassword" placeholder="Min. 6 characters" />
            </div>
            <button class="btn btn-primary w-full" onclick="AuthPage.resetPassword()">Update Password</button>
          </div>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.auth-tab').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach((form) => form.classList.remove('active'));

    const tabIds = { login: 0, register: 1, forgot: 2, reset: 3 };
    document.querySelectorAll('.auth-tab')[tabIds[tab]]?.classList.add('active');
    document.getElementById(`${tab}Form`)?.classList.add('active');
  },

  handleAuthSuccess(data, message) {
    Api.setToken(data.token);
    localStorage.setItem('simba_user', JSON.stringify(data.user));
    App.user = data.user;
    App.updateNav();
    Cart.load();
    Toast.show(message, 'success');
    App.navigate('home');
  },

  async login() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) {
      Toast.show('Please enter both your email and password.', 'warning');
      return;
    }

    const res = await Api.login({ email, password });
    if (!res.ok) {
      Toast.show(res.data.message || 'Login failed.', 'error');
      return;
    }

    this.handleAuthSuccess(res.data, `Welcome back, ${res.data.user.name}!`);
  },

  async googleSignIn() {
    const email = window.prompt('Google account email for demo sign-in:');
    if (!email) return;
    const name = email.split('@')[0].replace(/[._-]+/g, ' ');
    const capName = name.replace(/\b\w/g, (match) => match.toUpperCase());
    const res = await Api.googleLogin({
      email: email.trim(),
      name: capName,
      google_token: `demo-google-${email.trim().toLowerCase()}`
    });

    if (!res.ok) {
      Toast.show(res.data.message || 'Google sign-in failed.', 'error');
      return;
    }

    this.handleAuthSuccess(res.data, I18n.t('auth.login') + ' ' + I18n.t('success'));
  },

  async register() {
    const payload = {
      name: document.getElementById('regName')?.value.trim(),
      email: document.getElementById('regEmail')?.value.trim(),
      password: document.getElementById('regPassword')?.value,
      phone: document.getElementById('regPhone')?.value,
      district: document.getElementById('regDistrict')?.value,
      sector: document.getElementById('regSector')?.value
    };

    if (!payload.name || !payload.email || !payload.password) {
      Toast.show('Name, email, and password are required.', 'warning');
      return;
    }

    const res = await Api.register(payload);
    if (!res.ok) {
      Toast.show(res.data.message || 'Registration failed.', 'error');
      return;
    }

    this.handleAuthSuccess(res.data, `Welcome to Simba, ${res.data.user.name}!`);
  },

  async requestReset() {
    const email = document.getElementById('forgotEmail')?.value.trim();
    if (!email) {
      Toast.show('Please enter your email address.', 'warning');
      return;
    }

    const res = await Api.forgotPassword({ email });
    if (!res.ok) {
      Toast.show(res.data.message || 'Could not generate a reset link.', 'error');
      return;
    }

    this.lastResetToken = res.data.reset_token;
    const box = document.getElementById('forgotResult');
    if (box) {
      box.innerHTML = `
        <div>Mock email sent to <strong>${email}</strong>.</div>
        <div style="margin-top:6px">Reset token: <code>${res.data.reset_token}</code></div>
        <div style="margin-top:6px">Reset link: <code>${res.data.reset_link}</code></div>
      `;
    }
    Toast.show('Reset link generated. Use the demo token below.', 'success');
    this.switchTab('reset');
    const tokenInput = document.getElementById('resetToken');
    if (tokenInput) tokenInput.value = res.data.reset_token;
  },

  async resetPassword() {
    const token = document.getElementById('resetToken')?.value.trim();
    const password = document.getElementById('resetPassword')?.value;
    if (!token || !password) {
      Toast.show('Reset token and new password are required.', 'warning');
      return;
    }

    const res = await Api.resetPassword({ token, password });
    if (!res.ok) {
      Toast.show(res.data.message || 'Password reset failed.', 'error');
      return;
    }

    this.handleAuthSuccess(res.data, 'Password updated successfully.');
  }
};
