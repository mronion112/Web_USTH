-- Khởi tạo các Logical Database (Schemas) riêng biệt cho từng Service
CREATE DATABASE IF NOT EXISTS lunara_auth_db;
CREATE DATABASE IF NOT EXISTS lunara_booking_db;
CREATE DATABASE IF NOT EXISTS lunara_spa_db;

-- (Tùy chọn) Có thể tạo các User riêng biệt cho từng DB để bảo mật cao nhất
-- CREATE USER 'auth_user'@'%' IDENTIFIED BY 'auth_pass';
-- GRANT ALL PRIVILEGES ON lunara_auth_db.* TO 'auth_user'@'%';
-- FLUSH PRIVILEGES;
