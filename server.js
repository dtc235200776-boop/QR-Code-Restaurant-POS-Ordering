const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const PORT = Number(process.env.PORT || 3000);
const STAFF_PIN = process.env.STAFF_PIN || '246810'; // Demo PIN for Hotel Staff
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
fs.writeFileSync(DATA_FILE, JSON.stringify({ menu: seedServices, orders: [] }, null, 2));

const readStore = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeStore = store => fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
const sendJson = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
const getCookie = (req, name) => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`))?.slice(name.length + 1);
const isStaff = req => { const token = getCookie(req, SESSION_COOKIE); const expires = sessions.get(token); if (expires && expires > Date.now()) return true; if (token) sessions.delete(token); return false; };
const readBody = req => new Promise((resolve, reject) => { let data = ''; req.on('data', chunk => { data += chunk; if (data.length > 1_000_000) reject(new Error('Dữ liệu gửi lên quá lớn')); }); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('JSON không hợp lệ')); } }); req.on('error', reject); });
function broadcast(order) { for (const client of streams) { if (client.staff || client.table === order.table) client.res.write(`event: order\ndata: ${JSON.stringify(order)}\n\n`); } }
function updateOrder(store, order) { const index = store.orders.findIndex(row => row.id === order.id); if (index >= 0) store.orders[index] = order; writeStore(store); broadcast(order); }

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
    if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true, app: 'Cloud Hotel & Resort Room Service', port: PORT, time: new Date().toISOString() });
    if (req.method === 'GET' && url.pathname === '/api/network') {
      const allAddresses = Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => item.address);
      const lanAddresses = allAddresses.filter(ip => !ip.startsWith('169.254.'));
      const host = req.headers.host?.split(':')[0];
      const address = host && !['localhost', '127.0.0.1', '0.0.0.0'].includes(host) ? host : (lanAddresses[0] || 'localhost');
      return sendJson(res, 200, { address, addresses: lanAddresses, url: `http://${address}:${PORT}/index.html` });
    }
    if (req.method === 'GET' && url.pathname === '/api/session') return sendJson(res, 200, { staff: isStaff(req) });
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const body = await readBody(req);
      if (String(body.pin || '') !== STAFF_PIN) return sendJson(res, 401, { error: 'Mã nhân viên khách sạn không đúng.' });
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`, 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ ok: true }));
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
    const stationRoute = url.pathname.match(/^\/api\/orders\/([^/]+)\/station$/);
    if (req.method === 'PATCH' && stationRoute) {
      if (!isStaff(req)) return sendJson(res, 401, { error: 'Cần đăng nhập nhân viên khách sạn.' });
      const body = await readBody(req); const station = body.station; const status = body.status;
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
      if (!isStaff(req)) return sendJson(res, 401, { error: 'Cần đăng nhập nhân viên lễ tân.' });
      const body = await readBody(req); const store = readStore(); const order = store.orders.find(row => row.id === decodeURIComponent(payRoute[1]));
      if (!order) return sendJson(res, 404, { error: 'Không tìm thấy hóa đơn phòng.' });
      if (order.status === 'paid') return sendJson(res, 409, { error: 'Hóa đơn này đã thanh toán lúc check-out.' });
      const code = String(body.voucherCode || '').trim().toUpperCase(); let voucherDiscount = 0;
      if (code === 'HOTEL10') voucherDiscount = Math.min(Math.round(order.totalPrice * 0.1), 50000);
      else if (code === 'VIPSTAY' && order.totalPrice >= 200000) voucherDiscount = 50000;
      else if (code) return sendJson(res, 400, { error: 'Mã ưu đãi không hợp lệ.' });
      order.voucherCode = code; order.voucherDiscount = voucherDiscount; order.discountTotal = order.promotionDiscount + voucherDiscount;
      order.amountPaid = Math.max(0, order.totalPrice - voucherDiscount); order.status = 'paid'; order.paidAt = new Date().toISOString(); updateOrder(store, order); return sendJson(res, 200, { order });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'API không tồn tại.' });

    let requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    if (requested.includes('..')) return sendJson(res, 400, { error: 'Đường dẫn không hợp lệ.' });
    if (['/kitchen.html', '/admin.html', '/qrcodes/', '/qrcodes/index.html'].includes(requested) && !isStaff(req)) { res.writeHead(302, { Location: `/staff-login.html?next=${encodeURIComponent(requested)}` }); return res.end(); }
    const file = path.join(ROOT, requested);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file)) return sendJson(res, 404, { error: 'Không tìm thấy trang.' });
    if (fs.statSync(file).isDirectory()) requested = path.join(requested, 'index.html');
    const resolvedFile = path.join(ROOT, requested);
    if (!resolvedFile.startsWith(ROOT + path.sep) || !fs.existsSync(resolvedFile) || !fs.statSync(resolvedFile).isFile()) return sendJson(res, 404, { error: 'Không tìm thấy trang.' });
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': types[path.extname(resolvedFile)] || 'application/octet-stream', 'Cache-Control': path.extname(resolvedFile) === '.html' ? 'no-cache' : 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' }); fs.createReadStream(resolvedFile).pipe(res);
  } catch (error) { if (!res.headersSent) sendJson(res, 500, { error: 'Lỗi máy chủ.', detail: error.message }); else res.end(); }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') console.error(`Cổng ${PORT} đang được dùng.`);
  else console.error('Không thể khởi động Cloud Hotel POS:', error.message);
  process.exitCode = 1;
});
server.listen(PORT, '0.0.0.0', () => console.log(`Cloud Hotel Room Service running at http://localhost:${PORT}`));
