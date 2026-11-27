/* Học sử dụng AI – dữ liệu các nền tảng AI (8 nền tảng + 9 dòng tính năng tương đương).
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

// Tháng cập nhật bảng tính năng (hiện dưới bảng). Ô ghi chú trong ngoặc (...) hiện chữ nhỏ xám; ô bắt đầu bằng
// "Không" / "Chưa" / "Đã ngừng" hiện chữ xám nhạt kèm dấu —. Ô chưa chắc chắn: ghi "Kiểm tra lại" (hiện chưa có ô nào).
const FEATURE_UPDATED = "2026-11";
const FEATURE_MAP = [
  { feature: "AI tùy chỉnh / không gian dự án", description: "Lưu sẵn hướng dẫn + tài liệu thành một trợ lý / không gian riêng để dùng lại nhiều lần.",
    chatgpt: "Custom GPTs, Projects", gemini: "Gems", claude: "Projects", copilot: "Chưa có ở bản cá nhân", perplexity: "Spaces",
    deepseek: "Không có", notebooklm: "Mỗi Notebook (AI chỉ trả lời theo tài liệu của sổ)", grok: "Projects" },
  { feature: "Nghiên cứu sâu", description: "AI tự tìm, đọc nhiều nguồn rồi viết báo cáo có trích dẫn; chạy lâu hơn câu trả lời thường.",
    chatgpt: "Deep Research", gemini: "Deep Research", claude: "Research", copilot: "Đã ngừng (từ 18/8/2026)", perplexity: "Deep Research",
    deepseek: "Không có riêng (dùng DeepThink + Search)", notebooklm: "Fast Research / Deep Research", grok: "DeepSearch" },
  { feature: "Vùng soạn thảo", description: "Khung riêng cạnh cuộc chat để viết, sửa tài liệu hoặc code cùng AI.",
    chatgpt: "Canvas", gemini: "Canvas", claude: "Artifacts", copilot: "Pages", perplexity: "Labs / Pages (gần giống)",
    deepseek: "Không có", notebooklm: "Studio: báo cáo, slide, infographic (gần giống)", grok: "Grok Studio" },
  { feature: "Suy nghĩ sâu", description: "AI dành nhiều thời gian suy luận từng bước trước khi trả lời; hợp với bài toán và kế hoạch phức tạp, đổi lại trả lời chậm hơn.",
    chatgpt: "Chế độ Thinking", gemini: "Thinking", claude: "Extended thinking", copilot: "Think Deeper", perplexity: "Chọn model suy luận",
    deepseek: "DeepThink", notebooklm: "Không có nút riêng", grok: "Think" },
  { feature: "Bộ nhớ giữa các chat", description: "AI ghi nhớ thông tin, sở thích của bạn giữa các cuộc chat. Thường xem / tắt được trong cài đặt.",
    chatgpt: "Memory", gemini: "Có (cá nhân hóa)", claude: "Memory", copilot: "Memory", perplexity: "Memory",
    deepseek: "Chưa có", notebooklm: "Không (chỉ nhớ trong từng notebook)", grok: "Memory (tắt được)" },
  { feature: "Upload file", description: "Gửi PDF, Word, bảng tính, ảnh cho AI đọc. Loại file và dung lượng khác nhau theo gói.",
    chatgpt: "Có", gemini: "Có", claude: "Có", copilot: "Có", perplexity: "Có",
    deepseek: "Có (chủ yếu đọc chữ)", notebooklm: "Có – là tính năng chính (PDF, Docs, web, YouTube, audio)", grok: "Có" },
  { feature: "Tạo ảnh", description: "Gõ mô tả, AI vẽ ra ảnh mới.",
    chatgpt: "Có", gemini: "Có", claude: "Không (chỉ vẽ bằng code/SVG)", copilot: "Có", perplexity: "Có (tùy gói)",
    deepseek: "Không", notebooklm: "Chỉ infographic/slide", grok: "Grok Imagine (ảnh + video)" },
  { feature: "Tìm web", description: "AI tra thông tin mới trên internet và đưa nguồn để bạn kiểm tra.",
    chatgpt: "ChatGPT Search", gemini: "Có (Google Search)", claude: "Web search", copilot: "Copilot Search", perplexity: "Tính năng cốt lõi, luôn có nguồn",
    deepseek: "Nút Search", notebooklm: "Qua Fast/Deep Research", grok: "Có (web + X)" },
  { feature: "Giọng nói", description: "Nói chuyện với AI bằng giọng nói thay vì gõ.",
    chatgpt: "Voice Mode", gemini: "Gemini Live", claude: "Voice mode", copilot: "Copilot Voice", perplexity: "Voice Mode",
    deepseek: "Hạn chế", notebooklm: "Audio Overview (podcast)", grok: "Voice Mode" }
];

/* ---- "Tôi muốn làm gì? – Chọn AI theo việc" (tab Các nền tảng AI, đặt trên bảng tính năng) ----
   Mỗi việc: {id, icon, name, keywords[], picks:[{platform (id trong PLATFORMS), level: "Rất hợp" | "Hợp" | "Dùng được", reason (1 dòng)}],
   tips[], promptTemplate (tiếng Việt, chỗ trống dạng [ ... ]), warning? (cảnh báo riêng của việc đó)}.
   - picks theo thứ tự gợi ý (2–5 AI), trung lập, dựa trên tính năng; không ghi giá / giới hạn gói.
   - Ô tìm kiếm tìm trong name + keywords (không phân biệt dấu / hoa thường).
   - TASK_WARNING hiện cho mọi việc. Gợi ý chỉ mang tính tham khảo – cập nhật cùng FEATURE_MAP khi tính năng đổi. */
const TASK_WARNING = "Không dán thông tin mật, dữ liệu cá nhân vào AI.";
const TASK_GUIDE = [
  { id: "translate", icon: "🌐", name: "Dịch thuật",
    keywords: ["dịch", "dịch thuật", "translate", "translation", "tiếng anh", "tiếng trung", "tiếng việt", "ngoại ngữ", "song ngữ"],
    picks: [
      { platform: "chatgpt", level: "Rất hợp", reason: "Dịch tốt nhiều ngôn ngữ, chỉnh được văn phong theo yêu cầu." },
      { platform: "gemini", level: "Rất hợp", reason: "Dịch tốt nhiều ngôn ngữ, đọc được cả ảnh chứa chữ cần dịch." },
      { platform: "claude", level: "Rất hợp", reason: "Dịch mạch lạc, giữ giọng văn tự nhiên với văn bản dài." },
      { platform: "deepseek", level: "Hợp", reason: "Dùng được cho văn bản dài và có thể dùng miễn phí; chú ý chính sách dữ liệu." }
    ],
    tips: ["Nêu ngữ cảnh, người đọc, giọng văn và thuật ngữ cần giữ nguyên.", "Văn bản dài: dịch từng phần rồi nhờ AI rà lại tính nhất quán của thuật ngữ.", "Dịch quan trọng (hợp đồng, tài liệu kỹ thuật): nhờ người rành ngôn ngữ kiểm tra lại."],
    promptTemplate: "Hãy dịch đoạn văn dưới đây sang [ngôn ngữ đích].\nNgữ cảnh: [dùng để làm gì, ví dụ email gửi khách hàng]. Người đọc: [ai].\nGiọng văn: [trang trọng / thân thiện / trung tính].\nGiữ nguyên các thuật ngữ sau: [danh sách thuật ngữ].\n\n[đoạn văn cần dịch]" },
  { id: "grammar", icon: "✏️", name: "Sửa chính tả, ngữ pháp",
    keywords: ["chính tả", "ngữ pháp", "soát lỗi", "sửa lỗi", "proofread", "grammar", "spelling", "lỗi câu", "lỗi viết"],
    picks: [
      { platform: "chatgpt", level: "Rất hợp", reason: "Việc đơn giản, làm tốt với cả tiếng Việt và tiếng Anh." },
      { platform: "claude", level: "Rất hợp", reason: "Việc đơn giản, làm tốt và giải thích được vì sao sửa." },
      { platform: "gemini", level: "Rất hợp", reason: "Việc đơn giản, làm tốt – tiện nếu bạn đang dùng các app Google." }
    ],
    tips: ["Yêu cầu giữ nguyên ý, chỉ sửa lỗi – không viết lại cả đoạn.", "Nhờ liệt kê các lỗi đã sửa để bạn kiểm tra và rút kinh nghiệm.", "Tên riêng, số liệu: tự đọc lại vì AI có thể sửa nhầm."],
    promptTemplate: "Hãy soát lỗi chính tả và ngữ pháp trong đoạn văn dưới đây ([tiếng Việt / tiếng Anh]).\nGiữ nguyên ý và giọng văn, chỉ sửa lỗi. Sau đó liệt kê các lỗi đã sửa dưới dạng gạch đầu dòng.\n\n[đoạn văn]" },
  { id: "rewrite", icon: "🖋️", name: "Viết lại, chỉnh văn phong",
    keywords: ["viết lại", "văn phong", "giọng văn", "rewrite", "paraphrase", "diễn đạt", "chỉnh sửa", "rút gọn", "trang trọng", "chuyên nghiệp"],
    picks: [
      { platform: "claude", level: "Rất hợp", reason: "Artifacts: vùng soạn thảo riêng để sửa văn bản cùng AI." },
      { platform: "chatgpt", level: "Rất hợp", reason: "Canvas: sửa từng đoạn ngay trên bản nháp." },
      { platform: "gemini", level: "Hợp", reason: "Canvas: sửa từng đoạn ngay trên bản nháp." }
    ],
    tips: ["Nói rõ giọng văn: trang trọng / thân thiện / ngắn gọn.", "Chọn từng đoạn để sửa trong vùng soạn thảo thay vì viết lại cả bài.", "Đưa 1–2 câu mẫu theo giọng văn bạn thích."],
    promptTemplate: "Hãy viết lại đoạn văn dưới đây theo giọng [trang trọng / thân thiện / ngắn gọn], dành cho [người đọc].\nGiữ nguyên ý chính và các số liệu. Độ dài khoảng [số từ] từ.\nĐưa 2 phương án để tôi chọn.\n\n[đoạn văn]" },
  { id: "email", icon: "📧", name: "Viết email, văn bản mới",
    keywords: ["email", "thư", "soạn thảo", "thông báo", "văn bản", "báo cáo", "viết thư", "soạn email", "mail", "công văn"],
    picks: [
      { platform: "chatgpt", level: "Rất hợp", reason: "Soạn thảo linh hoạt, đổi giọng văn theo yêu cầu." },
      { platform: "claude", level: "Rất hợp", reason: "Văn bản mạch lạc, giọng văn tự nhiên." },
      { platform: "gemini", level: "Hợp", reason: "Soạn tốt; tiện nếu bạn dùng Gmail / Docs (tùy tài khoản)." },
      { platform: "copilot", level: "Hợp", reason: "Nếu công ty dùng Microsoft 365: soạn ngay trong Outlook / Word (tùy gói)." }
    ],
    tips: ["Cho biết người nhận, mục đích và độ dài mong muốn.", "Nêu rõ việc cần người nhận làm và hạn chót.", "Đọc lại tên, ngày, số liệu trước khi gửi."],
    promptTemplate: "Hãy soạn email gửi [người nhận] để [mục đích].\nThông tin chính cần có: [ý 1], [ý 2], [hạn chót nếu có].\nGiọng văn [trang trọng / thân thiện], dưới [số] từ, có tiêu đề email và lời chào kết." },
  { id: "summary", icon: "📄", name: "Tóm tắt tài liệu dài",
    keywords: ["tóm tắt", "tài liệu dài", "pdf", "báo cáo", "biên bản", "summary", "summarize", "đọc file", "file dài", "rút ý"],
    picks: [
      { platform: "notebooklm", level: "Rất hợp", reason: "Tải được nhiều tài liệu; câu trả lời trích đúng đoạn gốc để bạn kiểm tra." },
      { platform: "claude", level: "Rất hợp", reason: "Đọc được tài liệu dài và tóm tắt mạch lạc." },
      { platform: "gemini", level: "Hợp", reason: "Xử lý được nhiều loại tài liệu và file dài." }
    ],
    tips: ["Yêu cầu tóm tắt theo ý chính kèm trích dẫn (trang / mục).", "Tài liệu rất dài: tóm tắt từng phần rồi tổng hợp lại.", "Kiểm tra lại các con số và tên riêng với bản gốc."],
    promptTemplate: "Hãy tóm tắt tài liệu đính kèm cho [người đọc] trong [số] ý chính.\nMỗi ý kèm trích dẫn (trang / mục) để tôi kiểm tra lại.\nCuối cùng liệt kê [các việc cần làm / quyết định cần đưa ra] nếu có.\nNếu tài liệu không nói rõ điều gì, hãy ghi “không có trong tài liệu”." },
  { id: "explaindoc", icon: "🔍", name: "Giải thích văn bản (hợp đồng, quy định)",
    keywords: ["hợp đồng", "quy định", "điều khoản", "quy trình", "pháp lý", "giải thích văn bản", "tiêu chuẩn", "chính sách", "thông tư", "nghị định"],
    picks: [
      { platform: "notebooklm", level: "Rất hợp", reason: "Trả lời bám theo tài liệu và chỉ ra đoạn nguồn." },
      { platform: "claude", level: "Rất hợp", reason: "Đọc kỹ văn bản dài, giải thích từng điều khoản có trích dẫn." },
      { platform: "chatgpt", level: "Hợp", reason: "Giải thích dễ hiểu, cho ví dụ minh họa." }
    ],
    tips: ["Hỏi “đoạn nào nói vậy?” để kiểm tra từng câu trả lời.", "Yêu cầu giải thích bằng ngôn ngữ đời thường kèm ví dụ.", "Liệt kê điểm chưa rõ để hỏi lại người phụ trách."],
    promptTemplate: "Dưới đây là [loại văn bản: hợp đồng / quy định / quy trình]. Hãy giải thích cho người không chuyên: [điều khoản / phần cần hiểu].\nMỗi ý kèm trích đúng đoạn trong văn bản. Liệt kê các điểm tôi cần lưu ý hoặc hỏi lại người phụ trách.\n\n[nội dung văn bản]",
    warning: "AI giúp hiểu văn bản nhưng không thay thế tư vấn pháp lý hoặc ý kiến của bộ phận chuyên trách." },
  { id: "techexplain", icon: "⚙️", name: "Giải thích kỹ thuật, khái niệm",
    keywords: ["giải thích", "khái niệm", "kỹ thuật", "thuật ngữ", "toán", "logic", "là gì", "kiến thức", "ví dụ", "hiểu"],
    picks: [
      { platform: "chatgpt", level: "Rất hợp", reason: "Giải thích nhiều tầng, cho ví dụ thực tế." },
      { platform: "claude", level: "Rất hợp", reason: "Giải thích mạch lạc, từng bước." },
      { platform: "gemini", level: "Hợp", reason: "Giải thích kèm ví dụ, đọc được cả ảnh / sơ đồ." },
      { platform: "deepseek", level: "Hợp", reason: "DeepThink hợp với toán và logic cần suy luận từng bước." }
    ],
    tips: ["Nêu trình độ: “giải thích cho người mới”.", "Xin ví dụ thực tế và một câu hỏi để tự kiểm tra.", "Con số, công thức: tự kiểm tra lại bằng nguồn tin cậy."],
    promptTemplate: "Hãy giải thích [khái niệm / vấn đề] cho người [mới bắt đầu / đã có nền tảng về ...].\nDùng ví dụ thực tế trong [lĩnh vực / công việc của tôi], tối đa [số] ý.\nCuối cùng đặt 2 câu hỏi để tôi tự kiểm tra xem đã hiểu chưa." },
  { id: "news", icon: "📰", name: "Tra cứu thông tin mới, có nguồn",
    keywords: ["tra cứu", "tin tức", "tin mới", "nguồn", "tìm kiếm", "search", "tìm web", "thông tin mới", "thời sự", "so sánh", "cập nhật"],
    picks: [
      { platform: "perplexity", level: "Rất hợp", reason: "Tìm web là tính năng cốt lõi, luôn có nguồn." },
      { platform: "gemini", level: "Rất hợp", reason: "Dùng Google Search, dẫn nguồn." },
      { platform: "chatgpt", level: "Hợp", reason: "Có ChatGPT Search, trả lời kèm liên kết." },
      { platform: "grok", level: "Dùng được", reason: "Tìm web và nội dung trên X – hợp với chủ đề đang được bàn tới." }
    ],
    tips: ["Luôn mở link nguồn để kiểm tra, đừng chỉ tin phần tóm tắt của AI.", "Ghi rõ khoảng thời gian: “tin trong tuần này”.", "Tin trên mạng xã hội cần đối chiếu thêm với nguồn chính thống."],
    promptTemplate: "Hãy tìm thông tin mới nhất về [chủ đề] trong [khoảng thời gian].\nTóm tắt [số] ý chính, mỗi ý kèm tên nguồn và đường link.\nPhân biệt rõ điều đã được xác nhận và điều mới chỉ là tin đồn / ý kiến." },
  { id: "owndocs", icon: "📚", name: "Hỏi đáp trên tài liệu của mình",
    keywords: ["tài liệu của tôi", "hỏi đáp tài liệu", "notebook", "projects", "gems", "upload", "tải file", "kho tài liệu", "quy trình", "sổ tay"],
    picks: [
      { platform: "notebooklm", level: "Rất hợp", reason: "Mỗi notebook là một bộ tài liệu; AI chỉ trả lời theo tài liệu và chỉ ra nguồn." },
      { platform: "claude", level: "Hợp", reason: "Projects: lưu tài liệu và hướng dẫn, hỏi nhiều lần." },
      { platform: "chatgpt", level: "Hợp", reason: "Projects / Custom GPTs: lưu tài liệu, dùng lại nhiều lần." },
      { platform: "gemini", level: "Hợp", reason: "Gems: trợ lý riêng với hướng dẫn cố định." }
    ],
    tips: ["Lưu tài liệu một lần, hỏi nhiều lần không cần tải lại.", "Không tải lên tài liệu mật của công ty khi chưa được phép.", "Yêu cầu AI trả lời “chỉ dựa trên tài liệu”."],
    promptTemplate: "Chỉ dựa vào các tài liệu đã tải lên, hãy trả lời: [câu hỏi].\nTrích rõ đoạn / trang làm căn cứ. Nếu tài liệu không có thông tin, hãy nói “không tìm thấy trong tài liệu” thay vì đoán." },
  { id: "data", icon: "📊", name: "Phân tích dữ liệu, Excel",
    keywords: ["excel", "bảng tính", "dữ liệu", "phân tích", "biểu đồ", "thống kê", "sheets", "csv", "số liệu", "pivot"],
    picks: [
      { platform: "chatgpt", level: "Rất hợp", reason: "Đọc file bảng tính, tính toán và vẽ biểu đồ." },
      { platform: "claude", level: "Rất hợp", reason: "Đọc file, phân tích và giải thích kết quả." },
      { platform: "gemini", level: "Hợp", reason: "Làm việc với Google Sheets (tùy tài khoản)." },
      { platform: "copilot", level: "Hợp", reason: "Ngay trong Excel nếu công ty có Microsoft 365 Copilot." }
    ],
    tips: ["Kiểm tra lại số liệu quan trọng bằng Excel hoặc cách tính khác.", "Mô tả các cột dữ liệu và câu hỏi cần trả lời.", "Dùng dữ liệu đã ẩn danh, bỏ thông tin cá nhân / khách hàng."],
    promptTemplate: "Tôi đính kèm bảng dữ liệu về [mô tả dữ liệu]. Các cột gồm: [tên các cột].\nHãy: (1) kiểm tra dữ liệu thiếu / bất thường; (2) tính [chỉ số cần tính]; (3) gợi ý biểu đồ phù hợp để trình bày [thông điệp].\nGhi rõ cách tính để tôi kiểm tra lại." },
  { id: "code", icon: "💻", name: "Viết code, công thức Excel",
    keywords: ["code", "lập trình", "công thức", "excel", "vba", "python", "sql", "macro", "script", "hàm", "apps script", "html"],
    picks: [
      { platform: "claude", level: "Rất hợp", reason: "Viết và giải thích code tốt, hợp với việc nhiều bước." },
      { platform: "chatgpt", level: "Rất hợp", reason: "Viết, giải thích và sửa lỗi code / công thức." },
      { platform: "gemini", level: "Hợp", reason: "Viết code và công thức cho Google Sheets, Apps Script." },
      { platform: "deepseek", level: "Hợp", reason: "Mạnh ở lập trình và giải thích từng bước." }
    ],
    tips: ["Mô tả dữ liệu đầu vào và kết quả mong muốn (kèm vài dòng dữ liệu giả).", "Nói rõ phần mềm và phiên bản (Excel 365, Python 3…).", "Chạy thử trên bản sao trước khi dùng thật; dán nguyên văn thông báo lỗi nếu có."],
    promptTemplate: "Tôi dùng [phần mềm / ngôn ngữ, phiên bản]. Dữ liệu đầu vào: [mô tả cột / cấu trúc, ví dụ 3 dòng dữ liệu giả].\nKết quả mong muốn: [mô tả].\nHãy viết [công thức / đoạn code], giải thích từng phần và cho ví dụ để tôi kiểm tra." },
  { id: "image", icon: "🎨", name: "Tạo ảnh",
    keywords: ["ảnh", "hình ảnh", "vẽ", "tạo ảnh", "minh họa", "logo", "poster", "banner", "image", "infographic", "video"],
    picks: [
      { platform: "chatgpt", level: "Rất hợp", reason: "Tạo ảnh ngay trong cuộc chat, chỉnh tiếp bằng lời." },
      { platform: "gemini", level: "Rất hợp", reason: "Tạo ảnh từ mô tả, chỉnh tiếp trong cuộc chat." },
      { platform: "grok", level: "Hợp", reason: "Grok Imagine tạo cả ảnh và video." },
      { platform: "copilot", level: "Hợp", reason: "Tạo ảnh từ mô tả; tiện nếu bạn dùng hệ Microsoft." }
    ],
    tips: ["Mô tả chủ thể, bối cảnh, phong cách, tỉ lệ khung hình.", "Claude và DeepSeek không có tính năng tạo ảnh – hãy chọn một app có tính năng này.", "Dùng cho mục đích thương mại: đọc điều khoản của công cụ trước."],
    promptTemplate: "Hãy tạo ảnh: [chủ thể] đang [hành động] tại [bối cảnh].\nPhong cách: [ảnh chụp thật / minh họa phẳng / màu nước…]. Màu chủ đạo: [màu].\nTỉ lệ khung hình: [vuông / ngang 16:9 / dọc 9:16]. Không có chữ trong ảnh." },
  { id: "study", icon: "🎓", name: "Học, ôn tập",
    keywords: ["học", "ôn tập", "flashcard", "quiz", "ôn thi", "bài học", "giáo trình", "kiểm tra kiến thức", "hỏi ngược", "podcast", "tự học"],
    picks: [
      { platform: "notebooklm", level: "Rất hợp", reason: "Có flashcard, quiz và podcast tạo từ chính tài liệu của bạn." },
      { platform: "gemini", level: "Hợp", reason: "Guided Learning: học từng bước theo hướng dẫn." },
      { platform: "chatgpt", level: "Hợp", reason: "Hỏi đáp qua lại, ra bài tập và giải thích." }
    ],
    tips: ["Nhờ AI hỏi ngược lại mình thay vì chỉ đọc.", "Yêu cầu chia nhỏ theo từng buổi, kèm bài kiểm tra ngắn.", "Kiến thức quan trọng: đối chiếu với giáo trình / nguồn chính thức."],
    promptTemplate: "Tôi muốn học [chủ đề] ở mức [mới bắt đầu / trung bình] trong [thời gian].\nHãy chia thành [số] buổi, mỗi buổi gồm: tóm tắt ý chính, 1 ví dụ và 3 câu hỏi kiểm tra.\nHỏi tôi từng câu một, chờ tôi trả lời rồi mới nhận xét và giải thích." },
  { id: "deepresearch", icon: "🔬", name: "Nghiên cứu sâu một chủ đề",
    keywords: ["nghiên cứu", "research", "báo cáo", "tổng hợp", "so sánh", "khảo sát", "thị trường", "chủ đề", "deep research", "deepsearch"],
    picks: [
      { platform: "gemini", level: "Rất hợp", reason: "Deep Research: tự tìm nhiều nguồn, ra báo cáo có trích dẫn." },
      { platform: "chatgpt", level: "Rất hợp", reason: "Deep Research: tự tìm nhiều nguồn, ra báo cáo có trích dẫn." },
      { platform: "perplexity", level: "Hợp", reason: "Deep Research, luôn kèm nguồn." },
      { platform: "notebooklm", level: "Hợp", reason: "Fast / Deep Research tìm nguồn rồi đưa vào notebook để hỏi tiếp." },
      { platform: "grok", level: "Dùng được", reason: "DeepSearch trên cả web và X." }
    ],
    tips: ["Hỏi chéo 2 AI rồi so sánh kết quả.", "Mở các nguồn quan trọng để kiểm tra – báo cáo dài dễ lẫn chi tiết sai.", "Nêu phạm vi: thời gian, khu vực, loại nguồn cần ưu tiên."],
    promptTemplate: "Hãy nghiên cứu sâu về [chủ đề], phạm vi [thời gian / khu vực].\nƯu tiên nguồn [chính thức / học thuật / báo chí uy tín]. Báo cáo gồm: tóm tắt, các phát hiện chính, điểm còn tranh cãi, danh sách nguồn kèm link.\nNêu rõ chỗ nào chưa chắc chắn." }
];
