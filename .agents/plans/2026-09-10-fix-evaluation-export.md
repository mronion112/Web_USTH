# Fix Evaluation Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor hardcoded evaluation logic and sample data generation in `ProjectEvaluationServiceImpl` to comply 100% with the BA specifications.

**Architecture:** We will replace hardcoded samples and DB guesses with actual queries: `ApDomain` for approvers, `Project` with state=1 for projects, and extract inline Vietnamese string matching rules into `AppConstants` for the conclusion processing.

**Tech Stack:** Java, Spring Boot, Spring Data JPA, Apache POI

**Spec:** Refactor per BA docs `Đánh giá chất lượng dự án.md`.

## Global Constraints

- Must follow the project's Clean Code standards.
- Do NOT hardcode Vietnamese text inside logical `if-else` blocks in service files.
- BA compliance is 100% mandatory; no sample rows or extra dummy data allowed.

---

### Task 1: Add Conclusion Constants to AppConstants

**Files:**

- Modify: `business-service/src/main/java/com/fis/business/constants/AppConstants.java`

**Interfaces:**

- Produces: `AppConstants.ProjectEvaluationConclusion` with professional English keys `KEY_DOCUMENT`, `VAL_MISSING`, etc.

- [x] **Step 1: Write the implementation**

Add the following to `AppConstants`:

```java
    public static final class ProjectEvaluationConclusion {
        public static final String KEY_DOCUMENT = "HỒ SƠ";
        public static final String VAL_MISSING = "THIẾU";

        public static final String KEY_VIOLATION = "VI PHẠM";
        public static final String VAL_YES = "Có";

        public static final String KEY_EVALUATION = "ĐÁNH GIÁ";
        public static final String VAL_DELAYED = "Chậm";

        public static final String KEY_DETECTION = "PHÁT HIỆN";
        public static final String VAL_YES_UPPERCASE = "CÓ";

        public static final String KEY_RECOVERY = "THU HỒI";
        public static final String KEY_DEDUCTION = "GIẢM TRỪ";

        public static final String KEY_REMARK = "NHẬN XÉT";
        public static final String KEY_STATUS = "TÌNH HÌNH";
    }
```

- [ ] **Step 2: Commit**

```bash
git add business-service/src/main/java/com/fis/business/constants/AppConstants.java
git commit -m "refactor: extract evaluation conclusion strings to constants"
```

### Task 2: Refactor Conclusion Logic in Service

**Files:**

- Modify: `business-service/src/main/java/com/fis/business/service/impl/ProjectEvaluationServiceImpl.java`

**Interfaces:**

- Consumes: `AppConstants.ProjectEvaluationConclusion`

- [x] **Step 1: Replace hardcoded strings with constants**

Replace the if-else block in `getProjectEvaluations` (around line 382) with the constants from `AppConstants.ProjectEvaluationConclusion`.

```java
                        if (upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_DOCUMENT) && AppConstants.ProjectEvaluationConclusion.VAL_MISSING.equalsIgnoreCase(dtl.getValue())) {
                            res.setViolationQuality(dtl.getValue());
                        } else if (upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_VIOLATION) && AppConstants.ProjectEvaluationConclusion.VAL_YES.equalsIgnoreCase(dtl.getValue())) {
                            res.setViolationProcedure(dtl.getValue());
                        } else if (upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_EVALUATION) && AppConstants.ProjectEvaluationConclusion.VAL_DELAYED.equalsIgnoreCase(dtl.getValue())) {
                            res.setScheduleDelay(dtl.getValue());
                        } else if (upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_DETECTION) && AppConstants.ProjectEvaluationConclusion.VAL_YES_UPPERCASE.equalsIgnoreCase(dtl.getValue())) {
                            res.setWasteLoss(dtl.getValue());
                        } else if (upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_RECOVERY) || upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_DEDUCTION)) {
                            res.setTotalRecovery(dtl.getValue());
                        } else if (upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_REMARK) || upperName.contains(AppConstants.ProjectEvaluationConclusion.KEY_STATUS)) {
                            res.setMonitoringReport(dtl.getValue());
                        }
```

- [ ] **Step 2: Commit**

```bash
git add business-service/src/main/java/com/fis/business/service/impl/ProjectEvaluationServiceImpl.java
git commit -m "refactor: use conclusion constants in project evaluation service"
```

### Task 3: Map Approvers from ApDomain dynamically

**Files:**

- Modify: `business-service/src/main/java/com/fis/business/service/impl/ProjectEvaluationServiceImpl.java`

**Interfaces:**

- Consumes: `ApDomainRepository.findByTypeActive(String)`

- [x] **Step 1: Inject ApDomainRepository**

Add dependency in `ProjectEvaluationServiceImpl`:

```java
import com.fis.business.repository.ApDomainRepository;
import com.fis.business.entity.ApDomain;

// ... inside class ...
private final ApDomainRepository apDomainRepository;

// add to constructor or lombok @RequiredArgsConstructor
```

- [ ] **Step 2: Map Sheet 3 data**

In `downloadImportTemplate`, around line 831, find the `approvers` hardcoded array and replace it with DB query:

```java
            List<ApDomain> domainApprovers = apDomainRepository.findByTypeActive("APPROVER_DG");
            int aRow = 1;
            for (ApDomain approver : domainApprovers) {
                XSSFRow row = sheet3.createRow(aRow++);
                XSSFCell cellAccount = row.createCell(0);
                cellAccount.setCellValue(approver.getCode());
                cellAccount.setCellStyle(dataStyle);

                XSSFCell cellName = row.createCell(1);
                cellName.setCellValue(approver.getName());
                cellName.setCellStyle(dataStyle);

                XSSFCell cellRole = row.createCell(2);
                cellRole.setCellValue(approver.getValue());
                cellRole.setCellStyle(dataStyle);
            }
```

- [ ] **Step 3: Commit**

```bash
git add business-service/src/main/java/com/fis/business/service/impl/ProjectEvaluationServiceImpl.java
git commit -m "feat: fetch approvers dynamically from ApDomain"
```

### Task 4: Map Active Projects dynamically

**Files:**

- Modify: `business-service/src/main/java/com/fis/business/service/impl/ProjectEvaluationServiceImpl.java`

**Interfaces:**

- Consumes: `ProjectRepository.findByProjectState(Integer)`

- [x] **Step 1: Update Project Query**

In `downloadImportTemplate`, around line 849 (Sheet Dự án processing), find `List<Project> projects = projectRepository.findAll();` and replace it with:

```java
            List<Project> projects = projectRepository.findByProjectState(1); // 1 = Active
```

- [ ] **Step 2: Compile & Test**

```bash
./gradlew :business-service:compileJava
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add business-service/src/main/java/com/fis/business/service/impl/ProjectEvaluationServiceImpl.java
git commit -m "feat: fetch active projects for template"
```
