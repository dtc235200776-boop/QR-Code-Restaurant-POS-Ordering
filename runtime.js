(() => {
  const BUILD_VERSION = '2026-11-03-guest-room-qr-realtime-1';
  const isServer = value => value?.ok === true && value.version === BUILD_VERSION && String(value.app || '').toLowerCase().includes('cloud hotel');
  const showStartHint = () => {
    const add = () => {
      if (document.getElementById('hotelServerHint')) return;
      const hint = document.createElement('aside');
      hint.id = 'hotelServerHint';
      hint.setAttribute('role', 'alert');
      hint.innerHTML = '<strong>Chưa mở đúng máy chủ khách sạn.</strong> Bấm <b>start-pos.bat</b> trong thư mục dự án để khởi chạy, sau đó dùng địa chỉ trang được mở tự động. Go Live ở cổng 5500 chỉ chạy tệp tĩnh nên QR, đăng nhập và dữ liệu phòng không hoạt động.';
      Object.assign(hint.style, { position: 'fixed', zIndex: '2147483647', inset: '12px 12px auto', padding: '16px 20px', borderRadius: '12px', background: '#fff3dc', color: '#53320d', boxShadow: '0 8px 28px #1d243322', font: '600 15px/1.5 system-ui, sans-serif' });
      (document.body || document.documentElement).prepend(hint);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add, { once: true }); else add();
  };

  async function probe(port) {
    const protocol = location.protocol === 'file:' ? 'http:' : location.protocol;
    const host = location.hostname || 'localhost';
    const origin = `${protocol}//${host}${port ? `:${port}` : ''}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 650);
      const response = await fetch(`${origin}/api/health`, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return null;
      const data = await response.json();
      return isServer(data) ? { origin, port: Number(data.port || port || 80) } : null;
    } catch (_) { return null; }
  }

  (async () => {
    // VS Code Live Server serves the files from port 5500 and returns an HTML
    // page for unknown /api paths. Browsers may block its cross-port health
    // probe, so send that known static-server URL straight to the hotel app.
    if (location.protocol !== 'file:' && location.port === '5500') {
      const pathParts = location.pathname.split('/').filter(Boolean);
      let pageName = pathParts.pop() || 'home.html';
      if (pageName === 'index.html' && pathParts.at(-1) === 'qrcodes') pageName = 'letan.html';
      if (pageName === 'qrcodes') pageName = 'letan.html';
      if (!pageName.endsWith('.html')) pageName = 'home.html';
      location.replace(`${location.protocol}//${location.hostname}:3000/${pageName}${location.search}${location.hash}`);
      return;
    }
    const current = location.protocol !== 'file:' ? await probe(location.port || '') : null;
    if (current) return;
    const candidates = await Promise.all(Array.from({ length: 11 }, (_, index) => 3010 - index)
      .filter(port => String(port) !== location.port)
      .map(port => probe(String(port))));
    const server = candidates.find(Boolean);
    if (server) {
      const pathParts = location.pathname.split('/').filter(Boolean);
      let pageName = pathParts.pop() || 'home.html';
      if (pageName === 'index.html' && pathParts.at(-1) === 'qrcodes') pageName = 'letan.html';
      if (pageName === 'qrcodes') pageName = 'letan.html';
      if (!pageName.endsWith('.html')) pageName = 'home.html';
      location.replace(`${server.origin}/${pageName}${location.search}${location.hash}`);
      return;
    }
    showStartHint();
  })();
})();
