const form = document.getElementById('staffLogin');
const API_BASE = '';
const passwordInput = document.getElementById('staffPassword');
const passwordToggle = document.getElementById('togglePassword');
const EXPECTED_SERVER_VERSION = '2026-11-03-guest-room-qr-realtime-1';
const loginParams = new URLSearchParams(location.search);
const requestedRole = loginParams.get('role');
const roleSelect = document.getElementById('staffRole');
const usernameInput = document.getElementById('staffUsername');
const roleAccounts = { receptionist: 'letan', cashier: 'thungan', kitchen: 'bep', housekeeping: 'buongphong', manager: 'quanly' };
if (requestedRole && [...roleSelect.options].some(option => option.value === requestedRole)) roleSelect.value = requestedRole;
function syncRoleAccount() { usernameInput.value = roleAccounts[roleSelect.value] || ''; }
roleSelect.addEventListener('change', syncRoleAccount);
syncRoleAccount();
passwordToggle.addEventListener('click', () => {
  const reveal = passwordInput.type === 'password';
  passwordInput.type = reveal ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(reveal));
  passwordToggle.setAttribute('aria-label', reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  passwordToggle.title = reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'Đang xác thực…';
  const error = document.getElementById('loginError'); error.textContent = '';
  try {
    const healthResponse = await fetch('/api/health', { cache: 'no-store' });
    const health = healthResponse.ok ? await healthResponse.json() : null;
    if (health?.version !== EXPECTED_SERVER_VERSION) {
      throw new Error('Bạn đang mở máy chủ cũ nên tài khoản không được nhận. Hãy chạy start-pos.bat trong thư mục dự án và đăng nhập ở trang vừa được mở.');
    }
    const role = document.getElementById('staffRole').value;
    const response = await fetch(`${API_BASE}/api/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, username: roleAccounts[role], password: document.getElementById('staffPassword').value.trim() }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Đăng nhập thất bại.');
    const requested = loginParams.get('next');
    const defaultPage = { receptionist: '/letan.html', cashier: '/thu-ngan.html', housekeeping: '/van-hanh.html#housekeeping', kitchen: '/van-hanh.html#kitchen', manager: '/manager.html' }[role];
    const allowed = { receptionist: ['/letan.html'], cashier: ['/thu-ngan.html'], housekeeping: ['/van-hanh.html'], kitchen: ['/van-hanh.html'], manager: ['/manager.html', '/thu-ngan.html', '/van-hanh.html', '/letan.html'] }[role];
    const requestedPage = requested ? requested.split('#')[0] : '';
    location.replace(allowed.includes(requestedPage) ? requested : defaultPage);
  } catch (err) { error.textContent = err.message; button.disabled = false; button.textContent = 'Đăng nhập'; }
});
