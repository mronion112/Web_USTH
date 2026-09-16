# Khung fixture mẫu cho test backend

Thư viện chốt: `org.instancio:instancio-junit` (bản 6.0.0, tương thích Java 21 và record).
Xem `pom-snippet.xml` để paste dependency scope test vào `backend/pom.xml`.

## Cách dùng

1. Copy 3 file `.java` vào `backend/src/test/java/<package-goc>/fixtures/`.
2. Đổi package `com.example.fixtures` thành package test thật.
3. Thay tên entity, bảng, cột, endpoint theo module. Mọi chỗ cần sửa đã đánh dấu trong comment từng file.
4. Test mới dùng fixture chung, cấm helper `insertX` private trùng logic.

## Quy ước override

- Giá trị mặc định trong fixture luôn hợp lệ với validation của entity.
- Mỗi kịch bản override đúng field phân biệt, không dựng object từ đầu.
- Test repository dùng `DbFixtures` + `@DataJpaTest` + H2, không dùng DB local.
