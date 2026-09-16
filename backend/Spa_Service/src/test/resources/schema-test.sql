CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT PRIMARY KEY,
    display_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_profiles (
    account_id BIGINT PRIMARY KEY,
    is_bookable BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_services (
    staff_account_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    PRIMARY KEY (staff_account_id, service_id)
);
