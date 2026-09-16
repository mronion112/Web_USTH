# Spa Service implementation checklist

Spa Service là một Spring Boot app độc lập nằm hoàn toàn trong:

```text
backend/Spa_Service
```

Chạy Maven Wrapper ngay trong folder này; không phụ thuộc `backend/app` hay code của feature khác.

## Đã hoàn thành

- [x] Tạo branch riêng `feature/spa-service`; không sửa trực tiếp `main`.
- [x] Đóng gói feature thành Maven/Spring Boot app độc lập trong đúng folder feature.
- [x] Map bảng `services` bằng `SpaServiceEntity`.
- [x] Dùng `BigDecimal` cho tiền và `Long` cho ID.
- [x] `GET /api/services` chỉ trả Service active.
- [x] Danh sách sắp theo `display_order`, sau đó `id`.
- [x] `GET /api/services/{id}` trả buffer và staff phù hợp.
- [x] Staff detail đọc từ `staff_services`, `staff_profiles` và `accounts`.
- [x] Service inactive hoặc không tồn tại trả `404`.
- [x] `POST /api/manager/services` tạo Service và trả `201`.
- [x] Tên trùng trả `409`.
- [x] Request sai hoặc JSON hỏng trả `400` theo `ApiResponse` chung.
- [x] Validate giá, thời lượng, buffer và duration-adjustable rule.
- [x] Không trả JPA entity trực tiếp; API dùng DTO.
- [x] Có unit test, validation test, controller test và repository test.
- [x] Native query lấy staff đã được thực thi trong repository test.
- [x] `mvn clean test` pass: 16 tests.
- [x] Đã gọi HTTP local thành công cho create, list, detail, duplicate và invalid ID.
- [x] Có request mẫu tại `backend/Spa_Service/spa-service.http`.
- [x] Ghi API contract và hướng dẫn chạy trong `README.md` và `Guide.md` của feature.

## Còn chờ tích hợp

- [ ] Chạy với MySQL 8.4 thật; máy hiện tại chưa có Docker/MySQL.
- [ ] Tích hợp Authentication/JWT.
- [ ] Bảo vệ `POST /api/manager/services` bằng quyền quản lý Service.
- [ ] Test `401` và `403` sau khi security được tích hợp.
- [ ] Xác nhận với nhóm có thêm `imageUrl` vào create request hay không.
- [ ] Chạy CI trên GitHub sau khi push branch.
- [ ] Mở Pull Request để nhóm trưởng review, không merge trực tiếp vào `main`.

## Ngoài phạm vi Guide hiện tại

- Update Service.
- Bật/tắt hoặc xóa Service.
- Gán/bỏ gán staff cho Service.
- Search/filter/pagination.

Không tự thêm các API trên nếu nhóm chưa cập nhật Guide.
