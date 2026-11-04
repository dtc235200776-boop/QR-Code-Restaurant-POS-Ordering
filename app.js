let MENU_ITEMS = [
  // 1. Dịch vụ buồng phòng & Tiện ích (Housekeeping & Amenities)
  { id: 1, section: 'housekeeping', category: 'cleaning', name: 'Yêu cầu dọn phòng & Đổi ga gối', price: 0, desc: 'Nhân viên buồng phòng sẽ đến hút bụi, dọn phòng và thay ga gối mới', icon: '🧹', salePercent: 0 },
  { id: 2, section: 'housekeeping', category: 'cleaning', name: 'Bổ sung khăn tắm & Bộ vệ sinh', price: 0, desc: 'Bổ sung 2 khăn tắm lớn, bàn chải, dầu gội và sữa tắm', icon: '🛁', salePercent: 0 },
  { id: 3, section: 'housekeeping', category: 'amenities', name: 'Mượn bàn ủi & Cầu là', price: 0, desc: 'Mượn bàn ủi hơi nước và cầu là sử dụng tại phòng (miễn phí 2h)', icon: '👔', salePercent: 0 },
  { id: 4, section: 'housekeeping', category: 'amenities', name: 'Mượn máy sấy tóc & Ổ cắm quốc tế', price: 0, desc: 'Máy sấy tóc ion âm và củ sạc đa năng chuyển đổi chuẩn cắm', icon: '🔌', salePercent: 0 },
  { id: 5, section: 'housekeeping', category: 'laundry', name: 'Giặt sấy quần áo tiêu chuẩn (Bộ)', price: 45000, desc: 'Nhận giặt sạch, sấy khô và gấp gọn giao lại trong 4 tiếng', icon: '🧺', salePercent: 10 },
  { id: 6, section: 'housekeeping', category: 'laundry', name: 'Giặt hấp ủi cao cấp (Vest / Đầm)', price: 85000, desc: 'Giặt hấp chuyên dụng giữ phom dáng đồ cao cấp', icon: '👗', salePercent: 0 },
  { id: 7, section: 'housekeeping', category: 'rental', name: 'Thuê xe máy tay ga (Theo ngày)', price: 150000, desc: 'Xe tay ga đời mới, kèm 2 mũ bảo hiểm và giao xe tại sảnh', icon: '🛵', salePercent: 0 },
  { id: 8, section: 'housekeeping', category: 'rental', name: 'Xe đưa đón sân bay 4-7 chỗ', price: 320000, desc: 'Xe riêng đưa đón tận sảnh khách sạn đúng giờ hẹn', icon: '🚗', salePercent: 0 },
  { id: 21, section: 'housekeeping', category: 'amenities', name: 'Bổ sung nước uống trong phòng', price: 0, desc: 'Nhân viên buồng phòng giao thêm nước uống đóng chai đến phòng', icon: '💧', salePercent: 0 },
  { id: 22, section: 'housekeeping', category: 'amenities', name: 'Yêu cầu hỗ trợ tại phòng', price: 0, desc: 'Gọi nhân viên hỗ trợ và phối hợp lễ tân khi cần thiết', icon: '🛎️', salePercent: 0 },

  // 2. Ẩm thực & Minibar tại phòng (In-Room Dining)
  { id: 9, section: 'dining', category: 'breakfast', name: 'Set Ăn sáng kiểu Âu (Continental)', price: 65000, desc: 'Bánh sừng bò, trứng ốp la, xúc xích Đức, bơ mứt và nước cam', icon: '🍳', salePercent: 10 },
  { id: 10, section: 'dining', category: 'breakfast', name: 'Phở bò tái nạm tại phòng', price: 59000, desc: 'Bát phở bò nóng hổi kèm quẩy giòn và rau thơm phục vụ tận phòng', icon: '🍲', salePercent: 0 },
  { id: 11, section: 'dining', category: 'main', name: 'Bò bít tết sốt tiêu đen khoai tây', price: 129000, desc: 'Thịt thăn bò mềm mọng, sốt tiêu thơm lừng và khoai tây múi cau', icon: '🥩', salePercent: 0 },
  { id: 12, section: 'dining', category: 'main', name: 'Mì Ý sốt bò bằm Spaghetti', price: 79000, desc: 'Mì Ý truyền thống sốt thịt bò bằm cà chua phô mai Parmesan', icon: '🍝', salePercent: 0 },
  { id: 13, section: 'dining', category: 'main', name: 'Club Sandwich gà nướng phô mai', price: 55000, desc: 'Bánh kẹp 3 tầng thịt gà nướng, xà lách, cà chua và sốt mayo', icon: '🥪', salePercent: 0 },
  { id: 14, section: 'dining', category: 'snack', name: 'Đĩa trái cây tươi nhiệt đới', price: 49000, desc: 'Dưa hấu, thanh long, xoài cát và nho tươi mát lạnh', icon: '🍉', salePercent: 0 },
  { id: 15, section: 'dining', category: 'beverage', name: 'Cà phê Robusta Đắk Lắk pha phin', price: 30000, desc: 'Cà phê nguyên chất đậm đà, dùng kèm sữa đặc hoặc đá', icon: '☕', salePercent: 0 },
  { id: 16, section: 'dining', category: 'beverage', name: 'Trà lài mật ong chanh vàng', price: 35000, desc: 'Trà hoa lài ủ lạnh thanh mát cùng mật ong rừng và chanh vàng', icon: '🫖', salePercent: 0 },
  { id: 17, section: 'dining', category: 'beverage', name: 'Rượu vang đỏ Chile (Ly)', price: 85000, desc: 'Vang đỏ Cabernet Sauvignon hảo hạng phục vụ cùng ly pha lê', icon: '🍷', salePercent: 0 },
  { id: 18, section: 'dining', category: 'minibar', name: 'Nước ngọt lon Minibar (Coca/7Up)', price: 20000, desc: 'Lon 330ml ướp lạnh sẵn sàng', icon: '🥤', salePercent: 0 },
  { id: 19, section: 'dining', category: 'minibar', name: 'Bia Heineken lon Minibar', price: 35000, desc: 'Bia Heineken Silver 330ml ướp lạnh', icon: '🍺', salePercent: 0 },
  { id: 20, section: 'dining', category: 'minibar', name: 'Nước khoáng thiên nhiên cao cấp', price: 15000, desc: 'Chai nước khoáng tinh khiết đóng chai 500ml', icon: '💧', salePercent: 0 }
];

let cart = {};
let currentTable = null; // Số phòng (ví dụ: Phòng 101)
let currentStayToken = '';
let currentPin = '';
const API_BASE = '';
const apiUrl = path => `${API_BASE}${path}`;
const money = value => Number(value || 0) === 0 ? 'Miễn phí' : `${Number(value || 0).toLocaleString('vi-VN')}đ`;

// Hàm tạo URL mã VietQR chuẩn ngân hàng
function getVietQrUrl(amount, memo) {
  const bank = 'MB';
  const accountNo = '0901234567';
  const accountName = 'GRAND CLOUD HOTEL';
  const cleanMemo = encodeURIComponent(String(memo || '').replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 50));
  return `https://img.vietqr.io/image/${bank}-${accountNo}-compact2.png?amount=${Math.round(amount)}&addInfo=${cleanMemo}&accountName=${encodeURIComponent(accountName)}`;
}
const itemIcons = { 1: '🧹', 2: '🧺', 3: '♨️', 4: '💨', 5: '🧺', 6: '👗', 7: '🛵', 8: '🚘', 9: '🍳', 10: '🍜', 11: '🥩', 12: '🍝', 13: '🥪', 14: '🍉', 15: '☕', 16: '🍵', 17: '🍷', 18: '🥤', 19: '🍺', 20: '💧', 21: '💧', 22: '🛎️' };
const menuIllustrations = {
  3: '<svg class="menu-illustration" viewBox="0 0 100 100" aria-hidden="true"><path d="M19 59h51c8 0 13 5 13 12v5H20c-8 0-12-4-12-9s4-8 11-8Z" fill="#8b603d"/><path d="M22 56c1-18 14-31 33-31h20v16H57c-9 0-14 5-16 15l-2 8H22Z" fill="#e7c18d" stroke="#765034" stroke-width="4" stroke-linejoin="round"/><path d="M59 25v-9h17v9M27 76v6m48-6v6" stroke="#765034" stroke-width="4" stroke-linecap="round"/><path d="M30 49c4-7 9-11 16-13" stroke="#fff2dc" stroke-width="4" stroke-linecap="round"/></svg>',
  4: '<svg class="menu-illustration" viewBox="0 0 100 100" aria-hidden="true"><path d="m22 39 24-14 25 14-7 18-23 4-19-12Z" fill="#7c9da0" stroke="#49666a" stroke-width="4" stroke-linejoin="round"/><path d="m60 40 20 5 2 12-20 1Z" fill="#d2a46f" stroke="#765034" stroke-width="4" stroke-linejoin="round"/><path d="m35 57-10 20h18l12-20m-47-5-8-2m8 12-7 2m7-24-6-4" stroke="#765034" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="39" r="4" fill="#fff2dc"/></svg>',
  10: '<svg class="menu-illustration" viewBox="0 0 100 100" aria-hidden="true"><path d="M33 24c-7-7 4-10 0-17m18 17c-7-7 4-10 0-17m18 17c-7-7 4-10 0-17" stroke="#a9784b" stroke-width="4" stroke-linecap="round"/><path d="M17 49h66l-8 28c-2 8-9 13-17 13H42c-8 0-15-5-17-13Z" fill="#bd7852" stroke="#70462f" stroke-width="4"/><ellipse cx="50" cy="49" rx="33" ry="12" fill="#f1d7a7" stroke="#70462f" stroke-width="4"/><path d="M32 47c10 7 25 7 37 0M29 54c13 7 28 7 42 0m-42-9 35-8m-25 9 32-8" stroke="#8a5b35" stroke-width="3" stroke-linecap="round"/><path d="m28 83-8 8m52-8 8 8" stroke="#70462f" stroke-width="4" stroke-linecap="round"/></svg>',
  11: '<svg class="menu-illustration" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="51" cy="55" rx="39" ry="27" fill="#fff9ef" stroke="#9a704b" stroke-width="4"/><path d="M28 58c0-15 11-25 25-25 12 0 22 9 22 22 0 10-8 17-20 18-15 1-27-4-27-15Z" fill="#a84f36" stroke="#713b2e" stroke-width="4"/><path d="M43 37c4-4 11-4 15 0l-3 7c-4 3-9 3-13 0Z" fill="#f1d0a4"/><path d="m37 49 4 4m8-8 4 5m5 5 5 4" stroke="#f0bd77" stroke-width="3" stroke-linecap="round"/><circle cx="69" cy="43" r="5" fill="#748b4c"/><path d="M68 38c1-5 6-7 10-5-1 5-5 8-10 5Z" fill="#68834d"/><path d="M18 82h66" stroke="#d5bd9e" stroke-width="4" stroke-linecap="round"/></svg>',
  12: '<svg class="menu-illustration" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="55" rx="39" ry="27" fill="#fff9ef" stroke="#9a704b" stroke-width="4"/><ellipse cx="50" cy="53" rx="28" ry="17" fill="#d46a42"/><path d="M31 51c2-12 15-13 17-2 2 10 12 10 13 0s14-11 16 0M35 59c5-8 12-8 16 0s12 8 17 0" stroke="#efc86f" stroke-width="4" stroke-linecap="round"/><circle cx="47" cy="48" r="3" fill="#6b813f"/><circle cx="66" cy="57" r="3" fill="#6b813f"/><path d="m35 21 29 26M42 18l29 26" stroke="#765034" stroke-width="3" stroke-linecap="round"/><path d="M15 80h70" stroke="#d5bd9e" stroke-width="4" stroke-linecap="round"/></svg>'
};
const menuIcon = item => menuIllustrations[item.id] || itemIcons[item.id] || item.icon || '✨';

async function getOrders() {
  try {
    const response = await fetch(apiUrl(`/api/orders?table=${encodeURIComponent(currentTable)}`), { credentials: 'include' });
    if (!response.ok) throw new Error('Không đọc được API server');
    return (await response.json()).orders;
  } catch (_) {
    const local = JSON.parse(localStorage.getItem('cloud_hotel_orders') || '[]');
    return local.filter(order => order.table === currentTable);
  }
}

function renderMenu() {
  const query = (document.getElementById('menuSearch')?.value || '').trim().toLocaleLowerCase('vi');
  const serviceLabels = { all: 'Tất cả dịch vụ', cleaning: 'Dọn phòng & Vệ sinh', amenities: 'Mượn đồ dùng', laundry: 'Giặt ủi', rental: 'Thuê xe & Đưa đón' };
  const diningLabels = { all: 'Tất cả món', breakfast: 'Điểm tâm sáng', main: 'Món chính tại phòng', snack: 'Trái cây & Ăn vặt', beverage: 'Cà phê & Đồ uống', minibar: 'Đồ uống Minibar' };
  
  const card = item => `
    <article class="food-card ${item.available === false ? 'sold-out' : ''}">
      <div class="food-img-wrap">
        <span aria-hidden="true">${menuIcon(item)}</span>
        ${item.salePercent ? `<span class="sale-badge">-${item.salePercent}%</span>` : ''}
        ${item.price === 0 ? '<span class="sale-badge" style="background:#15803d">Free</span>' : ''}
        ${item.available === false ? '<span class="sold-out-badge">Tạm hết</span>' : ''}
      </div>
      <div class="food-info">
        <div>
          <h4 class="food-name">${item.name}</h4>
          <p class="food-desc">${item.desc}</p>
        </div>
        <div class="food-bottom">
          <span class="food-price">${money(Math.round(item.price * (100 - (item.salePercent || 0)) / 100))}${item.salePercent ? `<del>${money(item.price)}</del>` : ''}</span>
          <button class="btn-add" aria-label="Chọn ${item.name}" ${item.available === false ? 'disabled' : ''} onclick="addToCart(${item.id})">+</button>
        </div>
      </div>
    </article>`;

  const renderSection = (section, filters, labelMap, gridId) => {
    const active = document.querySelector(`[data-filter-group="${section}"] .cat-btn.active`)?.dataset.filter || 'all';
    const shown = MENU_ITEMS.filter(item => item.section === section && (active === 'all' || item.category === active) && (!query || `${item.name} ${item.desc}`.toLocaleLowerCase('vi').includes(query)));
    const gridElem = document.getElementById(gridId);
    if (gridElem) gridElem.innerHTML = shown.map(card).join('');
    
    const nav = document.querySelector(`[data-filter-group="${section}"]`);
    if (nav) {
      nav.innerHTML = Object.entries(filters).map(([key, title]) => `<button class="cat-btn ${key === active ? 'active' : ''}" data-filter="${key}">${title}</button>`).join('');
      nav.querySelectorAll('.cat-btn').forEach(button => button.addEventListener('click', () => {
        nav.querySelectorAll('.cat-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        const search = (document.getElementById('menuSearch')?.value || '').trim().toLocaleLowerCase('vi');
        if (gridElem) gridElem.innerHTML = MENU_ITEMS.filter(item => item.section === section && (button.dataset.filter === 'all' || item.category === button.dataset.filter) && (!search || `${item.name} ${item.desc}`.toLocaleLowerCase('vi').includes(search))).map(card).join('');
      }));
    }
  };
  renderSection('housekeeping', serviceLabels, serviceLabels, 'foodMenuGrid');
  renderSection('dining', diningLabels, diningLabels, 'drinkMenuGrid');
}

function renderCart() {
  const entries = Object.values(cart);
  const count = entries.reduce((sum, entry) => sum + entry.qty, 0);
  const total = entries.reduce((sum, entry) => sum + Math.round(entry.item.price * (100 - (entry.item.salePercent || 0)) / 100) * entry.qty, 0);
  document.getElementById('cartCountBadge').textContent = `${count} dịch vụ`;
  document.getElementById('cartTotalPrice').textContent = money(total);
  document.getElementById('subTotalText').textContent = money(total);
  document.getElementById('finalTotalText').textContent = money(total);
  const list = document.getElementById('cartItemsList');
  list.innerHTML = entries.length ? entries.map(({ item, qty, note }) => `
    <div class="cart-item-row">
      <div class="cart-line-main">
        <strong>${item.name}</strong>
        <span>${money(Math.round(item.price * (100 - (item.salePercent || 0)) / 100) * qty)}</span>
        <label class="note-label">Yêu cầu thêm / Giờ phục vụ
          <input class="item-note-input" maxlength="100" value="${escapeHtml(note)}" placeholder="VD: làm ngay lúc 10h, ít cay..." oninput="setItemNote(${item.id}, this.value)">
        </label>
      </div>
      <div class="item-qty-control">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
        <b>${qty}</b>
        <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
      </div>
    </div>`).join('') : '<p class="empty-text">Danh sách yêu cầu đang trống</p>';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

window.addToCart = id => {
  if (!currentTable) { showTableGuide(); return; }
  const item = MENU_ITEMS.find(menuItem => menuItem.id === id);
  if (!cart[id]) cart[id] = { item, qty: 0, note: '' };
  cart[id].qty += 1;
  renderCart();
};
function showTableGuide() {
  const guide = document.getElementById('tableEntryGuide');
  if (!guide) return;
  guide.classList.add('guide-attention');
  guide.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => guide.classList.remove('guide-attention'), 1800);
}
window.changeQty = (id, delta) => {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
};
window.setItemNote = (id, note) => { if (cart[id]) cart[id].note = note; };

async function renderCustomerStatus() {
  const area = document.getElementById('customerOrders');
  if (!area) return;
  if (!currentTable) { area.innerHTML = ''; return; }
  let active = [];
  try { active = (await getOrders()).slice(0, 5); }
  catch (error) { area.innerHTML = `<p class="connection-error">${error.message} Vui lòng tải lại trang.</p>`; return; }
  area.innerHTML = active.length ? `<h2>Yêu cầu của ${currentTable}</h2>${active.map(order => {
    const label = { pending: 'Lễ tân đã tiếp nhận', cooking: 'Nhân viên đang thực hiện', ready: 'Đã hoàn tất phục vụ', served: 'Đã phục vụ', paid: 'Đã thanh toán lúc check-out' }[order.status] || 'Đang xử lý';
    return `
      <article class="customer-order-card">
        <div>
          <strong>#${escapeHtml(order.id)}</strong>
          <span>${label}</span>
        </div>
        <ul>${order.items.map(item => `<li>${item.qty} × ${escapeHtml(item.name)}${item.note ? ` <small>(${escapeHtml(item.note)})</small>` : ''}</li>`).join('')}</ul>
        <b>${money(order.amountPaid ?? order.totalPrice)}</b>
        <button class="print-receipt" onclick="printReceipt('${escapeHtml(order.id)}')">In phiếu dịch vụ</button>
      </article>`;
  }).join('')}` : '';
}

async function submitOrder() {
  const entries = Object.values(cart);
  if (!entries.length) return alert('Danh sách yêu cầu đang trống.');
  const submitButton = document.getElementById('btnSubmitOrder'); submitButton.disabled = true;
  try {
    const response = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: currentTable,
        token: currentStayToken,
        pin: currentPin,
        items: entries.map(({ item, qty, note }) => ({ id: item.id, qty, note: note.trim() }))
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 403) {
        document.getElementById('pinAuthModal')?.classList.add('active');
        throw new Error(result.error || 'Cần xác thực mã PIN phòng để gọi dịch vụ.');
      }
      throw new Error(result.error || 'Lỗi gửi API server');
    }
  } catch (error) {
    alert(`${error.message}\n\nHãy kiểm tra kết nối hoặc liên hệ tiếp tân. Giỏ dịch vụ vẫn được giữ để quý khách thử lại.`);
    submitButton.disabled = false;
    return;
  }
  submitButton.disabled = false;
  cart = {};
  renderCart();
  document.getElementById('cartModal').classList.remove('active');
  await renderCustomerStatus();
  document.getElementById('successModal').classList.add('active');
}

window.printReceipt = async id => {
  const order = (await getOrders()).find(row => row.id === id); if (!order) return;
  const receipt = document.getElementById('receiptPrint');
  const amountToPay = order.amountPaid ?? order.totalPrice;
  const qrUrl = getVietQrUrl(amountToPay, `THANHTOAN ${order.table} ${order.id}`);
  receipt.innerHTML = `
    <h2>Grand Cloud Hotel &amp; Resort</h2>
    <p>${order.status === 'paid' ? 'HÓA ĐƠN DỊCH VỤ PHÒNG (ĐÃ THANH TOÁN)' : 'PHIẾU XÁC NHẬN DỊCH VỤ TẠI PHÒNG'} · ${escapeHtml(order.table)}</p>
    <p>Mã yêu cầu: ${escapeHtml(order.id)} · ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
    <hr>${order.items.map(item => `<p>${item.qty} × ${escapeHtml(item.name)} ${money(item.total)}</p>${item.salePercent ? `<small>Ưu đãi phòng: -${item.salePercent}%</small>` : ''}${item.note ? `<small>Ghi chú: ${escapeHtml(item.note)}</small>` : ''}`).join('')}
    <hr>
    <p>Tạm tính dịch vụ: <b>${money(order.totalPrice)}</b></p>
    ${order.voucherDiscount ? `<p>Ưu đãi ${escapeHtml(order.voucherCode)}: -${money(order.voucherDiscount)}</p>` : ''}
    <p>Tổng thanh toán: <b>${money(amountToPay)}</b></p>
    <div style="text-align:center; margin: 15px 0;">
      <p style="font-weight:700; margin-bottom:5px; font-size:13px;">Mã VietQR chuyển khoản dịch vụ:</p>
      <img src="${qrUrl}" alt="Mã VietQR chuyển khoản" style="width:160px; height:160px; border:1px solid #ddd; border-radius:8px; display:inline-block;">
      <p style="font-size:11px; color:#555; margin-top:4px;">MBBank · STK: 0901234567 · GRAND CLOUD HOTEL</p>
    </div>
    <p>${order.status === 'paid' ? 'Đã thanh toán. Chúc quý khách kỳ nghỉ tuyệt vời!' : 'Quý khách có thể chuyển khoản bằng VietQR ở trên hoặc thanh toán khi check-out.'}</p>`;
  window.print();
};

async function init() {
  const params = new URLSearchParams(location.search);
  const rawRoom = params.get('room') || params.get('table');
  const digits = rawRoom ? rawRoom.replace(/\D/g, '') : '';
  const roomNum = Number(digits);
  currentTable = digits && roomNum >= 100 && roomNum <= 999 ? `Phòng ${roomNum}` : null;
  const urlToken = params.get('token') || sessionStorage.getItem(`room_token_${roomNum}`) || '';

  const selectedView = location.hash === '#foodSection' ? 'housekeeping' : location.hash === '#drinkSection' ? 'dining' : '';
  document.body.dataset.serviceView = selectedView;
  const serviceLinks = [...document.querySelectorAll('[data-service-link]')];
  const setServiceView = view => {
    document.body.dataset.serviceView = view;
    serviceLinks.forEach(link => link.classList.toggle('active', link.dataset.serviceLink === view));
  };
  serviceLinks.forEach(link => link.addEventListener('click', () => setServiceView(link.dataset.serviceLink)));
  window.addEventListener('hashchange', () => {
    const view = location.hash === '#foodSection' ? 'housekeeping' : location.hash === '#drinkSection' ? 'dining' : '';
    setServiceView(view);
  });
  if (selectedView) setServiceView(selectedView);
  
  ['tableLabel', 'currentTableText', 'modalTableNumber', 'successTableText'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = currentTable || 'Quét mã QR tại phòng';
  });
  
  const welcomeText = document.querySelector('.welcome-banner p');
  const welcomeTitle = document.getElementById('guestWelcomeTitle');
  if (welcomeTitle) welcomeTitle.textContent = currentTable ? `👋 Xin chào quý khách - ${currentTable}` : '👋 Kính chào quý khách!';
  if (welcomeText) {
    welcomeText.innerHTML = currentTable
      ? `Chào mừng quý khách đang lưu trú tại <b>${currentTable}</b>. Vui lòng chọn dịch vụ buồng phòng hoặc ẩm thực bên dưới.`
      : 'Quý khách vui lòng quét mã QR đặt trên bàn làm việc trong phòng để gửi yêu cầu đúng số phòng.';
  }
  
  const guide = document.getElementById('tableEntryGuide');
  if (guide) guide.hidden = Boolean(currentTable);
  const badge = document.getElementById('tableBadge');
  if (badge) badge.classList.toggle('table-selected', Boolean(currentTable));

  // Xác thực bảo mật phòng qua Token hoặc PIN
  if (currentTable) {
    try {
      const authRes = await fetch(apiUrl(`/api/room-auth?room=${roomNum}${urlToken ? `&token=${encodeURIComponent(urlToken)}` : ''}`));
      if (authRes.ok) {
        const authData = await authRes.json();
        currentStayToken = authData.token || urlToken;
        sessionStorage.setItem(`room_token_${roomNum}`, currentStayToken);
      } else {
        document.getElementById('pinAuthModal')?.classList.add('active');
      }
    } catch (_) {}
  }

  // Lắng nghe form nhập PIN phòng
  document.getElementById('pinAuthForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const pinInput = document.getElementById('pinAuthInput');
    const pinVal = pinInput ? pinInput.value.trim() : '';
    const errBox = document.getElementById('pinAuthError');
    try {
      const res = await fetch(apiUrl(`/api/room-auth?room=${roomNum}&pin=${encodeURIComponent(pinVal)}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mã PIN phòng không chính xác.');
      currentStayToken = data.token;
      currentPin = pinVal;
      sessionStorage.setItem(`room_token_${roomNum}`, data.token);
      document.getElementById('pinAuthModal')?.classList.remove('active');
    } catch (err) {
      if (errBox) {
        errBox.textContent = err.message;
        errBox.hidden = false;
      }
    }
  });

  // Tải danh mục dịch vụ từ server
  try {
    const response = await fetch(apiUrl('/api/menu'));
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.items) && data.items.length) {
        MENU_ITEMS = data.items;
      }
    }
  } catch (_) {
    console.info('Chế độ xem trước: Sử dụng danh mục dịch vụ khách sạn có sẵn.');
  }
  renderMenu();

  document.getElementById('menuSearch')?.addEventListener('input', renderMenu);
  renderCart();
  renderCustomerStatus();
  
  document.getElementById('btnOpenCart')?.addEventListener('click', () => { if (!currentTable) return showTableGuide(); renderCart(); document.getElementById('cartModal')?.classList.add('active'); });
  document.getElementById('btnCloseCart')?.addEventListener('click', () => document.getElementById('cartModal')?.classList.remove('active'));
  document.getElementById('btnSubmitOrder')?.addEventListener('click', submitOrder);
  document.getElementById('btnCloseSuccess')?.addEventListener('click', () => document.getElementById('successModal')?.classList.remove('active'));
  
  if (currentTable) {
    try {
      const updates = new EventSource(apiUrl(`/api/events?table=${encodeURIComponent(currentTable)}`), { withCredentials: true });
      updates.addEventListener('order', renderCustomerStatus);
    } catch (_) {}
  }
}
document.addEventListener('DOMContentLoaded', init);
