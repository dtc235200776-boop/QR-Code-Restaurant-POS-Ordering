# Grand Cloud Hotel · Hệ thống dịch vụ phòng bằng QR

## Chạy từ VS Code

**Không dùng nút Go Live / Live Server** để vận hành. Go Live chỉ phục vụ tệp HTML ở cổng 5500, không chạy API đăng nhập, phòng, đặt món hay dữ liệu dùng chung. Mở dự án này trong VS Code, chạy `start-pos.bat` ở Explorer hoặc chọn **Terminal → Run Task → Khách sạn: Chạy ứng dụng**. Ứng dụng tự chọn cổng 3000–3010 nếu cổng trước đang bận và mở trang chủ. Có thể chạy `npm start` trong terminal; mở đúng địa chỉ được in trong cửa sổ máy chủ.

Nếu đang mở trang bằng cổng 5500, trang sẽ tự tìm máy chủ Node đang chạy rồi chuyển sang đúng địa chỉ. Nếu máy chủ chưa bật, trang sẽ hiện hướng dẫn khởi chạy.

## Các trang

- `home.html`: trang chủ khách sạn, tiện ích và gửi yêu cầu đặt phòng.
- `bo-phan.html`: cổng nội bộ để chọn bộ phận, đăng xuất và đổi tài khoản/bộ phận.
- `khach-hang.html`: thực đơn dịch vụ khách lưu trú mở từ QR. Mã QR có tham số `?room=101` để gắn yêu cầu đúng phòng.
- `index.html`: đường dẫn cũ, tự chuyển sang trang khách/QR.
- `letan.html`: tiếp tân xem phòng trống, nhận/trả khách, duyệt yêu cầu đặt phòng và tạo QR phòng.
- `thu-ngan.html`: thu ngân theo dõi dịch vụ đã hoàn tất, áp dụng ưu đãi và quyết toán hóa đơn.
- `van-hanh.html`: trang công việc chung có hai mục Bếp & Ẩm thực và Buồng phòng. Tài khoản bếp chỉ thấy mục bếp; tài khoản buồng phòng chỉ thấy mục buồng phòng; quản lý xem được cả hai.
- `bep.html` và `buongphong.html`: đường dẫn cũ, tự chuyển về đúng mục trong `van-hanh.html`.
- `manager.html`: quản lý xem doanh thu, sơ đồ phòng, tồn kho, việc cần xử lý và mở mọi bộ phận.

Tiếp tân và thu ngân là hai công việc/tài khoản riêng, cùng dùng dữ liệu phòng và hóa đơn. Lễ tân có thể xác nhận đã thu tiền dịch vụ rồi trả phòng; thu ngân cũng có thể quyết toán hóa đơn. Không thể trả phòng khi còn hóa đơn chưa thanh toán hoặc dịch vụ chưa hoàn tất. Bộ phận bếp/buồng phòng cập nhật phục vụ tại trang điều phối chung; quản lý xem báo cáo tổng hợp và cả hai mục vận hành.

Sau khi nhận phòng, lễ tân xem QR trong cửa sổ riêng. Bấm **Xong · quay lại sơ đồ phòng** để làm thủ tục khách kế tiếp. Trang QR dành cho khách không có nút đăng nhập nhân viên; dùng `bo-phan.html` để vào khu vực nội bộ.

## Tài khoản demo

| Bộ phận | Tài khoản | Mật khẩu |
| --- | --- | --- |
| Tiếp tân | `letan` | `123456` |
| Thu ngân | `thungan` | `123456` |
| Buồng phòng | `buongphong` | `123456` |
| Bếp | `bep` | `123456` |
| Quản lý | `quanly` | `123456` |

Các tài khoản demo dùng cố định đúng như bảng trên để biến môi trường cũ không làm sai mật khẩu. Đây là tài khoản mẫu cho đồ án trình diễn.

## In QR cho khách

Mở ứng dụng bằng địa chỉ Node, đăng nhập Tiếp tân, làm thủ tục nhận phòng rồi hệ thống tự cuộn tới và làm nổi bật mã QR đúng phòng để đưa khách quét. Với khách đã nhận phòng, nút **Hiện QR cho khách** mở lại mã đó; **Mở dịch vụ khách** kiểm tra trực tiếp liên kết có `?room=...`. Máy chủ và điện thoại cần cùng Wi‑Fi; điện thoại phải truy cập được địa chỉ LAN hiển thị trong QR. QR cũ trỏ tới IP/cổng Live Server trước đây cần được in lại. Mở thư mục `qrcodes` sẽ tự chuyển về trang lễ tân, không còn dùng danh sách tệp làm trang chính.
