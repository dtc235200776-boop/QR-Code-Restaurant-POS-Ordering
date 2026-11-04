// ==========================================================================
// Grand Cloud Hotel - Phân hệ Tiếp tân / Lễ tân & Quản lý QR Phòng
// File: letan.js
// ==========================================================================

const DEFAULT_LAN_IP = location.hostname;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

// Thông tin tài khoản ngân hàng của khách sạn nhận chuyển khoản VietQR
const HOTEL_BANK = {
  bankId: 'MB',
  bankName: 'MBBank (Ngân hàng Quân Đội)',
  accountNo: '0901234567',
  accountName: 'GRAND CLOUD HOTEL'
};

// Hàm tạo URL mã VietQR chuẩn ngân hàng
function getVietQrUrl(amount, memo) {
  const cleanMemo = encodeURIComponent(String(memo || '').replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 50));
  return `https://img.vietqr.io/image/${HOTEL_BANK.bankId}-${HOTEL_BANK.accountNo}-compact2.png?amount=${Math.round(amount)}&addInfo=${cleanMemo}&accountName=${encodeURIComponent(HOTEL_BANK.accountName)}`;
}

let receptionOrders = [];
let roomsList = [];
let currentFolioData = null;

// ==========================================================================
// 1. Quản lý Hóa đơn Dịch vụ phòng chờ thu
// ==========================================================================
async function loadReceptionOrders() {
  const target = document.getElementById('receptionBillsList');
  if (!target) return;
  try {
    const response = await fetch('/api/orders', { credentials: 'include', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không tải được hóa đơn.');
    receptionOrders = data.orders || [];
    const unpaid = receptionOrders.filter(order => order.status !== 'paid');

    target.innerHTML = unpaid.length ? unpaid.map(order => {
      const ready = ['ready', 'served'].includes(order.status);
      const state = ready ? 'Dịch vụ đã hoàn tất · sẵn sàng thu tiền' : 'Đang chờ bếp / buồng phòng phục vụ';
      return `
        <article class="reception-bill">
          <header>
            <div>
              <strong>${escapeHtml(order.table)}</strong>
              <small>#${escapeHtml(order.id)} · ${new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <b>${money(order.totalPrice)}</b>
          </header>
          <ul>${order.items.map(item => `<li>${item.qty} × ${escapeHtml(item.name)}</li>`).join('')}</ul>
          <small style="color:${ready ? '#15803d' : '#b45309'}; font-weight:600;">${state}</small>
          <footer>
            <div style="display:flex; gap:6px; width:100%;">
              <button type="button" class="btn-vietqr" data-vietqr-order="${escapeHtml(order.id)}" style="background:#0284c7; flex:1;">Mã VietQR</button>
              <button data-reception-pay="${escapeHtml(order.id)}" ${ready ? '' : 'disabled'} style="flex:1;">Xác nhận thu</button>
            </div>
          </footer>
        </article>`;
    }).join('') : '<p style="color:#64748b;">Không còn hóa đơn dịch vụ chờ thu.</p>';
  } catch (error) {
    target.textContent = error.message;
  }
}

// Lắng nghe sự kiện trên danh sách hóa đơn dịch vụ
document.getElementById('receptionBillsList')?.addEventListener('click', async event => {
  // Nút mở VietQR cho đơn dịch vụ
  const qrBtn = event.target.closest('[data-vietqr-order]');
  if (qrBtn) {
    const orderId = qrBtn.dataset.vietqrOrder;
    const order = receptionOrders.find(o => o.id === orderId);
    if (!order) return;
    openVietQrModal({
      title: `Thanh toán ${order.table} · Đơn #${order.id}`,
      amount: order.totalPrice,
      description: `THANHTOAN ${order.table.replace(/\s+/g, '')} ${order.id.slice(-6)}`
    });
    return;
  }

  // Nút xác nhận đã thu tiền mặt
  const payBtn = event.target.closest('[data-reception-pay]');
  if (!payBtn) return;
  payBtn.disabled = true;
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(payBtn.dataset.receptionPay)}/pay`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherCode: '' })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể xác nhận thanh toán.');
    await loadReceptionOrders();
    await loadRooms();
  } catch (error) {
    alert(error.message);
    payBtn.disabled = false;
  }
});

// ==========================================================================
// 2. Quản lý Sơ đồ phòng & Thủ tục Check-in / Check-out gộp tiền
// ==========================================================================
const roomLabels = {
  available: 'Phòng trống',
  occupied: 'Đang lưu trú',
  cleaning: 'Chờ dọn phòng',
  maintenance: 'Đang bảo trì'
};
const roomGrid = document.getElementById('roomStatusGrid');
const checkinBackdrop = document.getElementById('checkinBackdrop');
const checkinForm = document.getElementById('checkinForm');

function openCheckin(number) {
  checkinForm.elements.roomNumber.value = number;
  const room = roomsList.find(r => r.number === Number(number));
  const typeText = room ? ` (${room.typeLabel || 'Tiêu chuẩn'} · ${money(room.pricePerNight)}/đêm)` : '';
  document.getElementById('checkinRoomLabel').textContent = `Phòng ${number}${typeText} · nhập thông tin lưu trú`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  checkinForm.elements.plannedCheckout.min = tomorrow.toISOString().slice(0, 10);
  checkinForm.elements.plannedCheckout.value = checkinForm.elements.plannedCheckout.min;
  checkinBackdrop.hidden = false;
  checkinForm.elements.guestName.focus();
}

async function roomAction(number, action) {
  const response = await fetch(`/api/rooms/${number}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không thể cập nhật phòng.');
  await loadRooms();
}

// Mở Hóa đơn Quyết toán Tổng hợp khi Check-out
async function openCheckoutFolio(roomNumber) {
  const modal = document.getElementById('checkoutFolioBackdrop');
  if (!modal) return;
  modal.hidden = false;
  document.getElementById('checkoutFolioDetails').innerHTML = '<p style="text-align:center; padding:20px;">Đang tính toán tiền phòng và các dịch vụ...</p>';

  try {
    const res = await fetch(`/api/rooms/${roomNumber}/bill`, { credentials: 'include', cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không tải được hóa đơn phòng.');
    currentFolioData = data;

    const qrUrl = getVietQrUrl(data.amountDue, `THANHTOAN PHONG ${roomNumber}`);

    document.getElementById('checkoutFolioDetails').innerHTML = `
      <div class="folio-header" style="margin-bottom:12px; border-bottom:1px dashed #d8c7b1; padding-bottom:10px;">
        <h3 style="margin:0 0 4px; color:#4c3828; font-size:18px;">Hóa đơn quyết toán · Phòng ${data.room.number}</h3>
        <p style="margin:0; font-size:13px; color:#64748b;">Khách: <b>${escapeHtml(data.room.guestName)}</b> (${escapeHtml(data.room.guestPhone)}) · ${data.room.typeLabel}</p>
        <p style="margin:2px 0 0; font-size:12px; color:#887660;">Lưu trú: ${data.room.checkIn} → ${data.room.plannedCheckout} (${data.room.nights} đêm)</p>
      </div>

      <div class="folio-breakdown" style="display:grid; gap:8px; font-size:13px;">
        <div style="display:flex; justify-content:space-between; background:#fffcf7; padding:8px 10px; border-radius:8px; border:1px solid #eee4d7;">
          <span>Tiền phòng (${data.room.nights} đêm × ${money(data.room.pricePerNight)})</span>
          <b>${money(data.room.roomTotal)}</b>
        </div>
        <div style="display:flex; justify-content:space-between; background:#fffcf7; padding:8px 10px; border-radius:8px; border:1px solid #eee4d7;">
          <span>Tiền dịch vụ phòng (${data.orders.length} đơn)</span>
          <b>${money(data.servicesTotal)}</b>
        </div>
        ${data.servicesPaid > 0 ? `
        <div style="display:flex; justify-content:space-between; color:#15803d; font-size:12px; padding:0 10px;">
          <span>Đã thanh toán trước:</span>
          <span>- ${money(data.servicesPaid)}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between; margin-top:6px; padding:10px; background:#fef3c7; border-radius:8px; font-size:16px; font-weight:800; color:#b45309;">
          <span>TỔNG THANH TOÁN CHECK-OUT:</span>
          <span>${money(data.amountDue)}</span>
        </div>
      </div>

      <!-- Khung hiển thị VietQR -->
      <div class="folio-vietqr" style="margin-top:14px; text-align:center; padding:12px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;">
        <p style="margin:0 0 6px; font-size:12px; font-weight:700; color:#1e293b;">Quét mã VietQR chuyển khoản nhanh:</p>
        <img src="${qrUrl}" alt="VietQR Thanh toán phòng" style="width:160px; height:160px; border-radius:8px; border:1px solid #cbd5e1; display:inline-block;">
        <p style="margin:4px 0 0; font-size:11px; color:#64748b;">${HOTEL_BANK.bankName} · STK: <b>${HOTEL_BANK.accountNo}</b></p>
      </div>
    `;

    const settleBtn = document.getElementById('confirmSettleCheckoutBtn');
    if (settleBtn) {
      settleBtn.disabled = !data.canCheckOut;
      settleBtn.title = data.canCheckOut ? 'Xác nhận thu tiền và hoàn tất trả phòng' : 'Còn dịch vụ chưa hoàn tất phục vụ!';
    }
  } catch (err) {
    document.getElementById('checkoutFolioDetails').innerHTML = `<p style="color:#dc2626;">${err.message}</p>`;
  }
}

async function loadRooms() {
  try {
    const response = await fetch('/api/rooms', { credentials: 'include', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không tải được sơ đồ phòng.');
    roomsList = data.rooms || [];

    roomGrid.innerHTML = roomsList.map(room => {
      const state = roomLabels[room.status] || room.status;
      const roomOrders = receptionOrders.filter(order => order.table === `Phòng ${room.number}`);
      const unpaid = roomOrders.filter(order => order.status !== 'paid');
      const pinDisplay = room.pin ? `<span style="display:inline-block; margin-left:6px; padding:1px 6px; background:#fef3c7; color:#92400e; border-radius:4px; font-size:11px; font-weight:700;">PIN: ${room.pin}</span>` : '';
      
      const detail = room.status === 'occupied'
        ? `${escapeHtml(room.guestName)} · Trả ${escapeHtml(room.plannedCheckout)}<br><small style="color:${unpaid.length ? '#b45309' : '#15803d'}">${unpaid.length ? `Còn ${unpaid.length} dịch vụ chưa thu` : 'Dịch vụ đã quyết toán'}</small>`
        : room.status === 'cleaning' && room.lastGuestName
        ? `Khách vừa trả: ${escapeHtml(room.lastGuestName)}`
        : `${room.typeLabel || 'Phòng tiêu chuẩn'} · ${money(room.pricePerNight)}/đêm`;

      let actions = '';
      if (room.status === 'available') {
        actions = `
          <div class="room-status-actions">
            <button class="primary" data-checkin="${room.number}">Nhận phòng</button>
            <button data-room-action="maintenance" data-room="${room.number}">Bảo trì</button>
          </div>`;
      }
      if (room.status === 'occupied') {
        actions = `
          <div class="room-status-actions" style="flex-direction:column; gap:4px;">
            <div style="display:flex; gap:4px; width:100%;">
              <button data-show-qr="${room.number}" style="flex:1;">Hiện QR</button>
              <a class="qr-demo-link" href="${getRoomServiceUrl(room.number, room.stayToken)}" target="_blank" rel="noopener" style="flex:1; text-align:center;">Mở thử</a>
            </div>
            <button class="primary" data-checkout-folio="${room.number}" style="width:100%;">
              Quyết toán & Trả phòng →
            </button>
          </div>`;
      }
      if (room.status === 'maintenance') {
        actions = `
          <div class="room-status-actions">
            <button data-room-action="maintenance_done" data-room="${room.number}">Đã sửa xong</button>
          </div>`;
      }

      return `
        <article class="room-status-card ${room.status}">
          <h3>
            Phòng ${room.number} ${pinDisplay}
            <span class="room-state">${state}</span>
          </h3>
          <p>${detail}</p>
          ${actions}
        </article>`;
    }).join('');

    renderQRCodes();
  } catch (error) {
    roomGrid.textContent = error.message;
  }
}

// Xử lý sự kiện trên lưới phòng
roomGrid.addEventListener('click', async event => {
  const checkin = event.target.closest('[data-checkin]');
  if (checkin) return openCheckin(checkin.dataset.checkin);

  const qrButton = event.target.closest('[data-show-qr]');
  if (qrButton) return showRoomQr(qrButton.dataset.showQr);

  const folioButton = event.target.closest('[data-checkout-folio]');
  if (folioButton) return openCheckoutFolio(folioButton.dataset.checkoutFolio);

  const button = event.target.closest('[data-room-action]');
  if (!button) return;
  button.disabled = true;
  try {
    await roomAction(button.dataset.room, button.dataset.roomAction);
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
});

// Xử lý Check-in vãng lai
document.getElementById('cancelCheckin')?.addEventListener('click', () => {
  checkinBackdrop.hidden = true;
  checkinForm.reset();
});

checkinForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const button = checkinForm.querySelector('[type="submit"]');
  button.disabled = true;
  const body = Object.fromEntries(new FormData(checkinForm));
  try {
    const response = await fetch(`/api/rooms/${body.roomNumber}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, action: 'check_in' })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể nhận phòng.');
    checkinBackdrop.hidden = true;
    checkinForm.reset();
    await loadRooms();
    showRoomQr(body.roomNumber);
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
  }
});

// Xử lý xác nhận quyết toán gộp và trả phòng trong Folio Modal
document.getElementById('confirmSettleCheckoutBtn')?.addEventListener('click', async event => {
  if (!currentFolioData) return;
  const roomNumber = currentFolioData.room.number;
  const button = event.target;
  button.disabled = true;
  button.textContent = 'Đang quyết toán...';

  try {
    const response = await fetch(`/api/rooms/${roomNumber}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_out', settleAll: true })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể trả phòng.');

    document.getElementById('checkoutFolioBackdrop').hidden = true;
    currentFolioData = null;
    alert(`Đã hoàn tất trả phòng ${roomNumber} và quyết toán tổng cộng. Phòng được chuyển sang hàng đợi dọn dẹp.`);
    await loadReceptionOrders();
    await loadRooms();
  } catch (err) {
    alert(err.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Xác nhận quyết toán gộp & Trả phòng';
  }
});

document.getElementById('cancelCheckoutFolioBtn')?.addEventListener('click', () => {
  document.getElementById('checkoutFolioBackdrop').hidden = true;
  currentFolioData = null;
});

// In phiếu tổng hợp Check-out Folio
document.getElementById('printCheckoutFolioBtn')?.addEventListener('click', () => {
  if (!currentFolioData) return;
  const data = currentFolioData;
  const receipt = document.getElementById('receiptPrint');
  const qrUrl = getVietQrUrl(data.amountDue, `THANHTOAN PHONG ${data.room.number}`);

  receipt.innerHTML = `
    <h2>Grand Cloud Hotel &amp; Resort</h2>
    <p><b>HÓA ĐƠN QUYẾT TOÁN CHECK-OUT (GUEST FOLIO)</b></p>
    <p>Phòng: <b>Phòng ${data.room.number}</b> · ${data.room.typeLabel}</p>
    <p>Khách hàng: <b>${escapeHtml(data.room.guestName)}</b> · SĐT: ${escapeHtml(data.room.guestPhone)}</p>
    <p>Thời gian: ${data.room.checkIn} → ${data.room.plannedCheckout} (${data.room.nights} đêm)</p>
    <hr>
    <p>1. Tiền phòng (${data.room.nights} đêm × ${money(data.room.pricePerNight)}): <b>${money(data.room.roomTotal)}</b></p>
    <p>2. Tiền dịch vụ phòng (${data.orders.length} lượt yêu cầu): <b>${money(data.servicesTotal)}</b></p>
    ${data.orders.map(o => `<small style="display:block; padding-left:14px;">· #${o.id}: ${money(o.totalPrice)} (${o.items.map(i => i.name).join(', ')})</small>`).join('')}
    <hr>
    <p style="font-size:16px; font-weight:800;">TỔNG THANH TOÁN: ${money(data.amountDue)}</p>
    <div style="text-align:center; margin:16px 0;">
      <p style="font-size:12px; font-weight:700;">VietQR thanh toán trực tiếp:</p>
      <img src="${qrUrl}" alt="VietQR" style="width:170px; height:170px; border:1px solid #ccc; border-radius:8px;">
      <p style="font-size:11px; color:#555;">${HOTEL_BANK.bankName} · STK: ${HOTEL_BANK.accountNo}</p>
    </div>
    <p style="text-align:center; margin-top:12px;">Cảm ơn quý khách và hẹn gặp lại tại Grand Cloud Hotel!</p>
  `;
  window.print();
});

// ==========================================================================
// 3. Modal VietQR riêng biệt
// ==========================================================================
function openVietQrModal({ title, amount, description }) {
  const modal = document.getElementById('vietqrBackdrop');
  if (!modal) return;
  const qrUrl = getVietQrUrl(amount, description);
  document.getElementById('vietqrTitle').textContent = title;
  document.getElementById('vietqrImage').src = qrUrl;
  document.getElementById('vietqrAmountText').textContent = money(amount);
  document.getElementById('vietqrBankText').textContent = `${HOTEL_BANK.bankName} · STK: ${HOTEL_BANK.accountNo}`;
  document.getElementById('vietqrMemoText').textContent = `Nội dung: ${description}`;
  modal.hidden = false;
}

document.getElementById('closeVietQrBtn')?.addEventListener('click', () => {
  document.getElementById('vietqrBackdrop').hidden = true;
});
document.getElementById('vietqrBackdrop')?.addEventListener('click', event => {
  if (event.target.id === 'vietqrBackdrop') document.getElementById('vietqrBackdrop').hidden = true;
});

// ==========================================================================
// 4. Sinh mã QR dịch vụ phòng kèm Token & PIN
// ==========================================================================
function getRoomServiceUrl(roomNumber, token = '') {
  const base = document.getElementById('baseUrl').value.trim() || `${location.origin}/khach-hang.html`;
  const url = new URL(base, location.origin);
  url.search = '';
  url.searchParams.set('room', roomNumber);
  if (token) url.searchParams.set('token', token);
  return url.href;
}

function showRoomQr(roomNumber) {
  const room = roomsList.find(r => r.number === Number(roomNumber));
  const token = room?.stayToken || '';
  const pin = room?.pin || '';
  const url = getRoomServiceUrl(roomNumber, token);

  document.getElementById('guestQrTitle').textContent = `Mã QR dịch vụ · Phòng ${roomNumber}`;
  const pinNote = pin ? `<p style="margin:4px 0 10px; color:#b45309; font-weight:700; font-size:14px;">Mã PIN phòng: <u>${pin}</u></p>` : '';
  const descElem = document.getElementById('guestQrPinDesc');
  if (descElem) descElem.innerHTML = pinNote;

  document.getElementById('guestQrImage').src = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=220&margin=1`;
  document.getElementById('guestQrOpenLink').href = url;
  document.getElementById('guestQrBackdrop').hidden = false;
  document.getElementById('closeGuestQr').focus();
}

async function closeGuestQr() {
  document.getElementById('guestQrBackdrop').hidden = true;
  await loadRooms();
  document.getElementById('roomStatusGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.getElementById('closeGuestQr')?.addEventListener('click', closeGuestQr);
document.getElementById('guestQrBackdrop')?.addEventListener('click', event => {
  if (event.target.id === 'guestQrBackdrop') closeGuestQr();
});

function renderQRCodes() {
  let baseUrl = document.getElementById('baseUrl').value.trim();
  if (!baseUrl) return;
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = 'http://' + baseUrl;
    document.getElementById('baseUrl').value = baseUrl;
  }
  localStorage.setItem('hotel_qr_base_url', baseUrl);
  checkHostWarning(baseUrl);

  const container = document.getElementById('tablesContainer');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= 12; i++) {
    const roomNum = 100 + i;
    const room = roomsList.find(r => r.number === roomNum);
    const token = room?.stayToken || '';
    const pin = room?.pin || '';
    const orderUrl = getRoomServiceUrl(roomNum, token);
    const safeOrderUrl = escapeHtml(orderUrl);
    const targetUrl = encodeURIComponent(orderUrl);
    const qrApi = `https://quickchart.io/qr?text=${targetUrl}&size=180&margin=1`;

    const card = document.createElement('div');
    card.className = 'table-qr-card';
    card.innerHTML = `
      <div class="table-subtitle">Grand Cloud Hotel</div>
      <div class="table-title">PHÒNG ${roomNum}</div>
      ${pin ? `<div style="background:#fef3c7; color:#92400e; font-weight:800; font-size:12px; padding:3px 8px; border-radius:6px; margin-bottom:8px;">PIN: ${pin}</div>` : ''}
      <a href="${safeOrderUrl}" target="_blank" rel="noopener">
        <img class="qr-img" src="${qrApi}" alt="Mã QR dịch vụ Phòng ${roomNum}" loading="lazy">
      </a>
      <div class="instruction">Quét mã bằng camera để gọi dịch vụ phòng</div>
      <a class="qr-demo-link" href="${safeOrderUrl}" target="_blank" rel="noopener">Mở thử Phòng ${roomNum} →</a>
      <div class="qr-dest-url">${orderUrl}</div>
    `;
    container.appendChild(card);
  }
}

function checkHostWarning(urlStr) {
  const alertBox = document.getElementById('ipAlertBox');
  if (!alertBox) return;
  try {
    const u = new URL(urlStr);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      alertBox.className = 'alert-banner danger';
      alertBox.style.display = 'block';
      alertBox.innerHTML = `⚠️ <b>CHÚ Ý:</b> Địa chỉ <code>${u.hostname}</code> chỉ mở trên máy chủ, điện thoại khách sẽ không truy cập được. Hãy dùng địa chỉ LAN được máy chủ phát hiện hoặc tên miền HTTPS của khách sạn.`;
    } else {
      alertBox.className = 'alert-banner success';
      alertBox.style.display = 'block';
      alertBox.innerHTML = `✓ <b>Tuyệt vời:</b> Địa chỉ máy chủ hợp lệ (<code>${u.hostname}</code>). Điện thoại quét mã sẽ mở đúng phòng ngay!`;
    }
  } catch (_) {
    alertBox.style.display = 'none';
  }
}

function applyCustomUrl() {
  renderQRCodes();
}
window.applyCustomUrl = applyCustomUrl;

function selectIp(ip) {
  const input = document.getElementById('baseUrl');
  try {
    const appPort = location.port || '80';
    const u = new URL(input.value || `${location.protocol}//${ip}${location.port ? `:${appPort}` : ''}/khach-hang.html`);
    u.hostname = ip;
    input.value = u.href;
  } catch (_) {
    const port = location.port || '80';
    input.value = `http://${ip}:${port}/khach-hang.html`;
  }
  renderQRCodes();
}
window.selectIp = selectIp;

function switchPort(port) {
  const input = document.getElementById('baseUrl');
  try {
    const u = new URL(input.value || `http://${DEFAULT_LAN_IP}:${port}/khach-hang.html`);
    u.port = port;
    input.value = u.href;
  } catch (_) {
    input.value = `http://${DEFAULT_LAN_IP}:${port}/khach-hang.html`;
  }
  renderQRCodes();
}
window.switchPort = switchPort;

// ==========================================================================
// 5. Quản lý Đặt phòng trước (Reservations & Booking Scan)
// ==========================================================================
const bookingIdInput = document.getElementById('bookingIdInput');
const bookingScanStatus = document.getElementById('bookingScanStatus');
const bookingCamera = document.getElementById('bookingCamera');
const bookingConfirmBackdrop = document.getElementById('bookingConfirmBackdrop');
const bookingCheckinForm = document.getElementById('bookingCheckinForm');
let selectedBookingId = '';
let bookingCameraStream = null;
let bookingScannerTimer = null;

function parseBookingId(rawValue) {
  const value = String(rawValue || '').trim();
  try {
    const url = new URL(value);
    return url.searchParams.get('booking') || value.match(/BK-\d{4}-\d+/i)?.[0] || '';
  } catch (_) {
    return value.match(/BK-\d{4}-\d+/i)?.[0] || '';
  }
}

async function lookupBooking(rawValue = bookingIdInput?.value) {
  const bookingId = parseBookingId(rawValue);
  if (!bookingId) {
    if (bookingScanStatus) bookingScanStatus.textContent = 'Mã không hợp lệ. Hãy nhập mã BK-năm-số hoặc quét QR đặt phòng.';
    return;
  }
  if (bookingIdInput) bookingIdInput.value = bookingId;
  if (bookingScanStatus) bookingScanStatus.textContent = `Đang tra cứu ${bookingId}…`;
  try {
    const response = await fetch(`/api/reservations/${encodeURIComponent(bookingId)}`, { credentials: 'include', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không tìm thấy booking.');
    const reservation = data.reservation;
    if (!['pending', 'confirmed'].includes(String(reservation.status).toLowerCase())) {
      throw new Error(`Booking này đang ở trạng thái ${reservation.status}; không thể Check-in.`);
    }
    const roomsResponse = await fetch('/api/rooms', { credentials: 'include', cache: 'no-store' });
    const roomsData = await roomsResponse.json();
    if (!roomsResponse.ok) throw new Error(roomsData.error || 'Không tải được danh sách phòng.');
    const available = roomsData.rooms.filter(room => room.status === 'available');
    if (!available.length) throw new Error('Hiện không có phòng trống để gán.');

    selectedBookingId = reservation.id;
    document.getElementById('bookingConfirmDetails').innerHTML = `
      <strong>${escapeHtml(reservation.guestName)} · ${escapeHtml(reservation.phone)}</strong>
      <span>${escapeHtml(reservation.email || 'Không có email')}</span>
      <span>${escapeHtml(reservation.roomTypeLabel || reservation.roomType || 'Chưa chọn loại phòng')} · ${reservation.guests || 1} khách</span>
      <span>${escapeHtml(reservation.checkIn)} → ${escapeHtml(reservation.checkOut)} · Booking ${escapeHtml(reservation.id)}</span>
      <span>Trạng thái: ${String(reservation.status).toUpperCase()}</span>
    `;
    document.getElementById('bookingRoomSelect').innerHTML = `${available.map(room => `<option value="${room.number}">Phòng ${room.number} · ${room.typeLabel || 'Tiêu chuẩn'} · Trống</option>`).join('')}<option value="custom">Nhập số phòng khác…</option>`;
    document.getElementById('customRoomWrap').hidden = true;
    document.getElementById('customRoomNumber').value = '';
    bookingConfirmBackdrop.hidden = false;
    bookingScanStatus.textContent = 'Đã tìm thấy booking. Kiểm tra thông tin khách và xác nhận phòng.';
    document.getElementById('bookingRoomSelect').focus();
  } catch (error) {
    if (bookingScanStatus) bookingScanStatus.textContent = error.message;
  }
}

document.getElementById('lookupBookingButton')?.addEventListener('click', () => lookupBooking());
bookingIdInput?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    lookupBooking();
  }
});
document.getElementById('bookingRoomSelect')?.addEventListener('change', event => {
  document.getElementById('customRoomWrap').hidden = event.target.value !== 'custom';
  if (event.target.value === 'custom') document.getElementById('customRoomNumber').focus();
});
document.getElementById('cancelBookingCheckin')?.addEventListener('click', () => {
  bookingConfirmBackdrop.hidden = true;
  selectedBookingId = '';
});
bookingConfirmBackdrop?.addEventListener('click', event => {
  if (event.target === bookingConfirmBackdrop) {
    bookingConfirmBackdrop.hidden = true;
    selectedBookingId = '';
  }
});

bookingCheckinForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedBookingId) return;
  const button = bookingCheckinForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const roomNumber = bookingCheckinForm.elements.roomNumber.value === 'custom'
      ? document.getElementById('customRoomNumber').value
      : bookingCheckinForm.elements.roomNumber.value;
    if (!roomNumber) throw new Error('Hãy nhập số phòng thực tế.');

    const response = await fetch(`/api/reservations/${encodeURIComponent(selectedBookingId)}/check-in`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomNumber })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể hoàn tất Check-in.');
    bookingConfirmBackdrop.hidden = true;
    selectedBookingId = '';
    bookingCheckinForm.reset();
    bookingScanStatus.textContent = `Đã Check-in ${result.reservation.id} vào Phòng ${result.room.number}. PIN & QR dịch vụ phòng đã sẵn sàng!`;
    await loadReservations();
    await loadRooms();
    showRoomQr(result.room.number);
  } catch (error) {
    bookingScanStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

function stopBookingCamera() {
  if (bookingScannerTimer) clearTimeout(bookingScannerTimer);
  bookingScannerTimer = null;
  if (bookingCameraStream) bookingCameraStream.getTracks().forEach(track => track.stop());
  bookingCameraStream = null;
  if (bookingCamera) {
    bookingCamera.srcObject = null;
    bookingCamera.hidden = true;
  }
  const scanBtn = document.getElementById('startBookingScan');
  if (scanBtn) scanBtn.textContent = 'Quét QR bằng camera';
}

document.getElementById('startBookingScan')?.addEventListener('click', async event => {
  if (bookingCameraStream) {
    stopBookingCamera();
    bookingScanStatus.textContent = 'Đã dừng camera. Bạn vẫn có thể nhập Booking ID thủ công.';
    return;
  }
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
    bookingScanStatus.textContent = 'Trình duyệt chưa hỗ trợ quét QR camera. Hãy nhập Booking ID vào ô bên cạnh.';
    return;
  }
  const scanButton = event.currentTarget;
  try {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    bookingCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    bookingCamera.srcObject = bookingCameraStream;
    bookingCamera.hidden = false;
    await bookingCamera.play();
    scanButton.textContent = 'Dừng quét';
    bookingScanStatus.textContent = 'Hướng camera vào mã QR đặt phòng.';

    const scan = async () => {
      if (!bookingCameraStream) return;
      try {
        const codes = await detector.detect(bookingCamera);
        const bookingId = codes.map(code => parseBookingId(code.rawValue)).find(Boolean);
        if (bookingId) {
          stopBookingCamera();
          bookingIdInput.value = bookingId;
          await lookupBooking(bookingId);
          return;
        }
      } catch (_) {}
      bookingScannerTimer = setTimeout(scan, 350);
    };
    scan();
  } catch (_) {
    stopBookingCamera();
    bookingScanStatus.textContent = 'Không mở được camera. Hãy cấp quyền camera hoặc nhập Booking ID thủ công.';
  }
});

async function loadReservations() {
  const target = document.getElementById('reservationList');
  if (!target) return;
  try {
    const response = await fetch('/api/reservations', { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error('Không tải được yêu cầu đặt phòng.');
    const data = await response.json();
    const statuses = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      checked_in: 'Khách đã nhận phòng',
      completed: 'Đã trả phòng',
      rejected: 'Đã từ chối',
      cancelled: 'Đã hủy'
    };
    target.innerHTML = data.reservations.length ? data.reservations.map(row => `
      <article class="reservation-row">
        <div>
          <strong>${escapeHtml(row.guestName)} · ${escapeHtml(row.phone)}</strong>
          <small>${escapeHtml(row.email || 'Chưa có email')} · ${escapeHtml(row.roomTypeLabel || row.roomType || 'Chưa chọn loại phòng')}</small>
          <small>${escapeHtml(row.checkIn)} → ${escapeHtml(row.checkOut)} · ${row.guests} khách · ${escapeHtml(row.id)}</small>
          <small>Trạng thái: <b>${statuses[String(row.status).toLowerCase()] || escapeHtml(row.status)}</b></small>
        </div>
        ${['pending', 'confirmed'].includes(String(row.status).toLowerCase()) ? `
          <div class="reservation-actions">
            ${String(row.status).toLowerCase() === 'pending' ? `
              <button data-reservation="${escapeHtml(row.id)}" data-status="confirmed">Xác nhận</button>
              <button data-reservation="${escapeHtml(row.id)}" data-status="rejected">Từ chối</button>` : ''}
            <button data-checkin-booking="${escapeHtml(row.id)}">Check-in</button>
          </div>` : ''}
      </article>`).join('') : 'Chưa có yêu cầu đặt phòng mới.';
  } catch (error) {
    target.textContent = error.message;
  }
}

document.getElementById('reservationList')?.addEventListener('click', async event => {
  const checkin = event.target.closest('[data-checkin-booking]');
  if (checkin) {
    document.getElementById('bookingIdInput').value = checkin.dataset.checkinBooking;
    await lookupBooking(checkin.dataset.checkinBooking);
    return;
  }
  const button = event.target.closest('[data-reservation]');
  if (!button) return;
  button.disabled = true;
  try {
    const response = await fetch(`/api/reservations/${encodeURIComponent(button.dataset.reservation)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: button.dataset.status })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể cập nhật yêu cầu.');
    await loadReservations();
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
});

// Đăng xuất Lễ tân
document.getElementById('frontdeskLogout')?.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST', credentials: 'include' });
  location.replace('/bo-phan.html');
});

// ==========================================================================
// 6. Khởi tạo toàn bộ trang
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
  await loadReceptionOrders();
  await loadRooms();
  await loadReservations();

  setInterval(async () => {
    await loadReceptionOrders();
    await loadRooms();
  }, 12000);

  const input = document.getElementById('baseUrl');
  let initialUrl = '';

  try {
    const res = await fetch('/api/network', { cache: 'no-store' });
    if (res.ok) {
      const network = await res.json();
      if (network.url) initialUrl = network.url;
    }
  } catch (_) {}

  if (!initialUrl && input) {
    initialUrl = `${location.protocol}//${DEFAULT_LAN_IP}${location.port ? `:${location.port}` : ''}/khach-hang.html`;
  }

  const room = new URLSearchParams(location.search).get('room');
  if (room && input) initialUrl = `${initialUrl.split('?')[0]}?room=${encodeURIComponent(room)}`;
  if (input) input.value = initialUrl;
  renderQRCodes();
  if (room) showRoomQr(room);
});

