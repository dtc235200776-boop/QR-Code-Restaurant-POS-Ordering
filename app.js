/**
 * Cloudflare QR POS - Client App Logic
 * Xử lý logic chọn món, giỏ hàng và gửi order
 */

// 1. DỮ LIỆU THỰC ĐƠN (MENU DATA)
const MENU_ITEMS = [
  { id: 1, name: "Cà phê Sữa đá", category: "coffee", price: 29000, desc: "Cà phê Robusta Đắk Lắk đậm đà hòa quyện sữa đặc ngọt béo", icon: "☕" },
  { id: 2, name: "Bạc xỉu 3 tầng", category: "coffee", price: 32000, desc: "Nhiều sữa ít cà phê, béo ngậy thơm ngon chuẩn vị Sài Gòn", icon: "🥛" },
  { id: 3, name: "Cà phê Muối Huế", category: "coffee", price: 35000, desc: "Vị đắng thơm kết hợp lớp kem muối béo mặn độc đáo", icon: "🧂" },
  { id: 4, name: "Trà Đào Cam Sả", category: "tea", price: 39000, desc: "Thanh mát giải nhiệt với miếng đào giòn và hương sả tự nhiên", icon: "🍑" },
  { id: 5, name: "Trà Dâu Tằm Macchiato", category: "tea", price: 42000, desc: "Dâu tằm tươi chua ngọt kết hợp kem cheese bồng bềnh", icon: "🍓" },
  { id: 6, name: "Trà Sữa Trân Châu Đường Đen", category: "milktea", price: 45000, desc: "Trân châu dẻo dai nấu đường đen thơm phức cùng sữa tươi", icon: "🧋" },
  { id: 7, name: "Trà Sữa Oolong Nướng", category: "milktea", price: 40000, desc: "Hương trà oolong nướng khói đậm đà, vị ngọt thanh", icon: "🧋" },
  { id: 8, name: "Bánh Mì Chảo Đặc Biệt", category: "snack", price: 49000, desc: "Trứng ốp la, pate béo ngậy, xúc xích và bánh mì giòn rụm", icon: "🍳" },
  { id: 9, name: "Khoai Tây Chiên Lắc Phô Mai", category: "snack", price: 35000, desc: "Khoai tây chiên vàng giòn rụm phủ lớp bột phô mai thơm lừng", icon: "🍟" },
  { id: 10, name: "Bánh Croissant Bơ Tỏi", category: "snack", price: 32000, desc: "Bánh sừng bò ngàn lớp thơm nức mùi bơ tỏi lá mùi tây", icon: "🥐" }
];

// 2. KHỞI TẠO TRẠNG THÁI (STATE)
let cart = {}; // Cấu trúc: { itemId: { item, qty } }
let currentTable = "Bàn 01";

// 3. ĐỌC MÃ BÀN TỪ URL (Ví dụ: https://domain.pages.dev/?table=05)
function initTableFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get('table');

  if (tableParam) {
    // Nếu param là "5" hay "05" -> Format thành "Bàn 05"
    const formatted = tableParam.toString().padStart(2, '0');
    currentTable = `Bàn ${formatted}`;
  }

  // Cập nhật giao diện với số bàn thực tế
  document.getElementById('tableLabel').innerText = currentTable;
  document.getElementById('currentTableText').innerText = currentTable;
  document.getElementById('modalTableNumber').innerText = currentTable;
  document.getElementById('successTableText').innerText = currentTable;
}

// 4. RENDER DANH SÁCH MÓN ĂN RA GIAO DIỆN
function renderMenu(categoryFilter = "all") {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = "";

  const filteredItems = categoryFilter === "all" 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === categoryFilter);

  filteredItems.forEach(item => {
    const card = document.createElement('div');
    card.className = "food-card";
    card.innerHTML = `
      <div class="food-img-wrap">
        <span>${item.icon}</span>
        <span class="food-badge">Best Seller</span>
      </div>
      <div class="food-info">
        <div>
          <h4 class="food-name">${item.name}</h4>
          <p class="food-desc">${item.desc}</p>
        </div>
        <div class="food-bottom">
          <span class="food-price">${item.price.toLocaleString('vi-VN')}đ</span>
          <button class="btn-add" onclick="addToCart(${item.id})">+</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 5. QUẢN LÝ GIỎ HÀNG
window.addToCart = function(id) {
  const item = MENU_ITEMS.find(i => i.id === id);
  if (!item) return;

  if (cart[id]) {
    cart[id].qty += 1;
  } else {
    cart[id] = { item: item, qty: 1 };
  }

  updateCartUI();
};

window.changeQty = function(id, delta) {
  if (!cart[id]) return;

  cart[id].qty += delta;
  if (cart[id].qty <= 0) {
    delete cart[id];
  }

  updateCartUI();
  renderCartModalItems();
};

function updateCartUI() {
  const items = Object.values(cart);
  const totalCount = items.reduce((sum, entry) => sum + entry.qty, 0);
  const totalPrice = items.reduce((sum, entry) => sum + (entry.item.price * entry.qty), 0);

  // Cập nhật thanh giỏ hàng nổi
  document.getElementById('cartCountBadge').innerText = `${totalCount} món`;
  document.getElementById('cartTotalPrice').innerText = `${totalPrice.toLocaleString('vi-VN')}đ`;

  // Cập nhật giá trong modal
  document.getElementById('subTotalText').innerText = `${totalPrice.toLocaleString('vi-VN')}đ`;
  document.getElementById('finalTotalText').innerText = `${totalPrice.toLocaleString('vi-VN')}đ`;

  // Tự động ẩn thanh giỏ hàng nếu chưa chọn món nào
  const cartBar = document.getElementById('cartBar');
  if (totalCount > 0) {
    cartBar.style.display = 'flex';
  } else {
    cartBar.style.display = 'flex'; // Vẫn hiện để dễ tương tác
  }
}

function renderCartModalItems() {
  const list = document.getElementById('cartItemsList');
  list.innerHTML = "";

  const items = Object.values(cart);
  if (items.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:#94a3b8; padding: 20px 0;">Giỏ hàng đang trống</p>`;
    return;
  }

  items.forEach(({ item, qty }) => {
    const row = document.createElement('div');
    row.className = "cart-item-row";
    row.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 14px;">${item.name}</div>
        <div style="color: #d97706; font-size: 13px; font-weight: 700;">
          ${(item.price * qty).toLocaleString('vi-VN')}đ
        </div>
      </div>
      <div class="item-qty-control">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
        <span style="font-weight: 700; min-width: 20px; text-align: center;">${qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    `;
    list.appendChild(row);
  });
}

// 6. GỬI ĐƠN HÀNG XUỐNG BẾP (ĐỒNG BỘ REALTIME)
function submitOrder() {
  const items = Object.values(cart);
  if (items.length === 0) {
    alert("Giỏ hàng của bạn đang trống! Vui lòng chọn món trước.");
    return;
  }

  const totalPrice = items.reduce((sum, entry) => sum + (entry.item.price * entry.qty), 0);

  // Tạo đối tượng Đơn Hàng (Order Object)
  const newOrder = {
    id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
    table: currentTable,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    items: items.map(entry => ({
      name: entry.item.name,
      qty: entry.qty,
      price: entry.item.price,
      total: entry.item.price * entry.qty
    })),
    totalPrice: totalPrice,
    status: "pending" // pending -> completed
  };

  // 1. Lưu vào LocalStorage (để lưu trữ đơn)
  const existingOrders = JSON.parse(localStorage.getItem('cloud_pos_orders') || '[]');
  existingOrders.unshift(newOrder);
  localStorage.setItem('cloud_pos_orders', JSON.stringify(existingOrders));

  // 2. Phát tín hiệu Realtime qua BroadcastChannel (giao tiếp tức thì giữa tab Khách và Bếp)
  try {
    const channel = new BroadcastChannel('pos_kitchen_channel');
    channel.postMessage({ type: 'NEW_ORDER', order: newOrder });
  } catch (e) {
    console.log("BroadcastChannel sync:", e);
  }

  // Đóng Modal giỏ hàng & Mở Modal thành công
  document.getElementById('cartModal').classList.remove('active');
  document.getElementById('successModal').classList.add('active');

  // Reset giỏ hàng
  cart = {};
  updateCartUI();
}

// 7. GẮN SỰ KIỆN NÚT BẤM (EVENT LISTENERS)
document.addEventListener('DOMContentLoaded', () => {
  initTableFromURL();
  renderMenu('all');
  updateCartUI();

  // Lọc danh mục
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderMenu(e.target.dataset.category);
    });
  });

  // Mở/Đóng Giỏ hàng
  document.getElementById('btnOpenCart').addEventListener('click', () => {
    renderCartModalItems();
    document.getElementById('cartModal').classList.add('active');
  });

  document.getElementById('btnCloseCart').addEventListener('click', () => {
    document.getElementById('cartModal').classList.remove('active');
  });

  // Gửi đơn
  document.getElementById('btnSubmitOrder').addEventListener('click', submitOrder);

  // Đóng modal thành công
  document.getElementById('btnCloseSuccess').addEventListener('click', () => {
    document.getElementById('successModal').classList.remove('active');
  });
});
