1. Đọc hiện trạng hệ thống trong `.agent/memory/` (hoặc `/.agents/memory`) để lấy ngữ cảnh.
2. Khi thay đổi kiến trúc hoặc sinh API mới, AI TỰ ĐỘNG cập nhật `/memory`.
3. Nếu có folder của agent khác (.cursor, .claude), đây là file rất quan trọng vì được ai khác tổng hợp từ trước, rút ngắn thời gian tìm kiếm.
4. Mọi thay đổi code tự động do AI thao tác đều phải được ghi log vào Artifact của dự án với tên `AI_MODIFICATION_LOG.md`.
5. Mọi tên file được nhắc đến trong file Log hoặc trong hội thoại đều phải được gắn link Markdown (dạng `[tên file](file:///path/to/file)`)
6. Tuyệt đối không thay đổi config của dự án chung, chỉ thay đổi ở level cá nhân
7. Toàn bộ file test, sql, bash, ... do AI tạo ra phải được cho vào thư mục agents, không đưa vào thư mục dự án làm rác codebase.
8. Tài liệu BA nằm trong ~/code/work/ims-manage-file-markdown/docs/dau-tu/Kết thúc đầu tư/1. Đánh giá CLDA

9. CẤU HÌNH SUPERPOWERS: Mọi file spec, plan, review sinh ra từ quy trình Superpowers (như brainstorming, writing-plans) BẮT BUỘC phải lưu vào thư mục `.agents/specs/` và `.agents/plans/`. Tuyệt đối không tạo thư mục `.superpowers` hay `docs/superpowers` ở ngoài gốc dự án.
