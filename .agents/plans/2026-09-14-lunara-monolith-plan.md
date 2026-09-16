# Lunara Spa V2 Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend system for Lunara Spa V2 using a Monolithic Layered Architecture.

**Architecture:** Monolithic Layered (`controller`, `service`, `repository`, `entity`). The backend serves REST APIs and handles Google-only OAuth2 authentication internally.

**Tech Stack:** Java 17, Spring Boot 3.x, Spring Data JPA, Spring Security, OAuth2 Client, MySQL, Redis, JWT.

**Spec:** `database/lunara_spa_v2.dbml` and `.agents/specs/auth_design_spec.md`

## Global Constraints

- Base package: `com.lunaraspa.backend` (adjust to match user's init).
- All IDs must be `Long` (or `Short`/`Byte` as per DBML, but prefer wrapper classes).
- Use `Double` or `BigDecimal` for prices, but stick to team standards.
- Delete operations must be handled carefully (cascade configs as per DBML).
- All responses must be wrapped in a standard JSON response wrapper.

---

### Task 1: Verify Scaffolding & Setup Database Configs

_Since the user created the project via IntelliJ, we just configure properties._

**Files:**

- Modify: `src/main/resources/application.yml`
- Create: `src/main/java/com/lunaraspa/backend/config/RedisConfig.java`

**Interfaces:** N/A

- [ ] **Step 1: Write `application.yml`**
      (MySQL connection, Redis connection, Spring Security OAuth2 credentials placeholders, server port 8080).
- [ ] **Step 2: Commit**

---

### Task 1.5: Core Framework & Base Classes

_Importing best practices from ims-be._

**Files:**

- Create: `src/main/java/com/lunaraspa/backend/core/http/ApiResponse.java`
- Create: `src/main/java/com/lunaraspa/backend/core/http/ResponseBuilder.java`
- Create: `src/main/java/com/lunaraspa/backend/core/handler/GlobalExceptionHandler.java`
- Create: `src/main/java/com/lunaraspa/backend/core/data/BaseRepository.java`
- Create: `src/main/java/com/lunaraspa/backend/core/data/BaseService.java`
- Create: `src/main/java/com/lunaraspa/backend/core/constants/AppConstants.java`
- Create: `src/main/java/com/lunaraspa/backend/core/constants/ResponseMessage.java`

- [ ] **Step 1: Write Core Http classes (ResponseBuilder, ApiResponse, ResponseMessage)**
- [ ] **Step 2: Write GlobalExceptionHandler**
- [ ] **Step 3: Write BaseService and BaseRepository interfaces/classes**
- [ ] **Step 4: Commit**

---

### Task 2: Core Identity Entities (RBAC & Accounts)

**Files:**

- Create: `src/main/java/com/lunaraspa/backend/entity/Role.java`
- Create: `src/main/java/com/lunaraspa/backend/entity/Permission.java`
- Create: `src/main/java/com/lunaraspa/backend/entity/Account.java`
- Create: `src/main/java/com/lunaraspa/backend/entity/CustomerProfile.java`
- Create: `src/main/java/com/lunaraspa/backend/entity/StaffProfile.java`
- Create: Repositories for the above.

**Interfaces:** Database schema matching Identity TableGroup in DBML.

- [ ] **Step 1: Write `Role` and `Permission` entities**
- [ ] **Step 2: Write `Account`, `CustomerProfile`, `StaffProfile` entities**
      (Include JPA relationships and mappedBy fields).
- [ ] **Step 3: Write Spring Data Repositories for all**
      (Include `findByEmail` in `AccountRepository`).
- [ ] **Step 4: Commit**

---

### Task 3: JWT Security & Google OAuth2 Flow

**Files:**

- Create: `src/main/java/com/lunaraspa/backend/security/JwtUtils.java`
- Create: `src/main/java/com/lunaraspa/backend/security/JwtBlacklistService.java`
- Create: `src/main/java/com/lunaraspa/backend/security/CustomOAuth2UserService.java`
- Create: `src/main/java/com/lunaraspa/backend/security/OAuth2AuthenticationSuccessHandler.java`
- Create: `src/main/java/com/lunaraspa/backend/security/SecurityConfig.java`
- Create: `src/main/java/com/lunaraspa/backend/controller/AuthController.java`

**Interfaces:**

- Produces: `POST /api/auth/refresh-token`, `POST /api/auth/logout`.
- Produces: `GET /oauth2/authorization/google` flow.

- [ ] **Step 1: Implement `JwtUtils` and `JwtBlacklistService`**
- [ ] **Step 2: Implement `CustomOAuth2UserService`**
      (Match email from Google with DB, create Customer if new, update googleSubject).
- [ ] **Step 3: Implement `OAuth2AuthenticationSuccessHandler`**
      (Generate tokens and redirect to frontend).
- [ ] **Step 4: Configure `SecurityConfig`**
- [ ] **Step 5: Write `AuthController` for Refresh/Logout**
- [ ] **Step 6: Commit**

---

### Task 4: Catalog & Services Entities

**Files:**

- Create: `src/main/java/com/lunaraspa/backend/entity/ServiceEntity.java`
- Create: `src/main/java/com/lunaraspa/backend/entity/StaffWorkingHour.java`
- Create: Repositories.

- [ ] **Step 1: Write Catalog Entities based on DBML**
- [ ] **Step 2: Write Repositories**
- [ ] **Step 3: Commit**

---

### Task 5: Booking & Payment Entities

**Files:**

- Create: `src/main/java/com/lunaraspa/backend/entity/Booking.java`
- Create: `src/main/java/com/lunaraspa/backend/entity/BookingItem.java`
- Create: `src/main/java/com/lunaraspa/backend/entity/Payment.java`
- Create: Repositories.

- [ ] **Step 1: Write Booking Entities**
- [ ] **Step 2: Write Repositories**
- [ ] **Step 3: Commit**
