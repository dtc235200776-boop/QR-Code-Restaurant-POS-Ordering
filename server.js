const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const PORT = Number(process.env.PORT || 3000);
const STAFF_PIN = process.env.STAFF_PIN || '246810'; // Demo PIN; set STAFF_PIN before exposing the server.
const SESSION_COOKIE = 'cloud_pos_staff';
const sessions = new Map();
const streams = new Set();
const seedMenu = [
  { id: 1, section: 'food', category: 'main', name: 'Cơm tấm sườn bì chả', price: 59000, desc: 'Sườn nướng, bì, chả trứng và nước mắm', icon: '🍛', salePercent: 10 },
  { id: 2, section: 'food', category: 'main', name: 'Cơm gà sốt mắm tỏi', price: 55000, desc: 'Đùi gà chiên giòn, cơm nóng và dưa góp', icon: '🍗', salePercent: 0 },
  { id: 3, section: 'food', category: 'main', name: 'Bò lúc lắc khoai tây', price: 79000, desc: 'Bò mềm xào rau củ, ăn kèm khoai tây', icon: '🥩', salePercent: 0 },
  { id: 4, section: 'food', category: 'main', name: 'Mì xào hải sản', price: 69000, desc: 'Mì xào tôm mực cùng rau củ tươi', icon: '🍜', salePercent: 0 },
  { id: 5, section: 'food', category: 'main', name: 'Phở bò tái', price: 59000, desc: 'Nước dùng ninh xương, bánh phở mềm', icon: '🍲', salePercent: 0 },
  { id: 6, section: 'food', category: 'main', name: 'Bún bò Huế', price: 62000, desc: 'Bò, chả cua và nước dùng sả ớt', icon: '🍜', salePercent: 0 },
  { id: 7, section: 'food', category: 'appetizer', name: 'Gỏi cuốn tôm thịt (2 cuốn)', price: 39000, desc: 'Rau tươi, tôm thịt và nước chấm', icon: '🥗', salePercent: 0 },
  { id: 8, section: 'food', category: 'appetizer', name: 'Khoai tây chiên phô mai', price: 35000, desc: 'Khoai vàng giòn lắc phô mai', icon: '🍟', salePercent: 0 },
  { id: 9, section: 'food', category: 'appetizer', name: 'Bánh mì chảo đặc biệt', price: 49000, desc: 'Trứng ốp la, pate, xúc xích và bánh mì', icon: '🍳', salePercent: 0 },
  { id: 10, section: 'food', category: 'appetizer', name: 'Croissant bơ tỏi', price: 32000, desc: 'Bánh sừng bò thơm bơ tỏi', icon: '🥐', salePercent: 0 },
  { id: 11, section: 'drink', category: 'coffee', name: 'Cà phê sữa đá', price: 29000, desc: 'Robusta Đắk Lắk và sữa đặc', icon: '☕', salePercent: 0 },
  { id: 12, section: 'drink', category: 'coffee', name: 'Bạc xỉu', price: 32000, desc: 'Nhiều sữa, ít cà phê', icon: '🥛', salePercent: 0 },
  { id: 13, section: 'drink', category: 'coffee', name: 'Cà phê muối', price: 35000, desc: 'Cà phê đậm vị cùng kem muối', icon: '🧂', salePercent: 0 },
  { id: 14, section: 'drink', category: 'tea', name: 'Trà đào cam sả', price: 39000, desc: 'Đào giòn, cam tươi và sả', icon: '🍑', salePercent: 10 },
  { id: 15, section: 'drink', category: 'tea', name: 'Trà dâu tằm macchiato', price: 42000, desc: 'Dâu tằm chua ngọt và kem cheese', icon: '🍓', salePercent: 0 },
  { id: 16, section: 'drink', category: 'tea', name: 'Trà chanh mật ong', price: 32000, desc: 'Trà thanh mát, mật ong dịu nhẹ', icon: '🍋', salePercent: 0 },
  { id: 17, section: 'drink', category: 'milktea', name: 'Trà sữa trân châu đường đen', price: 45000, desc: 'Sữa tươi, trân châu và đường đen', icon: '🧋', salePercent: 0 },
  { id: 18, section: 'drink', category: 'milktea', name: 'Trà sữa oolong nướng', price: 40000, desc: 'Oolong rang thơm, vị ngọt dịu', icon: '🧋', salePercent: 0 },
  { id: 19, section: 'drink', category: 'other-drink', name: 'Nước suối', price: 12000, desc: 'Nước khoáng đóng chai', icon: '💧', salePercent: 0 },
  { id: 20, section: 'drink', category: 'other-drink', name: 'Nước ngọt', price: 18000, desc: 'Coca-Cola / Pepsi / 7Up', icon: '🥤', salePercent: 0 }
];

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ menu: seedMenu, orders: [] }, null, 2));
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
    try {
      const originUrl = new URL(origin);
      const requestHost = new URL(`http://${req.headers.host || 'localhost'}`);
      if (originUrl.hostname === requestHost.hostname && originUrl.protocol === 'http:') {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Vary', 'Origin');
      }
    } catch (_) {}
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true, app: 'Cloud Kitchen POS', port: PORT, time: new Date().toISOString() });
    if (req.method === 'GET' && url.pathname === '/api/network') {
      const addresses = Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => item.address);
      const host = req.headers.host?.split(':')[0];
      const address = host && !['localhost', '127.0.0.1', '0.0.0.0'].includes(host) ? host : (addresses[0] || 'localhost');
      return sendJson(res, 200, { address, url: `http://${address}:${PORT}/index.html` });
    }
    if (req.method === 'GET' && url.pathname === '/api/session') return sendJson(res, 200, { staff: isStaff(req) });
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const body = await readBody(req);
      if (String(body.pin || '') !== STAFF_PIN) return sendJson(res, 401, { error: 'Mã nhân viên không đúng.' });
      const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`, 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ ok: true }));
    }
    if (req.method === 'POST' && url.pathname === '/api/logout') { const token = getCookie(req, SESSION_COOKIE); sessions.delete(token); res.writeHead(204, { 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` }); return res.end(); }
    if (req.method === 'GET' && url.pathname === '/api/menu') return sendJson(res, 200, { items: readStore().menu });
    if (req.method === 'GET' && url.pathname === '/api/orders') {
      const store = readStore();
      if (isStaff(req)) return sendJson(res, 200, { orders: store.orders });
      const table = url.searchParams.get('table');
      if (!table) return sendJson(res, 401, { error: 'Chỉ nhân viên mới xem được toàn bộ đơn.' });
      return sendJson(res, 200, { orders: store.orders.filter(order => order.table === table) });
    }
    if (req.method === 'GET' && url.pathname === '/api/events') {
      const staff = isStaff(req); const table = url.searchParams.get('table');
      if (!staff && !table) return sendJson(res, 401, { error: 'Thiếu mã bàn.' });
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 3000\n\n'); const client = { res, staff, table }; streams.add(client); const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 20000);
      req.on('close', () => { clearInterval(heartbeat); streams.delete(client); }); return;
    }
    if (req.method === 'POST' && url.pathname === '/api/orders') {
      const body = await readBody(req); const table = String(body.table || '').trim();
      if (!/^Bàn (0[1-9]|1[0-2])$/.test(table) || !Array.isArray(body.items) || !body.items.length) return sendJson(res, 400, { error: 'Bàn hoặc danh sách món không hợp lệ.' });
      const store = readStore(); const items = [];
      for (const row of body.items) {
        const menuItem = store.menu.find(item => item.id === Number(row.id) && item.available !== false);
        const qty = Math.max(1, Math.min(50, Number(row.qty) || 1));
        if (!menuItem) return sendJson(res, 400, { error: 'Có món đã hết hàng hoặc không còn trong thực đơn.' });
        const unitPrice = Math.round(menuItem.price * (100 - (menuItem.salePercent || 0)) / 100);
        items.push({ id: menuItem.id, name: menuItem.name, section: menuItem.section, category: menuItem.category, qty, note: String(row.note || '').slice(0, 120), listPrice: menuItem.price, salePercent: menuItem.salePercent || 0, unitPrice, total: unitPrice * qty });
      }
      const subtotal = items.reduce((sum, item) => sum + item.total, 0); const promotionDiscount = items.reduce((sum, item) => sum + Math.round(item.listPrice * item.qty * item.salePercent / 100), 0);
      const order = { id: `ORD-${Date.now().toString().slice(-7)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`, table, items, subtotal, promotionDiscount, voucherCode: '', voucherDiscount: 0, discountTotal: promotionDiscount, totalPrice: subtotal, createdAt: new Date().toISOString(), status: 'pending', stations: { food: items.some(item => item.section === 'food') ? 'pending' : null, drink: items.some(item => item.section === 'drink') ? 'pending' : null } };
      store.orders.unshift(order); writeStore(store); broadcast(order); return sendJson(res, 201, { order });
    }
    const stationRoute = url.pathname.match(/^\/api\/orders\/([^/]+)\/station$/);
    if (req.method === 'PATCH' && stationRoute) {
      if (!isStaff(req)) return sendJson(res, 401, { error: 'Cần đăng nhập nhân viên.' });
      const body = await readBody(req); const station = body.station; const status = body.status;
      if (!['food', 'drink'].includes(station) || !['pending', 'cooking', 'ready'].includes(status)) return sendJson(res, 400, { error: 'Trạng thái khu bếp không hợp lệ.' });
      const store = readStore(); const order = store.orders.find(row => row.id === decodeURIComponent(stationRoute[1]));
      if (!order || !order.stations[station]) return sendJson(res, 404, { error: 'Không tìm thấy phiếu bếp.' });
      order.stations[station] = status;
      const states = Object.values(order.stations).filter(Boolean);
      order.status = states.every(state => state === 'ready') ? 'ready' : states.some(state => state === 'cooking' || state === 'ready') ? 'cooking' : 'pending';
      order.updatedAt = new Date().toISOString(); updateOrder(store, order); return sendJson(res, 200, { order });
    }
    const payRoute = url.pathname.match(/^\/api\/orders\/([^/]+)\/pay$/);
    if (req.method === 'POST' && payRoute) {
      if (!isStaff(req)) return sendJson(res, 401, { error: 'Cần đăng nhập nhân viên.' });
      const body = await readBody(req); const store = readStore(); const order = store.orders.find(row => row.id === decodeURIComponent(payRoute[1]));
      if (!order) return sendJson(res, 404, { error: 'Không tìm thấy hóa đơn.' });
      if (order.status === 'paid') return sendJson(res, 409, { error: 'Hóa đơn này đã thanh toán.' });
      if (order.status !== 'ready' && order.status !== 'served') return sendJson(res, 409, { error: 'Chỉ thanh toán khi các món đã sẵn sàng.' });
      const code = String(body.voucherCode || '').trim().toUpperCase(); let voucherDiscount = 0;
      if (code === 'WELCOME10') voucherDiscount = Math.min(Math.round(order.totalPrice * 0.1), 30000);
      else if (code === 'COMBO20' && order.totalPrice >= 120000) voucherDiscount = 20000;
      else if (code) return sendJson(res, 400, { error: 'Mã voucher không hợp lệ hoặc chưa đủ điều kiện.' });
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
  if (error.code === 'EADDRINUSE') console.error(`Cổng ${PORT} đang được dùng. Hãy đóng cửa sổ POS cũ hoặc đổi PORT trong môi trường rồi chạy lại.`);
  else console.error('Không thể khởi động Cloud POS:', error.message);
  process.exitCode = 1;
});
server.listen(PORT, '0.0.0.0', () => console.log(`Cloud POS running at http://localhost:${PORT} (staff PIN configured)`));
