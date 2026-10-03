import { createClient, SupabaseAuthAdapter as NeonAuthCompatibilityAdapter } from 'https://cdn.jsdelivr.net/npm/@neondatabase/neon-js@0.7.0-beta/+esm';

const cfg = window.CDC_CONFIG || {};
const $ = (id) => document.getElementById(id);
let client = null;

function setStatus(id, message, type = '') {
  const el = $(id);
  if (!el) return;
  el.textContent = message || '';
  el.className = 'status' + (type ? ' ' + type : '');
}

function showView(view) {
  ['loginView', 'recoveryView', 'resetView', 'checkingView'].forEach((id) => {
    const el = $(id);
    if (el) el.hidden = id !== view;
  });
}

function adminDashboardUrl() {
  const root = new URL(cfg.canonicalUrl || '../', location.href);
  root.search = '';
  root.hash = '';
  root.searchParams.set('admin', '1');
  return root.toString();
}

function recoveryCallbackUrl() {
  const root = new URL('admin/', cfg.canonicalUrl || new URL('../', location.href));
  root.search = '';
  root.hash = '';
  root.searchParams.set('reset', '1');
  return root.toString();
}

async function verifyAdministrator(session) {
  if (!session?.user?.id || !client) return false;
  const { data, error } = await client
    .from('admin_users')
    .select('id,email,display_name,role,is_active')
    .eq('id', session.user.id)
    .maybeSingle();
  if (error || !data?.is_active) return false;
  return data;
}

async function enterDashboard(session) {
  showView('checkingView');
  $('checkingStatus').textContent = 'Verifying your administrator permissions…';
  const admin = await verifyAdministrator(session);
  if (!admin) {
    try { await client.auth.signOut(); } catch {}
    showView('loginView');
    setStatus('loginStatus', 'This account is not authorised for Child Development Centre administration.', 'error');
    return;
  }
  $('checkingStatus').textContent = 'Access confirmed. Opening the administration dashboard…';
  location.replace(adminDashboardUrl());
}

async function initialiseSession() {
  const params = new URLSearchParams(location.search);
  const resetIntent = params.get('reset') === '1' || params.has('token') || params.get('error') === 'INVALID_TOKEN';
  if (resetIntent) {
    showView('resetView');
    if (params.get('error') === 'INVALID_TOKEN' || !params.get('token')) {
      setStatus('resetStatus', 'This reset link is invalid or has expired. Request a new password reset link.', 'error');
      $('resetSubmit').disabled = true;
    }
    return;
  }

  showView('checkingView');
  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    if (session) {
      await enterDashboard(session);
      return;
    }
  } catch (error) {
    console.error('Administrator session check failed', error);
  }
  showView('loginView');
}

function cleanResetUrl() {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  history.replaceState({}, '', url.toString());
}

function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.togglePassword);
      if (!input) return;
      const reveal = input.type === 'password';
      input.type = reveal ? 'text' : 'password';
      button.textContent = reveal ? 'Hide' : 'Show';
      button.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
    });
  });
}

function initForms() {
  $('forgotPassword').addEventListener('click', () => {
    const email = $('loginForm').elements.email.value || '';
    $('recoveryForm').elements.email.value = email;
    setStatus('recoveryStatus', '');
    showView('recoveryView');
  });

  document.querySelectorAll('[data-back-login]').forEach((button) => {
    button.addEventListener('click', () => {
      cleanResetUrl();
      $('resetSubmit').disabled = false;
      showView('loginView');
    });
  });

  $('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = $('loginSubmit');
    const email = String(form.elements.email.value || '').trim();
    const password = String(form.elements.password.value || '');
    if (!email || !password) {
      setStatus('loginStatus', 'Enter your administrator email address and password.', 'error');
      return;
    }

    submit.disabled = true;
    setStatus('loginStatus', 'Signing in securely…');
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const session = data?.session || (await client.auth.getSession()).data?.session;
      if (!session) throw new Error('No authenticated session was returned.');
      await enterDashboard(session);
    } catch (error) {
      console.error('Administrator sign-in failed', error);
      setStatus('loginStatus', 'Sign-in failed. Check your credentials and try again.', 'error');
      submit.disabled = false;
    }
  });

  $('recoveryForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = $('recoverySubmit');
    const email = String(form.elements.email.value || '').trim();
    if (!email) {
      setStatus('recoveryStatus', 'Enter the administrator email address.', 'error');
      return;
    }

    submit.disabled = true;
    setStatus('recoveryStatus', 'Requesting a secure password reset link…');
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: recoveryCallbackUrl() });
      if (error) throw error;
      setStatus('recoveryStatus', 'If an administrator account exists for that email, a reset link has been sent. Check the inbox and spam/junk folder.', 'success');
    } catch (error) {
      console.error('Administrator password recovery failed', error);
      setStatus('recoveryStatus', 'Password recovery could not be started. Please try again shortly.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  $('resetForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = $('resetSubmit');
    const token = new URLSearchParams(location.search).get('token') || '';
    const password = String(form.elements.password.value || '');
    const confirmPassword = String(form.elements.confirm_password.value || '');

    if (!token) {
      setStatus('resetStatus', 'This reset link is invalid or has expired. Request a new password reset link.', 'error');
      return;
    }
    if (password.length < 12) {
      setStatus('resetStatus', 'Use a new password of at least 12 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('resetStatus', 'The two password entries do not match.', 'error');
      return;
    }

    const betterAuth = client.auth.getBetterAuthInstance?.();
    if (!betterAuth?.resetPassword) {
      setStatus('resetStatus', 'Password recovery is temporarily unavailable. Please request a new link later.', 'error');
      return;
    }

    submit.disabled = true;
    setStatus('resetStatus', 'Updating your password…');
    try {
      const result = await betterAuth.resetPassword({ newPassword: password, token });
      if (result?.error) throw result.error;
      try { await client.auth.signOut(); } catch {}
      form.reset();
      cleanResetUrl();
      showView('loginView');
      setStatus('loginStatus', 'Password changed successfully. Sign in with your new password.', 'success');
    } catch (error) {
      console.error('Administrator password reset failed', error);
      setStatus('resetStatus', 'This reset link is invalid, expired, or already used. Request a new password reset link.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

async function boot() {
  initPasswordToggles();
  initForms();

  if (!cfg.neonAuthUrl || !cfg.neonDataApiUrl || String(cfg.neonAuthUrl).startsWith('__') || String(cfg.neonDataApiUrl).startsWith('__')) {
    showView('loginView');
    setStatus('loginStatus', 'Administrator authentication is temporarily unavailable.', 'error');
    $('loginSubmit').disabled = true;
    return;
  }

  try {
    client = createClient({
      auth: {
        adapter: NeonAuthCompatibilityAdapter(),
        url: cfg.neonAuthUrl,
        allowAnonymous: true,
      },
      dataApi: { url: cfg.neonDataApiUrl },
    });
  } catch (error) {
    console.error('Administrator authentication init failed', error);
    showView('loginView');
    setStatus('loginStatus', 'Administrator authentication is temporarily unavailable.', 'error');
    $('loginSubmit').disabled = true;
    return;
  }

  await initialiseSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
