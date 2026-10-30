const money = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const API_BASE = location.port === '3000' ? '' : `${location.protocol}//${location.hostname}:3000`;
const apiUrl = path => `${API_BASE}${path}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let orders = [];
let previousOrderIds = new Set();

function updateKitchenClock() {
  const clock = document.getElementById('kdsClock');
  if (clock) clock.textContent = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
}
updateKitchenClock();
setInterval(updateKitchenClock, 1000);

async function api(url, options = {}) {
  const response = await fetch(apiUrl(url), { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const result = response.status === 204 ? {} : await response.json();
  if (response.status === 401) { location.replace(`/staff-login.html?next=${encodeURIComponent('/kitchen.html')}`); throw new Error('Cần đăng nhập nhân viên.'); }
  if (!response.ok) throw new Error(result.error || 'Không thể kết nối máy chủ.');
  return result;
}

function playAlert() { try { const ctx = new AudioContext(); const tone = ctx.createOscillator(); const gain = ctx.createGain(); tone.frequency.value = 880; gain.gain.value = .12; tone.connect(gain); gain.connect(ctx.destination); tone.start(); tone.stop(ctx.currentTime + .2); } catch (_) {} }

function renderStation(station, rootId, countId) {
  const active = orders.filter(order => order.status !== 'paid' && order.stations?.[station]);
  document.getElementById(countId).textContent = `${active.length} phiếu`;
  document.getElementById(rootId).innerHTML = active.length ? active.map(order => {
    const status = order.stations[station];
    const items = order.items.filter(item => item.section === station);
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(order.createdAt)) / 60000));
    const action = status === 'pending' ? `<button data-order="${escapeHtml(order.id)}" data-station="${station}" data-status="cooking">Bắt đầu chế biến</button>` : status === 'cooking' ? `<button class="ready-action" data-order="${escapeHtml(order.id)}" data-station="${station}" data-status="ready">Hoàn tất phiếu</button>` : '<span class="ready-label">✓ Sẵn sàng</span>';
    return `<article class="ticket-card ${status}"><header class="ticket-head"><div><span class="ticket-table">${escapeHtml(order.table)}</span><span class="ticket-code">#${escapeHtml(order.id)}</span></div><span class="ticket-age ${minutes >= 15 ? 'late' : ''}">${minutes === 0 ? 'Vừa nhận' : `${minutes} phút`}</span></header><div class="ticket-status"><i></i>${({ pending: 'CHỜ THỰC HIỆN', cooking: 'ĐANG CHẾ BIẾN', ready: 'ĐÃ HOÀN TẤT' })[status]}</div><ul>${items.map(item => `<li><div><b>${escapeHtml(item.name)}</b>${item.note ? `<small>Ghi chú: ${escapeHtml(item.note)}</small>` : ''}</div><strong>×${item.qty}</strong></li>`).join('')}</ul><footer>${action}</footer></article>`;
  }).join('') : '<div class="station-empty"><span>✓</span><b>Chưa có phiếu</b><small>Đơn mới sẽ tự động xuất hiện tại đây</small></div>';
}

function renderKitchen() {
  const pending = orders.filter(order => order.status !== 'paid').reduce((sum, order) => sum + Object.values(order.stations || {}).filter(status => status === 'pending').length, 0);
  const cooking = orders.filter(order => order.status !== 'paid').reduce((sum, order) => sum + Object.values(order.stations || {}).filter(status => status === 'cooking').length, 0);
  const ready = orders.filter(order => order.status === 'ready' || order.status === 'served').length;
  document.getElementById('pendingTotal').textContent = pending;
  document.getElementById('cookingTotal').textContent = cooking;
  document.getElementById('readyTotal').textContent = ready;
  renderStation('food', 'foodTickets', 'foodTicketCount');
  renderStation('drink', 'drinkTickets', 'drinkTicketCount');
}

async function loadOrders() { orders = (await api('/api/orders')).orders; renderKitchen(); }
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-order][data-station]'); if (!button) return;
  button.disabled = true;
  try { await api(`/api/orders/${encodeURIComponent(button.dataset.order)}/station`, { method: 'PATCH', body: JSON.stringify({ station: button.dataset.station, status: button.dataset.status }) }); await loadOrders(); }
  catch (error) { alert(error.message); button.disabled = false; }
});
document.getElementById('logoutButton').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); location.replace('/index.html'); });

(async () => {
  try {
    await loadOrders();
    previousOrderIds = new Set(orders.map(order => order.id));
    document.getElementById('connectionState').textContent = '● Đang nhận đơn trực tiếp';
    document.getElementById('connectionState').classList.add('connected');
    const events = new EventSource(apiUrl('/api/events'), { withCredentials: true });
    events.addEventListener('order', event => {
      const order = JSON.parse(event.data); const isNew = !previousOrderIds.has(order.id);
      if (isNew) playAlert();
      previousOrderIds.add(order.id);
      const index = orders.findIndex(item => item.id === order.id);
      if (index < 0) orders.unshift(order); else orders[index] = order;
      renderKitchen();
    });
    events.onerror = () => { document.getElementById('connectionState').textContent = 'Đang khôi phục kết nối…'; document.getElementById('connectionState').classList.remove('connected'); };
  } catch (error) { document.getElementById('connectionState').textContent = error.message; }
})();
