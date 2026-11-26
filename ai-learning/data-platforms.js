/* Học sử dụng AI – dữ liệu các nền tảng AI (DỮ LIỆU MẪU: 3 nền tảng + 6 dòng tính năng).
   Quy tắc khi thêm / sửa:
   - Mỗi nền tảng có id cố định (không đổi sau khi phát hành). lastUpdated = ngày kiểm tra lại thông tin (YYYY-MM-DD).
   - Gói free, giới hạn, giá, tên mô hình thay đổi rất nhanh → ghi chung chung, luôn dẫn người học tới trang chính thức (url).
   - FEATURE_MAP: mỗi dòng 1 tính năng; cột = id nền tảng (chatgpt, gemini, claude, copilot, perplexity).
     Ô chưa chắc chắn ghi "Cần kiểm tra" thay vì đoán.
   - Repo public: chỉ thông tin công khai, không dữ liệu nội bộ / khóa API. */
const PLATFORMS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    company: "OpenAI",
    strengths: [
      "Đa dụng: hỏi đáp, viết, dịch, phân tích file, tạo ảnh trong cùng một ứng dụng",
      "Hệ tính năng và tích hợp rộng",
      "Rất phổ biến nên dễ tìm hướng dẫn và ví dụ từ cộng đồng"
    ],
    bestFor: ["Việc hằng ngày đa dạng", "Soạn thảo và chỉnh văn bản", "Phân tích file, bảng số liệu", "Học cách dùng AI lần đầu"],
    freeTier: "Có gói miễn phí với giới hạn về số lượt dùng và mô hình; chi tiết thay đổi theo thời điểm – xem trang chính thức.",
    url: "https://chatgpt.com/",
    lastUpdated: "2026-11-26"
  },
  {
    id: "gemini",
    name: "Gemini",
    company: "Google",
    strengths: [
      "Gắn với hệ sinh thái Google (Gmail, Docs, Drive, Android) khi tài khoản cho phép",
      "Xử lý nhiều loại đầu vào: văn bản, ảnh, âm thanh, video",
      "Tận dụng Google Search để tra cứu thông tin mới"
    ],
    bestFor: ["Người dùng nhiều dịch vụ Google", "Tra cứu và tổng hợp thông tin", "Làm việc với ảnh / tài liệu đa phương tiện"],
    freeTier: "Có gói miễn phí với giới hạn sử dụng; tính năng nâng cao thường nằm ở gói trả phí – xem trang chính thức.",
    url: "https://gemini.google.com/",
    lastUpdated: "2026-11-26"
  },
  {
    id: "claude",
    name: "Claude",
    company: "Anthropic",
    strengths: [
      "Đọc và viết văn bản dài, giọng văn tự nhiên",
      "Mạnh ở lập trình, phân tích tài liệu và lập luận nhiều bước",
      "Thường giải thích rõ cách suy luận và nói ra khi không chắc chắn"
    ],
    bestFor: ["Tóm tắt / đối chiếu tài liệu dài", "Viết báo cáo, email cần giọng văn mạch lạc", "Hỗ trợ lập trình"],
    freeTier: "Có gói miễn phí với giới hạn sử dụng; gói trả phí mở rộng giới hạn và tính năng – xem trang chính thức.",
    url: "https://claude.ai/",
    lastUpdated: "2026-11-26"
  }
];

const FEATURE_MAP = [
  { feature: "Hỏi đáp / trò chuyện", description: "Đặt câu hỏi bằng ngôn ngữ tự nhiên, hỏi tiếp trong cùng cuộc trò chuyện.",
    chatgpt: "Có", gemini: "Có", claude: "Có", copilot: "Có", perplexity: "Có" },
  { feature: "Tìm kiếm web có trích nguồn", description: "AI tra web và đưa link nguồn để bạn kiểm tra lại.",
    chatgpt: "Có", gemini: "Có", claude: "Có (tùy gói / vùng)", copilot: "Có", perplexity: "Có (trọng tâm của ứng dụng)" },
  { feature: "Tải file / tài liệu lên để phân tích", description: "Đưa PDF, Word, bảng tính cho AI đọc, tóm tắt, hỏi đáp. Dung lượng cho phép khác nhau theo gói.",
    chatgpt: "Có", gemini: "Có", claude: "Có", copilot: "Có", perplexity: "Có" },
  { feature: "Tạo ảnh từ mô tả", description: "Gõ mô tả, AI vẽ ra ảnh mới.",
    chatgpt: "Có", gemini: "Có", claude: "Không (chỉ đọc / hiểu ảnh)", copilot: "Có", perplexity: "Tùy gói" },
  { feature: "Ghi nhớ thông tin giữa các cuộc trò chuyện", description: "AI nhớ sở thích, ngữ cảnh của bạn cho lần sau. Thường có thể tắt trong cài đặt.",
    chatgpt: "Có (tùy gói)", gemini: "Có (tùy gói)", claude: "Có (tùy gói)", copilot: "Cần kiểm tra", perplexity: "Cần kiểm tra" },
  { feature: "Tích hợp ứng dụng văn phòng", description: "Dùng AI ngay trong email, tài liệu, bảng tính.",
    chatgpt: "Một số kết nối ngoài", gemini: "Google Workspace", claude: "Một số kết nối ngoài", copilot: "Microsoft 365", perplexity: "Hạn chế" }
];
