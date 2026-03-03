Hãy đọc kỹ các yêu cầu dưới đây sau đó hãy fix sửa fe đúng chuẩn chỉnh với từng yêu cầu:
Với phần auth đăng ký/ đăng nhập,... hãy báo lỗi cụ thể tất cả các lỗi người dùng đang gặp phải, gợi ý:

- phần Đăng nhập:
  Báo lỗi cụ thể khi Đăng nhập bằng tài khoản bị vô hiệu hóa
  Báo lỗi cụ thể khi Đăng nhập sai quá 5 lần và khóa tk tạm thời
- phần Đăng ký:
  Số điện thoại phải đúng định dạng nếu không đúng báo lỗi
  Báo lỗi bắt buộc chọn giới tính
  Thông báo ảnh vượt quá dung lượng khi up cccd quá dung lượng
- phần Quên mật khẩu (hãy kiểm tra làm lại toàn bộ do deploy lên không chạy được phần này):
  Gửi email otp đặt lại mật khẩu với tk đã đăng ký hợp lệ
  Báo lỗi cụ thể khi quên mk với email chưa đăng ký tài khoản và email sai định dạng
  Báo lỗi cụ thể khi: Nhập OTP sai, Nhập OTP hết hạn, Bỏ trống OTP, Nhập OTP sai quá 3 lần
  Báo lỗi cụ thể khi: Đặt lại mật khẩu mới trùng mật khẩu cũ, Đăng nhập lại bằng mật khẩu cũ
- phần Cài đặt:
  Chỉ để lại 2 tab là quyền riêng tư và bảo mật
- phần Gợi ý kết nối (user chưa có số lượng nón để lọc):
  Hiện thị danh sách user chung lĩnh vực
  Ấn vào kết nối hiển thị thông báo để người dùng biết đã gửi kết nối
  Tìm kiếm user có chung lĩnh vực
  Ẩn user khi bấm bỏ qua
