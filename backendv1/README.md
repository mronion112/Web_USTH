# Lunara backend v1

New Spring Boot 3 / Java 17 service. Its schema is created by Flyway from `frontend/schema/v2` and the flows in `frontend/FLOW.md`; it does not reuse the previous backend or database.

## Local startup

1. Install Java 17, Maven and Docker Desktop. In this directory run `docker compose up -d` (MySQL `3307`, Redis `6379`, Kafka `9092`, Mailpit `8025`).
2. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OWNER_EMAIL`, `JWT_SECRET` (at least 32 bytes), `SEPAY_BANK`, `SEPAY_ACCOUNT`, and `SEPAY_HMAC_SECRET`. Never use the local placeholder secrets in deployment. Google OAuth callback URL: `http://localhost:8080/login/oauth2/code/google`; authorized JavaScript origin: `http://localhost:5173`.
3. Run `mvn spring-boot:run -Dspring-boot.run.profiles=local`. Run the React app with `npm run dev` in `frontend/lunara`. Set `VITE_API_URL` if the API is not at `http://localhost:8080`.
4. Mailpit shows sandbox emails and attached ICS calendar invitations at `http://localhost:8025`.

`local` binds only to loopback and offers a simulator: `POST /dev/auth/login` with `{ "email": "owner@example.com", "roleCode": "OWNER" }` creates an isolated local account and cookies; `POST /dev/sepay/transaction` with `{ "bookingCode": "LNR...", "amount": 450000 }` simulates a matching incoming transfer for a logged-in Owner. Neither endpoint exists outside the local profile. The simulator is an alternative to Google/SePay during local testing, not production authentication.

## Flow and authoritative state

Public service/staff catalog → Google OIDC login → availability → `POST /api/v1/bookings` with `Idempotency-Key` → pending booking and SePay VietQR → signed bank webhook → confirmed booking → email/ICS and SSE update → ticket. Service amount/duration, staff allocation, slot occupancy and the 15-minute hold are calculated in MySQL, never trusted from the browser. The booking response returns `holdExpiresAt` and `serverNow`; the browser computes a display countdown from those values and polls for status. A scheduler expires unpaid bookings. Payment after expiration, wrong amount/account/content, or duplicate transfer goes to manual review, not automatic confirmation. Staff rescheduling is manual before check-in; customer requests must have a reason and arrive at least five hours beforehand.

The API uses HttpOnly access/refresh JWT cookies, refresh-token rotation stored as hashes, CSRF double-submit cookie/header, Google OIDC for identity, and DB-backed RBAC permissions for authorization. Google ID tokens are checked only during login; they are **not** the Lunara API JWTs. Use `COOKIE_SECURE=true`, HTTPS, strong secrets and a restricted `FRONTEND_URL` outside local development.

`/api/v1/services` has a Redis cache with explicit invalidation on catalog writes. Booking/availability locks and state are in MySQL; Redis is never the source of truth. Booking events, audit and outbox rows are inserted in the booking transaction. A publisher forwards outbox events to Kafka; consumers send Thymeleaf email/ICS and SSE schedule notifications after commit. Kafka is transport, not booking lock.

## Production checklist

- Configure Google consent screen, authorized callback and owner email.
- Configure the SePay bank account and HMAC webhook secret, and route `POST /webhooks/sepay` over HTTPS. Signature headers are `X-SePay-Timestamp` (Unix seconds) and `X-SePay-Signature` (`sha256=` + HMAC-SHA256 of `timestamp + "." + raw_body`). Keep the secret out of source control.
- Provision durable MySQL, Redis and Kafka, configure backups, SMTP and TLS, then set `DB_URL`, `DB_USER`, `DB_PASSWORD`, `REDIS_HOST`, `KAFKA_BOOTSTRAP`, `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`, `FRONTEND_URL` and `COOKIE_SECURE=true`.
- Run tests with `mvn test`; migrate the database with Flyway on startup. Hibernate uses `validate`, not auto-DDL.

## Current scope

The core booking/payment/ticket path, catalog, staff schedules, accounts/RBAC, basic operations/report endpoints and event delivery are implemented. Some React admin views still display sample data and need API wiring. Docker-based Redis/Kafka/Mailpit delivery and the real Google/SePay integrations require those services and credentials; the local MySQL booking/payment path has been exercised without them.
