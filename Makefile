# Workflow local. Chạy từ thư mục gốc.
# Khởi tạo: cp templates/.env.example templates/.env
# Quy tắc DB: Web_DataBase_USTH.sql là template cố định chỉ DDL, data do code nạp qua factory/fixture.

COMPOSE = docker compose -f templates/docker-compose.yml
ENV_FILE = templates/.env

MYSQL_ROOT_PASSWORD := $(shell grep -E '^MYSQL_ROOT_PASSWORD=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-)
MYSQL_DATABASE := $(or $(shell grep -E '^MYSQL_DATABASE=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-),lunara_spa)

TABLES = $(shell cat database/expected_tables.txt)

# Biến bắt buộc trong templates/.env, khớp application.yml (không fallback).
REQUIRED_VARS = MYSQL_ROOT_PASSWORD MYSQL_PASSWORD SPRING_DATASOURCE_URL SPRING_DATASOURCE_USERNAME SPRING_DATASOURCE_PASSWORD REDIS_HOST REDIS_PORT JWT_SECRET JWT_EXPIRATION_MS GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GEMINI_API_KEY FRONTEND_URL BACKEND_PORT

# Đường dẫn hạ tầng do infra sở hữu. Baseline mặc định là origin/main.
INFRA_PATHS = Makefile templates/ .github/ docs/ database/expected_tables.txt .gitignore
BASELINE ?= origin/main

.PHONY: help check-env up up-app down down-all logs seed schema seed-dataset seed-demo seed-test validate test-backend verify-infra

help:
	@echo "Targets:"
	@echo "  up           Khởi động stack local (DB template + Redis + Chroma, chưa có data)"
	@echo "  up-app       Khởi động full stack (database, redis, backend, frontend)"
	@echo "  down         Dừng stack local (giữ data trong volume)"
	@echo "  down-all     Dừng stack và xóa volume (mất data, up lại seed từ template)"
	@echo "  logs         Xem log, ví dụ: make logs SERVICE=db"
	@echo "  seed         Nạp lại schema template database/Web_DataBase_USTH.sql (không kèm data)"
	@echo "  schema       Alias của seed"
	@echo "  seed-demo    Nạp mock dataset Production (demo, benchmark)"
	@echo "  seed-test    Nạp mock dataset Testing (dev, test nhanh)"
	@echo "  validate     Kiểm tra đủ bảng theo kỳ vọng"
	@echo "  test-backend Chạy test backend với factory override (bỏ qua nếu chưa có code)"
	@echo "  verify-infra Liệt kê file hạ tầng đổi khác so với baseline"

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
	$(COMPOSE) --profile app down

down-all:
	$(COMPOSE) --profile app down -v

logs:
	$(COMPOSE) logs -f $(SERVICE)

seed: check-env
	$(COMPOSE) up -d db
	$(COMPOSE) exec -T db mysql -uroot -p"$(MYSQL_ROOT_PASSWORD)" < database/Web_DataBase_USTH.sql
	@echo "Đã nạp lại schema template từ database/Web_DataBase_USTH.sql (không kèm data)"

schema: seed

# Nạp mock dataset CSV theo database/IMPORT_ORDER.txt.
# DATASET=Production cho demo, Testing cho dev/test. CSV là mock, CRLF, NULL là \N.
seed-demo: DATASET=Production
seed-demo: seed-dataset

seed-test: DATASET=Testing
seed-test: seed-dataset

seed-dataset: seed
	@test -d database/$(DATASET) || (echo "Thiếu database/$(DATASET). Merge nhánh data trước." >&2; exit 1)
	@echo "Nạp mock dataset $(DATASET)..."
	@$(COMPOSE) exec -T db mysql -uroot -p"$(MYSQL_ROOT_PASSWORD)" -e \
		"SET GLOBAL local_infile=1; SET FOREIGN_KEY_CHECKS=0;"
	@for f in $$(sed 's/^[0-9]*\. //;s/\.csv$$//' database/IMPORT_ORDER.txt); do \
		$(COMPOSE) cp database/$(DATASET)/$$f.csv db:/tmp/seed_$$f.csv; \
		$(COMPOSE) exec -T db mysql --local-infile=1 -uroot -p"$(MYSQL_ROOT_PASSWORD)" \
			$(MYSQL_DATABASE) -e \
			"LOAD DATA LOCAL INFILE '/tmp/seed_$$f.csv' INTO TABLE $$f \
			FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\r\n' \
			IGNORE 1 LINES;"; \
		echo "  $$f: $$($(COMPOSE) exec -T db mysql -uroot -p"$(MYSQL_ROOT_PASSWORD)" -N \
			-e "SELECT COUNT(*) FROM $(MYSQL_DATABASE).$$f;") rows"; \
	done
	@$(COMPOSE) exec -T db mysql -uroot -p"$(MYSQL_ROOT_PASSWORD)" -e \
		"SET FOREIGN_KEY_CHECKS=1;"
	@$(COMPOSE) exec -T db sh -c 'rm -f /tmp/seed_*.csv'
	@echo "Đã nạp xong mock dataset $(DATASET)."

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

# Liệt kê file hạ tầng đổi khác so với baseline (mặc định origin/main).
# Đổi ngoài ý muốn thì restore: git checkout <baseline> -- <đường-dẫn>.
# Xóa file hạ tầng thì fail để chặn merge nhầm.
verify-infra:
	@echo "Baseline: $(BASELINE)"
	@deleted=$$(git diff --name-status $(BASELINE)...HEAD -- $(INFRA_PATHS) | grep '^D' || true); \
	if [ -n "$$deleted" ]; then echo "$$deleted"; echo "Có file hạ tầng bị xóa." >&2; exit 1; fi
	@git diff --name-status $(BASELINE)...HEAD -- $(INFRA_PATHS); \
	git status --short -- $(INFRA_PATHS); \
	echo "Xong. Trống nghĩa là hạ tầng khớp baseline."
