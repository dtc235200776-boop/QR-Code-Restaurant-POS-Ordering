# Cloud Kitchen POS

Web app gọi món QR gồm ba khu vực dùng chung một máy chủ: giao diện khách hàng, màn hình bếp và thu ngân. Máy chủ dùng Node.js tích hợp sẵn, lưu dữ liệu menu/đơn trong `data.json` và phát cập nhật trực tiếp bằng Server-Sent Events.

## Chạy trên máy tính và điện thoại cùng mạng Wi-Fi

1. Cài Node.js 18 trở lên trên máy chủ (máy đang mở thư mục Project Cloud).
2. Cách nhanh: nhấp đúp `start-pos.bat`. File sẽ mở cửa sổ máy chủ Node và mở trang khách. Hoặc mở terminal tại thư mục này và chạy `npm start` (hoặc `node server.js`). API/server lắng nghe trên cổng 3000.
3. Cách gọn nhất: trên máy chủ mở `http://localhost:3000`. Điện thoại/bếp/thu ngân mở `http://<IP-máy-chủ>:3000` trên cùng Wi-Fi. Cho phép Node.js qua firewall của mạng riêng nếu Windows hỏi.
4. Nếu mở nhầm bằng Live Server cổng 5500, các trang tự chuyển sang cổng 3000 để dùng cùng origin với API. Hãy giữ Node server chạy và dùng cùng hostname/IP trên mọi thiết bị.
5. Đăng nhập nhân viên, mở **In QR bàn** từ màn hình bếp hoặc thu ngân. Trang QR tự điền IP mạng LAN của máy chạy POS; kiểm tra lại địa chỉ trước khi in. Mỗi mã được gắn đúng bàn từ 01 đến 12. Khách không có QR sẽ chỉ xem được menu; trang không tự gán Bàn 01.
6. Trang bếp và thu ngân yêu cầu mã nhân viên. Mã demo mặc định là `246810`; trước khi mở mạng công cộng hãy đặt biến môi trường `STAFF_PIN` thành mã riêng.

Live Server chỉ phục vụ giao diện; API và kho đơn dùng chung do Node server ở cổng 3000 cung cấp. Nếu thấy `ERR_CONNECTION_REFUSED`, máy chủ chưa chạy: mở lại `start-pos.bat` và giữ cửa sổ Cloud POS Server đang mở. Có thể kiểm tra máy chủ tại `http://localhost:3000/api/health`.

## Kịch bản thao tác

1. Khách quét QR, chọn món ăn và đồ uống, chỉnh số lượng, thêm ghi chú từng món và gửi đơn.
2. Phiếu món ăn xuất hiện riêng tại **Bếp nóng**; đồ uống xuất hiện riêng tại **Quầy pha chế**. Mỗi khu tự chuyển Chờ thực hiện → Đang chế biến → Sẵn sàng.
3. Thu ngân thấy cập nhật trực tiếp, bàn và hóa đơn. Giá ưu đãi theo món tự tính; có thể nhập voucher `WELCOME10` (10%, tối đa 30.000đ) hoặc `COMBO20` (giảm 20.000đ khi hóa đơn từ 120.000đ).
4. Khách xem trạng thái và in bill; thu ngân chỉ thanh toán sau khi cả hai khu hoàn tất và có thể in hóa đơn đã thanh toán.

## Bảo vệ dữ liệu và giới hạn

- Khách chỉ dùng trang gọi món, chỉ đọc đơn của bàn gắn trong URL. Trang nhân viên được bảo vệ bằng session cookie HttpOnly và mã PIN.
- Menu, giá giảm, đơn hàng, voucher, trạng thái bếp và thanh toán được xác thực/tính ở server; trình duyệt không còn dùng `localStorage` làm nguồn dữ liệu chung. Sao lưu `data.json` định kỳ.
- Đây là backend demo nội bộ chạy trên một máy và một mạng LAN; dữ liệu lưu trong file JSON, phiên đăng nhập nằm trong bộ nhớ. Chưa có Supabase/PostgreSQL, JWT/RLS, quản lý nhân viên nhiều vai trò, backup tự động, hay triển khai Internet/HTTPS. Trước khi chạy thật cần thay JSON bằng cơ sở dữ liệu, cấu hình auth/phân quyền và bật HTTPS.
- Khi triển khai Cloudflare Pages/Render/Vercel, cần deploy server riêng hoặc chuyển API/SSE sang dịch vụ backend phù hợp; file JSON local không phải kho dữ liệu cloud bền vững.
