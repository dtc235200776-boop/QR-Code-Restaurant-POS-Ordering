/**
 * Cloudflare QR POS - Kitchen Screen Logic
 * Lắng nghe đơn hàng thời gian thực từ khách quét mã QR
 */

const channel = new BroadcastChannel('pos_kitchen_channel');
let orders = [];

// 1. TẢI DANH SÁCH ĐƠN TỪ LOCALSTORAGE KHI MỞ TRANG
function loadOrders() {
  const saved = localStorage.getItem('cloud_pos_orders');
  orders = saved ? JSON.parse(saved) : [];
  renderKitchenView();
}

// 2. PHÁT ÂM THANH BÍP KHI CÓ ĐƠN HÀNG MỚI
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.log("Audio alert blocked:", e);
  }
}

// 3. RENDER GIAO DIỆN BẾP
function renderKitchenView() {
  const grid = document.getElementById('ordersGrid');
  const emptyNotice = document.getElementById('emptyOrdersNotice');
  grid.innerHTML = "";

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed');

  // Cập nhật thống kê
  document.getElementById('pendingCount').innerText = pendingOrders.length;
  document.getElementById('completedCount').innerText = completedOrders.length;

  const totalRev = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  document.getElementById('totalRevenue').innerText = `${totalRev.toLocaleString('vi-VN')}đ`;

  if (pendingOrders.length === 0) {
    emptyNotice.style.display = 'block';
  } else {
    emptyNotice.style.display = 'none';
  }

  // Render các đơn đang chờ làm trước
  pendingOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = "order-card";

    const itemsHtml = order.items.map(item => `
      <div class="order-dish-row">
        <span><b>${item.qty}x</b> ${item.name}</span>
        <span>${item.total.toLocaleString('vi-VN')}đ</span>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="order-card-header">
        <span class="order-table-title">${order.table}</span>
        <span class="order-time">⏰ ${order.time} (${order.id})</span>
      </div>
      <div class="order-items-box">
        ${itemsHtml}
      </div>
      <div class="order-card-footer">
        <div>
          <span style="font-size: 11px; color: #94a3b8;">Tổng bill:</span>
          <b style="color: #4ade80; font-size: 16px; margin-left: 4px;">${order.totalPrice.toLocaleString('vi-VN')}đ</b>
        </div>
        <button class="btn-done" onclick="markOrderCompleted('${order.id}')">✓ Đã làm xong</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 4. ĐÁNH DẤU HOÀN THÀNH ĐƠN
window.markOrderCompleted = function(orderId) {
  const target = orders.find(o => o.id === orderId);
  if (target) {
    target.status = 'completed';
    localStorage.setItem('cloud_pos_orders', JSON.stringify(orders));
    renderKitchenView();
  }
};

// 5. LẮNG NGHE TÍN HIỆU REALTIME
channel.onmessage = (event) => {
  if (event.data && event.data.type === 'NEW_ORDER') {
    playAlertSound();
    loadOrders();
  }
};

// Lắng nghe thay đổi storage khi mở khác tab
window.addEventListener('storage', (e) => {
  if (e.key === 'cloud_pos_orders') {
    loadOrders();
  }
});

// 6. XÓA LỊCH SỬ ĐƠN HÀNG (RESET)
document.getElementById('btnClearHistory').addEventListener('click', () => {
  if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử đơn hàng của ca này?")) {
    localStorage.removeItem('cloud_pos_orders');
    orders = [];
    renderKitchenView();
  }
});

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', loadOrders);
