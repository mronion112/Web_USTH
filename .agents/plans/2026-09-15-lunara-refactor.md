# Lunara Spa Refactor & Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor existing code to strictly comply with `project_architecture_rules.md` (Lombok, BigDecimal, Modular Exceptions) and implement missing Auth/Profile API features.

**Architecture:** Single-Module Layered Monolith. We will migrate the essential Search/Pagination framework (`SearchRequest`, `PageableResponse`) from `ims-be` to support the frontend's advanced data tables and filtering.

**Tech Stack:** Spring Boot 3, Java 21, MySQL, Spring Data JPA, Lombok.

**Spec:** `/home/hoang-vu/code/work/lunara-spa/.agents/rules/project_architecture_rules.md` and `Web_USTH/backend` Guide documents.

## Global Constraints

- **Lombok on Entities**: `NO @Data`. Use `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@AllArgsConstructor(access = AccessLevel.PRIVATE)`.
- **Numeric Fields**: Force `BigDecimal` for financial data. No `Double`/`Float`.
- **Exception Handling**: Use `AppException` with Domain-specific Enums implementing `BaseErrorCode`. Use `.orElseThrow()` exclusively.
- **API Response**: ALWAYS use `com.kevin.lunaraspa.core.http.ApiResponse`. For Search APIs, the `data` field MUST contain `PageableResponse`.

---

### Task 1: Migrate Core Search & Pagination Framework

**Files:**
- Create: `src/main/java/com/kevin/lunaraspa/core/common/model/request/SearchRequest.java`
- Create: `src/main/java/com/kevin/lunaraspa/core/common/model/request/SortField.java`
- Create: `src/main/java/com/kevin/lunaraspa/core/common/model/Pagination.java`
- Create: `src/main/java/com/kevin/lunaraspa/core/common/model/response/PageableResponse.java`
- Create: `src/main/java/com/kevin/lunaraspa/core/data/util/JpaOrderUtils.java`

**Interfaces:**
- Consumes: Nothing
- Produces: The `SearchRequest` and `PageableResponse` models used across all search endpoints.

- [ ] **Step 1: Write tests for Pagination and SearchRequest models**
Create `src/test/java/com/kevin/lunaraspa/core/common/model/PaginationTest.java` verifying default values (page 0, size 10).

- [ ] **Step 2: Implement Pagination, SortField, SearchRequest, PageableResponse**
Copy implementation from `/home/hoang-vu/code/work/ims-be/library/fis-common/...` and refactor package to `com.kevin.lunaraspa.core.common.model`.

- [ ] **Step 3: Implement JpaOrderUtils**
Copy implementation from `/home/hoang-vu/code/work/ims-be/library/fis-data/...` and refactor package to `com.kevin.lunaraspa.core.data.util`.

- [ ] **Step 4: Run tests**
Run: `./mvnw clean test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/main/java/com/kevin/lunaraspa/core/ src/test/java/com/kevin/lunaraspa/core/
git commit -m "feat(core): migrate SearchRequest, PageableResponse and JpaOrderUtils"
```

### Task 2: Implement Modular Exception Architecture

**Files:**
- Create: `src/main/java/com/kevin/lunaraspa/core/exception/BaseErrorCode.java`
- Create: `src/main/java/com/kevin/lunaraspa/core/exception/AppException.java`
- Modify: `src/main/java/com/kevin/lunaraspa/core/http/GlobalExceptionHandler.java`

**Interfaces:**
- Consumes: `ApiResponse`
- Produces: Core Exception mechanism catching `AppException` and translating to `ApiResponse(success=false)`.

- [ ] **Step 1: Create BaseErrorCode and AppException**
Implement the interfaces defined in `project_architecture_rules.md` (Section 7.1).

- [ ] **Step 2: Update GlobalExceptionHandler**
Refactor the existing `GlobalExceptionHandler` to catch `AppException` and return the `ApiResponse` with `success=false`.

- [ ] **Step 3: Run Compilation checks**
Run: `./mvnw clean compile`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/main/java/com/kevin/lunaraspa/core/exception/ src/main/java/com/kevin/lunaraspa/core/http/GlobalExceptionHandler.java
git commit -m "feat(core): implement Modular Exception Architecture"
```

### Task 3: Refactor Entities and Repositories

**Files:**
- Modify: `src/main/java/com/kevin/lunaraspa/entity/Account.java`
- Modify: `src/main/java/com/kevin/lunaraspa/entity/CustomerProfile.java`
- Modify: `src/main/java/com/kevin/lunaraspa/entity/StaffProfile.java`
- Modify: `src/main/java/com/kevin/lunaraspa/entity/Role.java`
- Modify: `src/main/java/com/kevin/lunaraspa/entity/Permission.java`

**Interfaces:**
- Consumes: JPA schema
- Produces: Strict entities without StackOverflow risks from `@Data`.

- [ ] **Step 1: Fix Lombok Annotations**
For all entities above: Remove `@Data`. Add `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@AllArgsConstructor(access = AccessLevel.PRIVATE)`.

- [ ] **Step 2: Fix Numeric Types**
Check entities for `Double`/`Float`. Change to `BigDecimal`.

- [ ] **Step 3: Run Compilation and Tests**
Run: `./mvnw clean test`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/main/java/com/kevin/lunaraspa/entity/
git commit -m "refactor(entity): apply strict Lombok and BigDecimal rules"
```

### Task 4: Complete Authentication API (100% OAuth2) & Optionals Refactor

**Files:**
- Create: `src/main/java/com/kevin/lunaraspa/security/AuthErrorCode.java`
- Modify: `src/main/java/com/kevin/lunaraspa/security/CustomOAuth2UserService.java`
- Modify: `src/main/java/com/kevin/lunaraspa/security/AuthController.java`

**Interfaces:**
- Consumes: AccountRepository, AppException
- Produces: API `/api/auth/me` and OAuth2 flow.

- [ ] **Step 1: Refactor Optionals & Create AuthErrorCode**
Create `AuthErrorCode`. In `CustomOAuth2UserService`, remove `if (account == null)` checks. Use `accountRepository.findByEmail(email).orElseThrow(() -> new AppException(AuthErrorCode.ACCOUNT_NOT_FOUND))`.

- [ ] **Step 2: Implement /api/auth/me**
In `AuthController`, implement `GET /api/auth/me` returning current user info from SecurityContext.

- [ ] **Step 3: Compile and Test**
Run: `./mvnw clean compile`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/main/java/com/kevin/lunaraspa/security/
git commit -m "feat(auth): implement /me endpoint and refactor optionals"
```

### Task 5: Implement Profile API

**Files:**
- Create: `src/main/java/com/kevin/lunaraspa/controller/ProfileController.java`
- Create: `src/main/java/com/kevin/lunaraspa/service/ProfileService.java`
- Create: `src/main/java/com/kevin/lunaraspa/service/impl/ProfileServiceImpl.java`
- Create: `src/main/java/com/kevin/lunaraspa/dto/profile/ProfileUpdateRequest.java`

**Interfaces:**
- Consumes: `CustomerProfile`, `Account`
- Produces: APIs for users to manage their profiles (`/api/profile/me`).

- [ ] **Step 1: Create ProfileUpdateRequest DTO**
Create DTO for Profile updates using `@Data` and `@Builder`.

- [ ] **Step 2: Implement GET and PUT /api/profile/me**
In `ProfileServiceImpl`, implement the logic to fetch and update Profile.

- [ ] **Step 3: Compile and Test**
Run: `./mvnw clean compile`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/main/java/com/kevin/lunaraspa/controller/ src/main/java/com/kevin/lunaraspa/service/ src/main/java/com/kevin/lunaraspa/dto/profile/
git commit -m "feat(profile): implement profile API per Web_USTH requirements"
```
