# Local workflow. Run from the repository root.
# Setup: cp templates/.env.example templates/.env

COMPOSE = docker compose -f templates/docker-compose.yml
ENV_FILE = templates/.env

MYSQL_ROOT_PASSWORD := $(shell grep -E '^MYSQL_ROOT_PASSWORD=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-)
MYSQL_DATABASE := $(or $(shell grep -E '^MYSQL_DATABASE=' $(ENV_FILE) 2>/dev/null | cut -d= -f2-),lunara_spa)

TABLES = $(shell cat database/expected_tables.txt)

.PHONY: help check-env up up-app down logs seed validate

help:
	@echo "Targets:"
	@echo "  up       Start the local stack (database only until app code exists)"
	@echo "  up-app   Start the full stack (database, backend, frontend)"
	@echo "  down     Stop the local stack"
	@echo "  logs     Follow logs, e.g. make logs SERVICE=db"
	@echo "  seed     Re-import database/Web_DataBase_USTH.sql"
	@echo "  validate Check all expected tables exist"

check-env:
	@test -f $(ENV_FILE) || (echo "Missing $(ENV_FILE). Run: cp templates/.env.example $(ENV_FILE)" >&2; exit 1)

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
	@echo "Seeded database from database/Web_DataBase_USTH.sql"

validate: check-env
	$(COMPOSE) up -d db
	@echo "Waiting for database..."
	@i=1; \
	while [ $$i -le 30 ]; do \
		if $(COMPOSE) exec -T db mysqladmin ping -h localhost --silent >/dev/null 2>&1; then break; fi; \
		i=$$((i + 1)); sleep 2; \
	done
	@actual=$$($(COMPOSE) exec -T db mysql -uroot -p"$(MYSQL_ROOT_PASSWORD)" -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$(MYSQL_DATABASE)';"); \
	missing=0; \
	for t in $(TABLES); do \
		if ! printf '%s\n' "$$actual" | grep -qx "$$t"; then echo "Missing table: $$t"; missing=1; fi; \
	done; \
	if [ "$$missing" -ne 0 ]; then exit 1; fi; \
	echo "Database OK: $(words $(TABLES)) expected tables present."
