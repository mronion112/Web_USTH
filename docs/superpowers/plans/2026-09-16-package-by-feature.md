# Package-by-Feature Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all legacy root-level code (entity, repository, dto, service, security) into their respective domain packages (authentication_account and profiles) to complete the Monolithic DDD structure.

**Architecture:** Use `mv` to relocate files physically, then `sed` to bulk-update package declarations and imports. Ensure old empty directories are removed.

**Tech Stack:** Bash, Maven (for compilation checks), Git.

**Spec:** docs/superpowers/specs/2026-09-16-package-by-feature-design.md

## Global Constraints
- Target package for auth/security: `com.kevin.lunaraspa.authentication_account`
- Target package for profiles: `com.kevin.lunaraspa.profiles`
- The system MUST compile successfully (`./mvnw clean compile`) after all changes.

---

### Task 1: Migrate Authentication and Security Domain

**Files:**
- Create/Move: `src/main/java/com/kevin/lunaraspa/authentication_account/entity/*`
- Create/Move: `src/main/java/com/kevin/lunaraspa/authentication_account/repository/*`
- Create/Move: `src/main/java/com/kevin/lunaraspa/authentication_account/dto/*`
- Create/Move: `src/main/java/com/kevin/lunaraspa/authentication_account/service/*`
- Create/Move: `src/main/java/com/kevin/lunaraspa/authentication_account/security/*`

**Interfaces:**
- Produces: Correctly placed files with updated package declarations and imports.

- [ ] **Step 1: Move physical files for Authentication and Security**

```bash
cd backend/src/main/java/com/kevin/lunaraspa
mkdir -p authentication_account/entity authentication_account/repository authentication_account/dto authentication_account/service authentication_account/security

mv entity/Account.java entity/Role.java entity/Permission.java authentication_account/entity/
mv repository/AccountRepository.java repository/RoleRepository.java repository/PermissionRepository.java authentication_account/repository/
mv dto/auth/AccountResponseDTO.java authentication_account/dto/
mv service/AuthService.java authentication_account/service/
mkdir -p authentication_account/service/impl
mv service/impl/AuthServiceImpl.java authentication_account/service/impl/
mv security/* authentication_account/security/
```

- [ ] **Step 2: Update Package Declarations**

```bash
cd backend/src/main/java/com/kevin/lunaraspa/authentication_account
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.entity;/package com.kevin.lunaraspa.authentication_account.entity;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.repository;/package com.kevin.lunaraspa.authentication_account.repository;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.dto.auth;/package com.kevin.lunaraspa.authentication_account.dto;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.service;/package com.kevin.lunaraspa.authentication_account.service;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.service.impl;/package com.kevin.lunaraspa.authentication_account.service.impl;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.security;/package com.kevin.lunaraspa.authentication_account.security;/g' {} +
```

- [ ] **Step 3: Update Global Imports for Auth components**

```bash
cd backend/src/main/java/com/kevin/lunaraspa
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.entity.Account;/import com.kevin.lunaraspa.authentication_account.entity.Account;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.entity.Role;/import com.kevin.lunaraspa.authentication_account.entity.Role;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.entity.Permission;/import com.kevin.lunaraspa.authentication_account.entity.Permission;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.repository.AccountRepository;/import com.kevin.lunaraspa.authentication_account.repository.AccountRepository;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.repository.RoleRepository;/import com.kevin.lunaraspa.authentication_account.repository.RoleRepository;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.repository.PermissionRepository;/import com.kevin.lunaraspa.authentication_account.repository.PermissionRepository;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.dto.auth./import com.kevin.lunaraspa.authentication_account.dto./g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.service.AuthService;/import com.kevin.lunaraspa.authentication_account.service.AuthService;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.security./import com.kevin.lunaraspa.authentication_account.security./g' {} +
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/kevin/lunaraspa/authentication_account backend/src/main/java/com/kevin/lunaraspa/entity backend/src/main/java/com/kevin/lunaraspa/repository backend/src/main/java/com/kevin/lunaraspa/dto backend/src/main/java/com/kevin/lunaraspa/service backend/src/main/java/com/kevin/lunaraspa/security
git commit -m "refactor: migrate auth and security components to domain package"
```

---

### Task 2: Migrate Profiles Domain

**Files:**
- Create/Move: `src/main/java/com/kevin/lunaraspa/profiles/entity/*`
- Create/Move: `src/main/java/com/kevin/lunaraspa/profiles/repository/*`
- Create/Move: `src/main/java/com/kevin/lunaraspa/profiles/dto/*`
- Create/Move: `src/main/java/com/kevin/lunaraspa/profiles/service/*`

**Interfaces:**
- Produces: Correctly placed files with updated package declarations and imports.

- [ ] **Step 1: Move physical files for Profiles**

```bash
cd backend/src/main/java/com/kevin/lunaraspa
mkdir -p profiles/entity profiles/repository profiles/dto profiles/service/impl

mv entity/CustomerProfile.java entity/StaffProfile.java profiles/entity/
mv repository/CustomerProfileRepository.java repository/StaffProfileRepository.java profiles/repository/
mv dto/profile/ProfileResponseDTO.java dto/profile/ProfileUpdateRequest.java profiles/dto/
mv service/ProfileService.java profiles/service/
mv service/impl/ProfileServiceImpl.java profiles/service/impl/
```

- [ ] **Step 2: Update Package Declarations**

```bash
cd backend/src/main/java/com/kevin/lunaraspa/profiles
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.entity;/package com.kevin.lunaraspa.profiles.entity;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.repository;/package com.kevin.lunaraspa.profiles.repository;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.dto.profile;/package com.kevin.lunaraspa.profiles.dto;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.service;/package com.kevin.lunaraspa.profiles.service;/g' {} +
find . -name "*.java" -exec sed -i 's/package com.kevin.lunaraspa.service.impl;/package com.kevin.lunaraspa.profiles.service.impl;/g' {} +
```

- [ ] **Step 3: Update Global Imports for Profile components**

```bash
cd backend/src/main/java/com/kevin/lunaraspa
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.entity.CustomerProfile;/import com.kevin.lunaraspa.profiles.entity.CustomerProfile;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.entity.StaffProfile;/import com.kevin.lunaraspa.profiles.entity.StaffProfile;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.repository.CustomerProfileRepository;/import com.kevin.lunaraspa.profiles.repository.CustomerProfileRepository;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.repository.StaffProfileRepository;/import com.kevin.lunaraspa.profiles.repository.StaffProfileRepository;/g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.dto.profile./import com.kevin.lunaraspa.profiles.dto./g' {} +
find . -name "*.java" -exec sed -i 's/import com.kevin.lunaraspa.service.ProfileService;/import com.kevin.lunaraspa.profiles.service.ProfileService;/g' {} +
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/kevin/lunaraspa/profiles backend/src/main/java/com/kevin/lunaraspa/entity backend/src/main/java/com/kevin/lunaraspa/repository backend/src/main/java/com/kevin/lunaraspa/dto backend/src/main/java/com/kevin/lunaraspa/service
git commit -m "refactor: migrate profile components to domain package"
```

---

### Task 3: Cleanup and Compile Check

**Files:**
- Modify: `pom.xml` (implicitly via maven)

**Interfaces:**
- Produces: A clean tree with zero compilation errors.

- [ ] **Step 1: Delete empty legacy folders**

```bash
cd backend/src/main/java/com/kevin/lunaraspa
rm -rf entity repository dto service security
```

- [ ] **Step 2: Run Maven Compilation to verify**

```bash
cd backend
./mvnw clean compile
```

- [ ] **Step 3: Commit structural removal**

```bash
git add .
git commit -m "chore: remove legacy mvc packages"
```
