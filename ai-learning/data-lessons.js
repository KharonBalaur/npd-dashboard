/* Học sử dụng AI – dữ liệu bài học. Cấp 1 (5 bài + kiểm tra tổng 10 câu), cấp 2 (6 bài + kiểm tra tổng 10 câu); cấp 3 chưa có bài.
   Quy tắc khi thêm / sửa:
   - id bài CỐ ĐỊNH sau khi phát hành (tiến độ người học lưu theo id). Thêm / bớt / đổi thứ tự bài không làm mất bài đã đạt.
     Bắt buộc đổi id → báo chủ dự án (cần bảng đổi tên cũ → mới).
   - level: 1 = Nền tảng, 2 = Prompt cho mọi AI, 3 = Nâng cao. Thứ tự học = level tăng dần, bài kiểm tra tổng (isFinalTest) cuối mỗi cấp.
   - content là HTML do người biên soạn viết (được chèn nguyên văn): chỉ dùng thẻ đơn giản (p, h4, ul, ol, li, b, i, code, a).
     Mọi trường khác là chữ thường và được escape khi hiển thị.
   - quiz[].answer = chỉ số (bắt đầu từ 0) của đáp án đúng trong options. Đạt >= 80% mới mở bài sau.
   - Nội dung trung lập, dùng chung cho mọi nền tảng (ChatGPT, Gemini, Claude, Copilot…); không ghi giá / giới hạn / tên mô hình dễ cũ.
   - Nguồn: chỉ link chính thức; không chắc đường dẫn chi tiết thì dùng trang chủ của nguồn.
   - Repo public: không đưa dữ liệu nội bộ, khóa API, prompt mật. */
const AI_LEVELS = [
  { level: 1, name: "Nền tảng", desc: "AI là gì, làm được gì, giới hạn ở đâu, dùng an toàn." },
  { level: 2, name: "Prompt cho mọi AI", desc: "Cách ra lệnh rõ ràng, dùng được trên mọi nền tảng." },
  { level: 3, name: "Nâng cao", desc: "Quy trình làm việc, kiểm chứng và tự động hóa." }
];

// Nguồn tham khảo dùng chung (chính thức, miễn phí).
const AI_SRC = {
  oai: { name: "OpenAI Academy", url: "https://academy.openai.com/" },
  grow: { name: "Grow with Google (khóa Google AI Essentials)", url: "https://grow.google/" },
  ws: { name: "Google Workspace – tìm “Prompting Guide 101”", url: "https://workspace.google.com/" },
  ant: { name: "Anthropic Academy", url: "https://www.anthropic.com/learn" },
  cdocs: { name: "Claude Docs – mục Prompt engineering", url: "https://docs.claude.com/" },
  ms: { name: "Microsoft – Generative AI for Beginners (GitHub)", url: "https://github.com/microsoft/generative-ai-for-beginners" }
};

const LESSONS = [
  /* ===================== CẤP 1 · NỀN TẢNG ===================== */
  {
    id: "n1-01",
    level: 1,
    title: "AI, GenAI, LLM là gì?",
    goal: "Phân biệt được AI, AI tạo sinh (GenAI), mô hình ngôn ngữ lớn (LLM) và hiểu chatbot AI nằm ở đâu trong bức tranh đó.",
    content: `
<ul>
<li><b>AI (trí tuệ nhân tạo)</b>: tên gọi chung cho máy tính làm được những việc thường cần trí óc con người – nhận diện khuôn mặt, gợi ý phim, lọc thư rác, dịch máy.</li>
<li><b>Học máy (machine learning)</b>: cách làm AI phổ biến nhất hiện nay – máy tự rút ra quy luật từ rất nhiều ví dụ, thay vì được lập trình từng luật một.</li>
<li><b>GenAI (AI tạo sinh)</b>: nhánh AI <b>tạo ra nội dung mới</b> – văn bản, hình ảnh, âm thanh, video, mã lập trình.</li>
<li><b>LLM (mô hình ngôn ngữ lớn)</b>: loại GenAI chuyên về chữ, học từ lượng văn bản khổng lồ. Đây là “bộ não” phía sau các chatbot.</li>
<li><b>Chatbot AI</b> (ChatGPT, Gemini, Claude, Copilot…): ứng dụng có ô chat, dùng một hoặc nhiều mô hình, kèm thêm công cụ như tìm web, đọc file, tạo ảnh.</li>
</ul>
<h4>Hình dung nhanh</h4>
<ul>
<li>AI ⊃ học máy ⊃ GenAI ⊃ LLM.</li>
<li>Chatbot = giao diện chat + mô hình AI + công cụ đi kèm.</li>
</ul>
<h4>Ví dụ đời thường</h4>
<ul>
<li>AI “quen thuộc”: điện thoại tự gom ảnh theo khuôn mặt, hộp thư tự lọc thư rác.</li>
<li>GenAI: viết nháp email xin nghỉ phép, tóm tắt biên bản họp, tạo ảnh minh họa cho slide.</li>
</ul>
<h4>Giỏi gì – cần cẩn thận gì</h4>
<ul>
<li>Giỏi: viết nháp, tóm tắt, dịch, giải thích, gợi ý ý tưởng, sắp xếp thông tin.</li>
<li>Cần cẩn thận: số liệu, sự kiện mới, phép tính dài, việc cần chính xác tuyệt đối.</li>
</ul>`,
    promptExample: "Giải thích sự khác nhau giữa AI, AI tạo sinh và mô hình ngôn ngữ lớn cho người không làm kỹ thuật.\nMỗi khái niệm kèm 1 ví dụ đời thường. Tổng cộng dưới 150 từ.",
    pitfalls: [
      "Nghĩ AI chỉ là chatbot – thật ra chatbot chỉ là một dạng ứng dụng AI.",
      "Nghĩ chatbot “tra Google” cho mọi câu trả lời – phần lớn là mô hình tự sinh chữ, chỉ tra web khi bật tính năng tìm kiếm.",
      "Coi AI như một người có hiểu biết và chính kiến thật, tin như tin chuyên gia."
    ],
    sources: [AI_SRC.ms, AI_SRC.oai, AI_SRC.grow],
    quiz: [
      {
        q: "Ví dụ nào dưới đây là AI tạo sinh (GenAI)?",
        options: ["Điện thoại mở khóa bằng khuôn mặt", "Hộp thư tự lọc thư rác", "Ứng dụng viết nháp email theo yêu cầu của bạn", "Máy tính bỏ túi cộng hai số"],
        answer: 2,
        explain: "GenAI tạo ra nội dung mới (ở đây là email). Mở khóa khuôn mặt và lọc thư rác là AI nhận diện / phân loại; máy tính bỏ túi không phải AI."
      },
      {
        q: "LLM là viết tắt của gì?",
        options: ["Large Language Model – mô hình ngôn ngữ lớn", "Long Learning Machine – máy học dài hạn", "Local Language Memory – bộ nhớ ngôn ngữ cục bộ", "Logic Learning Method – phương pháp học logic"],
        answer: 0,
        explain: "LLM = Large Language Model: mô hình học từ lượng văn bản rất lớn để hiểu và sinh ra chữ."
      },
      {
        q: "Quan hệ nào dưới đây đúng?",
        options: ["LLM bao trùm toàn bộ AI", "GenAI là một nhánh của AI; LLM là một loại GenAI chuyên về chữ", "AI và GenAI là hai thứ không liên quan", "Chatbot và LLM là một thứ duy nhất"],
        answer: 1,
        explain: "AI là khái niệm rộng nhất; GenAI là nhánh tạo nội dung; LLM là loại GenAI về ngôn ngữ. Chatbot là ứng dụng dùng LLM, không phải bản thân LLM."
      },
      {
        q: "Một chatbot AI (ChatGPT, Gemini, Claude…) thường gồm những gì?",
        options: ["Chỉ là một công cụ tìm kiếm", "Một kho câu trả lời viết sẵn", "Một người trực tổng đài", "Giao diện chat + mô hình AI + công cụ đi kèm (tìm web, đọc file…)"],
        answer: 3,
        explain: "Chatbot là ứng dụng: phần giao diện để bạn gõ, mô hình AI sinh câu trả lời và các công cụ bổ sung tùy app."
      },
      {
        q: "Việc nào AI tạo sinh làm tốt và ít rủi ro nhất?",
        options: ["Viết nháp và tóm tắt văn bản để bạn đọc lại", "Đưa số liệu tài chính chính xác mà không cần kiểm tra", "Ra quyết định quan trọng thay bạn", "Cho biết tin vừa xảy ra 5 phút trước khi không có tìm kiếm web"],
        answer: 0,
        explain: "Viết nháp, tóm tắt là thế mạnh của GenAI, và bạn vẫn đọc lại trước khi dùng. Các lựa chọn còn lại đều cần độ chính xác hoặc thông tin mà AI không đảm bảo."
      }
    ]
  },
  {
    id: "n1-02",
    level: 1,
    title: "AI hoạt động thế nào?",
    goal: "Hiểu token, cơ chế dự đoán chữ tiếp theo, cửa sổ ngữ cảnh và giới hạn kiến thức – để biết vì sao AI giỏi, vì sao AI sai.",
    content: `
<ul>
<li><b>Token</b>: AI không đọc từng chữ cái mà cắt văn bản thành mẩu nhỏ gọi là token (một từ, một phần của từ hoặc dấu câu). Giới hạn độ dài thường tính bằng token; tiếng Việt thường tốn nhiều token hơn tiếng Anh cho cùng nội dung.</li>
<li><b>Dự đoán chữ tiếp theo</b>: mô hình đọc toàn bộ phần đã có, chọn token tiếp theo hợp lý nhất, rồi lặp lại đến hết câu trả lời – giống bàn phím điện thoại gợi ý từ, nhưng mạnh hơn rất nhiều.</li>
<li><b>Có yếu tố ngẫu nhiên</b>: hỏi cùng một câu hai lần có thể nhận hai câu trả lời khác nhau.</li>
<li><b>Context window (cửa sổ ngữ cảnh)</b>: lượng nội dung tối đa AI “nhìn thấy” trong một lần – gồm lời nhắn của bạn, file đính kèm và các câu trả lời trước đó. Cuộc chat quá dài thì phần cũ có thể bị bỏ bớt hoặc ít được chú ý.</li>
<li><b>Kiến thức có mốc thời gian</b>: mô hình học từ dữ liệu đến một thời điểm nhất định. Sau mốc đó nó không tự biết, trừ khi app có tìm kiếm web hoặc bạn đưa tài liệu vào.</li>
<li><b>Không phải bộ nhớ hoàn hảo</b>: mô hình nhớ “quy luật” chứ không lưu nguyên văn mọi thứ, nên chi tiết cụ thể (số, tên, ngày tháng) dễ sai.</li>
</ul>
<h4>Áp dụng khi dùng</h4>
<ul>
<li>Đưa đủ thông tin vào prompt quan trọng hơn hỏi cho khéo.</li>
<li>Đổi chủ đề → mở cuộc chat mới cho ngữ cảnh gọn gàng.</li>
<li>Hỏi tin mới → bật tìm kiếm web (nếu app có) hoặc dán tài liệu vào.</li>
</ul>`,
    promptExample: "Bên dưới là nội dung email của một khách hàng. Chỉ dựa vào nội dung này, hãy liệt kê 3 yêu cầu chính của khách.\nNếu email không nói rõ điều gì, hãy ghi “không có trong email” thay vì đoán.\n\n[Dán nội dung email ở đây]",
    pitfalls: [
      "Hỏi về sự kiện mới mà không bật tìm kiếm web hay đưa tài liệu.",
      "Dùng một cuộc chat rất dài cho nhiều chủ đề khác nhau.",
      "Dán tài liệu rất dài rồi tin rằng AI đã đọc kỹ từng dòng.",
      "Nghĩ AI tự “nhớ” mình từ các cuộc chat trước (chỉ đúng khi app bật tính năng ghi nhớ)."
    ],
    sources: [AI_SRC.ms, AI_SRC.ant, AI_SRC.oai],
    quiz: [
      {
        q: "Token là gì?",
        options: ["Mật khẩu đăng nhập vào app AI", "Mẩu văn bản nhỏ (từ, phần của từ, dấu câu) mà AI dùng để đọc và viết", "Một loại tiền ảo để trả phí", "Tên một loại virus máy tính"],
        answer: 1,
        explain: "AI xử lý văn bản theo token. Giới hạn độ dài và chi phí thường được tính bằng số token."
      },
      {
        q: "Mô hình ngôn ngữ tạo câu trả lời bằng cách nào?",
        options: ["Sao chép một câu trả lời có sẵn", "Hỏi ý kiến chuyên gia thật phía sau", "Lần lượt dự đoán token tiếp theo hợp lý dựa trên ngữ cảnh", "Tra nghĩa trong từ điển"],
        answer: 2,
        explain: "Câu trả lời được sinh dần từng token, mỗi token là lựa chọn “hợp lý nhất” dựa trên mọi thứ đứng trước nó."
      },
      {
        q: "Context window (cửa sổ ngữ cảnh) nghĩa là gì?",
        options: ["Cửa sổ trình duyệt đang mở app AI", "Danh sách các cuộc chat cũ", "Thời gian chờ AI trả lời", "Lượng nội dung tối đa AI xem được trong một lần, gồm cả cuộc trò chuyện và file"],
        answer: 3,
        explain: "Mọi thứ AI cần “nhìn” (lời nhắn, file, câu trả lời trước) phải nằm trong giới hạn này. Vượt quá thì phần cũ có thể bị bỏ bớt."
      },
      {
        q: "Bạn hỏi về một sự kiện tuần trước, app không có tìm kiếm web. Điều gì dễ xảy ra?",
        options: ["AI có thể không biết hoặc đoán sai vì kiến thức dừng ở một mốc thời gian", "AI luôn đúng vì đã đọc cả internet", "AI tự cập nhật tin tức mỗi giờ", "AI từ chối mọi câu hỏi khác"],
        answer: 0,
        explain: "Kiến thức của mô hình có mốc thời gian. Không có tìm kiếm web hay tài liệu bạn đưa vào thì AI có thể không biết – hoặc tệ hơn, đoán sai một cách tự tin."
      },
      {
        q: "Cuộc chat đã rất dài và bạn chuyển sang một việc khác hẳn. Nên làm gì?",
        options: ["Tiếp tục trong cuộc chat cũ cho tiện", "Mở cuộc chat mới và đưa lại những thông tin cần thiết", "Viết in hoa để AI chú ý hơn", "Xóa tài khoản và tạo lại"],
        answer: 1,
        explain: "Cuộc chat mới giúp ngữ cảnh gọn, AI không bị lẫn với nội dung cũ và không bị giới hạn cửa sổ ngữ cảnh."
      }
    ]
  },
  {
    id: "n1-03",
    level: 1,
    title: "Bản đồ các AI phổ biến",
    goal: "Biết các trợ lý AI phổ biến, đặc trưng của từng loại và cách chọn công cụ theo việc cần làm.",
    content: `
<p>Các app đều làm được việc cơ bản như hỏi đáp, viết, tóm tắt, dịch. Khác nhau chủ yếu ở <b>hệ sinh thái</b>, <b>tính năng đi kèm</b> và <b>chính sách dữ liệu</b>.</p>
<ul>
<li><b>ChatGPT</b> (OpenAI): trợ lý đa năng, nhiều tính năng trong cùng một app.</li>
<li><b>Gemini</b> (Google): gắn với Google Search và các dịch vụ Google như Gmail, Docs, Drive.</li>
<li><b>Claude</b> (Anthropic): trợ lý đa năng, nổi bật ở đọc – viết văn bản dài và lập trình.</li>
<li><b>Microsoft Copilot</b> (Microsoft): gắn với Windows, Edge và Microsoft 365 (Word, Excel, Outlook, Teams) tùy gói.</li>
<li><b>Perplexity</b> (Perplexity AI): xoay quanh tìm kiếm, trả lời kèm nguồn trích dẫn.</li>
<li><b>DeepSeek</b> (DeepSeek, Trung Quốc): trợ lý chat; công ty công bố nhiều mô hình dạng mở.</li>
<li><b>NotebookLM</b> (Google): trả lời dựa trên tài liệu bạn tải lên, chỉ ra đoạn nguồn trong tài liệu.</li>
</ul>
<h4>Chọn thế nào?</h4>
<ul>
<li>Công ty đã cấp công cụ AI → ưu tiên công cụ đó cho việc công ty (thường có cam kết bảo vệ dữ liệu).</li>
<li>Cần tra cứu có nguồn → app có tìm kiếm web và trích dẫn.</li>
<li>Hỏi đáp trên tài liệu của mình → công cụ kiểu “sổ tay tài liệu” hoặc tính năng tải file / dự án của các chatbot.</li>
<li>Dùng nhiều dịch vụ Google hay Microsoft → thử AI gắn với hệ sinh thái đó.</li>
<li>Xem chính sách quyền riêng tư của từng app: dữ liệu lưu ở đâu, có dùng để huấn luyện không, tắt được không.</li>
</ul>
<p>Kỹ năng viết prompt và kiểm chứng <b>dùng chung cho mọi app</b>. Gói miễn phí, tên mô hình và giới hạn thay đổi thường xuyên – xem tab “Các nền tảng AI” và trang chính thức.</p>`,
    promptExample: "Tôi là nhân viên văn phòng, mỗi ngày phải đọc nhiều email dài và cuối tuần viết báo cáo công việc.\nHãy gợi ý 3 cách dùng trợ lý AI để tiết kiệm thời gian, mỗi cách kèm 1 câu lệnh mẫu tôi có thể dùng ngay.",
    pitfalls: [
      "Đi tìm “AI tốt nhất” cho mọi việc thay vì chọn theo việc cần làm.",
      "Dùng app cá nhân cho dữ liệu công ty trong khi công ty đã quy định công cụ riêng.",
      "Tải app hoặc tiện ích giả mạo mang tên AI nổi tiếng – chỉ dùng trang web và kho ứng dụng chính thức.",
      "Nghĩ đổi app là phải học lại từ đầu."
    ],
    sources: [
      AI_SRC.grow, AI_SRC.oai, AI_SRC.ms,
      { name: "NotebookLM – trang chính thức", url: "https://notebooklm.google.com/" },
      { name: "Perplexity – trang chính thức", url: "https://www.perplexity.ai/" }
    ],
    quiz: [
      {
        q: "Trợ lý AI nào được thiết kế xoay quanh tìm kiếm, trả lời kèm nguồn trích dẫn?",
        options: ["Perplexity", "DeepSeek", "NotebookLM", "Paint"],
        answer: 0,
        explain: "Perplexity lấy tìm kiếm làm trọng tâm và luôn kèm nguồn. Các chatbot khác cũng có thể tìm web, nhưng đó không phải trọng tâm thiết kế."
      },
      {
        q: "NotebookLM khác chatbot thông thường ở điểm nào?",
        options: ["Chỉ dùng để tạo ảnh", "Trả lời chủ yếu dựa trên tài liệu bạn tải lên và chỉ ra đoạn nguồn", "Không cần kết nối internet", "Chỉ dùng cho lập trình viên"],
        answer: 1,
        explain: "NotebookLM bám vào tài liệu bạn đưa vào và chỉ rõ trích từ đoạn nào – tiện để kiểm tra lại."
      },
      {
        q: "Bạn dùng Outlook, Word, Teams hằng ngày ở công ty. Công cụ AI nào gắn sẵn với hệ sinh thái này?",
        options: ["Gemini", "Perplexity", "Microsoft Copilot", "NotebookLM"],
        answer: 2,
        explain: "Microsoft Copilot gắn với Microsoft 365 (tùy gói công ty đăng ký). Gemini gắn với hệ sinh thái Google."
      },
      {
        q: "Cách chọn công cụ AI nào hợp lý nhất?",
        options: ["Luôn dùng app mới ra mắt gần nhất", "Chọn app nhiều người dùng nhất là đủ", "Chỉ dùng duy nhất một app cho mọi việc", "Chọn theo việc cần làm và theo quy định dữ liệu của công ty"],
        answer: 3,
        explain: "Không có app tốt nhất cho mọi việc. Hãy chọn theo nhu cầu (tra cứu, tài liệu, văn phòng…) và luôn tuân thủ quy định công ty về dữ liệu."
      },
      {
        q: "Khi đổi từ app AI này sang app khác, kỹ năng nào vẫn dùng được?",
        options: ["Cách viết prompt rõ ràng và cách kiểm chứng kết quả", "Không kỹ năng nào cả", "Chỉ mật khẩu tài khoản", "Chỉ vị trí các nút bấm"],
        answer: 0,
        explain: "Các app đều hiểu ngôn ngữ tự nhiên. Prompt rõ ràng và thói quen kiểm chứng hiệu quả trên mọi nền tảng."
      }
    ]
  },
  {
    id: "n1-04",
    level: 1,
    title: "Hạn chế & an toàn",
    goal: "Nhận biết rủi ro bịa thông tin, bảo mật dữ liệu cá nhân / công ty, bản quyền và lừa đảo bằng AI – và biết cách phòng tránh.",
    content: `
<h4>1. Bịa thông tin (hallucination)</h4>
<ul>
<li>AI có thể đưa ra số liệu, trích dẫn, tên tài liệu, đường link không có thật – với giọng rất tự tin.</li>
<li>Phòng tránh: yêu cầu nêu nguồn, tự mở nguồn ra kiểm tra; việc quan trọng thì đối chiếu tài liệu gốc.</li>
</ul>
<h4>2. Dữ liệu cá nhân và công ty</h4>
<ul>
<li>Nội dung bạn nhập có thể được lưu trên máy chủ của nhà cung cấp; tùy app và cài đặt, có thể được dùng để cải thiện mô hình.</li>
<li>Không nhập: mật khẩu, số CCCD, số tài khoản, thông tin sức khỏe, dữ liệu khách hàng, bản vẽ, giá, hợp đồng, tài liệu nội bộ – trừ khi công ty cho phép dùng công cụ đó.</li>
<li>Cần ví dụ → thay tên, số liệu thật bằng dữ liệu giả (ẩn danh hóa).</li>
<li>Xem phần cài đặt quyền riêng tư: lịch sử chat, ghi nhớ, cho phép dùng dữ liệu để huấn luyện.</li>
</ul>
<h4>3. Bản quyền và trách nhiệm</h4>
<ul>
<li>Nội dung AI tạo có thể giống tác phẩm có bản quyền; quy định về bản quyền nội dung AI khác nhau theo quốc gia và vẫn đang thay đổi.</li>
<li>Không đưa tác phẩm của người khác vào AI rồi phát hành lại như của mình.</li>
<li>Dùng ảnh / văn bản AI cho mục đích thương mại → đọc điều khoản của công cụ và hỏi quy định công ty.</li>
<li>Bạn ký tên, bạn gửi đi → bạn chịu trách nhiệm.</li>
</ul>
<h4>4. Thiên kiến và lừa đảo</h4>
<ul>
<li>AI học từ dữ liệu của con người nên có thể mang định kiến – đọc với tư duy phản biện.</li>
<li>Kẻ gian dùng AI làm email, giọng nói, video giả. Yêu cầu chuyển tiền / gửi thông tin gấp → xác minh qua kênh khác.</li>
</ul>`,
    promptExample: "Dưới đây là đoạn mô tả sự cố, tôi đã thay tên khách hàng và số liệu bằng dữ liệu giả.\nHãy viết lại thành email gửi đối tác, giọng lịch sự, khoảng 120 từ.\nKhông thêm số liệu hay chi tiết nào không có trong đoạn mô tả.\n\n[Đoạn mô tả đã ẩn danh]",
    pitfalls: [
      "Dán nguyên file khách hàng hoặc bảng lương vào app AI cá nhân.",
      "Dùng đường link, trích dẫn AI đưa ra mà không mở ra xem.",
      "Dùng ảnh / văn bản AI tạo cho mục đích thương mại mà không kiểm tra điều khoản.",
      "Làm theo tin nhắn hoặc giọng nói “sếp” yêu cầu chuyển tiền gấp mà không xác minh."
    ],
    sources: [AI_SRC.ms, AI_SRC.grow, AI_SRC.oai, AI_SRC.ant],
    quiz: [
      {
        q: "Cách nào giảm rủi ro AI bịa thông tin hiệu quả nhất?",
        options: ["Tin vì AI trả lời rất nhanh", "Viết prompt bằng chữ in hoa", "Yêu cầu nêu nguồn và tự mở nguồn ra kiểm tra", "Hỏi đi hỏi lại đến khi AI đồng ý với mình"],
        answer: 2,
        explain: "Chỉ nguồn gốc đáng tin mới xác nhận được thông tin. Tốc độ, chữ in hoa hay việc AI đồng ý với bạn không chứng minh điều gì."
      },
      {
        q: "Thông tin nào KHÔNG nên nhập vào chatbot AI công cộng?",
        options: ["Câu hỏi về cách viết email lịch sự", "Mật khẩu và dữ liệu khách hàng thật", "Yêu cầu giải thích một khái niệm", "Đoạn văn tự viết đã bỏ hết thông tin nhạy cảm"],
        answer: 1,
        explain: "Mật khẩu, dữ liệu khách hàng là thông tin nhạy cảm; nội dung nhập vào có thể được lưu ở máy chủ của nhà cung cấp."
      },
      {
        q: "Muốn nhờ AI viết lại một báo cáo có tên khách hàng thật, bạn nên làm gì?",
        options: ["Dán nguyên văn cho nhanh", "Chụp ảnh màn hình gửi thay vì dán chữ, để AI không đọc được", "Gửi cho nhiều AI cùng lúc để so sánh", "Ẩn danh hóa (thay tên, số liệu thật) hoặc dùng công cụ AI được công ty cho phép"],
        answer: 3,
        explain: "Ẩn danh hóa hoặc dùng công cụ được phép mới giảm rủi ro. Ảnh chụp màn hình không bảo vệ được gì – AI đọc được chữ trong ảnh."
      },
      {
        q: "Về bản quyền nội dung do AI tạo, câu nào đúng?",
        options: ["Mọi nội dung AI tạo đều được tự do dùng thương mại", "Quy định khác nhau theo quốc gia và công cụ, còn đang thay đổi – cần đọc điều khoản và hỏi quy định công ty", "AI không bao giờ tạo ra nội dung giống tác phẩm có sẵn", "Chỉ cần ghi “do AI viết” là hết trách nhiệm"],
        answer: 1,
        explain: "Chưa có quy tắc chung cho mọi nơi. Trước khi dùng cho mục đích thương mại, hãy đọc điều khoản của công cụ và hỏi bộ phận phụ trách."
      },
      {
        q: "Bạn nhận cuộc gọi có giọng giống hệt sếp, yêu cầu chuyển tiền gấp. Nên làm gì?",
        options: ["Xác minh qua kênh khác (gọi lại số quen, hỏi trực tiếp) trước khi làm gì", "Chuyển ngay vì giọng rất giống", "Đọc mật khẩu ngân hàng để sếp kiểm tra", "Nhờ đồng nghiệp chuyển hộ cho nhanh"],
        answer: 0,
        explain: "AI có thể giả giọng nói và video. Yêu cầu bất thường về tiền hoặc thông tin luôn cần xác minh qua một kênh độc lập."
      }
    ]
  },
  {
    id: "n1-05",
    level: 1,
    title: "Bắt đầu cuộc chat đầu tiên",
    goal: "Tự mở một app AI, gửi yêu cầu, hỏi tiếp để chỉnh kết quả và biết các nút cơ bản.",
    content: `
<h4>Các bước</h4>
<ol>
<li>Mở trang web hoặc app <b>chính thức</b> (gõ đúng địa chỉ, tải từ kho ứng dụng chính thức), đăng nhập tài khoản.</li>
<li>Gõ yêu cầu vào ô chat bằng tiếng Việt như nói với đồng nghiệp – không cần câu lệnh đặc biệt.</li>
<li>Đọc câu trả lời, <b>hỏi tiếp ngay trong cuộc chat đó</b>: “ngắn hơn”, “thêm ví dụ”, “giọng trang trọng hơn”.</li>
<li>Chuyển sang việc khác hẳn → bấm “Cuộc trò chuyện mới” / “New chat”.</li>
<li>Kết quả dùng được → copy ra, đọc lại và chỉnh trước khi dùng.</li>
</ol>
<h4>Các nút thường gặp (tên có thể khác giữa các app)</h4>
<ul>
<li>Kẹp giấy / dấu +: gửi file, ảnh.</li>
<li>Micro: nói thay vì gõ.</li>
<li>Tìm kiếm web / nguồn: bật khi cần thông tin mới.</li>
<li>Tạo lại (regenerate) hoặc sửa câu hỏi: xin một câu trả lời khác.</li>
<li>Thanh bên: lịch sử chat. Cài đặt: ngôn ngữ, quyền riêng tư, ghi nhớ.</li>
</ul>
<h4>Gợi ý thử ngay</h4>
<ul>
<li>Viết nháp email xin lỗi khách vì giao hàng trễ.</li>
<li>Tóm tắt một bài báo dài thành 5 ý.</li>
<li>Lên thực đơn một tuần cho gia đình 4 người.</li>
<li>Giải thích một thuật ngữ khó trong tài liệu.</li>
</ul>`,
    promptExample: "Viết giúp tôi email gửi đồng nghiệp, nhắc hạn nộp báo cáo tháng vào thứ Sáu tuần này.\nGiọng thân thiện, dưới 80 từ, có lời cảm ơn ở cuối.",
    pitfalls: [
      "Gõ quá ngắn (“viết email”) rồi thất vọng với kết quả.",
      "Mở cuộc chat mới mỗi lần muốn sửa một chút thay vì hỏi tiếp.",
      "Copy nguyên kết quả gửi đi mà không đọc lại.",
      "Cài app giả mạo từ đường link lạ."
    ],
    sources: [AI_SRC.oai, AI_SRC.ws, AI_SRC.ant],
    quiz: [
      {
        q: "Có cần câu lệnh đặc biệt để nói chuyện với chatbot AI không?",
        options: ["Có, phải học một ngôn ngữ lập trình", "Không, chỉ cần gõ bằng ngôn ngữ tự nhiên như nói với đồng nghiệp", "Có, bắt buộc phải gõ tiếng Anh", "Chỉ dùng được bằng giọng nói"],
        answer: 1,
        explain: "Chatbot hiểu ngôn ngữ tự nhiên, kể cả tiếng Việt. Viết rõ ràng quan trọng hơn mọi “câu lệnh bí mật”."
      },
      {
        q: "AI viết email hơi dài. Cách nhanh nhất để sửa?",
        options: ["Mở cuộc chat mới và gõ lại từ đầu", "Chuyển sang app khác", "Hỏi tiếp trong cùng cuộc chat: “Rút gọn còn khoảng 50 từ”", "Chờ một lúc rồi hỏi lại y hệt"],
        answer: 2,
        explain: "AI thấy được nội dung vừa viết nên chỉ cần nói cụ thể phần cần sửa trong cùng cuộc chat."
      },
      {
        q: "Biểu tượng kẹp giấy hoặc dấu + cạnh ô chat thường dùng để làm gì?",
        options: ["Gửi file hoặc ảnh cho AI", "Xóa tài khoản", "Đổi mật khẩu", "Thanh toán gói trả phí"],
        answer: 0,
        explain: "Đây là nút đính kèm: gửi ảnh, PDF, Word, bảng tính… để AI đọc (tùy app và gói)."
      },
      {
        q: "Khi nào nên mở cuộc trò chuyện mới?",
        options: ["Mỗi khi muốn sửa một chữ", "Sau mỗi câu trả lời", "Không bao giờ, dùng một cuộc chat cho mọi việc", "Khi chuyển sang chủ đề hoặc công việc khác hẳn"],
        answer: 3,
        explain: "Chủ đề mới → chat mới để ngữ cảnh gọn. Còn sửa cùng một việc thì hỏi tiếp trong cuộc chat đang có."
      },
      {
        q: "Trước khi gửi email do AI viết cho khách hàng, bạn cần làm gì?",
        options: ["Gửi ngay vì AI viết rất chuẩn", "Đọc lại, kiểm tra tên, số liệu, thông tin và chỉnh giọng văn cho phù hợp", "Thêm dòng “do AI viết” là đủ", "Nhờ một AI khác gửi thay"],
        answer: 1,
        explain: "AI chỉ soạn nháp; người gửi chịu trách nhiệm nội dung. Luôn đọc lại trước khi gửi."
      }
    ]
  },
  {
    id: "n1-final",
    level: 1,
    isFinalTest: true,
    title: "Kiểm tra tổng cấp 1: Nền tảng",
    goal: "Ôn lại toàn bộ cấp Nền tảng (5 bài). Đạt từ 80% (8/10 câu) để mở sang cấp 2.",
    content: `<p>10 câu tổng hợp: khái niệm AI / GenAI / LLM, cách AI hoạt động, các nền tảng phổ biến, hạn chế và an toàn, thao tác cơ bản.</p>
<ul><li>Chọn đáp án là thấy ngay đúng / sai và lời giải thích.</li><li>Làm xong có thể làm lại; điểm cao nhất được lưu.</li></ul>`,
    promptExample: "",
    pitfalls: [],
    sources: [],
    quiz: [
      {
        q: "AI tạo sinh (GenAI) khác các ứng dụng AI khác ở điểm nào?",
        options: ["GenAI tạo ra nội dung mới (chữ, ảnh, âm thanh…)", "GenAI chỉ dùng cho trò chơi", "GenAI không cần dữ liệu để học", "GenAI là tên của một app"],
        answer: 0,
        explain: "Điểm đặc trưng của GenAI là sinh ra nội dung mới, thay vì chỉ nhận diện hay phân loại."
      },
      {
        q: "Vì sao hỏi cùng một câu hai lần, AI có thể trả lời khác nhau?",
        options: ["Vì AI bị lỗi", "Vì việc chọn chữ tiếp theo có yếu tố ngẫu nhiên", "Vì mạng internet chậm", "Vì AI không thích câu hỏi lặp lại"],
        answer: 1,
        explain: "Mô hình sinh chữ có yếu tố ngẫu nhiên nên câu trả lời có thể khác nhau – đó là đặc điểm bình thường."
      },
      {
        q: "Cửa sổ ngữ cảnh (context window) ảnh hưởng gì khi bạn dán một tài liệu rất dài?",
        options: ["Không ảnh hưởng gì", "Tài liệu càng dài AI càng chính xác", "AI có thể không xử lý hết hoặc bỏ sót chi tiết khi vượt giới hạn", "AI tự in tài liệu ra giấy"],
        answer: 2,
        explain: "Nội dung vượt giới hạn cửa sổ ngữ cảnh có thể bị cắt hoặc ít được chú ý. Tài liệu dài nên hỏi theo từng phần."
      },
      {
        q: "Bạn cần hỏi đáp dựa trên 5 file quy trình của phòng, có chỉ ra đoạn nguồn. Loại công cụ nào phù hợp?",
        options: ["Công cụ tạo ảnh từ mô tả", "Ứng dụng dịch giọng nói", "Một chatbot bất kỳ, không cần tải tài liệu lên", "Công cụ hỏi đáp trên tài liệu (như NotebookLM) hoặc tính năng tải file / dự án của chatbot – nếu công ty cho phép"],
        answer: 3,
        explain: "Công cụ làm việc trên tài liệu của bạn trả lời bám tài liệu và chỉ ra nguồn. Nhớ kiểm tra quy định công ty trước khi tải tài liệu nội bộ."
      },
      {
        q: "“Hallucination” (ảo giác) của AI là gì?",
        options: ["AI nói rõ là không biết", "AI trả lời chậm", "AI tạo ra thông tin sai nhưng nghe rất hợp lý", "AI hỏi ngược lại bạn"],
        answer: 2,
        explain: "AI có thể bịa số liệu, trích dẫn, link một cách tự tin – nên thông tin quan trọng luôn phải kiểm chứng."
      },
      {
        q: "Nội dung nào an toàn để nhập vào AI công cộng?",
        options: ["Bảng lương nhân viên", "Câu hỏi chung: “Cách viết biên bản họp gọn gàng?”", "Mật khẩu email công ty", "Hợp đồng chưa ký với khách hàng"],
        answer: 1,
        explain: "Câu hỏi chung không chứa dữ liệu nhạy cảm. Bảng lương, mật khẩu, hợp đồng thì không nên nhập vào công cụ chưa được công ty cho phép."
      },
      {
        q: "AI đưa ra một trích dẫn kèm tên sách và số trang. Bạn nên làm gì?",
        options: ["Tìm nguồn gốc để xác nhận trích dẫn có thật và đúng trước khi dùng", "Dùng luôn vì đã có số trang cụ thể", "Hỏi AI “có chắc không?” – AI nói chắc thì dùng", "Bỏ số trang đi cho gọn rồi dùng"],
        answer: 0,
        explain: "Chi tiết cụ thể (tên sách, số trang) không chứng minh trích dẫn có thật. Chỉ nguồn gốc mới xác nhận được."
      },
      {
        q: "Ai chịu trách nhiệm về nội dung do AI hỗ trợ soạn?",
        options: ["Chính AI", "Hãng làm ra AI chịu mọi trách nhiệm", "Người dùng nội dung đó (ký tên, gửi đi) chịu trách nhiệm kiểm tra", "Không ai cả"],
        answer: 2,
        explain: "AI là công cụ. Người dùng kết quả – ký tên, gửi đi, công bố – là người chịu trách nhiệm."
      },
      {
        q: "Muốn AI biết thông tin của tuần này, cách nào hợp lý?",
        options: ["Hỏi đi hỏi lại nhiều lần", "Viết thêm “hãy dùng thông tin mới nhất”", "Đổi giao diện sang chế độ tối", "Bật tìm kiếm web (nếu app có) hoặc dán tài liệu / nguồn mới vào"],
        answer: 3,
        explain: "Kiến thức của mô hình có mốc thời gian. Thông tin mới phải đến từ tìm kiếm web hoặc tài liệu bạn đưa vào."
      },
      {
        q: "Bước đầu tiên an toàn khi bắt đầu dùng một app AI?",
        options: ["Cài từ đường link lạ trong tin nhắn", "Mở trang web / kho ứng dụng chính thức và xem phần cài đặt quyền riêng tư", "Đăng nhập bằng mật khẩu công ty vào mọi app", "Cho app quyền truy cập toàn bộ danh bạ"],
        answer: 1,
        explain: "Chỉ dùng nguồn chính thức để tránh app giả mạo, và xem cài đặt quyền riêng tư để biết dữ liệu của bạn được xử lý thế nào."
      }
    ]
  },

  /* ===================== CẤP 2 · PROMPT CHO MỌI AI ===================== */
  {
    id: "n2-01",
    level: 2,
    title: "Công thức prompt: vai trò, bối cảnh, nhiệm vụ, định dạng",
    goal: "Viết được prompt rõ ràng theo 4 ô Vai trò – Bối cảnh – Nhiệm vụ – Định dạng, dùng được trên mọi nền tảng AI.",
    content: `
<p>Prompt tốt giống một bản <b>giao việc cho đồng nghiệp mới</b>: người đó không đọc được suy nghĩ của bạn, nên bạn cần nói đủ.</p>
<ul>
<li><b>Vai trò</b> – AI nên đứng ở vị trí nào: nhân viên hành chính, biên tập viên, chuyên viên chăm sóc khách hàng…</li>
<li><b>Bối cảnh</b> – tình huống, người đọc là ai, mục đích để làm gì.</li>
<li><b>Nhiệm vụ</b> – việc cụ thể, bắt đầu bằng động từ rõ ràng: tóm tắt, so sánh, liệt kê, viết lại, kiểm tra.</li>
<li><b>Định dạng</b> – kết quả trình bày thế nào: gạch đầu dòng, bảng, độ dài, ngôn ngữ, giọng văn.</li>
<li>Thêm <b>Lưu ý</b> nếu cần: điều phải tránh hoặc bắt buộc (không bịa số liệu, ghi rõ chỗ chưa chắc…).</li>
</ul>
<h4>Trước và sau</h4>
<ul>
<li>Chưa tốt: “Viết thông báo nghỉ lễ.”</li>
<li>Tốt hơn: xem ví dụ prompt bên dưới – có người viết, người đọc, nội dung chính, độ dài và hình thức.</li>
</ul>
<h4>Mẹo</h4>
<ul>
<li>Câu hỏi đơn giản không cần đủ 4 ô; việc quan trọng thì càng rõ càng tốt.</li>
<li>Nói rõ người đọc là ai – AI sẽ tự chọn mức chi tiết và giọng văn phù hợp.</li>
<li>Dùng tab “Trình tạo prompt” để ghép nhanh 4 ô.</li>
</ul>`,
    promptExample: "Vai trò: Bạn là nhân viên hành chính nhân sự.\nBối cảnh: Công ty khoảng 200 người, nghỉ lễ 30/4 và 1/5. Người đọc là toàn bộ nhân viên.\nNhiệm vụ: Viết thông báo lịch nghỉ lễ và ngày đi làm lại.\nĐịnh dạng: Tiêu đề + 3–4 gạch đầu dòng, dưới 120 từ, tiếng Việt, giọng thân thiện.\nLưu ý: Không tự thêm thông tin về thưởng hay lương.",
    pitfalls: [
      "Prompt một dòng, mơ hồ, để AI tự đoán mọi thứ.",
      "Không nói người đọc là ai và kết quả dùng để làm gì.",
      "Không nêu độ dài, hình thức, ngôn ngữ mong muốn.",
      "Nhồi nhiều việc không liên quan vào cùng một prompt."
    ],
    sources: [AI_SRC.ws, AI_SRC.cdocs, AI_SRC.oai, AI_SRC.ms],
    quiz: [
      {
        q: "4 ô của công thức prompt là gì?",
        options: ["Vai trò, Bối cảnh, Nhiệm vụ, Định dạng", "Tên, Tuổi, Địa chỉ, Số điện thoại", "Mở bài, Thân bài, Kết bài, Ký tên", "Tiêu đề, Màu chữ, Phông chữ, Cỡ chữ"],
        answer: 0,
        explain: "Vai trò – Bối cảnh – Nhiệm vụ – Định dạng giúp AI hiểu ai đang làm, cho ai, làm gì và trình bày ra sao."
      },
      {
        q: "“Người đọc là khách hàng lớn tuổi, không rành công nghệ” thuộc ô nào?",
        options: ["Vai trò", "Bối cảnh", "Định dạng", "Nhiệm vụ"],
        answer: 1,
        explain: "Thông tin về tình huống và người đọc thuộc ô Bối cảnh."
      },
      {
        q: "“Trình bày dạng bảng 3 cột, tối đa 10 dòng” thuộc ô nào?",
        options: ["Vai trò", "Bối cảnh", "Nhiệm vụ", "Định dạng"],
        answer: 3,
        explain: "Ô Định dạng quy định hình thức kết quả: bảng, gạch đầu dòng, độ dài, ngôn ngữ."
      },
      {
        q: "Prompt nào rõ ràng nhất?",
        options: ["Viết thông báo.", "Viết thông báo nghỉ lễ thật hay.", "Viết thông báo nghỉ lễ 30/4–1/5 cho 200 nhân viên: tiêu đề + 3 gạch đầu dòng, dưới 120 từ.", "Hãy là chuyên gia giỏi nhất thế giới và viết thông báo."],
        answer: 2,
        explain: "Prompt rõ nêu đủ nội dung, người đọc, hình thức và độ dài. Lời khen “giỏi nhất”, “thật hay” không thêm thông tin cho AI."
      },
      {
        q: "Câu hỏi đơn giản như “1 inch bằng bao nhiêu cm?” có cần đủ 4 ô không?",
        options: ["Bắt buộc phải đủ 4 ô", "Không cần – công thức dành cho việc phức tạp hoặc quan trọng", "Phải có Vai trò thì AI mới trả lời", "AI sẽ từ chối nếu thiếu ô"],
        answer: 1,
        explain: "Công thức là công cụ, không phải luật. Câu hỏi đơn giản hỏi thẳng là đủ."
      }
    ]
  },
  {
    id: "n2-02",
    level: 2,
    title: "Hỏi lại & chỉnh dần",
    goal: "Biết cách góp ý cụ thể để AI sửa đúng chỗ, và để AI hỏi lại bạn khi thiếu thông tin.",
    content: `
<p>Hiếm khi lần đầu đã hoàn hảo. Hãy làm việc với AI như với đồng nghiệp: <b>giao việc → xem bản nháp → góp ý cụ thể</b>.</p>
<h4>Góp ý hiệu quả</h4>
<ul>
<li><b>Nói cụ thể</b>: “Đoạn 2 dài quá, rút còn 2 câu” thay vì “chưa hay”.</li>
<li><b>Giữ phần tốt</b>: “Giữ nguyên mở bài, chỉ sửa kết luận”.</li>
<li><b>Mỗi lần vài thay đổi</b>, đừng đổi mọi thứ cùng lúc.</li>
<li><b>Để AI hỏi lại bạn</b>: “Trước khi viết, hãy hỏi tôi những thông tin còn thiếu.”</li>
<li><b>Sửa câu hỏi gốc</b> (nút chỉnh sửa) khi hướng đi sai ngay từ đầu.</li>
<li><b>Tạo lại</b> (regenerate) khi muốn một phương án khác cho cùng yêu cầu.</li>
</ul>
<h4>Câu chỉnh hay dùng</h4>
<ul>
<li>“Ngắn hơn / dài hơn, khoảng … từ.”</li>
<li>“Giọng trang trọng hơn / thân thiện hơn.”</li>
<li>“Chuyển thành bảng.”</li>
<li>“Đưa 3 phương án khác nhau để tôi chọn.”</li>
<li>“Giải thích đơn giản hơn, như cho người mới.”</li>
</ul>
<p>Sửa mãi không được, cuộc chat đã rối → mở cuộc chat mới với một prompt đầy đủ đã rút kinh nghiệm.</p>`,
    promptExample: "Tôi muốn viết thư mời đồng nghiệp tham dự buổi chia sẻ nội bộ.\nTrước khi viết, hãy hỏi tôi tối đa 5 câu để lấy đủ thông tin cần thiết.\nSau khi tôi trả lời, hãy viết bản nháp.",
    pitfalls: [
      "Góp ý chung chung: “chưa hay, viết lại”.",
      "Đổi quá nhiều yêu cầu trong một lần.",
      "Không nói rõ phần nào cần giữ nguyên.",
      "Cố sửa mãi trong một cuộc chat đã rối thay vì mở chat mới với prompt tốt hơn."
    ],
    sources: [AI_SRC.ws, AI_SRC.cdocs, AI_SRC.oai],
    quiz: [
      {
        q: "Góp ý nào giúp AI sửa hiệu quả nhất?",
        options: ["“Chưa hay, viết lại.”", "“Không được.”", "“Giữ mở bài, rút đoạn 2 còn 2 câu và thêm một ví dụ cụ thể.”", "“Cố gắng hơn nhé.”"],
        answer: 2,
        explain: "Góp ý cụ thể nói rõ giữ gì, sửa gì, sửa thế nào – AI sửa đúng chỗ thay vì viết lại ngẫu nhiên."
      },
      {
        q: "Bạn biết mình còn thiếu thông tin nhưng không rõ thiếu gì. Có thể làm gì?",
        options: ["Đoán bừa cho xong", "Yêu cầu AI hỏi bạn những câu cần thiết trước khi viết", "Bỏ cuộc", "Gõ lại y hệt câu cũ"],
        answer: 1,
        explain: "Câu “Trước khi làm, hãy hỏi tôi những thông tin còn thiếu” giúp AI chủ động thu thập đủ thông tin."
      },
      {
        q: "Nút “tạo lại” (regenerate) dùng khi nào?",
        options: ["Muốn một phương án trả lời khác cho cùng yêu cầu", "Muốn xóa tài khoản", "Muốn đổi ngôn ngữ của app", "Muốn lưu file về máy"],
        answer: 0,
        explain: "Tạo lại cho bạn một câu trả lời mới với cùng câu hỏi – hữu ích khi muốn thêm lựa chọn."
      },
      {
        q: "Sau 15 lượt sửa, cuộc chat rối và AI lẫn lộn yêu cầu cũ với mới. Nên làm gì?",
        options: ["Tiếp tục sửa thêm trong cuộc chat đó", "Viết in hoa để AI tập trung", "Chuyển sang app khác và gõ lại câu đầu tiên y hệt", "Mở cuộc chat mới với một prompt đầy đủ, đã rút kinh nghiệm từ các lần trước"],
        answer: 3,
        explain: "Ngữ cảnh rối làm AI lẫn lộn. Bắt đầu lại với prompt tốt hơn thường nhanh hơn sửa tiếp."
      },
      {
        q: "Muốn có nhiều lựa chọn để so sánh, câu nào phù hợp?",
        options: ["“Đưa 3 phương án khác nhau, mỗi phương án 1 câu, kèm ưu nhược điểm.”", "“Viết đi.”", "“Một phương án thôi.”", "“Viết cho đúng.”"],
        answer: 0,
        explain: "Yêu cầu rõ số phương án và tiêu chí so sánh giúp bạn chọn nhanh."
      }
    ]
  },
  {
    id: "n2-03",
    level: 2,
    title: "Cho ví dụ mẫu (few-shot)",
    goal: "Dùng vài ví dụ mẫu để AI làm đúng kiểu, đúng giọng, đúng định dạng mà mô tả bằng lời khó diễn đạt.",
    content: `
<ul>
<li><b>Few-shot</b> = đưa vài ví dụ mẫu (đầu vào → kết quả) để AI bắt chước đúng kiểu bạn muốn. Không có ví dụ nào gọi là <b>zero-shot</b>.</li>
<li>Ví dụ giúp AI hiểu những thứ khó tả bằng lời: giọng văn, độ dài, cách đặt tên, cách phân loại.</li>
<li>Thường 2–5 ví dụ là đủ; ví dụ nên đa dạng và đúng chuẩn bạn muốn.</li>
<li>Tách rõ phần ví dụ với phần cần xử lý (dùng tiêu đề “Ví dụ:”, “Cần làm:” hoặc dấu ---).</li>
<li>AI bắt chước cả lỗi trong ví dụ → chọn ví dụ “chuẩn”.</li>
<li>Không dùng dữ liệu thật nhạy cảm làm ví dụ.</li>
</ul>
<h4>Khi nào nên dùng</h4>
<ul>
<li>Phân loại phản hồi khách hàng hoặc email theo nhóm.</li>
<li>Viết mô tả sản phẩm theo một mẫu cố định.</li>
<li>Đặt tiêu đề, tên file theo quy ước của phòng.</li>
<li>Viết theo giọng văn riêng của bạn.</li>
</ul>`,
    promptExample: "Phân loại mỗi phản hồi khách hàng thành: Khen / Phàn nàn / Hỏi thông tin.\n\nVí dụ:\n“Giao hàng nhanh, đóng gói cẩn thận.” → Khen\n“Sản phẩm bị trầy, tôi muốn đổi.” → Phàn nàn\n“Cửa hàng mở cửa đến mấy giờ?” → Hỏi thông tin\n\nCần phân loại:\n1. “Nhân viên tư vấn rất nhiệt tình.”\n2. “Đơn của tôi đã 5 ngày chưa nhận được.”\n3. “Có giao hàng ra tỉnh không?”",
    pitfalls: [
      "Các ví dụ giống hệt nhau, khiến AI hiểu sai phạm vi.",
      "Ví dụ có lỗi, khiến AI chép theo lỗi.",
      "Không tách rõ ví dụ với phần cần xử lý.",
      "Dùng dữ liệu khách hàng thật làm ví dụ."
    ],
    sources: [AI_SRC.cdocs, AI_SRC.ws, AI_SRC.ms],
    quiz: [
      {
        q: "Few-shot prompting là gì?",
        options: ["Hỏi AI thật ít câu", "Đưa vài ví dụ mẫu để AI làm theo đúng kiểu", "Viết prompt thật ngắn", "Kỹ thuật chỉ dùng cho ảnh"],
        answer: 1,
        explain: "Few-shot = cho AI xem vài mẫu đầu vào → kết quả, để nó làm theo đúng cách bạn muốn."
      },
      {
        q: "Prompt không kèm ví dụ nào được gọi là gì?",
        options: ["Zero-shot", "Multi-shot", "Screenshot", "Hot-shot"],
        answer: 0,
        explain: "Zero-shot = không có ví dụ; AI chỉ dựa vào mô tả bằng lời của bạn."
      },
      {
        q: "Ví dụ mẫu có lỗi chính tả và định dạng lộn xộn. Điều gì dễ xảy ra?",
        options: ["AI luôn tự sửa hết lỗi", "AI từ chối làm", "AI dễ bắt chước cả lỗi và sự lộn xộn đó", "Không ảnh hưởng gì"],
        answer: 2,
        explain: "AI học theo ví dụ rất sát – kể cả lỗi. Ví dụ phải là mẫu chuẩn."
      },
      {
        q: "Việc nào hưởng lợi nhiều nhất từ few-shot?",
        options: ["Hỏi 1 + 1 bằng mấy", "Hỏi thủ đô của Việt Nam", "Chào hỏi AI", "Đặt tên file theo quy ước riêng của phòng"],
        answer: 3,
        explain: "Quy ước riêng khó mô tả đầy đủ bằng lời; vài ví dụ giúp AI hiểu ngay. Câu hỏi kiến thức đơn giản không cần ví dụ."
      },
      {
        q: "Cách trình bày ví dụ nào tốt?",
        options: ["Tách rõ phần “Ví dụ” và phần “Cần xử lý”", "Trộn lẫn ví dụ với nội dung cần xử lý", "Chỉ đưa 1 ví dụ thật dài", "Đưa 50 ví dụ giống hệt nhau"],
        answer: 0,
        explain: "Tách bạch giúp AI biết đâu là mẫu để học, đâu là việc cần làm."
      }
    ]
  },
  {
    id: "n2-04",
    level: 2,
    title: "Chia việc lớn thành chuỗi prompt",
    goal: "Chia một việc lớn thành các bước nhỏ, mỗi bước một prompt, để kiểm soát chất lượng và sửa sai sớm.",
    content: `
<ul>
<li>Nhồi việc lớn (báo cáo, kế hoạch, bài thuyết trình) vào một prompt → kết quả hời hợt, khó kiểm soát.</li>
<li><b>Chuỗi prompt</b> (prompt chaining): chia thành các bước nhỏ, mỗi bước một prompt; kết quả bước trước là đầu vào cho bước sau.</li>
<li>Lợi ích: kiểm tra và sửa từng bước, phát hiện sai sớm, kết quả sâu hơn.</li>
</ul>
<h4>Ví dụ: bài thuyết trình 10 phút</h4>
<ol>
<li>Dàn ý: “Đề xuất dàn ý 5 phần cho bài thuyết trình về …”</li>
<li>Bạn duyệt / sửa và chốt dàn ý.</li>
<li>Nội dung: “Viết nội dung phần 2 theo dàn ý đã chốt, khoảng 150 từ.”</li>
<li>Slide: “Chuyển phần 2 thành 3 slide, mỗi slide tiêu đề + 3 gạch đầu dòng.”</li>
<li>Rà soát: “Đóng vai người nghe khó tính, chỉ ra 3 điểm yếu của bài.”</li>
</ol>
<h4>Mẹo</h4>
<ul>
<li>Đầu chuỗi, nói rõ mục tiêu chung và các bước dự kiến.</li>
<li>Chốt từng bước trước khi đi tiếp: “Dàn ý này ổn, giờ làm phần 1.”</li>
<li>Nhờ AI đề xuất các bước: “Chia việc này thành các bước, chưa làm vội.”</li>
<li>Lưu lại chuỗi prompt hiệu quả để dùng lần sau.</li>
</ul>`,
    promptExample: "Tôi cần chuẩn bị kế hoạch tổ chức buổi team building nửa ngày cho 30 người.\nĐừng viết kế hoạch ngay. Trước tiên, hãy chia công việc thành 5–6 bước, mỗi bước ghi rõ bạn cần tôi cung cấp thông tin gì.\nChúng ta sẽ làm lần lượt từng bước.",
    pitfalls: [
      "Yêu cầu “viết cả báo cáo 20 trang” trong một prompt.",
      "Đi tiếp khi bước trước còn sai.",
      "Quên nhắc lại mục tiêu chung khi chuyển bước.",
      "Không lưu lại chuỗi prompt đã chạy tốt."
    ],
    sources: [AI_SRC.cdocs, AI_SRC.ms, AI_SRC.oai],
    quiz: [
      {
        q: "Chuỗi prompt (prompt chaining) là gì?",
        options: ["Chia việc lớn thành nhiều bước nhỏ, kết quả bước trước dùng cho bước sau", "Gửi cùng một prompt nhiều lần liên tục", "Nối nhiều tài khoản AI với nhau", "Viết một prompt thật dài chứa mọi yêu cầu"],
        answer: 0,
        explain: "Mỗi bước là một prompt; bạn kiểm tra kết quả rồi mới dùng làm đầu vào cho bước kế tiếp."
      },
      {
        q: "Lợi ích chính của chuỗi prompt là gì?",
        options: ["AI chạy nhanh hơn", "Kiểm tra, sửa từng bước và phát hiện sai sớm", "Không cần đọc kết quả", "Tiết kiệm điện"],
        answer: 1,
        explain: "Chia nhỏ giúp bạn kiểm soát chất lượng từng phần thay vì nhận một khối lớn khó sửa."
      },
      {
        q: "Dàn ý ở bước 1 còn sai hướng. Nên làm gì?",
        options: ["Cứ đi tiếp, cuối cùng sửa một lượt", "Bỏ dàn ý, bảo AI viết luôn bài hoàn chỉnh", "Sửa và chốt dàn ý trước khi sang bước tiếp theo", "Mở app khác bắt đầu lại từ đầu"],
        answer: 2,
        explain: "Lỗi ở bước đầu sẽ lan sang mọi bước sau. Sửa sớm tốn ít công nhất."
      },
      {
        q: "Câu nào giúp AI đề xuất các bước trước khi làm?",
        options: ["“Làm luôn đi, không cần hỏi.”", "“Viết hết trong một lần trả lời.”", "“Càng nhanh càng tốt.”", "“Chia việc này thành các bước và liệt kê ra, chưa làm vội.”"],
        answer: 3,
        explain: "Yêu cầu AI lập kế hoạch trước giúp bạn duyệt hướng đi trước khi tốn công làm chi tiết."
      },
      {
        q: "Việc nào nên dùng chuỗi prompt?",
        options: ["Hỏi bây giờ ở Tokyo mấy giờ", "Soạn kế hoạch dự án gồm mục tiêu, lịch, ngân sách, rủi ro", "Dịch một từ", "Hỏi cách viết hoa tên riêng"],
        answer: 1,
        explain: "Việc nhiều phần, cần kiểm soát chất lượng mới cần chia bước. Câu hỏi nhanh thì hỏi thẳng."
      }
    ]
  },
  {
    id: "n2-05",
    level: 2,
    title: "Gửi ảnh / file cho AI",
    goal: "Gửi ảnh và file cho AI đúng cách: kèm yêu cầu rõ, chỉ đúng chỗ cần xem, kiểm tra kết quả và giữ an toàn dữ liệu.",
    content: `
<ul>
<li>Nhiều app AI đọc được <b>ảnh</b> (chụp màn hình, ảnh tài liệu, biểu đồ, bảng) và <b>file</b> (PDF, Word, Excel, slide) – qua nút kẹp giấy / dấu + hoặc kéo thả.</li>
<li>Loại file, dung lượng, số file cho phép khác nhau theo app và gói.</li>
<li><b>Luôn kèm yêu cầu rõ</b>: AI cần biết bạn muốn làm gì với file.</li>
<li><b>Chỉ đúng chỗ</b>: “trang 3”, “cột Doanh số”, “ô màu đỏ trong ảnh”.</li>
<li>Ảnh: chụp rõ, đủ sáng, không nghiêng; cắt bớt phần thừa.</li>
<li>File dài: hỏi theo từng phần, yêu cầu ghi trang / mục để dễ kiểm tra.</li>
<li>Bảng tính, ảnh chụp số: AI có thể đọc nhầm hoặc tính sai → kiểm tra lại các con số quan trọng.</li>
<li><b>An toàn</b>: file thường chứa thông tin nhạy cảm (tên, số điện thoại, giá, chữ ký) – chỉ gửi khi được phép, hoặc che / xóa trước.</li>
</ul>
<h4>Việc hay làm</h4>
<ul>
<li>Chụp thông báo lỗi trên máy tính → hỏi cách xử lý.</li>
<li>Gửi biên bản họp → tóm tắt việc cần làm, ai làm, hạn chót.</li>
<li>Ảnh biểu đồ → giải thích xu hướng chính.</li>
<li>Ảnh hóa đơn, bảng giá → chuyển thành bảng (rồi đối chiếu lại).</li>
</ul>`,
    promptExample: "Tôi gửi kèm file biên bản họp. Hãy liệt kê các việc cần làm dưới dạng bảng 4 cột: Việc, Người phụ trách, Hạn chót, Trang / mục trong biên bản.\nNếu biên bản không ghi người phụ trách hoặc hạn chót, hãy ghi “chưa rõ” – không tự suy đoán.",
    pitfalls: [
      "Gửi file mà không nói cần AI làm gì.",
      "Gửi file có thông tin khách hàng / cá nhân chưa che.",
      "Tin các con số AI đọc từ ảnh hoặc bảng mà không đối chiếu.",
      "Ảnh mờ, nghiêng, chứa nhiều thứ thừa."
    ],
    sources: [AI_SRC.oai, AI_SRC.ws, AI_SRC.ms, AI_SRC.ant],
    quiz: [
      {
        q: "Khi gửi file kèm prompt, điều quan trọng nhất là gì?",
        options: ["File càng nặng càng tốt", "Nói rõ bạn muốn AI làm gì với file", "Đặt tên file bằng tiếng Anh", "Gửi càng nhiều file càng tốt"],
        answer: 1,
        explain: "Không có yêu cầu rõ, AI phải đoán – thường chỉ tóm tắt chung chung."
      },
      {
        q: "AI chuyển ảnh bảng giá thành bảng chữ. Bạn nên làm gì?",
        options: ["Đối chiếu lại các con số quan trọng với ảnh gốc", "Dùng luôn vì AI đọc ảnh rất chính xác", "Xóa ảnh gốc cho gọn máy", "Gửi ngay cho khách hàng"],
        answer: 0,
        explain: "AI có thể đọc nhầm số, nhất là ảnh mờ hoặc bảng phức tạp. Con số quan trọng luôn cần đối chiếu."
      },
      {
        q: "Biên bản họp có số điện thoại và tên khách hàng. Trước khi gửi cho AI công cộng, bạn nên làm gì?",
        options: ["Không cần làm gì, AI không lưu gì cả", "Đổi tên file cho khó đoán", "Nén thành file zip", "Che / xóa thông tin nhạy cảm, hoặc dùng công cụ AI được công ty cho phép"],
        answer: 3,
        explain: "Đổi tên hay nén file không bảo vệ nội dung bên trong. Cần loại bỏ thông tin nhạy cảm hoặc dùng công cụ được phép."
      },
      {
        q: "Cách hỏi về một file PDF 80 trang hiệu quả nhất?",
        options: ["Chỉ gửi trang bìa cho nhẹ", "Hỏi “tóm tắt hết” rồi tin hoàn toàn", "Hỏi theo từng phần và yêu cầu ghi số trang / mục để dễ kiểm tra", "In ra giấy rồi chụp lại từng trang"],
        answer: 2,
        explain: "Hỏi theo phần giúp AI tập trung; số trang / mục giúp bạn kiểm tra lại nhanh."
      },
      {
        q: "Ảnh nào giúp AI đọc tốt nhất?",
        options: ["Ảnh mờ, chụp nghiêng", "Ảnh rõ, đủ sáng, cắt gọn đúng phần cần hỏi", "Ảnh chụp cả bàn làm việc", "Ảnh đã bị nén rất nhỏ"],
        answer: 1,
        explain: "Ảnh rõ và gọn giúp AI đọc đúng nội dung, ít nhầm lẫn."
      }
    ]
  },
  {
    id: "n2-06",
    level: 2,
    title: "Kiểm chứng & hỏi chéo nhiều AI",
    goal: "Có thói quen kiểm chứng câu trả lời của AI: hỏi nguồn, đối chiếu nguồn gốc, để AI tự rà và hỏi chéo nhiều AI.",
    content: `
<p>AI trả lời trôi chảy không có nghĩa là đúng. Luôn có bước kiểm chứng, nhất là với <b>số liệu, quy định pháp luật, y tế, tài chính, kỹ thuật</b>.</p>
<h4>Cách kiểm chứng</h4>
<ul>
<li><b>Hỏi nguồn</b>: “Nêu nguồn cho từng ý” → mở nguồn ra đọc; nguồn không tồn tại hoặc không nói vậy → loại.</li>
<li><b>Đối chiếu nguồn gốc</b>: trang chính thức, văn bản gốc, tài liệu công ty, người có chuyên môn.</li>
<li><b>Để AI tự rà</b>: “Kiểm tra lại câu trả lời, chỉ ra chỗ có thể sai hoặc chưa chắc.”</li>
<li><b>Hỏi theo cách khác</b>: đặt lại câu hỏi từ góc khác; câu trả lời mâu thuẫn là dấu hiệu cần kiểm tra.</li>
<li><b>Hỏi chéo nhiều AI</b>: gửi cùng một prompt cho 2–3 app (ChatGPT, Gemini, Claude, Copilot…) rồi so sánh; chỗ khác nhau là chỗ cần kiểm tra kỹ.</li>
<li><b>Tính toán</b> quan trọng → kiểm tra lại bằng Excel hoặc máy tính.</li>
</ul>
<h4>Nhớ rằng</h4>
<ul>
<li>Nhiều AI cùng đồng ý ≠ chắc chắn đúng – chúng có thể cùng sai.</li>
<li>AI nói “tôi chắc chắn” cũng không phải bằng chứng.</li>
<li>Nguồn gốc đáng tin vẫn là chuẩn cuối cùng.</li>
</ul>`,
    promptExample: "Câu trả lời trước của bạn có nhiều số liệu. Hãy rà lại:\n1. Liệt kê từng số liệu kèm nguồn tôi có thể tự kiểm tra.\n2. Đánh dấu số liệu nào bạn không chắc chắn.\n3. Gợi ý loại nguồn chính thức tôi nên đối chiếu.",
    pitfalls: [
      "Thấy hai AI trả lời giống nhau là tin ngay.",
      "Chỉ hỏi “bạn có chắc không?” rồi tin khi AI nói chắc.",
      "Không mở đường link nguồn ra đọc.",
      "Dùng AI làm nguồn cuối cùng cho thông tin pháp luật, y tế, tài chính."
    ],
    sources: [AI_SRC.oai, AI_SRC.grow, AI_SRC.ws, AI_SRC.ms],
    quiz: [
      {
        q: "Loại thông tin nào cần kiểm chứng kỹ nhất?",
        options: ["Lời chào hỏi", "Số liệu, quy định pháp luật, thông tin y tế / tài chính", "Gợi ý tên vui cho nhóm", "Ý tưởng trang trí phòng họp"],
        answer: 1,
        explain: "Sai ở những loại thông tin này gây hậu quả thật, nên luôn đối chiếu nguồn gốc đáng tin."
      },
      {
        q: "AI đưa ra đường link nguồn. Bước tiếp theo là gì?",
        options: ["Mở link, xem nguồn có tồn tại và có nói đúng như vậy không", "Coi như đã kiểm chứng xong", "Xóa link cho gọn", "Chia sẻ ngay cho đồng nghiệp"],
        answer: 0,
        explain: "AI có thể đưa link không tồn tại hoặc link không nói điều AI viết. Phải mở ra đọc."
      },
      {
        q: "Ba AI cùng đưa ra một con số giống nhau. Kết luận nào đúng?",
        options: ["Chắc chắn đúng 100%", "Chắc chắn sai vì giống nhau là đáng ngờ", "Đáng tin hơn một chút nhưng vẫn cần đối chiếu nguồn gốc, vì các AI có thể cùng sai", "Không cần quan tâm nữa"],
        answer: 2,
        explain: "Các mô hình có thể học từ dữ liệu giống nhau và cùng sai. Nguồn gốc đáng tin mới là chuẩn cuối cùng."
      },
      {
        q: "Lợi ích chính của việc hỏi chéo nhiều AI là gì?",
        options: ["Không cần đọc câu trả lời nữa", "Các AI tự sửa lỗi cho nhau", "Được dùng miễn phí lâu hơn", "Chỗ các AI trả lời khác nhau chỉ ra điểm cần kiểm tra kỹ"],
        answer: 3,
        explain: "Sự khác biệt giữa các câu trả lời là tín hiệu tốt để biết nên kiểm tra chỗ nào."
      },
      {
        q: "Bạn hỏi “Bạn có chắc không?” và AI trả lời “Tôi chắc chắn”. Vậy thì sao?",
        options: ["Vẫn chưa đủ – cần một nguồn gốc độc lập để xác nhận", "Đã đủ để dùng", "AI không bao giờ nói sai nên đúng", "Hỏi lại thêm 10 lần nữa là được"],
        answer: 0,
        explain: "AI có thể khẳng định sai một cách tự tin. Lời tự xác nhận của AI không phải bằng chứng."
      }
    ]
  },
  {
    id: "n2-final",
    level: 2,
    isFinalTest: true,
    title: "Kiểm tra tổng cấp 2: Prompt cho mọi AI",
    goal: "Ôn lại toàn bộ cấp Prompt cho mọi AI (6 bài). Đạt từ 80% (8/10 câu) để mở sang cấp 3.",
    content: `<p>10 câu tổng hợp: công thức prompt, hỏi lại và chỉnh dần, ví dụ mẫu, chuỗi prompt, gửi ảnh / file, kiểm chứng và hỏi chéo.</p>
<ul><li>Chọn đáp án là thấy ngay đúng / sai và lời giải thích.</li><li>Làm xong có thể làm lại; điểm cao nhất được lưu.</li></ul>`,
    promptExample: "",
    pitfalls: [],
    sources: [],
    quiz: [
      {
        q: "Ô “Định dạng” trong prompt dùng để làm gì?",
        options: ["Nói AI đóng vai ai", "Mô tả tình huống", "Quy định hình thức kết quả: bảng, gạch đầu dòng, độ dài", "Đặt tên cho cuộc chat"],
        answer: 2,
        explain: "Định dạng cho AI biết kết quả trông ra sao: kiểu trình bày, độ dài, ngôn ngữ."
      },
      {
        q: "Thêm câu “Người đọc là ban giám đốc, cần nắm vấn đề trong 1 phút” giúp gì?",
        options: ["Không giúp gì", "Giúp AI chọn mức chi tiết và giọng văn phù hợp", "Làm AI trả lời chậm hơn", "Bắt AI trả lời bằng tiếng Anh"],
        answer: 1,
        explain: "Biết người đọc và mục đích, AI tự điều chỉnh độ dài, mức chi tiết và giọng văn."
      },
      {
        q: "AI viết bản nháp gần ổn, chỉ có kết luận yếu. Góp ý nào tốt nhất?",
        options: ["“Giữ nguyên phần thân, viết lại kết luận: nêu rõ 2 bước tiếp theo và người phụ trách.”", "“Viết lại toàn bộ cho hay hơn.”", "“Chưa được, làm lại.”", "“Sửa cho đúng ý tôi.”"],
        answer: 0,
        explain: "Góp ý tốt nói rõ phần giữ, phần sửa và sửa thế nào."
      },
      {
        q: "Few-shot (cho ví dụ mẫu) phù hợp nhất khi nào?",
        options: ["Hỏi một phép tính đơn giản", "Chào hỏi đầu cuộc trò chuyện", "Muốn AI trả lời thật dài", "Muốn AI làm theo đúng mẫu hoặc giọng văn khó mô tả bằng lời"],
        answer: 3,
        explain: "Ví dụ mẫu truyền đạt phong cách, định dạng, quy ước tốt hơn lời mô tả."
      },
      {
        q: "Vì sao nên chia một báo cáo lớn thành chuỗi prompt?",
        options: ["Để AI chạy nhiều lần cho vui", "Để kiểm tra, chỉnh từng bước và có kết quả sâu hơn", "Vì AI chỉ đọc được một câu mỗi lần", "Vì đó là quy định bắt buộc của mọi app"],
        answer: 1,
        explain: "Chia bước giúp kiểm soát chất lượng, phát hiện sai sớm và đi sâu vào từng phần."
      },
      {
        q: "Gửi ảnh chụp màn hình báo lỗi phần mềm, prompt nào tốt nhất?",
        options: ["“Đây.”", "“Sửa đi.”", "“Ảnh là thông báo lỗi khi tôi mở một file Excel. Giải thích lỗi nghĩa là gì và gợi ý 3 cách xử lý, cách dễ làm trước.”", "“Lỗi gì vậy???”"],
        answer: 2,
        explain: "Prompt tốt nêu bối cảnh (mở file Excel), nhiệm vụ (giải thích, gợi ý cách xử lý) và định dạng (3 cách, theo thứ tự)."
      },
      {
        q: "File cần gửi AI có thông tin cá nhân của khách hàng. Cách làm đúng?",
        options: ["Che / xóa thông tin đó, hoặc dùng công cụ AI được công ty phê duyệt", "Gửi luôn vì AI không lưu gì", "Đổi tên file", "Gửi bản PDF thay vì Word"],
        answer: 0,
        explain: "Định dạng hay tên file không thay đổi nội dung. Phải loại bỏ thông tin nhạy cảm hoặc dùng công cụ được phép."
      },
      {
        q: "Hỏi chéo hai AI và nhận được hai con số khác nhau. Nên làm gì?",
        options: ["Chọn con số lớn hơn cho an toàn", "Kiểm tra nguồn gốc đáng tin để xác định con số đúng", "Lấy trung bình hai con số", "Tin app mình hay dùng hơn"],
        answer: 1,
        explain: "Khác biệt là tín hiệu cần kiểm tra. Chỉ nguồn gốc đáng tin mới quyết định được con số đúng."
      },
      {
        q: "Câu nào giúp AI chủ động lấy đủ thông tin trước khi làm?",
        options: ["“Làm ngay, đừng hỏi gì.”", "“Tự đoán phần còn thiếu.”", "“Viết thật dài vào.”", "“Trước khi làm, hãy hỏi tôi những thông tin còn thiếu (tối đa 5 câu).”"],
        answer: 3,
        explain: "Để AI hỏi lại giúp bổ sung thông tin còn thiếu thay vì đoán."
      },
      {
        q: "Vì sao một prompt viết tốt dùng được trên nhiều app AI khác nhau?",
        options: ["Vì mỗi app cần một ngôn ngữ lệnh riêng", "Vì các app đều hiểu ngôn ngữ tự nhiên, và yêu cầu rõ ràng giúp mọi mô hình làm tốt hơn", "Vì prompt chỉ chạy bằng tiếng Anh", "Vì mọi app dùng chung một mô hình"],
        answer: 1,
        explain: "Các app dùng mô hình khác nhau nhưng đều hiểu ngôn ngữ tự nhiên; prompt rõ vai trò, bối cảnh, nhiệm vụ, định dạng hiệu quả ở mọi nơi."
      }
    ]
  }
];
