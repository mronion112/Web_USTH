# Design Spec: Monolithic DDD (Package-by-Feature) Refactoring

## 1. Overview
The current codebase suffers from legacy MVC package structures (`entity`, `repository`, `service`, `dto`, `security` at the root). This design completely abolishes these technical packages and distributes all code into their respective Domain/Feature boundaries.

## 2. Target Package Structure

### 2.1 Domain: `authentication_account`
All Identity, Access Management, and Security logic.
- **Entities (`...authentication_account.entity`)**: `Account`, `Role`, `Permission`
- **Repositories (`...authentication_account.repository`)**: `AccountRepository`, `RoleRepository`, `PermissionRepository`
- **Services (`...authentication_account.service`)**: `AuthService`, `AuthServiceImpl`
- **DTOs (`...authentication_account.dto`)**: `AccountResponseDTO`
- **Security (`...authentication_account.security`)**: `JwtUtils`, `JwtAuthenticationFilter`, `SecurityConfig`, `CustomUserDetails`, `OAuth2AuthenticationSuccessHandler`, `CustomOAuth2UserService`, `JwtBlacklistService`, `SecurityUtils`
- *(Existing)* `AuthController`, `CustomAuthorizationManager`, `ApiPermissionRegistry`, `RolePermissionService`, `Guide.md`

### 2.2 Domain: `profiles`
All user profile management logic for Staff and Customers.
- **Entities (`...profiles.entity`)**: `CustomerProfile`, `StaffProfile`
- **Repositories (`...profiles.repository`)**: `CustomerProfileRepository`, `StaffProfileRepository`
- **Services (`...profiles.service`)**: `ProfileService`, `ProfileServiceImpl`
- **DTOs (`...profiles.dto`)**: `ProfileResponseDTO`, `ProfileUpdateRequest`
- *(Existing)* `ProfileController`, `Guide.md`

### 2.3 Cleanup Phase
The following root packages will be permanently **DELETED**:
- `com.kevin.lunaraspa.entity`
- `com.kevin.lunaraspa.repository`
- `com.kevin.lunaraspa.service`
- `com.kevin.lunaraspa.dto`
- `com.kevin.lunaraspa.security`

## 3. Migration Mechanics
- Move all files physically to their new sub-packages.
- Search and replace package declarations across all moved Java files.
- Search and replace import statements across the entire codebase to match the new paths.
- Run `./mvnw clean compile` to ensure zero compilation errors.
