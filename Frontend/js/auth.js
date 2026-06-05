// ================================================================
//  AUTH — Login, Register, Session, Logout
// ================================================================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'))
  );
  $('form-login').style.display = tab === 'login' ? 'block' : 'none';
  $('form-register').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLogin() {
  const u = $('login-username').value.trim(), p = $('login-password').value.trim();
  $('login-error').textContent = '';
  if (!u || !p) { $('login-error').textContent = 'Fill in all fields'; return; }
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    if (!res.ok) throw new Error((data && (data.message || data.error || data)) || 'Login failed');
    saveSession(data);
    showApp();
  } catch (e) { $('login-error').textContent = e.message; }
}

async function handleRegister() {
  const u = $('reg-username').value.trim(),
        e = $('reg-email').value.trim(),
        p = $('reg-password').value.trim(),
        l = $('reg-location').value.trim();
  $('reg-error').textContent = '';
  if (!u || !e || !p) { $('reg-error').textContent = 'Fill in all fields'; return; }
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, email: e, password: p, location: l })
    });
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    if (!res.ok) throw new Error((data && (data.message || data.error || data)) || 'Registration failed');
    saveSession(data);
    showApp();
  } catch (e) { $('reg-error').textContent = e.message; }
}

function saveSession(data) {
  token = data.token; userId = data.userId; username = data.username;
  localStorage.setItem('ei_token', token);
  localStorage.setItem('ei_userId', userId);
  localStorage.setItem('ei_username', username);
}

function handleLogout() {
  localStorage.removeItem('ei_token');
  localStorage.removeItem('ei_userId');
  localStorage.removeItem('ei_username');
  token = null; userId = null; username = null;
  $('screen-app').classList.remove('active');
  $('screen-auth').classList.add('active');
}
