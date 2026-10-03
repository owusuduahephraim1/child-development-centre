import { createClient, SupabaseAuthAdapter as NeonAuthCompatibilityAdapter } from 'https://cdn.jsdelivr.net/npm/@neondatabase/neon-js@0.7.0-beta/+esm';

const cfg = window.CDC_CONFIG || {};
let client = null;

try {
  if (cfg.neonAuthUrl && cfg.neonDataApiUrl) {
    client = createClient({
      auth: {
        adapter: NeonAuthCompatibilityAdapter(),
        url: cfg.neonAuthUrl,
        allowAnonymous: true,
      },
      dataApi: { url: cfg.neonDataApiUrl },
    });
  }
} catch (error) {
  console.error('Password recovery init failed', error);
}

const $ = (id) => document.getElementById(id);

function recoveryCallbackUrl() {
  const base = new URL(cfg.canonicalUrl || location.href, location.href);
  base.hash = '';
  base.search = '';
  base.searchParams.set('admin', '1');
  base.searchParams.set('reset', '1');
  return base.toString();
}

function openAdminModal() {
  const modal = $('adminModal');
  const loginView = $('adminLoginView');
  const dashboard = $('adminDashboard');
  if (modal) modal.hidden = false;
  if (loginView) loginView.hidden = false;
  if (dashboard) dashboard.hidden = true;
  document.body.style.overflow = 'hidden';
}

function showOnly(which) {
  const login = $('adminLoginForm');
  const signup = $('adminSignupForm');
  const recovery = $('adminRecoveryForm');
  const reset = $('adminResetPasswordForm');
  if (login) login.hidden = which !== 'login';
  if (signup) signup.hidden = true;
  if (recovery) recovery.hidden = which !== 'recovery';
  if (reset) reset.hidden = which !== 'reset';
}

function cleanRecoveryUrl() {
  const u = new URL(location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set('admin', '1');
  history.replaceState({}, '', u.toString());
}

function buildRecoveryUi() {
  const loginView = $('adminLoginView');
  const loginForm = $('adminLoginForm');
  if (!loginView || !loginForm || $('adminRecoveryForm')) return;

  const signInButton = loginForm.querySelector('button[type="submit"]');
  const forgot = document.createElement('button');
  forgot.type = 'button';
  forgot.id = 'adminForgotPassword';
  forgot.className = 'btn btn-outline';
  forgot.textContent = 'Forgot Password?';
  if (signInButton) signInButton.insertAdjacentElement('afterend', forgot);
  else loginForm.appendChild(forgot);

  const recovery = document.createElement('form');
  recovery.id = 'adminRecoveryForm';
  recovery.hidden = true;
  recovery.innerHTML = `
    <div class="admin-safety-note"><strong>Password recovery:</strong> enter the authorised administrator email address. For security, the response will not confirm whether an account exists.</div>
    <label>Administrator email<input name="email" type="email" required autocomplete="email" maxlength="180"></label>
    <button class="btn btn-primary" type="submit">Send Password Reset Link</button>
    <button class="btn btn-outline" id="adminRecoveryBack" type="button">Back to Sign In</button>
    <p id="adminRecoveryStatus" class="form-status" role="status"></p>`;
  loginView.appendChild(recovery);

  const reset = document.createElement('form');
  reset.id = 'adminResetPasswordForm';
  reset.hidden = true;
  reset.innerHTML = `
    <div class="admin-safety-note"><strong>Set a new password:</strong> use at least 12 characters. The recovery link is time-limited and can be used only once.</div>
    <label>New password<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label>
    <label>Confirm new password<input name="confirm_password" type="password" required minlength="12" maxlength="128" autocomplete="new-password"></label>
    <button class="btn btn-primary" type="submit">Set New Password</button>
    <button class="btn btn-outline" id="adminResetBack" type="button">Back to Sign In</button>
    <p id="adminResetStatus" class="form-status" role="status"></p>`;
  loginView.appendChild(reset);

  forgot.addEventListener('click', () => {
    const currentEmail = loginForm.querySelector('input[name="email"]')?.value || '';
    recovery.querySelector('input[name="email"]').value = currentEmail;
    $('adminRecoveryStatus').textContent = '';
    showOnly('recovery');
  });

  $('adminRecoveryBack').addEventListener('click', () => showOnly('login'));
  $('adminResetBack').addEventListener('click', () => {
    cleanRecoveryUrl();
    showOnly('login');
  });

  recovery.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = $('adminRecoveryStatus');
    const submit = recovery.querySelector('button[type="submit"]');
    const email = String(new FormData(recovery).get('email') || '').trim();
    if (!client || !email) {
      status.textContent = 'Password recovery is temporarily unavailable. Please try again.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Requesting a secure password reset link…';
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: recoveryCallbackUrl(),
      });
      if (error) throw error;
      status.textContent = 'If an administrator account exists for that email, a reset link has been sent. Check the inbox and spam/junk folder.';
    } catch (error) {
      console.error('Password reset request failed', error);
      status.textContent = 'Password recovery could not be started. Please try again shortly.';
    } finally {
      submit.disabled = false;
    }
  });

  reset.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = $('adminResetStatus');
    const submit = reset.querySelector('button[type="submit"]');
    const params = new URLSearchParams(location.search);
    const token = params.get('token') || '';
    const form = new FormData(reset);
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirm_password') || '');

    if (!token) {
      status.textContent = 'This reset link is invalid or has expired. Request a new password reset link.';
      return;
    }
    if (password.length < 12) {
      status.textContent = 'Use a new password of at least 12 characters.';
      return;
    }
    if (password !== confirmPassword) {
      status.textContent = 'The two password entries do not match.';
      return;
    }

    const betterAuth = client?.auth?.getBetterAuthInstance?.();
    if (!betterAuth?.resetPassword) {
      status.textContent = 'Password recovery is temporarily unavailable. Please request a new link later.';
      return;
    }

    submit.disabled = true;
    status.textContent = 'Updating password…';
    try {
      const result = await betterAuth.resetPassword({ newPassword: password, token });
      if (result?.error) throw result.error;
      try { await client.auth.signOut(); } catch {}
      status.textContent = 'Password changed successfully. You can now sign in with the new password.';
      reset.reset();
      cleanRecoveryUrl();
      setTimeout(() => {
        showOnly('login');
        const loginStatus = $('adminLoginStatus');
        if (loginStatus) loginStatus.textContent = 'Password reset complete. Sign in with your new password.';
      }, 900);
    } catch (error) {
      console.error('Password reset failed', error);
      status.textContent = 'This reset link is invalid, expired, or already used. Request a new password reset link.';
    } finally {
      submit.disabled = false;
    }
  });

  const params = new URLSearchParams(location.search);
  const hasResetIntent = params.get('reset') === '1' || params.has('token') || params.get('error') === 'INVALID_TOKEN';
  if (hasResetIntent) {
    openAdminModal();
    showOnly('reset');
    if (params.get('error') === 'INVALID_TOKEN' || !params.get('token')) {
      $('adminResetStatus').textContent = 'This reset link is invalid or has expired. Request a new password reset link.';
      reset.querySelector('button[type="submit"]').disabled = true;
    }
  }
}

function init() {
  buildRecoveryUi();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 450), { once: true });
} else {
  setTimeout(init, 450);
}
window.addEventListener('pageshow', () => setTimeout(init, 120), { once: true });
