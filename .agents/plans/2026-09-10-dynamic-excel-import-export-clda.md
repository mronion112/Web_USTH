# [Đánh giá CLDA] Triển khai Sinh file mẫu động và Import Excel 100% theo tài liệu BA & Backend Rules

Tài liệu này đặc tả chi tiết kế hoạch kỹ thuật xây dựng lại chức năng Sinh file mẫu động (`downloadImportTemplate`) và Import dữ liệu Excel (`importFromExcel`) cho màn hình **Đánh giá chất lượng dự án (CLDA)** trong `business-service`, bám sát 100% tài liệu BA và tuân thủ các quy tắc trong [.agents/rules/backend_java_rules.md](file:///home/hoang-vu/code/work/ims-be/.agents/rules/backend_java_rules.md).

---

## User Review Required

> [!IMPORTANT]
> - **Cơ chế động 100% từ Database**: 
>   - Tuyệt đối KHÔNG dùng file Excel mẫu tĩnh, KHÔNG dùng MinIO.
>   - Toàn bộ 4 Sheet được sinh động bằng Apache POI dựa trên cấu hình thực tế trong Database.
> - **Tuân thủ Backend Rules**:
>   - Import toàn bộ thư viện ở đầu file, tuyệt đối không dùng FQN dài dòng.
>   - Không hardcode chuỗi tiếng Việt trong code, sử dụng `AppConstants.ProjectEvaluationMessage`.
>   - Import lỗi trả về JSON mảng lỗi `List<String> importErrors` bọc qua `ResponseBuilder.badRequest(errors)`.
>   - Bắt lỗi theo từng dòng, bỏ qua dòng lỗi và cho phép import các dòng hợp lệ theo đúng quy tắc BA mục 5.

---

## Proposed Changes

### business-service

#### [MODIFY] [AppConstants.java](file:///home/hoang-vu/code/work/ims-be/business-service/src/main/java/com/fis/business/constants/AppConstants.java)
- Bổ sung các hằng số thông báo lỗi import, validation và tiêu đề sheet để loại bỏ hoàn toàn việc hard-code chuỗi tiếng Việt trong Service:
  - `MSG_ROW_PREFIX = "Dòng "`
  - `MSG_PROJECT_NOT_FOUND = ": Mã dự án không tồn tại trong hệ thống: "`
  - `MSG_EVAL_PERIOD_NOT_FOUND = ": Loại đánh giá không tồn tại: "`
  - `SHEET_NAME_CLDA = "Đánh giá CLDA"`
  - `SHEET_NAME_PERIOD = "Loại đánh giá"`
  - `SHEET_NAME_APPROVER = "Người duyệt"`
  - `SHEET_NAME_PROJECT = "Dự án"`

#### [MODIFY] [ProjectEvaluationRepository.java](file:///home/hoang-vu/code/work/ims-be/business-service/src/main/java/com/fis/business/repository/ProjectEvaluationRepository.java)
- Tối ưu câu Native Query lấy Blueprint cấu hình Form động đang hiệu lực (`EVAL_CRITERIAL_LINK.VISIBLE = 1`), sắp xếp chuẩn theo `l.ORD, f.ORD, f.FORM_TYPE`:
  - `criterialId`, `criterialName`, `formName`, `formType`, `dataType`, `require`, `ord`.

#### [MODIFY] [ProjectEvaluationServiceImpl.java](file:///home/hoang-vu/code/work/ims-be/business-service/src/main/java/com/fis/business/service/impl/ProjectEvaluationServiceImpl.java)
- **Chuẩn hóa Code Clean & Imports**:
  - Đưa tất cả import lên đầu file (`XSSFWorkbook`, `XSSFSheet`, `XSSFRow`, `XSSFCell`, `CellStyle`, `Font`, `IndexedColors`, `Map`, `List`, `LocalDate`, `DateTimeFormatter`, v.v.).
  - Xóa bỏ triệt để các FQN dài dòng trong code.
- **Triển khai `downloadImportTemplate()` (Sinh động 100% trên RAM)**:
  - **Sheet 1 (`Đánh giá CLDA`)**:
    - Ghi 5 cột cơ sở: `Mã dự án`, `Loại đánh giá`, `Ngày đánh giá`, `Người duyệt`, `Ngày duyệt`.
    - Query danh sách tiêu chí & form động từ `projectEvaluationRepository.getAllFormBlueprints()`:
      - Duyệt qua từng cấu hình, sinh cột theo quy tắc BA:
        - `FORM_TYPE = 1`: `[Tên tiêu chí] - [Tên trường]`
        - `FORM_TYPE = 2`: `[Tên tiêu chí] - [Tên kết luận]`
    - Tạo dòng dữ liệu mẫu ví dụ (Dòng 1) bám sát BA: `DA001`, `Định kỳ`, `01/02/2026`, `Nguyễn Anh Văn`, `03/02/2026`.
    - Styling chuyên nghiệp: Header background màu xanh nhạt (#F2F4F8 hoặc `GREY_25_PERCENT`), font in đậm, border đầy đủ, tự động căn chỉnh độ rộng cột (`autoSizeColumn`).
  - **Sheet 2 (`Loại đánh giá`)**:
    - Header: `Mã`, `Tên đánh giá`.
    - Đổ danh mục thực tế từ `evalPeriodRepository.findAll()` (lọc `status = 1`).
  - **Sheet 3 (`Người duyệt`)**:
    - Header: `Account`, `Name`, `Role`.
    - Đổ dữ liệu mẫu người duyệt theo danh mục `Admin_Config.Approver_DG` trong tài liệu BA.
  - **Sheet 4 (`Dự án`)**:
    - Header: `Mã dự án`, `Tên dự án`.
    - Đổ danh sách dự án thực tế từ `projectRepository.findAll()` (`projectCode`, `projectName`).
- **Triển khai `importFromExcel(MultipartFile file)`**:
  - Đọc Sheet 1, lấy danh sách Header thực tế.
  - Đọc Blueprint cấu hình từ DB để lập bảng ánh xạ cột (`columnIndex -> {criterialId, evalCriFormId, formType, dataType, require}`).
  - Duyệt từng dòng dữ liệu từ dòng 1:
    - Bắt lỗi theo dòng (`rowErrors`):
      - Kiểm tra bắt buộc: `Mã dự án`, `Loại đánh giá`.
      - Kiểm tra tồn tại của `Mã dự án` trong DB.
      - Kiểm tra tính hợp lệ của `Loại đánh giá`.
      - Kiểm tra các trường cấu hình bắt buộc (`require = 1`).
    - Nếu dòng có lỗi: Ghi vào `importErrors.add("Dòng " + (r + 1) + ": " + rowErrors.toString())`, bỏ qua không lưu dòng này.
    - Nếu dòng hợp lệ:
      - Lưu/cập nhật `PROJECT_EVALUATION`.
      - Khởi tạo danh sách `PROJECT_EVAL_CRITERIAL` theo các tiêu chí xuất hiện.
      - Với các trường thông tin (`FORM_TYPE = 1`): Lưu chi tiết giá trị vào `PROJECT_EVAL_CRI_DETAIL`.
      - Với các kết luận (`FORM_TYPE = 2`): Gom các kết luận được đánh dấu (Có / x / 1) và lưu vào cột `conclusion` của `PROJECT_EVAL_CRITERIAL`.
      - Lưu tất cả xuống DB trong transaction an toàn.
  - Trả về `List<String> importErrors`.

#### [MODIFY] [ProjectEvaluationController.java](file:///home/hoang-vu/code/work/ims-be/business-service/src/main/java/com/fis/business/controller/ProjectEvaluationController.java)
- Đảm bảo API `/import` nhận kết quả `List<String> errors`:
  - Nếu `errors` không rỗng: trả về `ResponseBuilder.badRequest(errors, AppConstants.ProjectEvaluationMessage.IMPORT_FAILED)`.
  - Nếu thành công: trả về `ResponseBuilder.ok(AppConstants.ProjectEvaluationMessage.IMPORT_SUCCESS)`.

---

## Verification Plan

### Automated Tests
- Tạo script kiểm thử độc lập trong `.agents/scripts/test_excel_clda.sh` hoặc test case:
  1. Kiểm tra API `/download-template`:
     - Xác minh file Excel tải về có kích thước > 0, giải nén đọc bằng Python có đúng 4 Sheet.
     - Xác minh Sheet 1 có 5 cột cơ sở + toàn bộ các cột tiêu chí động lấy từ DB (không bị hardcode).
     - Xác minh Sheet 2, 3, 4 có đầy đủ dữ liệu danh mục.
  2. Kiểm tra API `/import`:
     - Test import file hợp lệ: dữ liệu được lưu chuẩn vào các bảng `PROJECT_EVALUATION`, `PROJECT_EVAL_CRITERIAL`, `PROJECT_EVAL_CRI_DETAIL`.
     - Test import file thiếu mã dự án / sai loại đánh giá: API trả về HTTP 400 kèm mảng chi tiết các dòng lỗi.

### Build Verification
- Biên dịch toàn bộ dự án đảm bảo không có bất kỳ lỗi Java/Lombok nào:
  ```bash
  ./gradlew :business-service:compileJava
  ```
