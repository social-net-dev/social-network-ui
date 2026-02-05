tôi được giao làm phần Frontend Recommendation của dự án social-network này

Hãy đọc hết lại tất cả các file FE và BE để nắm rõ dự án này đang làm gì.

Sau đó dựa vào các thông tin dưới đây hãy viết giúp tôi file Recommendation-fe.md tổng hợp tất cả nội dung những gì tôi cần làm, phải làm những gì, làm ntn, liên kết với BE ra sao,..vv.vv

-Kết nối mạng lưới (Recommendation)

1. Mục tiêu
   Hình thành đồ thị mạng xã hội có cấu trúc, phản ánh mối quan hệ thật giữa các người dùng.
2. Loại kết nối
   Học sinh – học sinh
   Giáo viên – học sinh
   Giáo viên – giáo viên
3. Quy trình kết nối cá nhân
   Người dùng gửi yêu cầu kết nối.
   Bên nhận chấp nhận hoặc từ chối.
   Mối quan hệ được ghi nhận vào tầng dữ liệu chung.
4. Kết nối nhóm và mạng khởi tạo
   Quản trị viên tạo các node khởi tạo cho nhóm người dùng mới.
   Gán các mối quan hệ ban đầu.
   Mạng lưới mở rộng thông qua chứng thực chéo.

- QUY TRÌNH KẾT NỐI MẠNG LƯỚI (RECOMMENDATION / NETWORK CONNECTION)

1. Quy trình kết nối cá nhân
   Người dùng gửi yêu cầu kết nối
   Hệ thống ghi nhận yêu cầu và thông báo bên nhận
   Bên nhận chấp nhận kết nối
   Bên nhận từ chối kết nối
   Hệ thống ghi nhận mối quan hệ vào tầng dữ liệu chung
   Người dùng hủy kết nối (nếu cần)
2. Quy trình gợi ý kết nối theo mạng lưới
   Phân tích hồ sơ và hành vi (trường/đơn vị, vai trò, tương đồng)
   Tạo danh sách gợi ý kết nối (HS–HS, GV–HS, GV–GV)
   Hiển thị gợi ý kết nối trên giao diện người dùng
   Cập nhật gợi ý theo phản hồi và thay đổi mạng lưới
3. Kết nối nhóm và mạng khởi tạo
   Quản trị viên tạo các node khởi tạo cho nhóm người dùng mới
   Gán các mối quan hệ ban đầu theo cấu trúc tổ chức (trường/lớp/bộ môn)
   Đồng bộ các thay đổi mạng khởi tạo vào đồ thị mạng lưới
   Mạng lưới mở rộng thông qua chứng thực chéo và kết nối tự nhiên.
   .
   SPRINT – KẾT NỐI MẠNG LƯỚI
   Thời gian: 30/01/2026
   Module Chức năng chính Chức năng con Giải thích
   Mạng lưới Gợi ý kết nối Theo bối cảnh học tập Tạo mạng lưới học thuật
   Theo môn học Kết nối theo sở thích
   Quan hệ người dùng Theo dõi Một chiều
   Kết nối Hai chiều
   Nhóm Nhóm học tập Theo trường Cộng đồng
   Theo lớp Nhóm nhỏ
   Theo môn Học tập
   Đồ thị mạng Phân tích mạng lưới Kết nối chung Phân tích quan hệ

-danh mục chức năng:
SPRINT – KẾT NỐI & MẠNG LƯỚI
Module Chức năng chính Chức năng con Mục đích BA UXUI FE BE
Network Gợi ý kết nối Theo context / môn Kết nối đúng người Xác định logic Thiết kế list Hiển thị API gợi ý
Network Quan hệ Follow / Connect Tạo graph Xác định quan hệ Thiết kế trạng thái Xử lý action API follow
Group Group học tập Trường / lớp / môn Học tập chung Xác định rule Thiết kế UI CRUD group API group
