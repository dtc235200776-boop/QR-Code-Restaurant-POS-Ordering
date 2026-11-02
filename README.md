# Grand Cloud Hotel & Resort - Hệ Thống Dịch Vụ Phòng Thông Minh Qua Mã QR

Dự án Web App chuyển đổi số dịch vụ lưu trú khách sạn & homestay thông minh. Hệ thống gồm 3 phân hệ hoạt động thời gian thực sử dụng Node.js:
1. **Cổng dịch vụ phòng dành cho khách lưu trú:** Quét mã QR tại phòng (Phòng 101 - 112) để gọi dịch vụ buồng phòng (dọn phòng, giặt ủi, mượn vật dụng, thuê xe) và ẩm thực tại phòng (In-Room Dining).
2. **Màn hình điều phối Buồng phòng & Phục vụ (Housekeeping & Room Service):** Tiếp nhận yêu cầu theo số phòng thời gian thực, điều phối nhân viên thực hiện.
3. **Màn hình Lễ tân & Quản lý (Front Desk & Billing):** Quản lý sơ đồ 12 phòng lưu trú, quyết toán hóa đơn dịch vụ khi khách check-out và thống kê doanh thu.

## Triển khai trên Điện toán đám mây (Cloud Deployment)
- Ứng dụng hỗ trợ triển khai trực tiếp trên nền tảng Cloud PaaS (Render.com) thông qua GitHub CI/CD tự động.
- Cung cấp kết nối thời gian thực qua Server-Sent Events (SSE).
- Mã PIN đăng nhập nhân viên mặc định: `246810`.
