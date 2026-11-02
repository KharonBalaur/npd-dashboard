/**
 * Thiên Công Tông · Tàng Kinh Các – lộ trình tu luyện (14 cảnh giới + Vị Tế, chia 3 giới).
 * window.REALMS = [{ id, order, name, gioi, hex, que, meaning, icon, gate?, topics:[{ id, name, short }] }]
 *  - Thứ tự trong mảng = thứ tự tu luyện. order: 1…14, Vị Tế = 15 (hiển thị "∞").
 *  - gate: cửa ải phải vượt khi đột phá khỏi cảnh giới này ("binh-canh" sau Kết Đan, "thien-kiep" sau Độ Kiếp → phi thăng).
 *  - Nội dung bài (trang, quiz, bài thực hành) có thể thêm vào từng topic: P:[[tiêu đề, [dòng…]]], Q:[[câu hỏi, [4 đáp án], đúng, giải thích]],
 *    task:"đề bài thực hành". Topic chưa có nội dung thì trang web hiện "Đang biên soạn".
 * Hiệu ứng đột phá: breakthrough-fx.js (BreakthroughFX.play(id, { icon })).
 */
window.REALMS = [
  // ---------------- NHÂN GIỚI ----------------
  { id: 'pham-nhan', order: 1, name: 'Phàm Nhân · Khai Mông', gioi: 'Nhân Giới', hex: '䷃', que: 'Mông', meaning: 'Khai mông mở trí', icon: 'img/realms/01-pham-nhan.webp',
    topics: [
      { id: 'qe-role', name: 'Vai trò QE & ISO 9001', short: 'QE làm gì trong nhà máy, hệ thống quản lý chất lượng ISO 9001' },
      { id: 'plant-product', name: 'Sản phẩm & quy trình nhà máy', short: 'Dòng sản phẩm, các công đoạn chính từ linh kiện đến thành phẩm' },
      { id: 'esd-liion', name: 'An toàn ESD & pin Li-ion cơ bản', short: 'Chống tĩnh điện, nguyên tắc an toàn khi làm việc với pin Li-ion' },
    ] },
  { id: 'luyen-the', order: 2, name: 'Luyện Thể', gioi: 'Nhân Giới', hex: '䷉', que: 'Lý', meaning: 'Theo lễ mà đi – kỷ luật', icon: 'img/realms/02-luyen-the.webp',
    topics: [
      { id: '5s', name: '5S', short: 'Nền móng nơi làm việc: sàng lọc, sắp xếp, sạch sẽ, săn sóc, sẵn sàng' },
      { id: 'kaizen', name: 'Kaizen', short: 'Cải tiến liên tục, từng bước nhỏ' },
      { id: 'standard-work', name: 'Standard Work', short: 'Công việc tiêu chuẩn: takt, trình tự, tồn kho tiêu chuẩn' },
      { id: 'visual-andon', name: 'Quản lý trực quan & Andon', short: 'Nhìn là biết bất thường, báo hiệu và phản ứng nhanh' },
    ] },
  { id: 'luyen-khi', order: 3, name: 'Luyện Khí', gioi: 'Nhân Giới', hex: '䷓', que: 'Quan', meaning: 'Quan sát – nhìn bằng dữ liệu', icon: 'img/realms/03-luyen-khi.webp',
    topics: [
      { id: '7qc', name: '7 QC Tools', short: '7 công cụ chất lượng: check sheet, Pareto, xương cá, histogram…' },
      { id: 'drawing-tolerance', name: 'Đọc bản vẽ & dung sai', short: 'Ký hiệu bản vẽ, dung sai kích thước, GD&T cơ bản' },
      { id: 'visual-inspection', name: 'Kiểm ngoại quan & mẫu giới hạn', short: 'Điều kiện kiểm, tiêu chí ngoại quan, mẫu giới hạn (limit sample)' },
    ] },
  { id: 'truc-co', order: 4, name: 'Trúc Cơ', gioi: 'Nhân Giới', hex: '䷻', que: 'Tiết', meaning: 'Chừng mực – tiêu chuẩn chấp nhận', icon: 'img/realms/04-truc-co.webp',
    topics: [
      { id: 'aql', name: 'AQL – ISO 2859-1', short: 'Lấy mẫu chấp nhận theo AQL, cỡ mẫu, Ac / Re' },
      { id: 'iqc-ipqc-oqc', name: 'IQC · IPQC · OQC', short: 'Kiểm soát chất lượng đầu vào, trong quá trình, đầu ra' },
      { id: 'fai', name: 'FAI – kiểm tra mẫu đầu', short: 'First Article Inspection: khi nào làm, làm thế nào' },
    ] },
  { id: 'ket-dan', order: 5, name: 'Kết Đan', gioi: 'Nhân Giới', hex: '䷼', que: 'Trung Phu', meaning: 'Số đo chân thật', icon: 'img/realms/05-ket-dan.webp', gate: 'binh-canh',
    topics: [
      { id: 'msa-grr', name: 'MSA / Gauge R&R', short: 'Phân tích hệ thống đo: lặp lại, tái lập, %GRR, ndc' },
      { id: 'calibration', name: 'Hiệu chuẩn & quản lý thiết bị đo', short: 'Chu kỳ hiệu chuẩn, truy xuất chuẩn, xử lý thiết bị đo lỗi' },
      { id: 'attribute-msa', name: 'MSA kiểm tra cảm quan', short: 'Đánh giá hệ đo thuộc tính (đạt / không đạt), Kappa' },
    ] },
  // ---------------- LINH GIỚI ----------------
  { id: 'nguyen-anh', order: 6, name: 'Nguyên Anh', gioi: 'Linh Giới', hex: '䷑', que: 'Cổ', meaning: 'Sửa cái đã hư', icon: 'img/realms/06-nguyen-anh.webp',
    topics: [
      { id: '5why', name: '5 Why', short: 'Hỏi "tại sao" đến nguyên nhân gốc' },
      { id: '8d', name: '8D', short: '8 bước giải quyết vấn đề theo nhóm' },
      { id: 'pdca-a3', name: 'PDCA & A3', short: 'Vòng PDCA và báo cáo A3 một trang' },
      { id: 'poka-yoke', name: 'Poka-Yoke', short: 'Chống sai lỗi ngay từ thiết kế quá trình' },
      { id: 'complaint-rma', name: 'Khiếu nại khách hàng & RMA', short: 'Tiếp nhận, phân tích hàng trả về, phản hồi khách hàng' },
    ] },
  { id: 'hoa-than', order: 7, name: 'Hóa Thần', gioi: 'Linh Giới', hex: '䷟', que: 'Hằng', meaning: 'Bền vững – quá trình ổn định', icon: 'img/realms/07-hoa-than.webp',
    topics: [
      { id: 'spc', name: 'SPC', short: 'Kiểm soát quá trình bằng thống kê, biểu đồ kiểm soát' },
      { id: 'cpk', name: 'Cp · Cpk', short: 'Năng lực quá trình (σ trong nhóm)' },
      { id: 'ppk', name: 'Pp · Ppk', short: 'Hiệu năng quá trình (σ tổng thể)' },
    ] },
  { id: 'luyen-hu', order: 8, name: 'Luyện Hư', gioi: 'Linh Giới', hex: '䷜', que: 'Khảm', meaning: 'Thấy trước rủi ro', icon: 'img/realms/08-luyen-hu.webp',
    topics: [
      { id: 'dfmea', name: 'DFMEA', short: 'Phân tích rủi ro thiết kế' },
      { id: 'pfmea', name: 'PFMEA', short: 'Phân tích rủi ro quá trình' },
      { id: 'qcp', name: 'QCP / Control Plan', short: 'Kế hoạch kiểm soát chất lượng' },
      { id: 'ecn-eco', name: 'ECN / ECO', short: 'Quản lý thay đổi kỹ thuật' },
    ] },
  { id: 'hop-the', order: 9, name: 'Hợp Thể', gioi: 'Linh Giới', hex: '䷌', que: 'Đồng Nhân', meaning: 'Đồng lòng liên phòng ban', icon: 'img/realms/09-hop-the.webp',
    topics: [
      { id: 'apqp', name: 'APQP', short: 'Hoạch định chất lượng sản phẩm nâng cao' },
      { id: 'npd-tti', name: 'NPD: EP → MP, PSR, NPPR, RTS', short: 'Các giai đoạn phát triển sản phẩm mới đến sản xuất hàng loạt' },
      { id: 'ser-ppap', name: 'SER FA/LA & PPAP', short: 'Duyệt mẫu linh kiện và hồ sơ PPAP' },
      { id: '3p', name: '3P', short: 'Production Preparation Process' },
    ] },
  { id: 'dai-thua', order: 10, name: 'Đại Thừa', gioi: 'Linh Giới', hex: '䷘', que: 'Vô Vọng', meaning: 'Không làm càn – an toàn & tuân thủ', icon: 'img/realms/10-dai-thua.webp',
    topics: [
      { id: 'iec62841', name: 'IEC 62841', short: 'An toàn dụng cụ điện cầm tay (tổng quan)' },
      { id: 'iec62133-un383', name: 'IEC 62133-2 & UN 38.3', short: 'An toàn pin Li-ion và vận chuyển pin (tổng quan)' },
      { id: 'hsf', name: 'HSF: RoHS / REACH', short: 'Chất độc hại hạn chế trong sản phẩm' },
      { id: 'reliability-ust', name: 'Độ tin cậy, NPQ-PEAC & Use Test', short: 'Thử nghiệm độ bền, độ tin cậy và thử dùng thực tế' },
    ] },
  { id: 'do-kiep', order: 11, name: 'Độ Kiếp', gioi: 'Linh Giới', hex: '䷲', que: 'Chấn', meaning: 'Lôi kiếp – thử thách lớn', icon: 'img/realms/11-do-kiep.webp', gate: 'thien-kiep',
    topics: [
      { id: 'iso9001-audit', name: 'Đánh giá nội bộ ISO 9001', short: 'Lập kế hoạch, thực hiện và báo cáo đánh giá' },
      { id: 'lpa', name: 'LPA', short: 'Layered Process Audit – đánh giá quá trình theo tầng' },
      { id: 'supplier-audit', name: 'Đánh giá nhà cung cấp', short: 'Đánh giá năng lực và quá trình của supplier' },
      { id: 'thien-kiep', name: 'Thiên kiếp: bài thi tình huống thật', short: 'Ôn tập tổng hợp và xử lý tình huống thực tế' },
    ] },
  // ---------------- TIÊN GIỚI ----------------
  { id: 'chan-tien', order: 12, name: 'Chân Tiên', gioi: 'Tiên Giới', hex: '䷰', que: 'Cách', meaning: 'Cải cách đổi mới', icon: 'img/realms/12-chan-tien.webp',
    topics: [
      { id: 'jit-kanban', name: 'JIT & Kanban', short: 'Sản xuất đúng lúc và hệ thống kéo' },
      { id: 'oee', name: 'OEE', short: 'Hiệu quả thiết bị tổng thể' },
      { id: 'vsm', name: 'VSM', short: 'Sơ đồ chuỗi giá trị' },
      { id: 'lean-practice', name: 'Thực hành Lean', short: 'Áp dụng Lean vào một quá trình thật' },
    ] },
  { id: 'kim-tien', order: 13, name: 'Kim Tiên', gioi: 'Tiên Giới', hex: '䷱', que: 'Đỉnh', meaning: 'Tinh luyện bằng thống kê', icon: 'img/realms/13-kim-tien.webp',
    topics: [
      { id: 'lss-dmaic', name: 'Lean Six Sigma (DMAIC)', short: 'Define – Measure – Analyze – Improve – Control' },
      { id: 'hypothesis', name: 'Kiểm định giả thuyết', short: 't-test, ANOVA, chi bình phương, p-value' },
      { id: 'doe', name: 'DOE – thiết kế thí nghiệm', short: 'Thí nghiệm giai thừa, tối ưu thông số' },
    ] },
  { id: 'dai-la', order: 14, name: 'Đại La', gioi: 'Tiên Giới', hex: '䷆', que: 'Sư', meaning: 'Làm thầy dẫn lối', icon: 'img/realms/14-dai-la.webp',
    topics: [
      { id: 'truyen-cong', name: 'Truyền công: dạy lại 1 chủ đề', short: 'Soạn và dạy lại một chủ đề cho đồng đội' },
      { id: 'lead-project', name: 'Dẫn dắt dự án cải tiến', short: 'Làm trưởng một dự án chất lượng / cải tiến' },
      { id: 'qe-master', name: 'QE Master', short: 'Tổng kết hành trình, đánh giá năng lực QE toàn diện' },
    ] },
  { id: 'vi-te', order: 15, name: 'Vị Tế', gioi: 'Tiên Giới', hex: '䷿', que: 'Vị Tế', meaning: 'Chưa bao giờ xong', icon: 'img/realms/15-vi-te.webp',
    topics: [] },   // không có bí kíp mới: ôn tập + tái chứng nhận hằng năm
];
