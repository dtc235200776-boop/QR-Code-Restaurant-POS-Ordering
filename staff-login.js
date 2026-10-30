const form = document.getElementById('staffLogin');
const API_BASE = location.port === '3000' ? '' : `${location.protocol}//${location.hostname}:3000`;
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button'); button.disabled = true; button.textContent = 'Đang xác thực…';
  const error = document.getElementById('loginError'); error.textContent = '';
  try {
    const response = await fetch(`${API_BASE}/api/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: document.getElementById('staffPin').value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Đăng nhập thất bại.');
    const requested = new URLSearchParams(location.search).get('next');
    location.replace(['/kitchen.html', '/admin.html', '/qrcodes/', '/qrcodes/index.html'].includes(requested) ? requested : '/kitchen.html');
  } catch (err) { error.textContent = err.message; button.disabled = false; button.textContent = 'Đăng nhập'; }
});
