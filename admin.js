const money = value => Number(value || 0) === 0 ? '0đ' : `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const API_BASE = location.port === '3000' ? '' : `${location.protocol}//${location.hostname}:3000`;
const apiUrl = path => `${API_BASE}${path}`;
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let orders = [];
let billView = 'unpaid';

async function api(url, options = {}) {
  const response = await fetch(apiUrl(url), { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const result = response.status === 204 ? {} : await response.json();
  if (response.status === 401) { location.replace(`/staff-login.html?next=${encodeURIComponent('/admin.html')}`); throw new Error('Cần đăng nhập nhân viên lễ tân.'); }
  if (!response.ok) throw new Error(result.error || 'Không thể kết nối máy chủ.');
  return result;
}

function renderReceipt(order) {
  const receipt = document.getElementById('receiptPrint');
  receipt.innerHTML = `
    <h2>Grand Cloud Hotel &amp; Resort</h2>
    <p>${order.status === 'paid' ? 'HÓA ĐƠN QUYẾT TOÁN DỊCH VỤ PHÒNG (CHECK-OUT)' : 'PHIẾU TẠM TÍNH DỊCH VỤ PHÒNG'}</p>
    <p>${safe(order.table)} · Mã phiếu: ${safe(order.id)}</p>
    <p>Thời gian: ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
    <hr>${order.items.map(item => `<p>${item.qty} × ${safe(item.name)}　${money(item.total)}</p>${item.salePercent ? `<small>Ưu đãi phòng: -${item.salePercent}%</small>` : ''}${item.note ? `<small>Ghi chú: ${safe(item.note)}</small>` : ''}`).join('')}
    <hr>
    <p>Tổng tiền dịch vụ: ${money(order.totalPrice)}</p>
    ${order.voucherDiscount ? `<p>Ưu đãi ${safe(order.voucherCode)}: -${money(order.voucherDiscount)}</p>` : ''}
    <p class="receipt-total">Thanh toán: ${money(order.amountPaid ?? order.totalPrice)}</p>
    <p>Kính chúc quý khách có kỳ nghỉ đáng nhớ tại Grand Cloud Hotel!</p>`;
  window.print();
}
window.printOrder = id => { const order = orders.find(item => item.id === id); if (order) renderReceipt(order); };

function renderBills() {
  const view = orders.filter(order => billView === 'paid' ? order.status === 'paid' : order.status !== 'paid');
  document.getElementById('billsList').innerHTML = view.length ? view.map(order => {
    const paid = order.status === 'paid';
    const items = order.items.map(item => `<li><span>${item.qty} × ${safe(item.name)}${item.note ? `<small> · ${safe(item.note)}</small>` : ''}${item.salePercent ? `<small class="sale-inline"> · giảm ${item.salePercent}%</small>` : ''}</span><b>${money(item.total)}</b></li>`).join('');
    const voucher = paid
      ? `<div class="paid-summary">${order.voucherCode ? `Mã ưu đãi ${safe(order.voucherCode)} · giảm ${money(order.voucherDiscount)}` : 'Không dùng mã giảm'}<strong>Đã quyết toán ${money(order.amountPaid ?? order.totalPrice)}</strong></div>`
      : `<label class="voucher-field">Mã ưu đãi phòng<input data-voucher-for="${safe(order.id)}" placeholder="Nhập mã nếu có (VD: HOTEL10)" autocomplete="off"></label><div class="payment-summary"><span>Tạm tính dịch vụ</span><b>${money(order.totalPrice)}</b><small>Khoản này sẽ gộp vào hóa đơn phòng</small></div>`;
    const action = paid
      ? `<button class="receipt-button" data-print="${safe(order.id)}">In phiếu quyết toán</button>`
      : `<button class="pay-button" data-pay="${safe(order.id)}" ${!['ready', 'served'].includes(order.status) ? 'disabled title="Chờ bộ phận phục vụ hoàn tất dịch vụ"' : ''}>Quyết toán Check-out</button>`;
    const state = paid ? 'Đã quyết toán' : ({ pending: 'Lễ tân đã nhận', cooking: 'Đang phục vụ', ready: 'Đã hoàn tất phục vụ', served: 'Đã phục vụ' }[order.status] || 'Đang xử lý');
    return `
      <article class="bill-card ${paid ? 'bill-paid' : ''}">
        <header>
          <div>
            <strong>${safe(order.table)}</strong>
            <small>#${safe(order.id)} · ${new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
          <span class="status-pill ${paid ? 'paid' : order.status}">${state}</span>
        </header>
        <ul>${items}</ul>
        ${voucher}
        <footer>
          <b>${paid ? 'Hoàn tất' : 'Lễ tân'}</b>
          ${action}
        </footer>
      </article>`;
  }).join('') : '<p class="admin-empty">Không có yêu cầu dịch vụ trong mục này.</p>';
}

function renderReports(paidOrders) {
  const daily = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - offset)); const key = date.toLocaleDateString('en-CA');
    const amount = paidOrders.filter(order => (order.paidAt || '').slice(0, 10) === key).reduce((sum, order) => sum + (order.amountPaid ?? order.totalPrice), 0);
    return { label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), amount };
  });
  const maximum = Math.max(...daily.map(day => day.amount), 1);
  document.getElementById('revenueChart').innerHTML = daily.map(day => `<div class="chart-col"><strong>${day.amount ? money(day.amount) : ''}</strong><i style="height:${Math.max(day.amount ? 8 : 3, day.amount / maximum * 100)}%"></i><span>${day.label}</span></div>`).join('');
  const popular = new Map(); paidOrders.forEach(order => order.items.forEach(item => popular.set(item.name, (popular.get(item.name) || 0) + item.qty)));
  const top = [...popular.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  document.getElementById('topItems').innerHTML = top.length ? top.map(([name, qty]) => `<li><span>${safe(name)}</span><b>${qty} lượt</b></li>`).join('') : '<li>Chưa có dữ liệu quyết toán</li>';
}

function renderAdmin() {
  const unpaid = orders.filter(order => order.status !== 'paid'); const paid = orders.filter(order => order.status === 'paid');
  const today = new Date().toLocaleDateString('en-CA'); const todayPaid = paid.filter(order => (order.paidAt || '').slice(0, 10) === today);
  const revenue = todayPaid.reduce((sum, order) => sum + (order.amountPaid ?? order.totalPrice), 0);
  document.getElementById('revenueStat').textContent = money(revenue);
  document.getElementById('revenueOrderCount').textContent = `${todayPaid.length} lượt phục vụ hôm nay`;
  document.getElementById('unpaidStat').textContent = unpaid.filter(order => ['ready', 'served'].includes(order.status)).length;
  const activeTables = new Set(unpaid.map(order => order.table));
  document.getElementById('occupiedStat').textContent = `${activeTables.size} / 12`;
  
  // 12 phòng từ Phòng 101 đến Phòng 112
  document.getElementById('tablesGrid').innerHTML = Array.from({ length: 12 }, (_, index) => {
    const room = `Phòng ${101 + index}`;
    const open = unpaid.filter(order => order.table === room);
    return `
      <article class="table-tile ${open.length ? 'occupied' : 'free'}">
        <span class="table-icon">${open.length ? '●' : '✓'}</span>
        <strong>${room}</strong>
        <span>${open.length ? `${open.length} yêu cầu · ${money(open.reduce((sum, order) => sum + order.totalPrice, 0))}` : 'Phòng trống'}</span>
      </article>`;
  }).join('');
  renderBills(); renderReports(paid);
}

async function loadOrders() { orders = (await api('/api/orders')).orders; renderAdmin(); }
document.getElementById('billsList').addEventListener('click', async event => {
  const print = event.target.closest('[data-print]'); if (print) return window.printOrder(print.dataset.print);
  const button = event.target.closest('[data-pay]'); if (!button) return;
  const id = button.dataset.pay; const input = document.querySelector(`[data-voucher-for="${CSS.escape(id)}"]`); button.disabled = true;
  try { await api(`/api/orders/${encodeURIComponent(id)}/pay`, { method: 'POST', body: JSON.stringify({ voucherCode: input?.value || '' }) }); await loadOrders(); }
  catch (error) { alert(error.message); button.disabled = false; }
});
document.querySelectorAll('[data-bill-view]').forEach(button => button.addEventListener('click', () => { billView = button.dataset.billView; document.querySelectorAll('[data-bill-view]').forEach(tab => tab.classList.toggle('active', tab === button)); renderBills(); }));
document.getElementById('cashierLogout').addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); location.replace('/index.html'); });

(async () => {
  try {
    await loadOrders(); document.getElementById('cashierConnection').textContent = '● Đang đồng bộ trực tiếp'; document.getElementById('cashierConnection').classList.add('connected');
    const events = new EventSource(apiUrl('/api/events'), { withCredentials: true }); events.addEventListener('order', event => { const order = JSON.parse(event.data); const index = orders.findIndex(item => item.id === order.id); if (index < 0) orders.unshift(order); else orders[index] = order; renderAdmin(); });
    events.onerror = () => { document.getElementById('cashierConnection').textContent = 'Đang khôi phục kết nối…'; document.getElementById('cashierConnection').classList.remove('connected'); };
  } catch (error) { document.getElementById('cashierConnection').textContent = error.message; }
})();
