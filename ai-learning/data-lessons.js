/* Học sử dụng AI – dữ liệu bài học (DỮ LIỆU MẪU: 2 bài + 1 bài kiểm tra tổng cấp 1; cấp 3 chưa có bài).
   Quy tắc khi thêm / sửa:
   - id bài CỐ ĐỊNH sau khi phát hành (tiến độ người học lưu theo id). Thêm / bớt / đổi thứ tự bài không làm mất bài đã đạt.
     Bắt buộc đổi id → báo chủ dự án (cần bảng đổi tên cũ → mới).
   - level: 1 = Nền tảng, 2 = Prompt cho mọi AI, 3 = Nâng cao. Thứ tự học = level tăng dần, bài kiểm tra tổng (isFinalTest) cuối mỗi cấp.
   - content là HTML do người biên soạn viết (được chèn nguyên văn): chỉ dùng thẻ đơn giản (p, h4, ul, ol, li, b, i, code, a).
     Mọi trường khác là chữ thường và được escape khi hiển thị.
   - quiz[].answer = chỉ số (bắt đầu từ 0) của đáp án đúng trong options. Đạt >= 80% mới mở bài sau.
   - Nội dung dùng chung cho mọi nền tảng (ChatGPT, Gemini, Claude, Copilot…); không ghi giá / giới hạn dễ cũ.
   - Repo public: không đưa dữ liệu nội bộ, khóa API, prompt mật. */
const AI_LEVELS = [
  { level: 1, name: "Nền tảng", desc: "AI là gì, làm được gì, giới hạn ở đâu, dùng an toàn." },
  { level: 2, name: "Prompt cho mọi AI", desc: "Cách ra lệnh rõ ràng, dùng được trên mọi nền tảng." },
  { level: 3, name: "Nâng cao", desc: "Quy trình làm việc, kiểm chứng và tự động hóa." }
];

const LESSONS = [
  {
    id: "n1-01",
    level: 1,
    title: "AI tạo sinh là gì? Làm được gì, không làm được gì",
    goal: "Hiểu chatbot AI thực chất làm gì và không làm gì, để dùng đúng việc và không tin mù quáng.",
    content: `
<p><b>AI tạo sinh</b> (generative AI) là các mô hình đã học từ lượng văn bản, hình ảnh… rất lớn để <b>sinh ra nội dung mới</b>: văn bản, ảnh, mã lập trình.
Các chatbot như ChatGPT, Gemini, Claude, Copilot, Perplexity đều là ứng dụng đặt cạnh một <b>mô hình ngôn ngữ lớn</b> (LLM).</p>
<h4>Cách hoạt động, nói đơn giản</h4>
<p>Mô hình đoán đoạn chữ <i>hợp lý tiếp theo</i> dựa trên những gì bạn đã viết và những gì nó đã học. Vì vậy nó rất giỏi diễn đạt, tóm tắt, dịch, gợi ý ý tưởng,
nhưng nó <b>không tự biết</b> câu mình viết là đúng hay sai.</p>
<h4>Bốn giới hạn cần nhớ</h4>
<ol>
<li><b>Có thể bịa</b> (hallucination): đưa ra số liệu, trích dẫn, đường link nghe rất hợp lý nhưng không có thật.</li>
<li><b>Kiến thức có mốc thời gian</b>: nếu không bật tìm kiếm web hoặc không đưa tài liệu cho nó, AI có thể thiếu thông tin mới.</li>
<li><b>Trí nhớ ngắn hạn có giới hạn</b>: trong một cuộc trò chuyện dài, AI có thể “quên” đoạn đầu.</li>
<li><b>Không ổn định</b>: hỏi cùng một câu hai lần có thể ra hai câu trả lời khác nhau.</li>
</ol>
<h4>Dùng an toàn</h4>
<ul>
<li>Không dán dữ liệu mật (khách hàng, bản vẽ, mật khẩu, tài liệu nội bộ) vào AI công cộng nếu chưa được phép; làm theo chính sách của công ty.</li>
<li>Việc quan trọng: AI soạn nháp – <b>bạn kiểm tra và chịu trách nhiệm</b> bản cuối.</li>
</ul>`,
    promptExample: "Hãy giải thích “dung sai” cho người mới bắt đầu trong 5 câu, kèm 1 ví dụ đời thường.\nNếu có chỗ bạn không chắc chắn, hãy nói rõ chỗ đó thay vì đoán.",
    pitfalls: [
      "Coi câu trả lời trơn tru, tự tin là câu trả lời đúng.",
      "Hỏi số liệu, trích dẫn, đường link rồi dùng luôn mà không đối chiếu nguồn gốc.",
      "Dán dữ liệu nội bộ hoặc thông tin khách hàng vào chatbot công cộng.",
      "Nghĩ mọi AI giống hệt nhau: mỗi ứng dụng dùng mô hình và có tính năng khác nhau."
    ],
    sources: [
      { name: "Wikipedia – Large language model", url: "https://en.wikipedia.org/wiki/Large_language_model" },
      { name: "Wikipedia – Hallucination (artificial intelligence)", url: "https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)" }
    ],
    quiz: [
      {
        q: "Chatbot AI tạo sinh về bản chất làm gì?",
        options: [
          "Tra câu trả lời đã được kiểm chứng trong một cơ sở dữ liệu",
          "Sinh ra nội dung hợp lý dựa trên những gì đã học và ngữ cảnh bạn đưa",
          "Suy nghĩ và hiểu vấn đề giống con người",
          "Chỉ sao chép nguyên văn từ internet"
        ],
        answer: 1,
        explain: "Mô hình sinh ra chữ “hợp lý tiếp theo” từ mẫu đã học và ngữ cảnh bạn đưa. Nó không tra cứu kiểm chứng và không tự biết mình đúng hay sai."
      },
      {
        q: "“Hallucination” (ảo giác) của AI nghĩa là gì?",
        options: [
          "AI từ chối trả lời câu hỏi",
          "AI trả lời rất chậm",
          "AI đưa ra thông tin nghe rất hợp lý nhưng sai hoặc không có thật",
          "AI bị mất kết nối mạng"
        ],
        answer: 2,
        explain: "Hallucination là khi AI “bịa” số liệu, trích dẫn, link… một cách tự tin. Vì vậy thông tin quan trọng luôn phải đối chiếu lại."
      },
      {
        q: "Cần một số liệu hoặc trích dẫn quan trọng từ AI, bạn nên làm gì?",
        options: [
          "Tin ngay vì AI trả lời rất tự tin",
          "Hỏi lại cùng câu cho đến khi ra kết quả mình thích",
          "Thêm câu “hãy chắc chắn là đúng” vào cuối là đủ",
          "Đối chiếu với nguồn gốc đáng tin (tài liệu, trang chính thức) trước khi dùng"
        ],
        answer: 3,
        explain: "Giọng tự tin không đảm bảo đúng. Chỉ nguồn gốc đáng tin mới xác nhận được; thêm “hãy chắc chắn” không biến câu bịa thành sự thật."
      }
    ]
  },
  {
    id: "n1-final",
    level: 1,
    isFinalTest: true,
    title: "Kiểm tra tổng cấp 1: Nền tảng",
    goal: "Ôn lại toàn bộ cấp Nền tảng. Đạt từ 80% để mở sang cấp 2.",
    content: `<p>Bài kiểm tra tổng gồm các câu tổng hợp kiến thức cấp 1: bản chất của AI, giới hạn và cách dùng an toàn. Chọn đáp án là thấy ngay đúng / sai và lời giải thích; làm xong có thể làm lại.</p>`,
    promptExample: "",
    pitfalls: [],
    sources: [],
    quiz: [
      {
        q: "Vì sao không nên dán dữ liệu mật của công ty hoặc khách hàng vào chatbot AI công cộng?",
        options: [
          "Vì AI sẽ từ chối xử lý",
          "Vì dữ liệu có thể bị lưu hoặc lộ ra ngoài phạm vi được phép; cần làm theo chính sách công ty",
          "Vì AI chỉ hiểu dữ liệu công khai",
          "Vì làm ứng dụng chạy chậm đi"
        ],
        answer: 1,
        explain: "Rủi ro nằm ở việc dữ liệu rời khỏi phạm vi kiểm soát của công ty. Hãy hỏi bộ phận IT / quản lý về công cụ AI được phép dùng."
      },
      {
        q: "Câu nào đúng về kiến thức của AI?",
        options: [
          "Mọi AI luôn biết tin tức mới nhất",
          "AI chỉ sai khi câu hỏi quá dài",
          "AI không bao giờ đổi câu trả lời khi hỏi lại",
          "AI có thể thiếu thông tin mới nếu không bật tìm kiếm web hoặc không được đưa tài liệu"
        ],
        answer: 3,
        explain: "Mô hình có mốc kiến thức. Muốn thông tin mới, hãy bật tìm kiếm web (nếu có) hoặc đưa tài liệu cho AI, và vẫn nên kiểm tra nguồn."
      },
      {
        q: "Cách dùng AI nào hợp lý nhất?",
        options: [
          "Để AI quyết định cuối cùng về chất lượng lô hàng mà không ai kiểm tra",
          "Nhờ AI trích đúng từng điều khoản của một tiêu chuẩn rồi dùng luôn",
          "Nhờ AI soạn nháp email, tóm tắt, gợi ý ý tưởng – rồi bạn đọc lại và chỉnh",
          "Dùng AI thay hoàn toàn quy trình kiểm tra"
        ],
        answer: 2,
        explain: "AI mạnh ở soạn nháp, tóm tắt, gợi ý. Quyết định và nội dung quan trọng vẫn cần người kiểm tra và chịu trách nhiệm."
      }
    ]
  },
  {
    id: "n2-01",
    level: 2,
    title: "Viết prompt rõ ràng: công thức 5 ô",
    goal: "Viết được prompt đầy đủ gồm Vai trò – Bối cảnh – Nhiệm vụ – Định dạng – Lưu ý, dùng được trên mọi nền tảng AI.",
    content: `
<p>Prompt tốt giống một bản <b>giao việc cho đồng nghiệp mới</b>: người đó không đọc được suy nghĩ của bạn, nên bạn cần nói đủ.</p>
<h4>5 ô của một prompt</h4>
<ol>
<li><b>Vai trò</b> – AI nên “đứng ở vị trí” nào (ví dụ: kỹ sư chất lượng, biên tập viên).</li>
<li><b>Bối cảnh</b> – tình huống, người đọc là ai, mục đích để làm gì.</li>
<li><b>Nhiệm vụ</b> – việc cụ thể cần làm, bằng động từ rõ ràng (tóm tắt, so sánh, viết, kiểm tra…).</li>
<li><b>Định dạng</b> – kết quả trình bày thế nào: gạch đầu dòng, bảng, độ dài, ngôn ngữ.</li>
<li><b>Lưu ý</b> – điều cần tránh hoặc bắt buộc (không bịa số liệu, nêu chỗ chưa chắc…).</li>
</ol>
<p>Không phải prompt nào cũng cần đủ 5 ô, nhưng <b>Nhiệm vụ</b> gần như luôn bắt buộc. Có thể dùng tab “Trình tạo prompt” để ghép nhanh.</p>
<h4>Làm tốt hơn</h4>
<ul>
<li>Đưa <b>ví dụ mẫu</b> của kết quả mong muốn nếu có.</li>
<li>Chưa vừa ý thì <b>phản hồi cụ thể trong cùng cuộc trò chuyện</b> (giữ phần tốt, nêu phần cần sửa) thay vì bắt đầu lại.</li>
<li>Việc lớn: chia nhỏ thành nhiều bước, mỗi lần một việc.</li>
</ul>`,
    promptExample: "Vai trò: Bạn là kỹ sư chất lượng (QE) có nhiều năm kinh nghiệm trong ngành cơ khí.\nBối cảnh: Tôi cần báo cáo cho quản lý về một lô hàng bị trả do lỗi xước bề mặt; người đọc không chuyên kỹ thuật.\nNhiệm vụ: Viết bản tóm tắt các nguyên nhân gốc có thể và 3 hành động khắc phục.\nĐịnh dạng: Gạch đầu dòng, tối đa 150 từ, tiếng Việt.\nLưu ý: Không bịa số liệu; chỗ nào thiếu dữ liệu hãy ghi “cần xác nhận”.",
    pitfalls: [
      "Prompt quá ngắn, mơ hồ (“viết báo cáo đi”) nên AI phải tự đoán.",
      "Nhồi quá nhiều việc khác nhau vào một prompt.",
      "Không nói người đọc là ai và mục đích là gì.",
      "Không nêu định dạng, độ dài, ngôn ngữ mong muốn.",
      "Kết quả chưa vừa ý thì bỏ cuộc hoặc gõ lại y hệt thay vì phản hồi cụ thể."
    ],
    sources: [
      { name: "OpenAI – Prompt engineering", url: "https://platform.openai.com/docs/guides/prompt-engineering" },
      { name: "Anthropic – Prompt engineering overview", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview" },
      { name: "Google – Prompting strategies (Gemini API)", url: "https://ai.google.dev/gemini-api/docs/prompting-strategies" }
    ],
    quiz: [
      {
        q: "Ô nào giúp AI biết kết quả nên trình bày thế nào (bảng, gạch đầu dòng, độ dài)?",
        options: ["Vai trò", "Bối cảnh", "Định dạng", "Lưu ý"],
        answer: 2,
        explain: "Ô Định dạng quy định hình thức kết quả: kiểu trình bày, độ dài, ngôn ngữ."
      },
      {
        q: "Prompt nào tốt hơn?",
        options: [
          "Viết báo cáo đi",
          "Viết báo cáo lỗi xước bề mặt cho quản lý không chuyên kỹ thuật, tối đa 150 từ, dạng gạch đầu dòng",
          "Báo cáo lỗi, làm nhanh nhất có thể",
          "Hãy là AI giỏi nhất và viết báo cáo hoàn hảo"
        ],
        answer: 1,
        explain: "Prompt tốt nêu rõ việc cần làm, người đọc, độ dài và hình thức. Những lời khen ngợi hay giục giã không thêm thông tin cho AI."
      },
      {
        q: "Kết quả lần đầu chưa vừa ý, cách làm hiệu quả nhất là gì?",
        options: [
          "Kết luận AI kém và bỏ cuộc",
          "Phản hồi cụ thể trong cùng cuộc trò chuyện: giữ phần tốt, nêu rõ phần cần sửa",
          "Mở cuộc trò chuyện mới và gõ lại y hệt",
          "Viết thật nhiều chữ in hoa vào prompt"
        ],
        answer: 1,
        explain: "AI thấy được cả cuộc trò chuyện nên phản hồi cụ thể giúp nó sửa đúng chỗ. Gõ lại y hệt hay viết in hoa không thêm thông tin."
      }
    ]
  }
];
