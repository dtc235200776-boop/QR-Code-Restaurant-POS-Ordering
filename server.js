const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');

const ROOT = __dirname;
const BUILD_VERSION = '2026-11-03-frontdesk-shared-ops-3';
const DATA_FILE = path.join(ROOT, 'data.json');
let PORT = Number(process.env.PORT || 3000);
const STAFF_ACCOUNTS = {
  receptionist: { username: 'letan', password: '123456', role: 'receptionist' },
  cashier: { username: 'thungan', password: '123456', role: 'cashier' },
  housekeeping: { username: 'buongphong', password: '123456', role: 'housekeeping' },
  kitchen: { username: 'bep', password: '123456', role: 'kitchen' },
  manager: { username: 'quanly', password: '123456', role: 'manager' }
};
const LEGACY_PORT = Number(process.env.LEGACY_PORT || 5500);
const seedInventory = [
  { id: 'towels', name: 'Khăn tắm', category: 'Buồng phòng', quantity: 38, minimum: 12, unit: 'chiếc' },
  { id: 'linen', name: 'Bộ ga gối', category: 'Buồng phòng', quantity: 18, minimum: 6, unit: 'bộ' },
  { id: 'amenities', name: 'Bộ đồ dùng cá nhân', category: 'Buồng phòng', quantity: 26, minimum: 10, unit: 'bộ' },
  { id: 'detergent', name: 'Nước giặt', category: 'Buồng phòng', quantity: 9, minimum: 4, unit: 'can' },
  { id: 'pho', name: 'Bánh phở & nước dùng', category: 'Bếp', quantity: 16, minimum: 6, unit: 'phần' },
  { id: 'beef', name: 'Thịt bò', category: 'Bếp', quantity: 7, minimum: 5, unit: 'kg' },
  { id: 'coffee', name: 'Cà phê & trà', category: 'Bếp', quantity: 14, minimum: 5, unit: 'hộp' },
  { id: 'water', name: 'Nước khoáng', category: 'Minibar', quantity: 32, minimum: 12, unit: 'chai' },
  { id: 'soft-drink', name: 'Nước ngọt', category: 'Minibar', quantity: 10, minimum: 12, unit: 'lon' },
  { id: 'beer', name: 'Bia', category: 'Minibar', quantity: 22, minimum: 8, unit: 'lon' }
];
const SESSION_COOKIE = 'hotel_pos_staff';
const sessions = new Map();
const streams = new Set();

const seedServices = [
  // 1. Dịch vụ buồng phòng & Tiện ích (Housekeeping & Amenities)
  { id: 1, section: 'housekeeping', category: 'cleaning', name: 'Yêu cầu dọn phòng & Đổi ga gối', price: 0, desc: 'Nhân viên buồng phòng sẽ đến hút bụi, dọn phòng và thay ga gối mới', icon: '🧹', salePercent: 0 },
  { id: 2, section: 'housekeeping', category: 'cleaning', name: 'Bổ sung khăn tắm & Bộ vệ sinh', price: 0, desc: 'Bổ sung 2 khăn tắm lớn, bàn chải, dầu gội và sữa tắm', icon: '🛁', salePercent: 0 },
  { id: 3, section: 'housekeeping', category: 'amenities', name: 'Mượn bàn ủi & Cầu là', price: 0, desc: 'Mượn bàn ủi hơi nước và cầu là sử dụng tại phòng (miễn phí 2h)', icon: '👔', salePercent: 0 },
  { id: 4, section: 'housekeeping', category: 'amenities', name: 'Mượn máy sấy tóc & Ổ cắm quốc tế', price: 0, desc: 'Máy sấy tóc ion âm và củ sạc đa năng chuyển đổi chuẩn cắm', icon: '🔌', salePercent: 0 },
  { id: 5, section: 'housekeeping', category: 'laundry', name: 'Giặt sấy quần áo tiêu chuẩn (Bộ)', price: 45000, desc: 'Nhận giặt sạch, sấy khô và gấp gọn giao lại trong 4 tiếng', icon: '🧺', salePercent: 10 },
  { id: 6, section: 'housekeeping', category: 'laundry', name: 'Giặt hấp ủi cao cấp (Vest / Đầm)', price: 85000, desc: 'Giặt hấp chuyên dụng giữ phom dáng đồ cao cấp', icon: '👗', salePercent: 0 },
  { id: 7, section: 'housekeeping', category: 'rental', name: 'Thuê xe máy tay ga (Theo ngày)', price: 150000, desc: 'Xe tay ga đời mới, kèm 2 mũ bảo hiểm và giao xe tại sảnh', icon: '🛵', salePercent: 0 },
  { id: 8, section: 'housekeeping', category: 'rental', name: 'Xe đưa đón sân bay 4-7 chỗ', price: 320000, desc: 'Xe riêng đưa đón tận sảnh khách sạn đúng giờ hẹn', icon: '🚗', salePercent: 0 },

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

// Khởi tạo hoặc cập nhật data.json sang dữ liệu khách sạn
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ menu: seedServices, orders: [] }, null, 2));

const readStore = () => {
  const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(store.reservations)) store.reservations = [];
  if (!Array.isArray(store.rooms)) store.rooms = Array.from({ length: 12 }, (_, index) => ({ number: 101 + index, status: 'available', guestName: '', guestPhone: '', checkIn: '', plannedCheckout: '' }));
  if (!Array.isArray(store.inventory)) store.inventory = seedInventory.map(item => ({ ...item }));
  return store;
};
const writeStore = store => fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
const sendJson = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
const getCookie = (req, name) => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`))?.slice(name.length + 1);
const getRole = req => { const token = getCookie(req, SESSION_COOKIE); const session = sessions.get(token); if (session && session.expires > Date.now()) return session.role; if (token) sessions.delete(token); return null; };
const isStaff = req => Boolean(getRole(req));
const canAccess = (role, allowed) => role === 'manager' || allowed.includes(role);
const readBody = req => new Promise((resolve, reject) => { let data = ''; req.on('data', chunk => { data += chunk; if (data.length > 1_000_000) reject(new Error('Dữ liệu gửi lên quá lớn')); }); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('JSON không hợp lệ')); } }); req.on('error', reject); });
function broadcast(order) { for (const client of streams) { if (client.staff || client.table === order.table) client.res.write(`event: order\ndata: ${JSON.stringify(order)}\n\n`); } }
function updateOrder(store, order) { const index = store.orders.findIndex(row => row.id === order.id); if (index >= 0) store.orders[index] = order; writeStore(store); broadcast(order); }
function availableRooms(store, checkIn, checkOut) {
  const active = store.reservations.filter(row => ['pending', 'confirmed'].includes(row.status) && row.checkIn < checkOut && row.checkOut > checkIn);
  const heldRooms = store.rooms.filter(room => room.status === 'cleaning' || room.status === 'maintenance' || (room.status === 'occupied' && room.checkIn < checkOut && room.plannedCheckout > checkIn)).length;
  return Math.max(0, 12 - heldRooms - active.length);
}
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true, app: 'Cloud Hotel & Resort Room Service', version: BUILD_VERSION, port: PORT, time: new Date().toISOString() });
    if (req.method === 'GET' && url.pathname === '/api/network') {
      const allAddresses = Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => item.address);
      const lanAddresses = allAddresses.filter(ip => !ip.startsWith('169.254.'));
      const hostHeader = req.headers.host || 'localhost';
      const parsedHost = new URL(`http://${hostHeader}`);
      const host = parsedHost.hostname;
      const address = host && !['localhost', '127.0.0.1', '0.0.0.0'].includes(host) ? host : (lanAddresses[0] || 'localhost');
      const protocol = String(req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')).split(',')[0].trim();
      const localHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(host);
      const publicAddress = !localHost && parsedHost.port !== String(LEGACY_PORT) ? hostHeader : `${address}:${PORT}`;
      return sendJson(res, 200, { address, addresses: lanAddresses, url: `${protocol}://${publicAddress}/khach-hang.html` });
    }
    if (req.method === 'GET' && url.pathname === '/api/session') { const role = getRole(req); return sendJson(res, 200, { staff: Boolean(role), role }); }
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const body = await readBody(req);
      const account = STAFF_ACCOUNTS[String(body.role || '')];
      if (!account || String(body.username || '').trim() !== account.username || String(body.password || '').trim() !== account.password) return sendJson(res, 401, { error: 'Tài khoản, mật khẩu hoặc bộ phận không chính xác.' });
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { expires: Date.now() + 12 * 60 * 60 * 1000, role: account.role });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`, 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ ok: true, role: account.role }));
    }
    if (req.method === 'POST' && url.pathname === '/api/logout') { const token = getCookie(req, SESSION_COOKIE); sessions.delete(token); res.writeHead(204, { 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` }); return res.end(); }
    if (req.method === 'GET' && url.pathname === '/api/menu') return sendJson(res, 200, { items: readStore().menu });
    if (req.method === 'GET' && url.pathname === '/api/orders') {
      const store = readStore();
      if (isStaff(req)) return sendJson(res, 200, { orders: store.orders });
      const table = url.searchParams.get('table');
      if (!table) return sendJson(res, 401, { error: 'Chỉ nhân viên mới xem được toàn bộ yêu cầu.' });
      return sendJson(res, 200, { orders: store.orders.filter(order => order.table === table) });
    }
    if (req.method === 'GET' && url.pathname === '/api/events') {
      const staff = isStaff(req); const table = url.searchParams.get('table');
      if (!staff && !table) return sendJson(res, 401, { error: 'Thiếu mã số phòng.' });
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 3000\n\n'); const client = { res, staff, table }; streams.add(client); const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 20000);
      req.on('close', () => { clearInterval(heartbeat); streams.delete(client); }); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readBody(req); const table = String(body.table || '').trim();
      if (!table || !Array.isArray(body.items) || !body.items.length) return sendJson(res, 400, { error: 'Số phòng hoặc danh sách dịch vụ không hợp lệ.' });
      const store = readStore(); const items = [];
      const roomNumber = Number(table.replace(/\D/g, '')); const room = store.rooms.find(item => item.number === roomNumber);
      if (!room || room.status !== 'occupied') return sendJson(res, 409, { error: 'Phòng chưa được tiếp tân làm thủ tục nhận phòng hoặc đang chờ dọn dẹp.' });
      for (const row of body.items) {
        const menuItem = store.menu.find(item => item.id === Number(row.id) && item.available !== false);
        const qty = Math.max(1, Math.min(50, Number(row.qty) || 1));
        if (!menuItem) return sendJson(res, 400, { error: 'Có dịch vụ tạm thời không khả dụng.' });
        const unitPrice = Math.round(menuItem.price * (100 - (menuItem.salePercent || 0)) / 100);
        items.push({ id: menuItem.id, name: menuItem.name, section: menuItem.section, category: menuItem.category, qty, note: String(row.note || '').slice(0, 120), listPrice: menuItem.price, salePercent: menuItem.salePercent || 0, unitPrice, total: unitPrice * qty });
      }
      const subtotal = items.reduce((sum, item) => sum + item.total, 0); const promotionDiscount = items.reduce((sum, item) => sum + Math.round(item.listPrice * item.qty * item.salePercent / 100), 0);
      const order = { id: `SRV-${Date.now().toString().slice(-7)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`, table, items, subtotal, promotionDiscount, voucherCode: '', voucherDiscount: 0, discountTotal: promotionDiscount, totalPrice: subtotal, createdAt: new Date().toISOString(), status: 'pending', stations: { housekeeping: items.some(item => item.section === 'housekeeping') ? 'pending' : null, dining: items.some(item => item.section === 'dining') ? 'pending' : null } };
      store.orders.unshift(order); writeStore(store); broadcast(order); return sendJson(res, 201, { order });
    }
    if (req.method === 'GET' && url.pathname === '/api/rooms') {
      if (!canAccess(getRole(req), ['receptionist', 'housekeeping'])) return sendJson(res, getRole(req) ? 403 : 401, { error: 'Chỉ nhân viên lễ tân, buồng phòng hoặc quản lý được xem tình trạng phòng.' });
      return sendJson(res, 200, { rooms: readStore().rooms });
    }
    const roomRoute = url.pathname.match(/^\/api\/rooms\/(\d+)$/);
    if (req.method === 'PATCH' && roomRoute) {
      const role = getRole(req); if (!role) return sendJson(res, 401, { error: 'Cần đăng nhập nhân viên khách sạn.' });
      const body = await readBody(req); const store = readStore(); const room = store.rooms.find(item => item.number === Number(roomRoute[1]));
      if (!room) return sendJson(res, 404, { error: 'Không tìm thấy phòng.' });
      if (body.action === 'check_in') {
        if (!canAccess(role, ['receptionist'])) return sendJson(res, 403, { error: 'Chỉ lễ tân hoặc quản lý được làm thủ tục nhận phòng.' });
        const guestName = String(body.guestName || '').trim().slice(0, 80); const guestPhone = String(body.guestPhone || '').trim().slice(0, 30); const plannedCheckout = String(body.plannedCheckout || '');
        if (room.status !== 'available') return sendJson(res, 409, { error: 'Phòng chưa sẵn sàng nhận khách.' });
        if (!guestName || !guestPhone || !validDate(plannedCheckout) || plannedCheckout <= new Date().toISOString().slice(0, 10)) return sendJson(res, 400, { error: 'Cần nhập tên khách, số điện thoại và ngày trả phòng hợp lệ.' });
        const today = new Date().toISOString().slice(0, 10);
        const reservation = store.reservations.find(row => ['pending', 'confirmed'].includes(row.status) && row.phone === guestPhone && row.checkOut === plannedCheckout && row.checkIn <= today);
        if (reservation) { reservation.status = 'checked_in'; reservation.roomNumber = room.number; reservation.updatedAt = new Date().toISOString(); room.reservationId = reservation.id; }
        room.status = 'occupied'; room.guestName = guestName; room.guestPhone = guestPhone; room.checkIn = today; room.plannedCheckout = plannedCheckout; room.updatedAt = new Date().toISOString();
      } else if (body.action === 'check_out') {
        if (!canAccess(role, ['receptionist'])) return sendJson(res, 403, { error: 'Chỉ lễ tân hoặc quản lý được làm thủ tục trả phòng.' });
        if (room.status !== 'occupied') return sendJson(res, 409, { error: 'Phòng hiện không có khách để trả phòng.' });
        const unpaidOrders = store.orders.filter(order => order.table === `Phòng ${room.number}` && order.status !== 'paid');
        if (unpaidOrders.length) return sendJson(res, 409, { error: 'Chưa thể trả phòng: còn hóa đơn dịch vụ chưa thanh toán hoặc bộ phận chưa hoàn tất. Lễ tân hãy kiểm tra và xác nhận thanh toán trước.' });
        room.status = 'cleaning'; room.lastGuestName = room.guestName; room.lastCheckOut = new Date().toISOString();
        const reservation = store.reservations.find(row => row.id === room.reservationId); if (reservation) { reservation.status = 'completed'; reservation.updatedAt = new Date().toISOString(); }
        room.reservationId = ''; room.guestName = ''; room.guestPhone = ''; room.checkIn = ''; room.plannedCheckout = ''; room.updatedAt = new Date().toISOString();
      } else if (body.action === 'cleaned') {
        if (!canAccess(role, ['housekeeping'])) return sendJson(res, 403, { error: 'Chỉ buồng phòng hoặc quản lý được xác nhận phòng đã dọn.' });
        if (room.status !== 'cleaning') return sendJson(res, 409, { error: 'Phòng này không nằm trong hàng đợi dọn phòng.' });
        room.status = 'available'; room.updatedAt = new Date().toISOString();
      } else if (body.action === 'maintenance' || body.action === 'maintenance_done') {
        if (!canAccess(role, ['receptionist'])) return sendJson(res, 403, { error: 'Chỉ lễ tân hoặc quản lý được cập nhật tình trạng bảo trì.' });
        if (body.action === 'maintenance' && room.status !== 'available') return sendJson(res, 409, { error: 'Chỉ chuyển phòng trống sang trạng thái bảo trì.' });
        if (body.action === 'maintenance_done' && room.status !== 'maintenance') return sendJson(res, 409, { error: 'Phòng này không ở trạng thái bảo trì.' });
        room.status = body.action === 'maintenance' ? 'maintenance' : 'available'; room.updatedAt = new Date().toISOString();
      } else return sendJson(res, 400, { error: 'Thao tác phòng không hợp lệ.' });
      writeStore(store); return sendJson(res, 200, { room });
    }
    if (req.method === 'GET' && url.pathname === '/api/inventory') {
      if (!canAccess(getRole(req), ['manager'])) return sendJson(res, getRole(req) ? 403 : 401, { error: 'Chỉ quản lý được xem tồn kho.' });
      return sendJson(res, 200, { items: readStore().inventory });
    }
    const inventoryRoute = url.pathname.match(/^\/api\/inventory\/([^/]+)$/);
    if (req.method === 'PATCH' && inventoryRoute) {
      if (!canAccess(getRole(req), ['manager'])) return sendJson(res, getRole(req) ? 403 : 401, { error: 'Chỉ quản lý được điều chỉnh tồn kho.' });
      const body = await readBody(req); const store = readStore(); const item = store.inventory.find(row => row.id === decodeURIComponent(inventoryRoute[1]));
      if (!item) return sendJson(res, 404, { error: 'Không tìm thấy mặt hàng.' });
      const quantity = Number(body.quantity); const minimum = body.minimum === undefined ? item.minimum : Number(body.minimum);
      if (!Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(minimum) || minimum < 0) return sendJson(res, 400, { error: 'Số lượng và mức tồn tối thiểu phải là số nguyên không âm.' });
      item.quantity = quantity; item.minimum = minimum; item.updatedAt = new Date().toISOString(); writeStore(store); return sendJson(res, 200, { item });
    }

    const stationRoute = url.pathname.match(/^\/api\/orders\/([^/]+)\/station$/);
    if (req.method === 'PATCH' && stationRoute) {
      if (!getRole(req)) return sendJson(res, 401, { error: 'Cần đăng nhập nhân viên khách sạn.' });
      const body = await readBody(req); const station = body.station; const status = body.status;
      if (!canAccess(getRole(req), station === 'housekeeping' ? ['housekeeping'] : ['kitchen'])) return sendJson(res, 403, { error: 'Tài khoản không có quyền xử lý bộ phận này.' });
      if (!['housekeeping', 'dining'].includes(station) || !['pending', 'cooking', 'ready'].includes(status)) return sendJson(res, 400, { error: 'Trạng thái bộ phận không hợp lệ.' });
      const store = readStore(); const order = store.orders.find(row => row.id === decodeURIComponent(stationRoute[1]));
      if (!order || !order.stations[station]) return sendJson(res, 404, { error: 'Không tìm thấy phiếu yêu cầu dịch vụ.' });
      order.stations[station] = status;
      const states = Object.values(order.stations).filter(Boolean);
      order.status = states.every(state => state === 'ready') ? 'ready' : states.some(state => state === 'cooking' || state === 'ready') ? 'cooking' : 'pending';
      order.updatedAt = new Date().toISOString(); updateOrder(store, order); return sendJson(res, 200, { order });
    }
    const payRoute = url.pathname.match(/^\/api\/orders\/([^/]+)\/pay$/);
    if (req.method === 'POST' && payRoute) {
      if (!canAccess(getRole(req), ['cashier', 'receptionist'])) return sendJson(res, getRole(req) ? 403 : 401, { error: 'Chỉ lễ tân, thu ngân hoặc quản lý được xác nhận thanh toán.' });
      const body = await readBody(req); const store = readStore(); const order = store.orders.find(row => row.id === decodeURIComponent(payRoute[1]));
      if (!order) return sendJson(res, 404, { error: 'Không tìm thấy hóa đơn phòng.' });
      if (order.status === 'paid') return sendJson(res, 409, { error: 'Hóa đơn này đã thanh toán lúc check-out.' });
      if (!['ready', 'served'].includes(order.status)) return sendJson(res, 409, { error: 'Chỉ xác nhận thanh toán sau khi bếp và buồng phòng đã hoàn tất phục vụ.' });
      const code = String(body.voucherCode || '').trim().toUpperCase(); let voucherDiscount = 0;
      if (code === 'HOTEL10') voucherDiscount = Math.min(Math.round(order.totalPrice * 0.1), 50000);
      else if (code === 'VIPSTAY' && order.totalPrice >= 200000) voucherDiscount = 50000;
      else if (code) return sendJson(res, 400, { error: 'Mã ưu đãi không hợp lệ.' });
      order.voucherCode = code; order.voucherDiscount = voucherDiscount; order.discountTotal = order.promotionDiscount + voucherDiscount;
      order.amountPaid = Math.max(0, order.totalPrice - voucherDiscount); order.status = 'paid'; order.paidAt = new Date().toISOString(); updateOrder(store, order); return sendJson(res, 200, { order });
    }
    if (req.method === 'GET' && url.pathname === '/api/availability') {
      const checkIn = url.searchParams.get('checkIn') || ''; const checkOut = url.searchParams.get('checkOut') || '';
      if (!validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn) return sendJson(res, 400, { error: 'Vui lòng chọn ngày nhận và trả phòng hợp lệ.' });
      return sendJson(res, 200, { available: availableRooms(readStore(), checkIn, checkOut), checkIn, checkOut });
    }
    if (req.method === 'POST' && url.pathname === '/api/reservations') {
      const body = await readBody(req); const guestName = String(body.guestName || '').trim().slice(0, 80); const phone = String(body.phone || '').trim().slice(0, 30);
      const checkIn = String(body.checkIn || ''); const checkOut = String(body.checkOut || ''); const guests = Number(body.guests || 1);
      if (!guestName || !phone || !validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn || !Number.isInteger(guests) || guests < 1 || guests > 4) return sendJson(res, 400, { error: 'Vui lòng điền họ tên, số điện thoại, 1–4 khách và ngày lưu trú hợp lệ.' });
      const store = readStore(); if (availableRooms(store, checkIn, checkOut) < 1) return sendJson(res, 409, { error: 'Khoảng ngày này đã hết phòng trong hệ thống. Hãy chọn ngày khác hoặc liên hệ tiếp tân.' });
      const reservation = { id: `BK-${Date.now().toString().slice(-7)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`, guestName, phone, checkIn, checkOut, guests, status: 'pending', createdAt: new Date().toISOString() };
      store.reservations.unshift(reservation); writeStore(store); return sendJson(res, 201, { reservation, available: availableRooms(store, checkIn, checkOut) });
    }
    if (req.method === 'GET' && url.pathname === '/api/reservations') {
      if (!canAccess(getRole(req), ['receptionist'])) return sendJson(res, getRole(req) ? 403 : 401, { error: 'Chỉ tiếp tân hoặc quản lý được xem yêu cầu đặt phòng.' });
      return sendJson(res, 200, { reservations: readStore().reservations });
    }
    const reservationRoute = url.pathname.match(/^\/api\/reservations\/([^/]+)$/);
    if (req.method === 'PATCH' && reservationRoute) {
      if (!canAccess(getRole(req), ['receptionist'])) return sendJson(res, getRole(req) ? 403 : 401, { error: 'Chỉ tiếp tân hoặc quản lý được cập nhật đặt phòng.' });
      const body = await readBody(req); if (!['confirmed', 'rejected', 'cancelled'].includes(body.status)) return sendJson(res, 400, { error: 'Trạng thái đặt phòng không hợp lệ.' });
      const store = readStore(); const reservation = store.reservations.find(row => row.id === decodeURIComponent(reservationRoute[1]));
      if (!reservation) return sendJson(res, 404, { error: 'Không tìm thấy yêu cầu đặt phòng.' });
      reservation.status = body.status; reservation.updatedAt = new Date().toISOString(); writeStore(store); return sendJson(res, 200, { reservation });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'API không tồn tại.' });

    let requested = decodeURIComponent(url.pathname === '/' ? '/home.html' : url.pathname);
    if (requested.includes('..')) return sendJson(res, 400, { error: 'Đường dẫn không hợp lệ.' });
    const role = getRole(req);
    const legacyRoutes = {
      '/admin.html': '/manager.html', '/quan-ly.html': '/manager.html',
      '/cashier.html': '/thu-ngan.html',
      '/le-tan.html': '/letan.html', '/buong-phong.html': '/van-hanh.html',
      '/index.html': '/khach-hang.html', '/qrcodes': '/letan.html', '/qrcodes/': '/letan.html', '/qrcodes/index.html': '/letan.html'
    };
    if (requested === '/bep.html' || requested === '/kitchen.html' || requested === '/bep-buong-phong.html' || requested === '/bep-buongphong.html') { res.writeHead(302, { Location: '/van-hanh.html#kitchen' }); return res.end(); }
    if (requested === '/buongphong.html' || requested === '/buong-phong.html') { res.writeHead(302, { Location: '/van-hanh.html#housekeeping' }); return res.end(); }
    if (legacyRoutes[requested]) { res.writeHead(302, { Location: `${legacyRoutes[requested]}${url.search}${url.hash}` }); return res.end(); }
    const pageRoles = { '/van-hanh.html': ['kitchen', 'housekeeping'], '/manager.html': ['manager'], '/thu-ngan.html': ['cashier'], '/letan.html': ['receptionist'] };
    if (pageRoles[requested] && !canAccess(getRole(req), pageRoles[requested])) { res.writeHead(302, { Location: `/staff-login.html?next=${encodeURIComponent(requested)}` }); return res.end(); }
    const staticRequest = requested;
    const file = path.join(ROOT, staticRequest);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file)) return sendJson(res, 404, { error: 'Không tìm thấy trang.' });
    let resolvedRequest = staticRequest;
    if (fs.statSync(file).isDirectory()) resolvedRequest = path.join(staticRequest, 'index.html');
    const resolvedFile = path.join(ROOT, resolvedRequest);
    if (!resolvedFile.startsWith(ROOT + path.sep) || !fs.existsSync(resolvedFile) || !fs.statSync(resolvedFile).isFile()) return sendJson(res, 404, { error: 'Không tìm thấy trang.' });
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': types[path.extname(resolvedFile)] || 'application/octet-stream', 'Cache-Control': path.extname(resolvedFile) === '.html' ? 'no-cache' : 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' }); fs.createReadStream(resolvedFile).pipe(res);
  } catch (error) { if (!res.headersSent) sendJson(res, 500, { error: 'Lỗi máy chủ.', detail: error.message }); else res.end(); }
});

server.on('listening', () => {
  console.log(`Cloud Hotel Room Service running at http://localhost:${PORT}`);
  if (LEGACY_PORT !== PORT) {
    const legacyServer = http.createServer(server.listeners('request')[0]);
    legacyServer.on('error', error => console.warn(`Cổng QR cũ ${LEGACY_PORT} không khả dụng: ${error.message}`));
    legacyServer.listen(LEGACY_PORT, '0.0.0.0', () => console.log(`QR compatibility endpoint running at http://localhost:${LEGACY_PORT}`));
  }
});

function listenOnAvailablePort() {
  server.once('error', function retryOrStop(error) {
    if (error.code === 'EADDRINUSE' && !process.env.PORT && PORT < 3010) {
      PORT += 1;
      console.warn(`Cổng đang được dùng; thử cổng ${PORT}...`);
      listenOnAvailablePort();
      return;
    }
    console.error(`Không thể mở máy chủ tại cổng ${PORT}: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(PORT, '0.0.0.0');
}
listenOnAvailablePort();
