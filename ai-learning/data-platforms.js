/* Học sử dụng AI – dữ liệu các nền tảng AI (8 nền tảng + 8 dòng tính năng tương đương).
   Quy tắc khi thêm / sửa:
   - Mỗi nền tảng có id cố định (không đổi sau khi phát hành). lastUpdated = tháng kiểm tra lại thông tin (YYYY-MM hoặc YYYY-MM-DD).
   - Gói free, giới hạn, giá, tên mô hình thay đổi rất nhanh → ghi chung chung, luôn dẫn người học tới trang chính thức (url).
   - FEATURE_MAP: mỗi dòng 1 tính năng; mỗi cột = id một nền tảng trong PLATFORMS (bảng tự lấy cột theo thứ tự PLATFORMS).
     Ô chưa chắc chắn ghi "Kiểm tra lại" thay vì đoán. Tên tính năng giữ nguyên tiếng Anh như trong app.
   - color: màu nhận diện nhẹ của thẻ (#rrggbb, chỉ dùng màu, không dùng logo); không có thì thẻ dùng màu xám.
   - Nội dung trung lập, không xếp hạng hãng nào hơn hãng nào.
   - Repo public: chỉ thông tin công khai, không dữ liệu nội bộ / khóa API. */
const FREE_NOTE = " Kiểm tra lại trên trang chính thức.";

const PLATFORMS = [
  {
    id: "chatgpt",
    color: "#10a37f",
    name: "ChatGPT",
    company: "OpenAI",
    strengths: [
      "Trợ lý đa năng: hỏi đáp, viết, dịch, phân tích file, tạo ảnh trong cùng một ứng dụng",
      "Nhiều tính năng mở rộng: AI tùy chỉnh, nghiên cứu sâu, vùng soạn thảo, giọng nói",
      "Rất phổ biến nên dễ tìm hướng dẫn và ví dụ từ cộng đồng"
    ],
    bestFor: ["Việc hằng ngày đa dạng", "Soạn thảo và chỉnh văn bản", "Phân tích file, bảng số liệu", "Người mới bắt đầu"],
    freeTier: "Có gói miễn phí, giới hạn số lượt dùng và tính năng; gói trả phí mở rộng giới hạn." + FREE_NOTE,
    url: "https://chatgpt.com/",
    lastUpdated: "2026-11"
  },
  {
    id: "gemini",
    color: "#4285f4",
    name: "Gemini",
    company: "Google",
    strengths: [
      "Gắn với hệ sinh thái Google: Search, Gmail, Docs, Drive, Android (tùy tài khoản)",
      "Xử lý nhiều loại đầu vào: văn bản, ảnh, âm thanh, video",
      "Có AI tùy chỉnh (Gems), nghiên cứu sâu, Canvas, trò chuyện giọng nói"
    ],
    bestFor: ["Người dùng nhiều dịch vụ Google", "Tra cứu và tổng hợp thông tin", "Làm việc với ảnh / video / tài liệu"],
    freeTier: "Có gói miễn phí với giới hạn sử dụng; tính năng nâng cao thường nằm ở gói trả phí hoặc gói Google Workspace." + FREE_NOTE,
    url: "https://gemini.google.com/",
    lastUpdated: "2026-11"
  },
  {
    id: "claude",
    color: "#d97757",
    name: "Claude",
    company: "Anthropic",
    strengths: [
      "Đọc và viết văn bản dài, giọng văn tự nhiên, mạch lạc",
      "Mạnh ở lập trình, phân tích tài liệu và lập luận nhiều bước",
      "Có Projects (lưu tài liệu + hướng dẫn) và Artifacts (vùng tạo tài liệu / code / trang nhỏ)"
    ],
    bestFor: ["Tóm tắt, đối chiếu tài liệu dài", "Viết báo cáo, email cần mạch lạc", "Hỗ trợ lập trình"],
    freeTier: "Có gói miễn phí với giới hạn sử dụng; gói trả phí mở rộng giới hạn và tính năng." + FREE_NOTE,
    url: "https://claude.ai/",
    lastUpdated: "2026-11"
  },
  {
    id: "copilot",
    color: "#db2777",
    name: "Microsoft Copilot",
    company: "Microsoft",
    strengths: [
      "Có sẵn trong Windows, trình duyệt Edge và ứng dụng di động",
      "Bản dành cho công việc gắn với Microsoft 365: Word, Excel, PowerPoint, Outlook, Teams (tùy gói công ty)",
      "Tìm web kèm nguồn, tạo ảnh, trò chuyện giọng nói"
    ],
    bestFor: ["Công ty dùng Microsoft 365", "Soạn thảo ngay trong Word / Outlook", "Tóm tắt cuộc họp Teams, email (bản công việc)"],
    freeTier: "Bản cá nhân có thể dùng miễn phí với giới hạn; Copilot trong Microsoft 365 cho công việc thường cần giấy phép riêng." + FREE_NOTE,
    url: "https://copilot.microsoft.com/",
    lastUpdated: "2026-11"
  },
  {
    id: "perplexity",
    color: "#0891b2",
    name: "Perplexity",
    company: "Perplexity AI",
    strengths: [
      "Xoay quanh tìm kiếm: trả lời kèm danh sách nguồn trích dẫn",
      "Dễ mở nguồn ra kiểm tra lại",
      "Có chế độ nghiên cứu nhiều nguồn và không gian lưu chủ đề (Spaces)"
    ],
    bestFor: ["Tra cứu thông tin mới", "Tìm và so sánh nguồn", "Câu hỏi cần trích dẫn"],
    freeTier: "Có gói miễn phí cho tìm kiếm cơ bản, giới hạn số lượt dùng chế độ nâng cao." + FREE_NOTE,
    url: "https://www.perplexity.ai/",
    lastUpdated: "2026-11"
  },
  {
    id: "deepseek",
    color: "#4f46e5",
    name: "DeepSeek",
    company: "DeepSeek (Trung Quốc)",
    strengths: [
      "Trợ lý chat đa năng, có chế độ suy luận nhiều bước",
      "Công ty công bố nhiều mô hình dạng mở (open-weight) cho cộng đồng",
      "Mạnh ở toán, lập trình và giải thích từng bước"
    ],
    bestFor: ["Giải thích, giải bài toán từng bước", "Hỗ trợ lập trình", "Hỏi đáp chung với dữ liệu công khai"],
    freeTier: "Ứng dụng chat có thể dùng miễn phí với giới hạn. Đọc kỹ chính sách quyền riêng tư (nơi lưu dữ liệu) trước khi dùng cho việc công ty." + FREE_NOTE,
    url: "https://www.deepseek.com/",
    lastUpdated: "2026-11"
  },
  {
    id: "notebooklm",
    color: "#f59e0b",
    name: "NotebookLM",
    company: "Google",
    strengths: [
      "Trả lời dựa trên tài liệu bạn tải lên, chỉ ra đoạn nguồn trong tài liệu",
      "Tạo tóm tắt dạng nghe (Audio Overview), sơ đồ tư duy, câu hỏi ôn tập",
      "Mỗi notebook là một bộ tài liệu riêng theo chủ đề"
    ],
    bestFor: ["Học và ôn tập từ tài liệu", "Hỏi đáp trên quy trình, hướng dẫn, báo cáo", "Tóm tắt nhiều tài liệu cùng chủ đề"],
    freeTier: "Có gói miễn phí giới hạn số notebook và số nguồn; gói trả phí mở rộng giới hạn." + FREE_NOTE,
    url: "https://notebooklm.google.com/",
    lastUpdated: "2026-11"
  },
  {
    id: "grok",
    color: "#64748b",
    name: "Grok",
    company: "xAI",
    strengths: [
      "Trợ lý chat có tìm kiếm web và nội dung trên mạng xã hội X",
      "Có chế độ tìm kiếm / nghiên cứu nhiều nguồn và tạo ảnh",
      "Dùng được trên web, ứng dụng riêng và trong X"
    ],
    bestFor: ["Theo dõi chủ đề đang được bàn trên mạng xã hội", "Hỏi đáp chung", "Tạo ảnh minh họa"],
    freeTier: "Có thể dùng miễn phí với giới hạn; gói trả phí mở rộng giới hạn và tính năng." + FREE_NOTE,
    url: "https://grok.com/",
    lastUpdated: "2026-11"
  }
];

const FEATURE_MAP = [
  { feature: "AI tùy chỉnh", description: "Lưu sẵn hướng dẫn + tài liệu thành một trợ lý / không gian riêng để dùng lại nhiều lần.",
    chatgpt: "Custom GPTs, Projects", gemini: "Gems", claude: "Projects", copilot: "Kiểm tra lại", perplexity: "Spaces",
    deepseek: "Kiểm tra lại", notebooklm: "Mỗi notebook là một bộ tài liệu riêng", grok: "Kiểm tra lại" },
  { feature: "Nghiên cứu sâu", description: "AI tự tìm, đọc nhiều nguồn rồi viết báo cáo có trích dẫn; chạy lâu hơn câu trả lời thường.",
    chatgpt: "Deep research", gemini: "Deep Research", claude: "Research", copilot: "Kiểm tra lại", perplexity: "Research / Deep Research",
    deepseek: "Kiểm tra lại", notebooklm: "Kiểm tra lại", grok: "DeepSearch" },
  { feature: "Vùng soạn thảo", description: "Khung riêng cạnh cuộc chat để viết, sửa tài liệu hoặc code cùng AI.",
    chatgpt: "Canvas", gemini: "Canvas", claude: "Artifacts", copilot: "Pages", perplexity: "Kiểm tra lại",
    deepseek: "Kiểm tra lại", notebooklm: "Kiểm tra lại", grok: "Kiểm tra lại" },
  { feature: "Bộ nhớ", description: "AI ghi nhớ thông tin, sở thích của bạn giữa các cuộc chat. Thường xem / tắt được trong cài đặt.",
    chatgpt: "Có (Memory)", gemini: "Có (tùy gói / vùng)", claude: "Có (tùy gói)", copilot: "Kiểm tra lại", perplexity: "Kiểm tra lại",
    deepseek: "Kiểm tra lại", notebooklm: "Kiểm tra lại", grok: "Kiểm tra lại" },
  { feature: "Upload file", description: "Gửi PDF, Word, bảng tính, ảnh cho AI đọc. Loại file và dung lượng khác nhau theo gói.",
    chatgpt: "Có", gemini: "Có", claude: "Có", copilot: "Có", perplexity: "Có",
    deepseek: "Có", notebooklm: "Có (tính năng chính)", grok: "Có" },
  { feature: "Tạo ảnh", description: "Gõ mô tả, AI vẽ ra ảnh mới.",
    chatgpt: "Có", gemini: "Có", claude: "Không (chỉ đọc / hiểu ảnh)", copilot: "Có", perplexity: "Có (tùy gói)",
    deepseek: "Kiểm tra lại", notebooklm: "Không (có sơ đồ tư duy, Audio Overview)", grok: "Có" },
  { feature: "Tìm web", description: "AI tra thông tin mới trên internet và đưa nguồn để bạn kiểm tra.",
    chatgpt: "Có", gemini: "Có", claude: "Có (tùy gói / vùng)", copilot: "Có", perplexity: "Có (trọng tâm của ứng dụng)",
    deepseek: "Có", notebooklm: "Tìm nguồn web để thêm vào notebook", grok: "Có (web và X)" },
  { feature: "Giọng nói", description: "Nói chuyện với AI bằng giọng nói thay vì gõ.",
    chatgpt: "Có", gemini: "Có (Gemini Live)", claude: "Có (tùy app / vùng)", copilot: "Có", perplexity: "Có (trên app)",
    deepseek: "Kiểm tra lại", notebooklm: "Nghe Audio Overview (tóm tắt dạng podcast)", grok: "Có" }
];
