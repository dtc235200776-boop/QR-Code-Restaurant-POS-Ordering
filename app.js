let MENU_ITEMS = [
  { id: 1, section: 'food', category: 'main', name: 'Cơm tấm sườn bì chả', price: 59000, desc: 'Sườn nướng, bì, chả trứng và nước mắm', icon: '🍛' },
  { id: 2, section: 'food', category: 'main', name: 'Cơm gà sốt mắm tỏi', price: 55000, desc: 'Đùi gà chiên giòn, cơm nóng và dưa góp', icon: '🍗' },
  { id: 3, section: 'food', category: 'main', name: 'Bò lúc lắc khoai tây', price: 79000, desc: 'Bò mềm xào rau củ, ăn kèm khoai tây', icon: '🥩' },
  { id: 4, section: 'food', category: 'main', name: 'Mì xào hải sản', price: 69000, desc: 'Mì xào tôm mực cùng rau củ tươi', icon: '🍜' },
  { id: 5, section: 'food', category: 'main', name: 'Phở bò tái', price: 59000, desc: 'Nước dùng ninh xương, bánh phở mềm', icon: '🍲' },
  { id: 6, section: 'food', category: 'main', name: 'Bún bò Huế', price: 62000, desc: 'Bò, chả cua và nước dùng sả ớt', icon: '🍜' },
  { id: 7, section: 'food', category: 'appetizer', name: 'Gỏi cuốn tôm thịt (2 cuốn)', price: 39000, desc: 'Rau tươi, tôm thịt và nước chấm', icon: '🥗' },
  { id: 8, section: 'food', category: 'appetizer', name: 'Khoai tây chiên phô mai', price: 35000, desc: 'Khoai vàng giòn lắc phô mai', icon: '🍟' },
  { id: 9, section: 'food', category: 'appetizer', name: 'Bánh mì chảo đặc biệt', price: 49000, desc: 'Trứng ốp la, pate, xúc xích và bánh mì', icon: '🍳' },
  { id: 10, section: 'food', category: 'appetizer', name: 'Croissant bơ tỏi', price: 32000, desc: 'Bánh sừng bò thơm bơ tỏi', icon: '🥐' },
  { id: 11, section: 'drink', category: 'coffee', name: 'Cà phê sữa đá', price: 29000, desc: 'Robusta Đắk Lắk và sữa đặc', icon: '☕' },
  { id: 12, section: 'drink', category: 'coffee', name: 'Bạc xỉu', price: 32000, desc: 'Nhiều sữa, ít cà phê', icon: '🥛' },
  { id: 13, section: 'drink', category: 'coffee', name: 'Cà phê muối', price: 35000, desc: 'Cà phê đậm vị cùng kem muối', icon: '🧂' },
  { id: 14, section: 'drink', category: 'tea', name: 'Trà đào cam sả', price: 39000, desc: 'Đào giòn, cam tươi và sả', icon: '🍑' },
  { id: 15, section: 'drink', category: 'tea', name: 'Trà dâu tằm macchiato', price: 42000, desc: 'Dâu tằm chua ngọt và kem cheese', icon: '🍓' },
  { id: 16, section: 'drink', category: 'tea', name: 'Trà chanh mật ong', price: 32000, desc: 'Trà thanh mát, mật ong dịu nhẹ', icon: '🍋' },
  { id: 17, section: 'drink', category: 'milktea', name: 'Trà sữa trân châu đường đen', price: 45000, desc: 'Sữa tươi, trân châu và đường đen', icon: '🧋' },
  { id: 18, section: 'drink', category: 'milktea', name: 'Trà sữa oolong nướng', price: 40000, desc: 'Oolong rang thơm, vị ngọt dịu', icon: '🧋' },
  { id: 19, section: 'drink', category: 'other-drink', name: 'Nước suối', price: 12000, desc: 'Nước khoáng đóng chai', icon: '💧' },
  { id: 20, section: 'drink', category: 'other-drink', name: 'Nước ngọt', price: 18000, desc: 'Coca-Cola / Pepsi / 7Up', icon: '🥤' }
];

let cart = {};
let currentTable = null;
const API_BASE = location.port === '3000' ? '' : `${location.protocol}//${location.hostname}:3000`;
const apiUrl = path => `${API_BASE}${path}`;
const money = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
async function getOrders() {
  const response = await fetch(apiUrl(`/api/orders?table=${encodeURIComponent(currentTable)}`), { credentials: 'include' });
  if (!response.ok) throw new Error('Không tải được đơn của bàn.');
  return (await response.json()).orders;
}

function renderMenu() {
  const query = (document.getElementById('menuSearch')?.value || '').trim().toLocaleLowerCase('vi');
  const foodLabels = { all: 'Tất cả món ăn', main: 'Món chính', appetizer: 'Món ăn nhẹ' };
  const drinkLabels = { all: 'Tất cả đồ uống', coffee: 'Cà phê', tea: 'Trà', milktea: 'Trà sữa', 'other-drink': 'Nước đóng chai' };
  const card = item => `<article class="food-card ${item.available === false ? 'sold-out' : ''}"><div class="food-img-wrap"><span>${item.icon}</span>${item.salePercent ? `<span class="sale-badge">-${item.salePercent}%</span>` : ''}${item.available === false ? '<span class="sold-out-badge">Tạm hết</span>' : ''}</div><div class="food-info"><div><h4 class="food-name">${item.name}</h4><p class="food-desc">${item.desc}</p></div><div class="food-bottom"><span class="food-price">${money(Math.round(item.price * (100 - (item.salePercent || 0)) / 100))}${item.salePercent ? `<del>${money(item.price)}</del>` : ''}</span><button class="btn-add" aria-label="Thêm ${item.name}" ${item.available === false ? 'disabled' : ''} onclick="addToCart(${item.id})">+</button></div></div></article>`;
  const renderSection = (section, filters, labelMap, gridId) => {
    const active = document.querySelector(`[data-filter-group="${section}"] .cat-btn.active`)?.dataset.filter || 'all';
    const shown = MENU_ITEMS.filter(item => item.section === section && (active === 'all' || item.category === active) && (!query || `${item.name} ${item.desc}`.toLocaleLowerCase('vi').includes(query)));
    document.getElementById(gridId).innerHTML = shown.map(card).join('');
    const nav = document.querySelector(`[data-filter-group="${section}"]`);
    nav.innerHTML = Object.entries(filters).map(([key, title]) => `<button class="cat-btn ${key === active ? 'active' : ''}" data-filter="${key}">${title}</button>`).join('');
    nav.querySelectorAll('.cat-btn').forEach(button => button.addEventListener('click', () => {
      nav.querySelectorAll('.cat-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const search = (document.getElementById('menuSearch')?.value || '').trim().toLocaleLowerCase('vi');
      document.getElementById(gridId).innerHTML = MENU_ITEMS.filter(item => item.section === section && (button.dataset.filter === 'all' || item.category === button.dataset.filter) && (!search || `${item.name} ${item.desc}`.toLocaleLowerCase('vi').includes(search))).map(card).join('');
    }));
  };
  renderSection('food', foodLabels, foodLabels, 'foodMenuGrid');
  renderSection('drink', drinkLabels, drinkLabels, 'drinkMenuGrid');
}

function renderCart() {
  const entries = Object.values(cart);
  const count = entries.reduce((sum, entry) => sum + entry.qty, 0);
  const total = entries.reduce((sum, entry) => sum + Math.round(entry.item.price * (100 - (entry.item.salePercent || 0)) / 100) * entry.qty, 0);
  document.getElementById('cartCountBadge').textContent = `${count} món`;
  document.getElementById('cartTotalPrice').textContent = money(total);
  document.getElementById('subTotalText').textContent = money(total);
  document.getElementById('finalTotalText').textContent = money(total);
  const list = document.getElementById('cartItemsList');
  list.innerHTML = entries.length ? entries.map(({ item, qty, note }) => `
    <div class="cart-item-row"><div class="cart-line-main"><strong>${item.name}</strong><span>${money(Math.round(item.price * (100 - (item.salePercent || 0)) / 100) * qty)}</span>
      <label class="note-label">Ghi chú món<input class="item-note-input" maxlength="100" value="${escapeHtml(note)}" placeholder="VD: ít ngọt, không đá" oninput="setItemNote(${item.id}, this.value)"></label></div>
      <div class="item-qty-control"><button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button><b>${qty}</b><button class="qty-btn" onclick="changeQty(${item.id},1)">+</button></div></div>`).join('') : '<p class="empty-text">Giỏ hàng đang trống</p>';
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
  area.innerHTML = active.length ? `<h2>Đơn của ${currentTable}</h2>${active.map(order => {
    const label = { pending: 'Đang chờ bếp', cooking: 'Bếp đang chuẩn bị món', ready: 'Món đã sẵn sàng, đang chờ phục vụ', served: 'Đã phục vụ', paid: 'Đã thanh toán' }[order.status] || 'Đang xử lý';
    return `<article class="customer-order-card"><div><strong>#${escapeHtml(order.id)}</strong><span>${label}</span></div><ul>${order.items.map(item => `<li>${item.qty} × ${escapeHtml(item.name)}${item.note ? ` <small>(${escapeHtml(item.note)})</small>` : ''}</li>`).join('')}</ul><b>${money(order.amountPaid ?? order.totalPrice)}</b><button class="print-receipt" onclick="printReceipt('${escapeHtml(order.id)}')">In hóa đơn</button></article>`;
  }).join('')}` : '';
}

async function submitOrder() {
  const entries = Object.values(cart);
  if (!entries.length) return alert('Giỏ hàng đang trống.');
  const submitButton = document.getElementById('btnSubmitOrder'); submitButton.disabled = true;
  try {
    const response = await fetch(apiUrl('/api/orders'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: currentTable, items: entries.map(({ item, qty, note }) => ({ id: item.id, qty, note: note.trim() })) }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không gửi được đơn.');
  } catch (error) { alert(error.message); submitButton.disabled = false; return; }
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
  receipt.innerHTML = `<h2>Cloud Kitchen &amp; Cafe</h2><p>${order.status === 'paid' ? 'HÓA ĐƠN THANH TOÁN' : 'HÓA ĐƠN TẠM TÍNH'} · ${escapeHtml(order.table)}</p><p>Mã đơn: ${escapeHtml(order.id)} · ${new Date(order.createdAt).toLocaleString('vi-VN')}</p><hr>${order.items.map(item => `<p>${item.qty} × ${escapeHtml(item.name)} ${money(item.total)}</p>${item.salePercent ? `<small>Ưu đãi món: -${item.salePercent}%</small>` : ''}${item.note ? `<small>Ghi chú: ${escapeHtml(item.note)}</small>` : ''}`).join('')}<hr><p>Tạm tính sau ưu đãi món: <b>${money(order.totalPrice)}</b></p>${order.voucherDiscount ? `<p>Voucher ${escapeHtml(order.voucherCode)}: -${money(order.voucherDiscount)}</p>` : ''}<p>Thanh toán: <b>${money(order.amountPaid ?? order.totalPrice)}</b></p><p>${order.status === 'paid' ? 'Cảm ơn quý khách!' : 'Vui lòng thanh toán tại quầy.'}</p>`;
  window.print();
};

async function init() {
  const params = new URLSearchParams(location.search);
  const rawTableId = params.get('table');
  const digits = rawTableId ? rawTableId.replace(/\D/g, '') : '';
  const tableId = Number(digits);
  currentTable = digits && tableId >= 1 && tableId <= 12 ? `Bàn ${String(tableId).padStart(2, '0')}` : null;
  ['tableLabel', 'currentTableText', 'modalTableNumber', 'successTableText'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = currentTable || 'Quét mã QR tại bàn';
  });
  document.querySelector('.welcome-banner p').innerHTML = currentTable
    ? `Quý khách đang ngồi tại <b>${currentTable}</b>. Vui lòng chọn món bên dưới.`
    : 'Quý khách vui lòng quét mã QR trên bàn để gửi món đúng bàn. Bạn vẫn có thể xem thực đơn trước.';
  document.getElementById('tableEntryGuide').hidden = Boolean(currentTable);
  document.getElementById('tableBadge').classList.toggle('table-selected', Boolean(currentTable));
  try { const response = await fetch('/api/menu'); MENU_ITEMS = (await response.json()).items; renderMenu(); }
  catch { document.getElementById('foodMenuGrid').innerHTML = '<p class="connection-error">Chưa kết nối máy chủ POS ở cổng 3000. Hãy mở terminal trong thư mục dự án và chạy <code>node server.js</code>.</p>'; }
  document.getElementById('menuSearch').addEventListener('input', renderMenu);
  renderCart();
  renderCustomerStatus();
  document.querySelectorAll('.cat-btn').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    renderMenu(button.dataset.category);
  }));
  document.getElementById('btnOpenCart').addEventListener('click', () => { if (!currentTable) return showTableGuide(); renderCart(); document.getElementById('cartModal').classList.add('active'); });
  document.getElementById('btnCloseCart').addEventListener('click', () => document.getElementById('cartModal').classList.remove('active'));
  document.getElementById('btnSubmitOrder').addEventListener('click', submitOrder);
  document.getElementById('btnCloseSuccess').addEventListener('click', () => document.getElementById('successModal').classList.remove('active'));
  if (currentTable) {
    const updates = new EventSource(apiUrl(`/api/events?table=${encodeURIComponent(currentTable)}`), { withCredentials: true });
    updates.addEventListener('order', renderCustomerStatus);
  }
}
document.addEventListener('DOMContentLoaded', init);
