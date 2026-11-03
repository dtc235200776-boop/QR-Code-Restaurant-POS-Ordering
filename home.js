const form = document.getElementById('bookingForm');
const resultBox = document.getElementById('bookingResult');
const checkIn = document.getElementById('checkIn');
const checkOut = document.getElementById('checkOut');
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
    resultBox.textContent = `Đã gửi yêu cầu ${data.reservation.id} cho ${data.reservation.checkIn} – ${data.reservation.checkOut}, ${data.reservation.guests} khách. Tiếp tân sẽ xác nhận qua số ${data.reservation.phone}. Yêu cầu đang chờ xác nhận, chưa phải đặt phòng hoàn tất.`;
    form.reset(); checkIn.value = localDate(0); checkOut.value = localDate(1); form.querySelector('[name="guests"]').value = '2';
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    button.disabled = false; button.innerHTML = 'Gửi yêu cầu <span>→</span>';
  }
});
