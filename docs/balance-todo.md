# Bản Nguyên Kỳ Duyên – việc cân bằng chưa làm

Ghi lại để quyết định sau. **Chưa sửa gì trong game.** Số liệu và tên hàm lấy từ `genesis.js` ngày 2026-11-19
(số dòng chỉ gần đúng vì file còn đổi; tìm theo tên hằng số / hàm).

---

## 1. Hệ số thời gian ×6 của tộc trường sinh (`durOf`)

**Trạng thái:** chưa làm.

**Hiện trạng**
- `longLived(C) = C.lifeMax > 200 && C.age >= 30` (dòng ~1824); `durOf(C, k)` (dòng ~1825).
- Khi `longLived`, bốn hoạt động **Tu luyện, Nghỉ ngơi, Học hành, Rèn luyện** kéo dài ×6 số ngày (`ACT_DUR`). Các hoạt động khác không đổi.
- Hệ số theo **tuổi thọ**, không theo chủng tộc: bất cứ nhân vật nào có `lifeMax > 200` (Tinh linh, Huyết tộc, bậc cao…) đều được áp từ năm 30 tuổi.
- Một lượt "Tu luyện" thường là 120–540 ngày; sau ×6 là 720–3.240 ngày (khoảng 2–9 năm game) cho một lần chọn.
- Chỗ khác dùng ngưỡng tuổi thọ: bế quan đột phá ×3 khi `lifeMax > 300` (dòng ~1694); giới hạn số lượt của một đời 220 thay vì 130 khi `lifeMax > 300` (dòng ~1879).

**Cần quyết**
- Hệ số ×6 có đúng ý (một lượt chọn tiêu tốn nhiều năm, hợp với "đời dài") hay làm nhân vật trường sinh tiến chậm / ít sự kiện theo tuổi so với người thường?
- Ngưỡng `lifeMax > 200` và `> 300` có cần xem lại sau khi đấu khí chỉ cộng nửa thọ (`lifeSum`: tổng T0→T9 là 1.550 thay vì 3.100)? Hệ này nay đến các ngưỡng ấy muộn hơn các hệ khác.

**Hướng gợi ý (chưa chọn):** chơi thử vài đời Tinh linh và vài đời Huyết tộc để so số lượt / số sự kiện với đời người thường; sau đó chọn giữ ×6, hạ xuống, hoặc đổi thành hệ số tăng dần theo `lifeMax`.

---

## 2. Vai trò của Mị lực ở cuối game

**Trạng thái:** chưa làm.

**Hiện trạng**
- Mị lực (`mi`) là một trong 6 chỉ số, nhưng **không hệ tu luyện nào** dùng nó làm chỉ số chính (`PATHS[k].st`); chỉ có Huyết tộc · Tiến hóa (`vampE`) cộng Mị lực khi lên bậc.
- Chỉ số này phục vụ chủ yếu thời trẻ và giao tiếp: hoạt động Giao du, sự kiện lập gia đình `a_wed` (cần Mị lực ≥ 8 hoặc có người thương), thiên phú Khuynh Thành.
- Trong 129 lựa chọn có thử chỉ số của các sự kiện, 16 lựa chọn thử Mị lực (so với Thể chất 32, Vận khí 25, Tinh thần 25, Trí tuệ 21, Sức mạnh 10).
- Trong các sự kiện **chỉ bắt đầu từ tuổi 40 trở lên** chỉ có 4 lựa chọn có thử chỉ số và không lựa chọn nào thử Mị lực.

**Cần quyết**
- Có muốn Mị lực còn tác dụng ở trung niên / tuổi già (danh vọng, ngoại giao, thế lực, quý tộc / hoàng tộc), hay chấp nhận đây là chỉ số "đầu đời"?

**Hướng gợi ý (chưa chọn):** thêm vài sự kiện tuổi 40+ thử Mị lực (thế lực, triều đình, thương hội) và một hệ số nhỏ của Mị lực vào danh vọng hoặc điểm gia tộc (`clanScore`).

---

## 3. Cảnh báo trước "vận mệnh chết sớm"

**Trạng thái:** chưa làm.

**Hiện trạng**
- Mỗi đời có một vận mệnh ẩn (`FATE`, `fateRoll`): thọ chung 50%, chết bệnh 20%, tai nạn 20%, kiếp nạn 10%.
- Tuổi định sẵn `at`: chết bệnh ngẫu nhiên từ 25 tuổi đến `lifeMax − 5`; tai nạn 14–70 tuổi (không quá `lifeMax − 8`); kiếp nạn 18–60 tuổi (không quá `lifeMax − 10`).
- Khi `C.age >= at`, `fateDue` ép sự kiện `f_ill` / `f_acc` / `f_hunt` xuất hiện ngay (dòng ~1917); mỗi sự kiện có lối thoát (thuốc, vận khí, sức mạnh, đồng minh…). Phần "cách tránh" có sẵn trong dữ liệu `FATE` nhưng **không hiển thị cho người chơi**.
- Thẻ nhân vật chỉ hiện `❓` cho đến khi đã vượt qua; **không có điềm báo nào trước tuổi `at`**, nên tai nạn và kiếp nạn có thể rơi xuống người chơi chưa kịp chuẩn bị.

**Cần quyết**
- Có thêm cảnh báo không, và mức độ nào: (a) một điềm báo một vài năm trước tuổi `at` ("cảm giác bất an", gợi ý loại tai họa); (b) chỉ hiện gợi ý chung trên thẻ nhân vật; (c) giữ nguyên để tạo bất ngờ.

**Hướng gợi ý (chưa chọn):** phương án (a): thêm điềm báo 1–3 năm trước `at`, ghi cờ trong `C.fate` (ví dụ `warned`) để không lặp, và dùng đúng chữ "Cách tránh" trong `FATE` làm lời gợi ý. Cần giữ bản lưu cũ: chỉ thêm trường, đời đang dở không bị báo muộn.
