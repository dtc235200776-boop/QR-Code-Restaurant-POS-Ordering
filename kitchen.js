const money = value => Number(value || 0) === 0 ? 'Miễn phí' : `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const API_BASE = '';
const apiUrl = path => `${API_BASE}${path}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let orders = [];
let previousOrderIds = new Set();
let staffRole = null;
const visibleStations = () => staffRole === 'manager' ? ['housekeeping', 'dining'] : staffRole === 'housekeeping' ? ['housekeeping'] : ['dining'];
let activeOpsTab = location.hash === '#housekeeping' ? 'housekeeping' : 'kitchen';

function updateKitchenClock() {
  const clock = document.getElementById('kdsClock');
  if (clock) clock.textContent = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
}
updateKitchenClock();
setInterval(updateKitchenClock, 1000);

async function api(url, options = {}) {
  const response = await fetch(apiUrl(url), { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const result = response.status === 204 ? {} : await response.json();
  if (response.status === 401) { location.replace(`/staff-login.html?next=${encodeURIComponent(location.pathname)}`); throw new Error('Cần đăng nhập nhân viên khách sạn.'); }
  if (!response.ok) throw new Error(result.error || 'Không thể kết nối máy chủ.');
  return result;
}

function playAlert() { try { const ctx = new AudioContext(); const tone = ctx.createOscillator(); const gain = ctx.createGain(); tone.frequency.value = 880; gain.gain.value = .12; tone.connect(gain); gain.connect(ctx.destination); tone.start(); tone.stop(ctx.currentTime + .2); } catch (_) {} }

function renderStation(station, rootId, countId) {
  const active = orders.filter(order => order.status !== 'paid' && order.stations?.[station]);
  document.getElementById(countId).textContent = `${active.length} yêu cầu`;
  document.getElementById(rootId).innerHTML = active.length ? active.map(order => {
    const status = order.stations[station];
    const items = order.items.filter(item => item.section === station);
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(order.createdAt)) / 60000));
    const action = status === 'pending'
      ? `<button data-order="${escapeHtml(order.id)}" data-station="${station}" data-status="cooking">Tiếp nhận phục vụ</button>`
      : status === 'cooking'
      ? `<button class="ready-action" data-order="${escapeHtml(order.id)}" data-station="${station}" data-status="ready">Hoàn tất phục vụ</button>`
      : '<span class="ready-label">✓ Đã phục vụ</span>';
      
    const statusText = { pending: 'CHỜ TIẾP NHẬN', cooking: 'ĐANG PHỤC VỤ TẠI PHÒNG', ready: 'ĐÃ HOÀN TẤT' }[status] || 'ĐANG XỬ LÝ';
    
    return `
      <article class="ticket-card ${status}">
        <header class="ticket-head">
          <div>
            <span class="ticket-table">${escapeHtml(order.table)}</span>
            <span class="ticket-code">#${escapeHtml(order.id)}</span>
          </div>
          <span class="ticket-age ${minutes >= 15 ? 'late' : ''}">${minutes === 0 ? 'Vừa gửi' : `${minutes} phút trước`}</span>
        </header>
        <div class="ticket-status"><i></i>${statusText}</div>
        <ul>
          ${items.map(item => `<li><div><b>${escapeHtml(item.name)}</b>${item.note ? `<small>Ghi chú: ${escapeHtml(item.note)}</small>` : ''}</div><strong>×${item.qty}</strong></li>`).join('')}
        </ul>
        <footer>${action}</footer>
      </article>`;
  }).join('') : '<div class="station-empty"><span>✓</span><b>Chưa có yêu cầu mới</b><small>Yêu cầu dịch vụ từ khách sẽ tự động xuất hiện tại đây</small></div>';
}

function renderKitchen() {
  const stations = visibleStations();
  const activeOrders = orders.filter(order => order.status !== 'paid');
  const pending = activeOrders.reduce((sum, order) => sum + stations.filter(station => order.stations?.[station === 'dining' ? 'dining' : 'housekeeping'] === 'pending').length, 0);
  const cooking = activeOrders.reduce((sum, order) => sum + stations.filter(station => order.stations?.[station] === 'cooking').length, 0);
  const ready = activeOrders.reduce((sum, order) => sum + stations.filter(station => order.stations?.[station] === 'ready').length, 0);
  document.getElementById('pendingTotal').textContent = pending;
  document.getElementById('cookingTotal').textContent = cooking;
  document.getElementById('readyTotal').textContent = ready;
  if (stations.includes('housekeeping')) renderStation('housekeeping', 'foodTickets', 'foodTicketCount');
  if (stations.includes('dining')) renderStation('dining', 'drinkTickets', 'drinkTicketCount');
  const houseCount = orders.filter(order => order.status !== 'paid' && order.stations?.housekeeping).length;
  const diningCount = orders.filter(order => order.status !== 'paid' && order.stations?.dining).length;
  document.getElementById('housekeepingTabCount')?.replaceChildren(document.createTextNode(houseCount));
  document.getElementById('diningTabCount')?.replaceChildren(document.createTextNode(diningCount));
}

function selectOpsTab(tab) {
  const station = tab === 'housekeeping' ? 'housekeeping' : 'dining';
  if (!visibleStations().includes(station)) return;
  activeOpsTab = tab;
  document.querySelectorAll('[data-ops-tab]').forEach(button => button.classList.toggle('active', button.dataset.opsTab === tab));
  document.querySelector('[data-station-panel="kitchen"]').hidden = tab !== 'kitchen' || !visibleStations().includes('dining');
  document.querySelector('[data-station-panel="housekeeping"]').hidden = tab !== 'housekeeping' || !visibleStations().includes('housekeeping');
  document.querySelector('[data-room-turnover]').hidden = tab !== 'housekeeping' || !['housekeeping', 'manager'].includes(staffRole);
  history.replaceState(null, '', `${location.pathname}${location.search}#${tab}`);
}

async function loadTurnoverRooms() {
  const panel = document.querySelector('[data-room-turnover]'); if (!panel) return;
  panel.hidden = !['housekeeping', 'manager'].includes(staffRole); if (panel.hidden) return;
  const root = document.getElementById('turnoverRooms');
  try {
    const response = await fetch(apiUrl('/api/rooms'), { credentials: 'include', cache: 'no-store' }); const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không tải được phòng chờ dọn.');
    const cleaning = data.rooms.filter(room => room.status === 'cleaning');
    document.getElementById('turnoverCount').textContent = `${cleaning.length} phòng`;
    root.innerHTML = cleaning.length ? cleaning.map(room => `<article class="turnover-room"><div><strong>Phòng ${room.number}</strong><small>${room.lastGuestName ? `Khách vừa trả: ${escapeHtml(room.lastGuestName)}` : 'Đã trả phòng · cần làm vệ sinh'}</small></div><button data-room-cleaned="${room.number}">Xác nhận phòng đã sạch</button></article>`).join('') : '<div class="station-empty"><span>✓</span><b>Chưa có phòng chờ dọn</b><small>Phòng vừa trả sẽ xuất hiện tại đây</small></div>';
  } catch (error) { root.textContent = error.message; }
}

async function loadOrders() { orders = (await api('/api/orders')).orders; renderKitchen(); }
document.addEventListener('click', async event => {
  const cleanButton = event.target.closest('[data-room-cleaned]');
  if (cleanButton) {
    cleanButton.disabled = true;
    try { await api(`/api/rooms/${cleanButton.dataset.roomCleaned}`, { method: 'PATCH', body: JSON.stringify({ action: 'cleaned' }) }); await loadTurnoverRooms(); }
    catch (error) { alert(error.message); cleanButton.disabled = false; }
    return;
  }
  const button = event.target.closest('[data-order][data-station]'); if (!button) return;
  button.disabled = true;
  try {
    await api(`/api/orders/${encodeURIComponent(button.dataset.order)}/station`, { method: 'PATCH', body: JSON.stringify({ station: button.dataset.station, status: button.dataset.status }) });
    await loadOrders();
    await loadTurnoverRooms();
  } catch (error) { alert(error.message); button.disabled = false; }
});
document.getElementById('logoutButton').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); location.replace('/bo-phan.html'); });

(async () => {
  try {
    const sessionResponse = await fetch(apiUrl('/api/session'), { credentials: 'include' });
    const session = await sessionResponse.json();
    staffRole = session.role;
    if (!location.hash) activeOpsTab = staffRole === 'housekeeping' ? 'housekeeping' : 'kitchen';
    const allowedStations = visibleStations();
    document.querySelectorAll('[data-ops-tab]').forEach(button => {
      const station = button.dataset.opsTab === 'housekeeping' ? 'housekeeping' : 'dining';
      button.hidden = !allowedStations.includes(station);
      button.addEventListener('click', () => selectOpsTab(button.dataset.opsTab));
    });
    document.querySelectorAll('[data-manager-link]').forEach(link => { link.hidden = staffRole !== 'manager'; });
    document.querySelector('[data-room-turnover]').hidden = !['housekeeping', 'manager'].includes(staffRole);
    document.getElementById('shiftLabel').textContent = staffRole === 'housekeeping' ? 'CA BUỒNG PHÒNG' : staffRole === 'kitchen' ? 'CA TRỰC BẾP' : 'QUẢN LÝ CA';
    selectOpsTab(activeOpsTab);
    await loadOrders();
    await loadTurnoverRooms();
    previousOrderIds = new Set(orders.map(order => order.id));
    document.getElementById('connectionState').textContent = '● Đang đồng bộ trực tiếp';
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
    if (staffRole === 'housekeeping' || staffRole === 'manager') setInterval(loadTurnoverRooms, 10000);
    events.onerror = () => { document.getElementById('connectionState').textContent = 'Đang khôi phục kết nối…'; document.getElementById('connectionState').classList.remove('connected'); };
  } catch (error) { document.getElementById('connectionState').textContent = error.message; }
})();
