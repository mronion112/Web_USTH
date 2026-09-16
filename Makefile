# Workflow local. Chạy từ thư mục gốc.
# Khởi tạo: cp templates/.env.example templates/.env
# Quy tắc DB: Web_DataBase_USTH.sql là template cố định chỉ DDL, data do code nạp qua factory/fixture.

COMPOSE = docker compose -f templates/docker-compose.yml
ENV_FILE = templates/.env

MYSQL_ROOT_PASSWORD := $(shell grep -E '^MYSQL_ROOT_PASSWORD=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-)
MYSQL_DATABASE := $(or $(shell grep -E '^MYSQL_DATABASE=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-),lunara_spa)

TABLES = $(shell cat database/expected_tables.txt)

# Biến bắt buộc trong templates/.env, khớp application.yml (không fallback).
REQUIRED_VARS = MYSQL_ROOT_PASSWORD MYSQL_PASSWORD SPRING_DATASOURCE_URL SPRING_DATASOURCE_USERNAME SPRING_DATASOURCE_PASSWORD REDIS_HOST REDIS_PORT JWT_SECRET JWT_EXPIRATION_MS GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET FRONTEND_URL BACKEND_PORT

.PHONY: help check-env up up-app down logs seed schema validate test-backend

help:
	@echo "Targets:"
	@echo "  up           Khởi động stack local (DB template + Redis, chưa có data)"
	@echo "  up-app       Khởi động full stack (database, redis, backend, frontend)"
	@echo "  down         Dừng stack local"
	@echo "  logs         Xem log, ví dụ: make logs SERVICE=db"
	@echo "  seed         Nạp lại schema template database/Web_DataBase_USTH.sql (không kèm data)"
	@echo "  schema       Alias của seed"
	@echo "  validate     Kiểm tra đủ bảng theo kỳ vọng"
	@echo "  test-backend Chạy test backend với factory override (bỏ qua nếu chưa có code)"

check-env:
	@test -f $(ENV_FILE) || (echo "Thiếu $(ENV_FILE). Chạy: cp templates/.env.example $(ENV_FILE)" >&2; exit 1)
	@missing=""; \
	for v in $(REQUIRED_VARS); do \
		if ! grep -qE "^$$v=.+" $(ENV_FILE); then missing="$$missing $$v"; fi; \
	done; \
	if [ -n "$$missing" ]; then echo "Thiếu biến trong $(ENV_FILE):$$missing" >&2; exit 1; fi

up: check-env
	$(COMPOSE) up -d

up-app: check-env
	$(COMPOSE) --profile app up -d --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f $(SERVICE)

seed: check-env
	$(COMPOSE) up -d db
	$(COMPOSE) exec -T db mysql -uroot -p"$(MYSQL_ROOT_PASSWORD)" < database/Web_DataBase_USTH.sql
	@echo "Đã nạp lại schema template từ database/Web_DataBase_USTH.sql (không kèm data)"

schema: seed

validate: check-env
	$(COMPOSE) up -d db
	@echo "Đang chờ database..."
	@i=1; \
	while [ $$i -le 30 ]; do \
		if $(COMPOSE) exec -T db mysqladmin ping -h localhost --silent >/dev/null 2>&1; then break; fi; \
		i=$$((i + 1)); sleep 2; \
	done
	@actual=$$($(COMPOSE) exec -T db mysql -uroot -p"$(MYSQL_ROOT_PASSWORD)" -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$(MYSQL_DATABASE)';"); \
	missing=0; \
	for t in $(TABLES); do \
		if ! printf '%s\n' "$$actual" | grep -qx "$$t"; then echo "Thiếu bảng: $$t"; missing=1; fi; \
	done; \
	if [ "$$missing" -ne 0 ]; then exit 1; fi; \
	echo "Database OK: đủ $(words $(TABLES)) bảng theo kỳ vọng."

test-backend:
	@if [ -f backend/pom.xml ]; then \
		mvn -B -f backend/pom.xml test; \
	else \
		echo "Chưa có code backend, đã bỏ qua."; \
	fi
