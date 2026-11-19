# Google Sheet – các tab

Chuyển từ `CLAUDE.md` nguyên văn (chỉ đổi chỗ, không bỏ thông tin). Quy tắc bắt buộc vẫn ở `CLAUDE.md`.

- Tài khoản: Tên đăng nhập | Mật khẩu (SHA-256 + SALT) | Họ tên | Quyền (Viewer = chỉ xem, khác = sửa) |
  Trạng thái (Khóa / Chờ duyệt = chặn) → KHÔNG bao giờ gửi tab này về trình duyệt
- Lịch sử (tự tạo): Thời gian | Người sửa | Tab | TTi model | Dòng | Cột | Giá trị cũ | Giá trị mới
- Cá nhân (tự tạo, chỉ chủ tài khoản đọc được): Tên đăng nhập | Khóa | Dữ liệu (JSON) | Cập nhật
- Phỏng vấn (tự tạo, chỉ Admin đọc / ghi qua iv_data / iv_save): ID | Loại | Nhóm | Tiêu đề | Dữ liệu (JSON) | Cập nhật
- Tu luyện (tự tạo): Thời gian | Tên đăng nhập | Họ tên | Cảnh giới | Bí kíp | Bài làm | Trạng thái (Chờ duyệt / Đã duyệt /
  Trả lại) | Người duyệt | Nhận xét | Cập nhật – chỉ máy chủ ghi; người học không tự duyệt được
- Cài đặt: Khóa | Giá trị (address; links dạng JSON)
- Thư viện: ID | Chủ đề | Tiêu đề | Tóm tắt | Nội dung | Câu hỏi | Tác giả | Cập nhật
  (Nội dung: "## tiêu đề", "- ý", "1. bước", "**đậm**"; Câu hỏi: câu hỏi, "- sai", "* đúng", cách nhau 1 dòng trống)
- English: Loại (word/idiom/phrasal/phrase/mistake) | Từ / câu | Từ loại | Nghĩa (EN) | Tiếng Việt | Ví dụ | Ghi chú
  (mistake: Từ / câu = câu sai, Ví dụ = câu đúng, Nghĩa (EN) = giải thích; phrase: Ghi chú = ngữ cảnh)
- Chinese: Loại (word/phrase) | Chữ Hán | Pinyin | Từ loại | Nghĩa (EN) | Tiếng Việt | Ví dụ (Hán) | Ví dụ pinyin |
  Ví dụ EN | Ví dụ VI | Ngữ cảnh
- Các tab NPD cũ (Model, Timeline, SER…) có thể còn trong Sheet nhưng không còn được gửi về trình duyệt
