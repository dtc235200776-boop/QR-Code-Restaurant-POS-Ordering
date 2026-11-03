const form = document.getElementById('bookingForm');
const resultBox = document.getElementById('bookingResult');
const checkIn = document.getElementById('checkIn');
const checkOut = document.getElementById('checkOut');
const staffPortalReturn = document.getElementById('staffPortalReturn');
fetch('/api/session', { credentials: 'include', cache: 'no-store' })
  .then(response => response.ok ? response.json() : { staff: false })
  .then(session => { if (staffPortalReturn) staffPortalReturn.hidden = !session.staff; })
  .catch(() => { if (staffPortalReturn) staffPortalReturn.hidden = true; });
const localDate = offset => {
  const date = new Date(); date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
checkIn.min = localDate(0);
checkOut.min = localDate(1);
checkIn.value = localDate(0);
checkOut.value = localDate(1);
checkIn.addEventListener('change', () => {
  const nextDay = new Date(`${checkIn.value}T00:00:00`); nextDay.setDate(nextDay.getDate() + 1);
  const minimum = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
  checkOut.min = minimum;
  if (checkOut.value < minimum) checkOut.value = minimum;
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = 'Đang gửi…'; resultBox.hidden = false; resultBox.textContent = 'Đang kiểm tra phòng và gửi yêu cầu tới tiếp tân…';
  const fields = new FormData(form);
  try {
    const response = await fetch('/api/reservations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fields.entries()))
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Chưa gửi được yêu cầu. Vui lòng thử lại.');
    const reservation = data.reservation;
    const qrPayload = `${location.origin}/home.html?booking=${encodeURIComponent(reservation.id)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=png&data=${encodeURIComponent(qrPayload)}`;
    resultBox.innerHTML = `<div class="booking-success"><div><strong>Đã nhận yêu cầu ${escapeBookingText(reservation.id)}</strong><p>Tiếp tân sẽ xác nhận qua số ${escapeBookingText(reservation.phone)}. Trạng thái: <b>Đang chờ xác nhận</b>. Yêu cầu chưa phải đặt phòng đã được xác nhận.</p><p>${escapeBookingText(reservation.roomTypeLabel)} · ${escapeBookingText(reservation.checkIn)} – ${escapeBookingText(reservation.checkOut)}</p></div><div class="booking-qr"><img src="${qrUrl}" alt="Mã QR tra cứu booking ${escapeBookingText(reservation.id)}"><a class="button-wood" href="${qrUrl}" download="${escapeBookingText(reservation.id)}.png">Tải mã QR</a></div></div>`;
    resultBox.querySelector('.booking-qr a').addEventListener('click', async event => {
      event.preventDefault();
      try {
        const qrResponse = await fetch(qrUrl);
        if (!qrResponse.ok) throw new Error('QR download unavailable');
        const blobUrl = URL.createObjectURL(await qrResponse.blob());
        const download = document.createElement('a'); download.href = blobUrl; download.download = `${reservation.id}.png`; download.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (_) { window.open(qrUrl, '_blank', 'noopener'); }
    });
    form.reset(); checkIn.value = localDate(0); checkOut.value = localDate(1); form.querySelector('[name="guests"]').value = '2';
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    button.disabled = false; button.innerHTML = 'Gửi yêu cầu <span>→</span>';
  }
});

const bookingId = new URLSearchParams(location.search).get('booking');
if (bookingId) {
  resultBox.hidden = false;
  resultBox.textContent = `Đang tra cứu đặt phòng ${bookingId}…`;
  fetch(`/api/reservations/${encodeURIComponent(bookingId)}`)
    .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Không tìm thấy đặt phòng.'); return data.reservation; })
    .then(reservation => { resultBox.textContent = `Booking ${reservation.id} · ${reservation.statusLabel} · ${reservation.roomTypeLabel} · ${reservation.checkIn} – ${reservation.checkOut}.`; document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); })
    .catch(error => { resultBox.textContent = error.message; });
}

function escapeBookingText(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
