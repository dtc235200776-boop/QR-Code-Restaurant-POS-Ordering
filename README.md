# QR-Code Restaurant POS - Cloudflare Pages

Hệ thống Gọi món tại bàn bằng mã QR (Mini Project môn Điện toán đám mây).

## 🚀 Thành phần Hệ thống

1. **`index.html` & `app.js`**: Màn hình dành cho Khách hàng. Tự động nhận diện bàn từ mã QR (`?table=01`), hiển thị menu, giỏ hàng và gửi order.
2. **`kitchen.html` & `kitchen.js`**: Màn hình dành cho Quầy Bếp / Thu ngân (KDS). Nhận thông báo đơn hàng thời gian thực, có âm thanh chuông báo, thống kê doanh thu và xác nhận hoàn thành món.
3. **`_headers`**: File cấu hình Đám mây Cloudflare Pages, tối ưu hóa bộ nhớ đệm Edge Cache và thiết lập tiêu chuẩn bảo mật.
4. **`qrcodes/index.html`**: Trang in sẵn thẻ mã QR cho từng bàn (Bàn 01 đến Bàn 06) để in ra giấy phục vụ buổi Demo.

---

## 💻 Cách Chạy và Kiểm thử trên Máy tính (Local)

1. Trong **VS Code**, mở file `index.html`.
2. Chuột phải vào `index.html` chọn **Open with Live Server** (hoặc mở trực tiếp file `index.html` bằng trình duyệt Chrome/Edge).
3. Mở thêm 1 tab nữa chạy `kitchen.html` đặt cạnh bên:
   - Thử bấm gọi món ở tab `index.html`.
   - Ngay lập tức tab `kitchen.html` sẽ phát chuông "ting ting" và hiển thị đơn hàng của bàn đó!
