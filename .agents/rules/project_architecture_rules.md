 Backend Stack Standards

## Overview

This document defines the standard patterns and practices for the complete backend stack in the Lunara Spa system, from database entities to REST controllers. All modules must follow these conventions to ensure consistency, maintainability, and code quality.

## Architecture Pattern: Single-Module Layered Monolith

The system follows a **Monolithic architecture** with clear package-level separation between core libraries and business logic:

```
lunara-spa/
├── src/main/java/com/kevin/lunaraspa/
│   ├── core/                        # Core Framework (Formerly FIS libraries)
│   │   ├── cache/                   # Caching utilities
│   │   ├── common/                  # Common utilities & models
│   │   ├── data/                    # Data access abstractions (BaseService, BaseRepository)
│   │   ├── exception/               # Custom exceptions and error codes
│   │   ├── http/                    # ApiResponse & ResponseBuilder
│   │   └── security/                # Security and JWT utilities
│   │
│   ├── entity/                      # JPA Entity classes
│   ├── dto/                         # Data Transfer Objects
│   ├── model/                       # Request/Response models
│   │   ├── request/                 
│   │   └── response/                
│   ├── repository/                  # Repository interfaces
│   ├── service/                     # Service layer interfaces
│   │   └── impl/                    # Service implementations
│   ├── controller/                  # REST Controllers
│   ├── config/                      # Configuration classes
│   └── util/                        # Business utility classes
```

## 1. Entity Layer Standards

### 1.1 Base Entity Structure

```java
@Getter
@Setter
@Entity
@Table(name = "ENTITY_NAME")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EntityName {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ENTITY_NAME_SEQ")
    @SequenceGenerator(sequenceName = "ENTITY_NAME_SEQ", name = "ENTITY_NAME_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "CODE")
    private String code;

    @Column(name = "NAME")
    private String name;

    @Column(name = "DESCRIPTION")
    private String description;

    @Column(name = "STATUS", nullable = false)
    private String status;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "CREATED_USER")
    private String createdUser;
    
    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = AppConstants.Status.ACTIVE;
        }
    }
}
```

### 1.2 Entity Conventions

#### Required Annotations (Lombok & JPA)

**🚨 CRITICAL RULE: NEVER use `@Data` on JPA Entities**
Using `@Data` on Entities generates `hashCode()`, `equals()`, and `toString()` that can trigger lazy-loading exceptions or infinite recursion (StackOverflowError) in bidirectional relationships.

**✅ For Entities:**
- `@Entity`, `@Table(name = "TABLE_NAME")`
- `@Getter`, `@Setter`
- `@Builder` (Highly Recommended for professional instantiation)
- `@NoArgsConstructor(access = AccessLevel.PROTECTED)` - JPA requires a no-arg constructor, but it shouldn't be public.
- `@AllArgsConstructor(access = AccessLevel.PRIVATE)` - Required by `@Builder`.

**✅ For DTOs and Request/Response Models:**
- `@Data` is perfectly fine and recommended for DTOs.
- `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` are highly recommended. If you use `@Builder`, you MUST provide `@AllArgsConstructor` and `@NoArgsConstructor`.

#### ID Field Pattern
```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ENTITY_NAME_SEQ")
@SequenceGenerator(sequenceName = "ENTITY_NAME_SEQ", name = "ENTITY_NAME_SEQ", allocationSize = 1)
@Column(name = "ID")
private Long id;
```

#### Field Patterns
```java
@Column(name = "FIELD_NAME")
private String fieldName;

@Column(name = "STATUS", nullable = false)
private String status;
```

#### Numeric Data Type Standards

**🚨 CRITICAL RULE: Use BigDecimal for Financial/Monetary Fields**

**✅ REQUIRED:**
- Use `BigDecimal` for all monetary, financial, and precise decimal fields (amounts, prices, VAT).
- Use `Integer` for small whole numbers (status codes, counts, quantities).
- Use `Long` for ID fields and large counters.

**❌ FORBIDDEN:**
- Do NOT use `Double` or `Float` for currency or exact measurements (they suffer from floating-point precision loss).

**Example:**
```java
// ✅ CORRECT: Use BigDecimal for exact precision
@Column(name = "AMOUNT")
private BigDecimal amount;

@Column(name = "PRICE")
private BigDecimal price;

// ❌ WRONG: Do NOT use Double for money
@Column(name = "PRICE")
private Double price;  // ❌ Precision issues
```java
// ✅ CORRECT: Use Double for numeric fields
@Column(name = "AMOUNT")
private Double amount;

@Column(name = "VAT_PERCENT")
private Double vatPercent;

@Column(name = "QUANTITY")
private Double quantity;

@Column(name = "PRICE")
private Double price;

// ✅ CORRECT: Use Long for IDs
@Id
@Column(name = "ID")
private Long id;

// ❌ WRONG: Do NOT use BigDecimal
@Column(name = "AMOUNT")
private BigDecimal amount;  // ❌ Not allowed

// ❌ WRONG: Do NOT use Float
@Column(name = "PRICE")
private Float price;  // ❌ Precision issues
```

#### Table Naming Convention
- **Business Tables**: Uppercase table names without prefixes
  - `PRODUCT_CLASS` - Product classification
  - `PRODUCT_ATTRIBUTE` - Product attributes
  - `ACCOUNT_TAX` - Tax accounts
  - `RES_UOM_CLASS` - Unit of measure classes
  - `WM_WORK_CATEGORY` - Work categories
  - `WM_WORK_GROUP` - Work groups


#### Hierarchical Data Pattern
For tree structures like ProductClass:
```java
@OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
private List<ProductClass> children;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "PARENT_ID")
private ProductClass parent;
```

## 2. Model Layer Standards

### 2.1 Request Models

#### Filter Request Pattern
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class EntityNameFilterRequest extends PagingBase {
    private String fieldName;
    private String validFrom;
    private String validTo;
    // Additional filter fields...
}
```

#### Add Request Pattern
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityNameAddRequest {
    private String fieldName;
    private LocalDate validFrom;
    private LocalDate validTo;
    // Required fields for creation...
}
```

#### Edit Request Pattern
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityNameEditRequest {
    private String fieldName;
    private LocalDate validTo;
    // Editable fields only...
}
```

### 2.2 Response Models

#### List Response Pattern
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityNameResponse {
    private UUID id;
    private String fieldName;
    private LocalDate validFrom;
    private LocalDate validTo;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
```

#### Detail Response Pattern
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityNameDetailResponse {
    private String fieldName;
    private String computedLabel;
    private List<String> computedList;
    private String version;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
```

### 2.3 Model Conventions

#### Required Annotations
- `@Data`, `@AllArgsConstructor`, `@NoArgsConstructor` - Lombok annotations
- `@ToString` - For filter requests
- Extend `PagingBase` for filter requests

#### Field Naming
- Use camelCase for field names
- Use consistent Vietnamese field names: `validFrom`, `validTo`
- Include audit fields: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

## 3. Repository Layer Standards

### 3.1 Repository Interface Pattern

```java
@Repository
public interface EntityNameRepository extends BaseRepository<EntityName, Long> {
    
    // Custom queries for hierarchical data (MySQL WITH RECURSIVE CTE)
    @Query(value = "WITH RECURSIVE EntityTree AS (" +
                   "  SELECT * FROM ENTITY_NAME WHERE id = :id AND status = :status " +
                   "  UNION ALL " +
                   "  SELECT e.* FROM ENTITY_NAME e INNER JOIN EntityTree et ON e.parent_id = et.id " +
                   ") SELECT * FROM EntityTree", nativeQuery = true)
    List<EntityName> findTree(Long id, String status);
    
    // Standard Spring Data JPA methods are inherited from BaseRepository
    // BaseRepository extends JpaRepository<T, ID> and JpaSpecificationExecutor<T>
}
```

### 3.2 Repository Conventions

#### Required Extensions
- `BaseRepository<EntityName, Long>` - Extended repository with batch operations
- BaseRepository includes:
  - `JpaRepository<T, ID>` - Basic CRUD operations  
  - `JpaSpecificationExecutor<T>` - Dynamic query support
  - Batch operations: `insertBatch()`, `updateBatch()`, `deleteBatchByIds()`
  - Advanced queries: `findAllByIds()`, `findExistingIds()`

#### Method Naming Pattern (Spring Data JPA Standard)
**Use Spring Data JPA method naming conventions instead of @Query annotations when possible:**

- `existsByFieldAndTrangThaiNotAndDanhDauXoaIsNull()` - Check existence with soft delete
- `findByIdAndTrangThaiNotAndDanhDauXoaIsNull()` - Find by ID with soft delete
- `findByFieldAndTrangThaiNotAndDanhDauXoaIsNull()` - Find by field with soft delete
- `findAllByParentFieldAndTrangThaiNotAndDanhDauXoaIsNull()` - Find children with soft delete

**Standard Lunara Spa pattern using `isDeleted` field:**
- `existsByCodeAndIsDeleted(String code, String isDeleted)` - Check existence
- `findByIdAndIsDeleted(UUID id, String isDeleted)` - Find by ID
- `findByCodeAndIsDeleted(String code, String isDeleted)` - Find by code
- `findByIsDeletedOrderByCreatedDateDesc(String isDeleted)` - Find all active
- `findAllByStatusAndIsDeleted(String status, String isDeleted)` - Find by status
- `findAllByParentCodeAndIsDeleted(String parentCode, String isDeleted)` - Find children

**When to use @Query annotations:**
- Complex date range queries with CURRENT_DATE
- Multi-table joins with FETCH clauses
- Complex business logic that cannot be expressed in method names
- Custom aggregate functions or calculations

#### Required Annotations
- `@Repository` - Mark as Spring repository

#### Example Implementation Patterns

**Standard Pattern (preferred):**
```java
@Repository
public interface EntityNameRepository extends JpaRepository<EntityName, UUID>, JpaSpecificationExecutor<EntityName> {
    
    // Existence checks with soft delete
    boolean existsByCodeAndTrangThaiNotAndDanhDauXoaIsNull(String code, String status);
    
    // Find by ID with soft delete check
    EntityName findByIdAndTrangThaiNotAndDanhDauXoaIsNull(UUID id, String status);
    
    // Find by code with soft delete check
    EntityName findByCodeAndTrangThaiNotAndDanhDauXoaIsNull(String code, String status);
    
    // Find children (for hierarchical data)
    List<EntityName> findAllByParentCodeAndTrangThaiNotAndDanhDauXoaIsNull(String parentCode, String status);
}
```

**For isDeleted field pattern:**
```java
@Repository
public interface PersonalRepository extends JpaRepository<Personal, UUID>, JpaSpecificationExecutor<Personal> {
    
    // Existence checks with soft delete
    boolean existsByPersonalCodeAndIsDeleted(String personalCode, String isDeleted);
    
    // Find by ID with soft delete check
    Optional<Personal> findByIdAndIsDeleted(UUID id, String isDeleted);
    
    // Find by personal code with soft delete check
    Optional<Personal> findByPersonalCodeAndIsDeleted(String personalCode, String isDeleted);
    
    // Find all active personals
    List<Personal> findByIsDeletedOrderByCreatedDateDesc(String isDeleted);
}
```

**When @Query is necessary:**
```java
@Repository
public interface PersonalRelationshipRepository extends JpaRepository<PersonalRelationship, UUID>, JpaSpecificationExecutor<PersonalRelationship> {
    
    // Simple queries use method naming
    List<PersonalRelationship> findAllByPersonalCode(String personalCode);
    boolean existsByPersonalCodeAndOrgCode(String personalCode, String orgCode);
    
    // Complex queries requiring JPQL
    @Query("SELECT pr FROM PersonalRelationship pr " +
           "WHERE pr.personalCode = :personalCode " +
           "AND (pr.validTo IS NULL OR pr.validTo >= CURRENT_DATE) " +
           "AND pr.status = 'A'")
    Optional<PersonalRelationship> findActiveRelationship(
        @Param("personalCode") String personalCode,
        @Param("orgCode") String orgCode);
}
```

## 4. Service Layer Standards

### 4.1 Service Interface Pattern

```java
import com.kevin.lunaraspa.core.common.model.response.PageableResponse;
import com.kevin.lunaraspa.core.common.model.request.SearchRequest;
import com.kevin.lunaraspa.core.data.service.BaseService;

/**
 * Service interface extends BaseService (interface), NOT BaseServiceImpl (class)
 */
public interface EntityNameService extends BaseService<EntityName, Long> {
    EntityNameDto addNewEntityName(EntityNameDto dto);
    PageableResponse<EntityNameDto> getAllEntityNames(int page, int size);
    void deleteEntityName(Long id);
    EntityNameDto updateEntityName(EntityNameDto dto);
    PageableResponse<EntityNameDto> searchEntityNames(SearchRequest<EntityNameRequest> request);
    List<EntityNameDto> findTree(Long id, String status);
}
```

**Key Points:**
- Service **interface** extends `BaseService<Entity, ID>` (interface from core-data)
- Import paths:
  - `com.kevin.lunaraspa.core.common.model.response.PageableResponse` (note: `.response` package)
  - `com.kevin.lunaraspa.core.common.model.request.SearchRequest` (note: `.request` package)

### 4.2 Service Implementation Pattern

```java
import com.kevin.lunaraspa.core.common.model.response.PageableResponse;
import com.kevin.lunaraspa.core.common.model.request.SearchRequest;
import com.kevin.lunaraspa.core.common.model.Pagination;
import com.kevin.lunaraspa.core.data.service.impl.BaseServiceImpl;
import com.kevin.lunaraspa.core.data.util.JpaOrderUtils;
import com.kevin.lunaraspa.core.security.util.SecurityUtils;
import com.kevin.lunaraspa.constants.AppConstants;

/**
 * Service implementation extends BaseServiceImpl (class from core-data)
 * Uses constructor injection WITH @RequiredArgsConstructor (Mandatory)
 */
@Service
@Transactional
@RequiredArgsConstructor
public class EntityNameServiceImpl extends BaseServiceImpl<EntityName, Long, EntityNameRepository> implements EntityNameService {

    private final EntityNameMapper entityNameMapper;
    private final MessageSource messageSource;

    @Override
    public EntityNameDto addNewEntityName(EntityNameDto dto) {
        validateValue(dto);
        EntityName entity = entityNameMapper.toEntity(dto);
        
        // Use SecurityUtils from core-security
        entity.setCreatedUser(SecurityUtils.getUsername());
        entity.setCreatedDate(LocalDateTime.now());
        
        // Use AppConstants for status values
        entity.setStatus(AppConstants.Status.ACTIVE); // "ACTIVE" (String)
        
        EntityName savedEntity = save(entity); // Use BaseService's save method
        return entityNameMapper.toDto(savedEntity);
    }
    
    @Override
    public PageableResponse<EntityNameDto> searchEntityNames(SearchRequest<EntityNameRequest> request) {
        // Extract filter with default
        EntityNameRequest filter = request.getFilter() != null 
            ? request.getFilter() 
            : new EntityNameRequest();
        
        // Extract pagination with default (from core-common)
        Pagination pagination = request.getPagination() != null 
            ? request.getPagination() 
            : new Pagination();
        
        // Build specification
        Specification<EntityName> spec = EntityNameSpecification.buildSpecification(filter);
        
        // Use JpaOrderUtils from core-data for sorting
        Sort sort = JpaOrderUtils.buildSort(request.getSorts());
        if (sort.isUnsorted()) {
            sort = Sort.by(Sort.Direction.DESC, "createdDate");
        }
        
        Pageable pageable = PageRequest.of(pagination.getPage(), pagination.getSize(), sort);
        Page<EntityName> page = findAll(spec, pageable); // BaseService method
        
        List<EntityNameDto> content = entityNameMapper.toDtoList(page.getContent());
        
        return PageableResponse.<EntityNameDto>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .numberOfElements(page.getNumberOfElements())
                .build();
    }

    @Override
    public void deleteEntityName(Long id) {
        EntityName entity = repo.findById(id)
            .orElseThrow(() -> new AppException(EntityErrorCode.ENTITY_NOT_FOUND));
            
        entity.setStatus(AppConstants.Status.DEACTIVE);
        repo.save(entity);
    }

    @Override
    public EntityNameDto updateEntityName(EntityNameDto dto) {
        checkUpdateEntity(dto);
        EntityName entity = entityNameMapper.toEntity(dto);
        
        if (dto.getParentID() != null) {
            EntityName parent = repo.findById(dto.getParentID())
                .orElseThrow(() -> new AppException(EntityErrorCode.PARENT_NOT_FOUND));
            entity.setParent(parent);
        }
        
        return entityNameMapper.toDto(repo.save(entity));
    }

    @Override
    public PageableResponse<EntityNameDto> searchEntityNames(SearchRequest<EntityNameRequest> request) {
        Specification<EntityName> specification = EntityNameSpecification
                .hasCode(request.getFilter().getCode())
                .and(EntityNameSpecification.hasName(request.getFilter().getName()))
                .and(EntityNameSpecification.hasStatus(request.getFilter().getStatus()))
                .and(EntityNameSpecification.hasParentID(request.getFilter().getParentID()));
                
        Pageable pageable = PageRequest.of(request.getPagination().getPage(), request.getPagination().getSize());
        Page<EntityName> entities = repo.findAll(specification, pageable);
        
        List<EntityNameDto> list = entities.getContent().stream()
                .map(entityNameMapper::toDto)
                .toList();

        return PageableResponse.<EntityNameDto>builder()
                .content(list)
                .totalPages(entities.getTotalPages())
                .totalElements(entities.getTotalElements())
                .pageSize(request.getPagination().getSize())
                .numberOfElements(entities.getNumberOfElements())
                .build();
    }

    @Override
    public List<EntityNameDto> findTree(Long id, String status) {
        List<EntityName> lstData = (id == null) ? repo.getAllTree(status) : repo.findTree(id, status);
        return lstData.stream()
            .map(entityNameMapper::toDto)
            .toList();
    }

    private void validateValue(EntityNameDto dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new ValidationException(messageHelper.getMessage("entityController.msg.condition.nameValidate"));
        } else if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new ValidationException(messageHelper.getMessage("entityController.msg.condition.codeValidate"));
        } else if (!AppConstants.Status.ACTIVE.equals(dto.getStatus()) && !AppConstants.Status.DEACTIVE.equals(dto.getStatus())) {
            throw new ValidationException(messageHelper.getMessage("entityController.msg.condition.StatusValidate", 
                    AppConstants.Status.ACTIVE, AppConstants.Status.DEACTIVE));
        }
    }

    private void checkUpdateEntity(EntityNameDto dto) {
        if (dto.getId() == null) {
            throw new ValidationException(messageHelper.getMessage("entityController.msg.condition.idValidate"));
        }

        EntityName existingEntity = repo.findById(dto.getId())
                .orElseThrow(() -> new ValidationException(messageHelper.getMessage("entityController.msg.condition.isExisted")));

        // Apply existing values for null fields
        if (ValidationUtils.isNullOrEmpty(dto.getName())) {
            dto.setName(existingEntity.getName());
        }
        if (ValidationUtils.isNullOrEmpty(dto.getCode())) {
            dto.setCode(existingEntity.getCode());
        }
        if (ValidationUtils.isNullOrEmpty(dto.getStatus())) {
            dto.setStatus(existingEntity.getStatus());
        }
        // ... other field validations
    }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> all(EntityNameFilterRequest filter) {
        // Implementation with pagination
        Specification<EntityName> specification = createSpecification(filter);
        Page<EntityName> entities = repository.findAll(
                specification, ServiceHelper.createPageable(filter.getPageNumber(), filter.getPageSize())
        );
        
        return ServiceHelper.createResponse(filter.getPageNumber(), filter.getPageSize(), entities, EntityNameResponse.class, modelMapper);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public EntityNameDetailResponse add(ApiRequest apiRequest) {
        EntityNameAddRequest request = ServiceHelper.convertToModelRequest(apiRequest, EntityNameAddRequest.class);
        
        // Validate unique constraint
        if (repository.existsByCodeAndTrangThaiNotAndDanhDauXoaIsNull(
                request.getCode(), StatusEntityEnum.EXPIRED.getCode())) {
            String errorMessage = messageSource.getMessage("entity.code.is.exist.warning.message",
                    new Object[]{request.getCode()}, getCurrentLocale());
            throw new IllegalStateException(errorMessage);
        }
        
        EntityName newEntity = modelMapper.map(request, EntityName.class);
        newEntity.setPhienBan("V0");
        newEntity.setNguoiTao("Admin");
        newEntity.setNgayTao(SystemUtils.getCurrentDateTime());
        newEntity = repository.save(newEntity);
        
        return mapToResponse(newEntity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public EntityNameDetailResponse view(UUID id) {
        EntityName entity = findEntityById(id);
        return mapToResponse(entity);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public EntityNameDetailResponse edit(UUID id, ApiRequest apiRequest) {
        EntityNameEditRequest request = ServiceHelper.convertToModelRequest(apiRequest, EntityNameEditRequest.class);
        EntityName oldEntity = findEntityById(id);
        
        // Expire old version
        oldEntity.setTrangThai(StatusEntityEnum.EXPIRED.getCode());
        repository.save(oldEntity);
        
        // Create new version
        EntityName updatedEntity = new EntityName();
        modelMapper.map(oldEntity, updatedEntity);
        modelMapper.map(request, updatedEntity);
        
        if (Objects.equals(oldEntity, updatedEntity)) {
            throw new IllegalStateException(messageSource.getMessage("entity.update.abort.warning.message", 
                    new Object[]{id}, getCurrentLocale()));
        }
        
        updatedEntity.setId(null);
        updatedEntity.setPhienBan(ServiceHelper.getNextVersion(oldEntity.getPhienBan()));
        updatedEntity.setNguoiCapNhat("Admin");
        updatedEntity.setNgayCapNhat(SystemUtils.getCurrentDateTime());
        updatedEntity = repository.save(updatedEntity);
        
        return mapToResponse(updatedEntity);
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public EntityNameDetailResponse delete(UUID id) {
        EntityName entity = findEntityById(id);
        ServiceHelper.markAsSoftDeleted(entity, "Admin");
        return mapToResponse(repository.save(entity));
    }
    
    @Transactional(readOnly = true)
    protected EntityName findEntityById(UUID id) {
        EntityName entity = repository.findByIdAndTrangThaiNotAndDanhDauXoaIsNull(id, StatusEntityEnum.EXPIRED.getCode());
        if (entity == null) {
            throw new EntityNotFoundException(messageSource.getMessage("entity.not.found.warning.message", 
                    new Object[]{id}, getCurrentLocale()));
        }
        return entity;
    }
    
    private Specification<EntityName> createSpecification(EntityNameFilterRequest filter) {
        LocalDate validFrom = filter.getHieuLucTu() != null ? LocalDate.parse(filter.getHieuLucTu(), formatter) : null;
        LocalDate validTo = filter.getHieuLucDen() != null ? LocalDate.parse(filter.getHieuLucDen(), formatter) : null;
        
        return Specification.where(GenericSpecification.<EntityName>fieldIsNull("isDeleted"))
                .and(GenericSpecification.hasFieldNotEqual("status", StatusEntityEnum.EXPIRED.getCode()))
                .and(GenericSpecification.likeField("fieldName", filter.getFieldName()))
                .and(GenericSpecification.fieldIsGreaterThanOrEqualTo("validFrom", validFrom))
                .and(GenericSpecification.fieldIsLessThanOrEqualTo("validTo", validTo));
    }
    
    private EntityNameDetailResponse mapToResponse(EntityName entity) {
        return modelMapper.map(entity, EntityNameDetailResponse.class);
    }
}
```

### 4.3 Service Conventions

#### Required Annotations
- `@Service` - Mark as Spring service
- `@RequiredArgsConstructor` - Lombok constructor injection
- `@Transactional(readOnly = true)` - For read operations
- `@Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)` - For write operations

#### Standard Dependencies
- `MessageSource` - For internationalization
- `ModelMapper` - For object mapping
- `EntityRepository` - For data access
- `DateTimeFormatter` - For date parsing

#### Standard Methods
- `combobox()` - For dropdown lists with current date filter
- `all()` - For paginated lists
- `add()` - For creating new entities
- `view()` - For viewing single entity
- `edit()` - For updating entities (with versioning)
- `delete()` - For soft deletion
- `findEntityById()` - Protected method for entity lookup
- `createSpecification()` - For building dynamic queries
- `mapToResponse()` - For mapping to detail response

#### Version Control Pattern
- Expire old entity: `setTrangThai(StatusEntityEnum.EXPIRED.getCode())`
- Create new version: `setPhienBan(ServiceHelper.getNextVersion(oldEntity.getPhienBan()))`
- Reset ID: `setId(null)`

#### FIS Library Utilities

**Use these FIS library utilities instead of custom implementations:**

1. **JpaOrderUtils.buildSort()** - For building Sort from SearchRequest
   - Location: `com.kevin.lunaraspa.core.data.util.JpaOrderUtils`
   - Usage: `Sort sort = JpaOrderUtils.buildSort(searchRequest.getSorts())`
   - Handles null/empty sorts with sensible defaults

2. **Pagination Class** - For pagination parameters
   - Location: `com.kevin.lunaraspa.core.common.model.Pagination`
   - Default constructor: `new Pagination()` → page=0, size=10
   - Usage: Extract from SearchRequest or use default

3. **ValidationException** - For validation errors
   - Location: `jakarta.validation.ValidationException`
   - NOT `com.kevin.lunaraspa.core.common.exception.ValidationException`
   - Usage: `throw new ValidationException(messageSource.getMessage(...))`

4. **SecurityUtils.getUsername()** - Get current user
   - Location: `com.kevin.lunaraspa.core.security.util.SecurityUtils`
   - Usage: `String username = SecurityUtils.getUsername()`

**Example Service Implementation with FIS Utilities:**

```java
@Service
@Transactional
@RequiredArgsConstructor
public class PartnerServiceImpl implements PartnerService {
    
    private final PartnerRepository partnerRepository;
    private final PartnerMapper partnerMapper;
    private final MessageSource messageSource;
    
    @Override
    @Transactional(readOnly = true)
    public PageableResponse<PartnerListResponse> search(SearchRequest<PartnerFilterRequest> searchRequest) {
        // Extract with defaults
        PartnerFilterRequest filter = searchRequest.getFilter() != null 
            ? searchRequest.getFilter() 
            : new PartnerFilterRequest();
        
        Pagination pagination = searchRequest.getPagination() != null 
            ? searchRequest.getPagination() 
            : new Pagination();  // Uses defaults: page=0, size=10
        
        // Use FIS utility for sorting
        Sort sort = JpaOrderUtils.buildSort(searchRequest.getSorts());
        
        // Build specification and pageable
        Specification<Partner> spec = PartnerSpecification.buildSpecification(filter);
        Pageable pageable = PageRequest.of(pagination.getPage(), pagination.getSize(), sort);
        
        // Execute and map
        Page<Partner> page = partnerRepository.findAll(spec, pageable);
        List<PartnerListResponse> content = partnerMapper.toListResponses(page.getContent());
        
        return PageableResponse.<PartnerListResponse>builder()
            .content(content)
            .pageNumber(page.getNumber())
            .pageSize(page.getSize())
            .totalPages(page.getTotalPages())
            .totalElements(page.getTotalElements())
            .numberOfElements(page.getNumberOfElements())
            .build();
    }
    
    @Override
    public PartnerDetailResponse create(PartnerAddRequest request) {
        // Validation with MessageSource
        if (partnerRepository.existsByPartnerCode(request.getPartnerCode())) {
            String message = messageSource.getMessage(
                "partner.code.already.exists", 
                new Object[]{request.getPartnerCode()}, 
                LocaleContextHolder.getLocale()
            );
            throw new ValidationException(message);  // jakarta.validation.ValidationException
        }
        
        Partner partner = partnerMapper.toEntity(request);
        partner.setCreatedUser(SecurityUtils.getUsername());  // FIS utility
        partner.setCreatedDate(LocalDateTime.now());
        
        return partnerMapper.toDetailResponse(partnerRepository.save(partner));
    }
}
```


## 5. Controller Layer Standards

### 5.1 Controller Pattern

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/entity-name")
@Tag(name = "Entity Management API", description = "Entity management operations")
public class EntityNameController {
    
    private final EntityNameService entityNameService;

    @PostMapping("/create")
    @Operation(summary = "Create new entity")
    public ResponseEntity<Object> createNewEntity(@RequestBody EntityNameDto dto) {
        return ResponseBuilder.ok(entityNameService.addNewEntityName(dto));
    }
    
    @PostMapping("/search")
    @Operation(summary = "Search entities with pagination and filters")
    public ResponseEntity<Object> search(
            @Valid @RequestBody SearchRequest<EntityNameFilterRequest> searchRequest) {
        PageableResponse<EntityNameDto> result = entityNameService.search(searchRequest);
        return ResponseBuilder.ok(result);
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "Delete entity by ID")
    public ResponseEntity<Object> deleteEntity(@PathVariable Long id) {
        entityNameService.deleteEntityName(id);
        return ResponseBuilder.ok("Entity deleted successfully");
    }

    @PutMapping("/update")
    @Operation(summary = "Update entity")
    public ResponseEntity<Object> updateEntity(@RequestBody EntityNameDto dto) {
        return ResponseBuilder.ok(entityNameService.updateEntityName(dto));
    }

    @GetMapping("/get-tree")
    @Operation(summary = "Get hierarchical tree structure")
    public ResponseEntity<?> searchTree(@RequestParam(name = "id", required = false) Long id,
                                       @RequestParam(name = "status", required = false, defaultValue = "ACTIVE") String status,
                                       @RequestParam(name = "buildTree", required = false, defaultValue = "1") String buildTree) {
        List<EntityNameDto> lstData = entityNameService.findTree(id, status);
        Map<String, Object> map = new HashMap<>();
        
        if (Objects.equals(buildTree, "1")) {
            map.put("treeData", TreeUtils.toForest(lstData));
        } else if (Objects.equals(buildTree, "ALL")) {
            map.put("treeData", TreeUtils.toForest(lstData));
            map.put("listData", lstData);
        } else {
            map.put("listData", lstData);
        }
        
        return ResponseBuilder.ok(map);
    }
}
```

### 5.2 Controller Conventions

#### Required Annotations
- `@RestController` - Mark as REST controller
- `@RequiredArgsConstructor` - Lombok constructor injection
- `@RequestMapping("/{entity-name}")` - Base path mapping (kebab-case)
- `@Tag(name = "API Name", description = "Description")` - Swagger documentation

#### Standard Endpoints
- `POST /create` - For creating new entities
- `POST /search` - For search/list with pagination and filters (MANDATORY pattern - see 5.3)
- `DELETE /delete/{id}` - For soft deletion
- `PUT /update` - For updating entities
- `GET /get-tree` - For hierarchical tree data (special case)

#### Request/Response Patterns
- DTO requests: `@RequestBody EntityNameDto`
- **Search requests**: `@RequestBody SearchRequest<EntityFilterRequest>` → Returns `PageableResponse<EntityDto>`
- Path variables: `@PathVariable Long id` (for single resource operations only)
- Response wrapper: `ResponseBuilder.ok(service.method())`
- **Note**: Avoid `@RequestParam` for pagination - use SearchRequest body instead

#### Swagger Documentation
- Use `@Operation(summary = "Description")` for each endpoint
- Use `@Tag` for controller-level documentation
- Provide meaningful operation summaries

#### URL Patterns
- **Business Service**: `/{entity-name}`
  - Examples: `/product-class`, `/product-attribute`, `/account-tax`
  - Use kebab-case for multi-word entity names
  - No `/api` prefix - handled by gateway routing

### 5.3 Search API Standards (MANDATORY)

⚠️ **CRITICAL RULE**: All search/list APIs with pagination MUST follow this pattern.

#### Mandatory Pattern for Search/List APIs

**✅ REQUIRED Structure:**
- **HTTP Method**: `POST` (NOT GET)
- **Request Body**: `SearchRequest<FilterRequest>` wrapper
- **Response Body**: `PageableResponse<DtoResponse>` wrapper

#### Request Structure

```java
// Controller
@PostMapping("/search")
@Operation(summary = "Search entities with pagination and filters")
public ResponseEntity<Object> search(
        @Valid @RequestBody SearchRequest<EntityFilterRequest> searchRequest) {
    PageableResponse<EntityDto> result = entityService.search(searchRequest);
    return ResponseBuilder.ok(result);
}
```

**SearchRequest Structure** (from `core-common` library):
```java
public class SearchRequest<T> {
    private T filter;                    // Filter criteria object
    private Pagination pagination;       // Page number and size
    private List<SortField> sorts;       // Sorting fields
}

public class Pagination {
    private int page;                    // Page number (0-based)
    private int size;                    // Page size (default 10)
}

public class SortField {
    private String field;                // Field name to sort
    private String direction;            // ASC or DESC
}
```

**Request Body Example**:
```json
{
  "filter": {
    "name": "Product",
    "status": "ACTIVE",
    "createdDateFrom": "2024-01-01",
    "createdDateTo": "2024-12-31"
  },
  "pagination": {
    "page": 0,
    "size": 10
  },
  "sorts": [
    {
      "field": "createdDate",
      "direction": "DESC"
    }
  ]
}
```

#### Response Structure

**PageableResponse Structure** (from `core-common` library):
```java
public class PageableResponse<T> {
    private List<T> content;              // List of items
    private int pageNumber;               // Current page (0-based)
    private int pageSize;                 // Items per page
    private int totalPages;               // Total number of pages
    private long totalElements;           // Total number of items
    private int numberOfElements;         // Items in current page
}
```

**Response Body Example**:
```json
{
  "content": [
    {
      "id": 1,
      "name": "Product 1",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "name": "Product 2",
      "status": "ACTIVE"
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalPages": 5,
  "totalElements": 50,
  "numberOfElements": 10
}
```

#### Service Implementation Pattern

**✅ CORRECT: Using FIS Library Utilities**

```java
// Service Implementation
@Override
@Transactional(readOnly = true)
public PageableResponse<EntityDto> search(SearchRequest<EntityFilterRequest> searchRequest) {
    // Extract filter with default
    EntityFilterRequest filter = searchRequest.getFilter() != null 
        ? searchRequest.getFilter() 
        : new EntityFilterRequest();
    
    // Extract pagination with default (uses default page=0, size=10)
    Pagination pagination = searchRequest.getPagination() != null 
        ? searchRequest.getPagination() 
        : new Pagination();
    
    // Build specification for filtering
    Specification<Entity> spec = EntitySpecification.buildSpec(filter);
    
    // Use JpaOrderUtils.buildSort from core-data library
    Sort sort = JpaOrderUtils.buildSort(searchRequest.getSorts());
    
    // Build pageable
    int page = pagination.getPage();
    int size = pagination.getSize();
    Pageable pageable = PageRequest.of(page, size, sort);
    
    // Execute query
    Page<Entity> pageResult = repository.findAll(spec, pageable);
    
    // Map to DTOs
    List<EntityDto> dtos = pageResult.getContent().stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
    
    // Build PageableResponse
    return PageableResponse.<EntityDto>builder()
            .content(dtos)
            .pageNumber(pageResult.getNumber())
            .pageSize(pageResult.getSize())
            .totalPages(pageResult.getTotalPages())
            .totalElements(pageResult.getTotalElements())
            .numberOfElements(pageResult.getNumberOfElements())
            .build();
}
```

**Key Points:**
- Use `com.kevin.lunaraspa.core.data.util.JpaOrderUtils.buildSort()` instead of custom sort building
- Use `com.kevin.lunaraspa.core.common.model.Pagination` (not `com.kevin.lunaraspa.core.common.model.request.Pagination`)
- Default Pagination constructor provides page=0, size=10
- Use `jakarta.validation.ValidationException` for validation errors
- MessageSource for i18n error messages

#### Filter Request Model Pattern

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EntityFilterRequest {
    
    // Search criteria fields
    private String keyword;
    private String name;
    private String code;
    private String status;
    private LocalDate createdDateFrom;
    private LocalDate createdDateTo;
    
    // NOTE: Do NOT include page, size, sortField in filter
    // These are handled by SearchRequest.pagination and SearchRequest.sorts
}
```

#### ❌ ANTI-PATTERNS (Do NOT Do)

**❌ DON'T: Use GET with query parameters for pagination**
```java
// ❌ WRONG
@GetMapping("/search")
public ResponseEntity<Object> search(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    // This violates the standard
}
```

**❌ DON'T: Use path variables for filtering**
```java
// ❌ WRONG
@GetMapping("/search/{status}")
public ResponseEntity<Object> search(@PathVariable String status) {
    // Filter criteria should be in request body, not path
}
```

**❌ DON'T: Return Spring's Page directly**
```java
// ❌ WRONG
public Page<EntityDto> search(...) {
    // Must return PageableResponse, not Spring Page
}
```

**❌ DON'T: Include pagination in filter object**
```java
// ❌ WRONG
public class EntityFilterRequest {
    private String name;
    private int page;      // ❌ WRONG: Should be in SearchRequest.pagination
    private int size;      // ❌ WRONG: Should be in SearchRequest.pagination
}
```

#### Migration Examples

**Example 1: Simple List API**

Before (❌):
```java
@GetMapping("/list")
public ResponseEntity<Object> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    Page<Entity> result = service.findAll(PageRequest.of(page, size));
    return ResponseBuilder.ok(result);
}
```

After (✅):
```java
@PostMapping("/search")
public ResponseEntity<Object> search(
        @Valid @RequestBody SearchRequest<EntityFilterRequest> searchRequest) {
    PageableResponse<EntityDto> result = service.search(searchRequest);
    return ResponseBuilder.ok(result);
}
```

**Example 2: Search with Filters**

Before (❌):
```java
@GetMapping("/search")
public ResponseEntity<Object> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    EntityFilterRequest filter = new EntityFilterRequest();
    filter.setKeyword(keyword);
    filter.setStatus(status);
    filter.setPage(page);
    filter.setSize(size);
    return ResponseBuilder.ok(service.search(filter));
}
```

After (✅):
```java
@PostMapping("/search")
public ResponseEntity<Object> search(
        @Valid @RequestBody SearchRequest<EntityFilterRequest> searchRequest) {
    PageableResponse<EntityDto> result = service.search(searchRequest);
    return ResponseBuilder.ok(result);
}
```

#### Benefits of This Pattern

1. ✅ **Consistency**: All search APIs use the same structure
2. ✅ **Extensibility**: Easy to add new filter fields without changing URL
3. ✅ **Type Safety**: Strong typing with generics
4. ✅ **RESTful**: POST for complex queries is RESTful best practice
5. ✅ **Maintainability**: Standardized pattern across all modules
6. ✅ **Testability**: Easy to test with request/response DTOs
7. ✅ **Documentation**: Clear Swagger documentation with request/response models

#### Real Implementation Examples

**Example 1**: Contract Work Allocations
- Controller: `ContractWorkController.searchWorkAllocations()`
- Endpoint: `POST /contract-work/work-allocations`
- Filter: `ContractWorkAllocationFilterRequest`
- Response: `PageableResponse<ContractWorkAllocationDto>`

**Example 2**: Payment History
- Controller: `AccountPaymentRequestController.getPaymentHistory()`
- Endpoint: `POST /account-payment-request/payment-history`
- Filter: `PaymentHistoryFilterRequest`
- Response: `PageableResponse<PaymentHistoryDto>`

### 5.4 Excel Export Pattern

```java
@GetMapping("/exportExcel")
public ResponseEntity<?> exportExcel(@ModelAttribute EntityNameFilterRequest filter) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
    headers.setContentDispositionFormData("attachment", "entityname.xlsx");
    
    return ResponseEntity.ok()
            .headers(headers)
            .body(service.exportExcel(filter));
}
```

## 6. Common Patterns

### 6.1 Soft Delete Pattern

All entities use soft delete with the `status` field:
- `status` - Status marker (`"ACTIVE"` = Active, `"DEACTIVE"` = Deleted)

#### Constants
```java
public static final class Status {
    public static final String ACTIVE = "ACTIVE";
    public static final String DEACTIVE = "DEACTIVE";
}
```

#### Service Implementation
```java
@Override
public void deleteEntityName(Long id) {
    EntityName entity = repo.findById(id).orElse(null);
    if (entity != null) {
        entity.setStatus(AppConstants.Status.DEACTIVE);
        repo.save(entity);
    } else {
        throw new AppException(messageHelper.getMessage("entityController.msg.condition.isExisted"));
    }
}
```

### 6.2 Version Control Pattern

All entities support versioning:
- `version` - Version field (V0, V1, V2, etc.)
- Edit operations create new versions and expire old ones

#### Version Update
```java
updatedEntity.setPhienBan(ServiceHelper.getNextVersion(oldEntity.getPhienBan()));
```

### 6.3 Specification Pattern

Dynamic queries using JPA Specifications with dedicated Specification classes:

```java
// EntityNameSpecification.java
public class EntityNameSpecification {
    
    public static Specification<EntityName> hasCode(String code) {
        return (root, query, criteriaBuilder) -> {
            if (code == null || code.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.like(
                criteriaBuilder.lower(root.get("code")), 
                "%" + code.toLowerCase() + "%"
            );
        };
    }

    public static Specification<EntityName> hasName(String name) {
        return (root, query, criteriaBuilder) -> {
            if (name == null || name.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.like(
                criteriaBuilder.lower(root.get("name")), 
                "%" + name.toLowerCase() + "%"
            );
        };
    }

    public static Specification<EntityName> hasStatus(String status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null || status.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("status"), status);
        };
    }

    public static Specification<EntityName> hasParentID(Long parentID) {
        return (root, query, criteriaBuilder) -> {
            if (parentID == null) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("parent").get("id"), parentID);
        };
    }
}

// Usage in Service
Specification<EntityName> specification = EntityNameSpecification
        .hasCode(request.getFilter().getCode())
        .and(EntityNameSpecification.hasName(request.getFilter().getName()))
        .and(EntityNameSpecification.hasStatus(request.getFilter().getStatus()))
        .and(EntityNameSpecification.hasParentID(request.getFilter().getParentID()));
```

## 6. Message Resources & Internationalization

### 6.1 Message File Structure

All validation and user-facing messages are externalized to properties files for internationalization support:

```
src/main/resources/messages/
├── messages.properties         # Default (English) messages
└── messages_vi.properties     # Vietnamese messages
```

### 6.2 Message Key Naming Convention

#### Entity-specific Messages
```properties
# Pattern: {entity}.{operation}.{type}
# Operations: create, update, delete, get, search
# Types: success, error, validation

# Contract Messages
contract.create.success=Contract created successfully
contract.create.error=Error creating contract
contract.update.success=Contract updated successfully
contract.update.error=Error updating contract
contract.delete.success=Contract deleted successfully
contract.delete.error=Error deleting contract
contract.notFound=Contract with ID {0} not found

# Customer Messages  
customer.create.success=Customer created successfully
customer.create.error=Error creating customer
customer.validation.phone.required=Phone number is required
customer.validation.email.invalid=Invalid email format
```

#### Validation Messages
```properties
# Pattern: {entity}.validation.{field}.{rule}
contract.validation.vat.invalid=VAT percentage must be between 0 and 100
contract.validation.value.invalid=Contract value must be greater than 0
contract.validation.tba.required=TBA quantity is required for operation service
customer.validation.tin.required=Tax ID is required for business customers
customer.validation.idno.required=ID number is required for individual customers
```

#### Vietnamese Messages (Unicode Encoded)
```properties
# Contract Messages in Vietnamese
contract.create.success=T\u1EA1o h\u1EE3p \u0111\u1ED3ng th\u00E0nh c\u00F4ng
contract.create.error=L\u1ED7i khi t\u1EA1o h\u1EE3p \u0111\u1ED3ng
contract.update.success=C\u1EADp nh\u1EADt h\u1EE3p \u0111\u1ED3ng th\u00E0nh c\u00F4ng
contract.validation.vat.invalid=Thu\u1EBF VAT ph\u1EA3i n\u1EB1m trong kho\u1EA3ng t\u1EEB 0 \u0111\u1EBFn 100
customer.validation.phone.required=S\u1ED1 \u0111i\u1EC7n tho\u1EA1i l\u00E0 b\u1EAFt bu\u1ED9c
```

### 6.3 MessageHelper Usage Pattern

#### Service Layer Integration
```java
@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {
    
    private final MessageHelper messageHelper;
    private final ContractRepository contractRepository;
    private final ModelMapper modelMapper;
    
    @Override
    public ContractDto createContract(ContractRequest request) {

            validateContractRequest(request);
            
            Contract entity = modelMapper.map(request, Contract.class);
            entity = contractRepository.save(entity);
            
            ContractDto dto = modelMapper.map(entity, ContractDto.class);
            
            return dto;
        
    }
    
    private void validateContractRequest(ContractRequest request) {
        if (request.getVatPercent() != null && 
            (request.getVatPercent().compareTo(BigDecimal.ZERO) < 0 || 
             request.getVatPercent().compareTo(new BigDecimal("100")) > 0)) {
            throw new AppException(messageHelper.getMessage("contract.validation.vat.invalid"));
        }
        
        if (request.getValueBeforeTax() != null && 
            request.getValueBeforeTax().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(messageHelper.getMessage("contract.validation.value.invalid"));
        }
    }
}
```

## 7. Exception Handling Standards

### 7.1 Exception Architecture (Modular Error Codes)

**🚨 CRITICAL RULE: No God Modules for Error Codes**

We use an Interface-driven Error Code pattern to prevent a single massive `ErrorCode` enum.

#### Base Exception and Interface
```java
// Base Error Code Interface
public interface BaseErrorCode {
    String getCode();
    String getMessage();
    HttpStatus getHttpStatus();
}

// Global Custom Exception
@Getter
public class AppException extends RuntimeException {
    private final BaseErrorCode errorCode;
    
    public AppException(BaseErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
```

#### Domain-Specific Error Enums
Create separate Enums for each domain (Auth, Catalog, Booking, etc.):
```java
@Getter
@AllArgsConstructor
public enum AuthErrorCode implements BaseErrorCode {
    INVALID_CREDENTIALS("AUTH_001", "Invalid email or password", HttpStatus.UNAUTHORIZED),
    ACCOUNT_LOCKED("AUTH_002", "Account is locked", HttpStatus.FORBIDDEN);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}

@Getter
@AllArgsConstructor
public enum CustomerErrorCode implements BaseErrorCode {
    CUSTOMER_NOT_FOUND("CUS_001", "Customer not found", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS("CUS_002", "Email already exists in system", HttpStatus.BAD_REQUEST);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
```

### 7.2 Throwing Exceptions with Java 8 Optional
**❌ FORBIDDEN:** Checking `if (entity == null)`
**✅ REQUIRED:** Use `Optional.orElseThrow()`

```java
// ✅ CORRECT: Using orElseThrow with AppException
Customer customer = customerRepository.findById(id)
    .orElseThrow(() -> new AppException(CustomerErrorCode.CUSTOMER_NOT_FOUND));
```

### 7.3 Handling Exceptions (GlobalExceptionHandler)
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
        return ResponseEntity
            .status(ex.getErrorCode().getHttpStatus())
            .body(ResponseBuilder.error(ex.getErrorCode().getCode(), ex.getMessage()));
    }
}
```

### 7.5 Message Resource Management

#### Required Message Categories

**1. CRUD Operation Messages**
```properties
# Success messages
entity.create.success=Entity created successfully
entity.update.success=Entity updated successfully  
entity.delete.success=Entity deleted successfully

# Error messages
entity.create.error=Error creating entity
entity.update.error=Error updating entity
entity.delete.error=Error deleting entity
entity.get.error=Error getting entity details
entity.search.error=Error searching entities
entity.notFound=Entity with ID {0} not found
```

**2. Validation Messages**
```properties
# Common validation
id.empty=ID cannot be empty
entity.validation.name.required=Name is required
entity.validation.code.required=Code is required
entity.validation.status.invalid=Invalid status: {0}. Must be {1} or {2}

# Field-specific validation
entity.validation.email.invalid=Invalid email format
entity.validation.phone.required=Phone number is required
entity.validation.amount.positive=Amount must be greater than 0
entity.validation.percentage.range=Percentage must be between 0 and 100
```

**3. Business Rule Messages**
```properties
# Business logic validation
entity.validation.duplicate.code=Entity with code {0} already exists
entity.validation.parent.notfound=Parent entity not found
entity.validation.status.inactive=Current status is inactive, cannot perform operation
entity.validation.dependency.exists=Cannot delete entity, dependencies exist
```

#### Vietnamese Message Pattern
```properties
# Use Unicode escape sequences for Vietnamese characters
entity.create.success=T\u1EA1o th\u00E0nh c\u00F4ng
entity.update.success=C\u1EADp nh\u1EADt th\u00E0nh c\u00F4ng
entity.delete.success=X\u00F3a th\u00E0nh c\u00F4ng
entity.validation.name.required=T\u00EAn l\u00E0 b\u1EAFt bu\u1ED9c
entity.validation.email.invalid=\u0110\u1ECBnh d\u1EA1ng email kh\u00F4ng h\u1EE3p l\u1EC7
id.empty=ID kh\u00F4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng
```

### 7.6 Complete Service Implementation Example

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ContractServiceImpl implements ContractService {
    
    private final ContractRepository contractRepository;
    private final ModelMapper modelMapper;
    private final MessageHelper messageHelper;
    
    @Override
    public Object createContract(ContractRequest request) {
     
            log.info("Creating contract: {}", request.getContractNumber());
            
            // Business validation with message keys
            validateContractRequest(request);
            
            // Entity mapping and persistence
            Contract entity = modelMapper.map(request, Contract.class);
            entity.setIsDeleted("0");
            entity.setCreatedDate(LocalDateTime.now());
            
            entity = contractRepository.save(entity);
            ContractDto dto = modelMapper.map(entity, ContractDto.class);
            
            log.info("Successfully created contract: {}", entity.getId());
            return dto;
         
    }
    
    @Override
    @Transactional(readOnly = true)
    public Object getContractById(Long id) {
            log.info("Getting contract: {}", id);
            
            // Entity lookup with custom exception
            Contract entity = contractRepository.findByIdAndIsDeleted(id, "0")
                .orElseThrow(() -> new AppException(ContractErrorCode.CONTRACT_NOT_FOUND));
            
            ContractDto response = modelMapper.map(entity, ContractDto.class);
            return response;
    }
    
    private void validateContractRequest(ContractRequest request) {
        if (request.getVatPercent() != null && 
            (request.getVatPercent().compareTo(BigDecimal.ZERO) < 0 || 
             request.getVatPercent().compareTo(new BigDecimal("100")) > 0)) {
            throw new AppException(ContractErrorCode.INVALID_VAT);
        }
    }
            
            // Entity lookup with custom exception
            Contract entity = contractRepository.findByIdAndIsDeleted(id, "0")
                .orElseThrow(() -> new AppException(
                    messageHelper.getMessage("contract.notFound", id)));
            
            ContractDto response = modelMapper.map(entity, ContractDto.class);
            
            log.info("Successfully retrieved contract: {}", id);
            return response;
       
    }
    
    private void validateContractRequest(ContractRequest request) {
        // VAT validation with message key
        if (request.getVatPercent() != null && 
            (request.getVatPercent().compareTo(BigDecimal.ZERO) < 0 || 
             request.getVatPercent().compareTo(new BigDecimal("100")) > 0)) {
            throw new AppException(messageHelper.getMessage("contract.validation.vat.invalid"));
        }
        
        // Value validation with message key
        if (request.getValueBeforeTax() != null && 
            request.getValueBeforeTax().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(messageHelper.getMessage("contract.validation.value.invalid"));
        }
        
        // Business rule validation with message key
        if (request.getServiceTypes() != null && request.getServiceTypes().contains("Vận hành") && 
            (request.getTbaQuantity() == null || request.getTbaQuantity() < 1)) {
            throw new AppException(messageHelper.getMessage("contract.validation.tba.required"));
        }
    }
}
```

### 7.7 Exception Response Patterns

#### Success Response
```java
// With data and message
return ResponseBuilder.ok(data, messageHelper.getMessage("operation.success"));

// With message only
return ResponseBuilder.ok(null, messageHelper.getMessage("operation.success"));

// With data only (uses default success message)
return ResponseBuilder.ok(data);
```

#### Error Response Patterns
```java
// Validation errors (400 Bad Request)
return ResponseBuilder.badRequest(null, e.getMessage()); // AppException message
return ResponseBuilder.badRequest(null, messageHelper.getMessage("operation.error")); // Generic error

// Not found errors (404 Not Found)
return ResponseBuilder.notFound(null, e.getMessage()); // AppException message

// Input validation (400 Bad Request)
return ResponseBuilder.badRequest(null, messageHelper.getMessage("id.empty")); // Input validation
```

### 7.8 MessageHelper Dependency Injection

#### Required Dependencies
```java
@Service
@RequiredArgsConstructor
public class EntityServiceImpl {
    
    // Required for message localization
    private final MessageHelper messageHelper;
    
    // Required for object mapping
    private final ModelMapper modelMapper;
    
    // Required for data access - ONLY own repository
    private final EntityRepository entityRepository;
    
    // For accessing other entities - ONLY through services
    private final OtherEntityService otherEntityService;
}
```

#### **🚨 CRITICAL RULE: Repository Access Pattern**

**✅ ALLOWED:**
- Service can ONLY inject its own Repository
- Service MUST call other entities through their Services

**❌ FORBIDDEN:**
- Service CANNOT inject Repository of other entities
- Service CANNOT directly access other entity's data layer

**Example:**
```java
// ✅ CORRECT
@Service
public class CustomerServiceImpl {
    private final CustomerRepository customerRepository;           // ✅ Own repository
    private final CustomerContactService customerContactService;   // ✅ Other entity via service
}

// ❌ WRONG
@Service  
public class CustomerServiceImpl {
    private final CustomerRepository customerRepository;           // ✅ Own repository
    private final CustomerContactRepository customerContactRepository; // ❌ Other repository
}
```

#### MessageHelper Methods
```java
// Get simple message
String message = messageHelper.getMessage("message.key");

// Get message with parameters
String message = messageHelper.getMessage("message.key", param1, param2);

// Get message with single parameter
String message = messageHelper.getMessage("entity.notFound", entityId);
```

### 7.9 Exception Handling Best Practices

**1. Use Specific Exception Types**
- `AppException` - For business validation errors (most common)
- `AppException` - For entity not found scenarios
- `InputAppException` - For input format validation
- `IllegalStateException` - For business logic violations

**2. Message Key Strategy**
- Use message keys instead of hardcoded strings
- Provide both English and Vietnamese messages
- Use parameters for dynamic content: `{0}`, `{1}`, etc.

**3. Exception Catch Order**
```java
try {
    // business logic
} catch (AppException e) {
    // Handle validation errors first (most specific)
    return ResponseBuilder.badRequest(null, e.getMessage());
} catch (AppException e) {
    // Handle not found errors
    return ResponseBuilder.notFound(null, e.getMessage());
} catch (Exception e) {
    // Handle all other errors (most generic)
    return ResponseBuilder.badRequest(null, messageHelper.getMessage("generic.error"));
}
```

**4. Logging Pattern**
```java
// Log start of operations
log.info("Starting operation with params: {}", params);

// Log validation errors
log.error("Validation error: {}", e.getMessage(), e);

// Log system errors
log.error("Error in operation: {}", e.getMessage(), e);

// Log successful completion
log.info("Successfully completed operation: {}", result);
```

#### Common Exception Types
- `AppException` - Input validation errors (most common)
- `IllegalStateException` - Business logic violations
- `AppException` - Entity not found (from Spring Data)

#### MessageHelper Usage
```java
private final MessageHelper messageHelper;

// Get localized messages
String message = messageHelper.getMessage("message.key");
String messageWithParams = messageHelper.getMessage("message.key", param1, param2);
```

## 7. Testing Standards

### 7.1 Unit Testing

#### Service Layer Testing
```java
@ExtendWith(MockitoExtension.class)
class EntityNameServiceTest {
    
    @Mock
    private EntityNameRepository repository;
    
    @Mock
    private MessageSource messageSource;
    
    @Mock
    private ModelMapper modelMapper;
    
    @InjectMocks
    private EntityNameServiceImpl service;
    
    @Test
    void shouldAddEntitySuccessfully() {
        // Test implementation
    }
    
    @Test
    void shouldThrowExceptionWhenCodeExists() {
        // Test implementation
    }
}
```

#### Repository Testing
```java
@DataJpaTest
class EntityNameRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private EntityNameRepository repository;
    
    @Test
    void shouldFindEntityByCodeAndStatusNotExpired() {
        // Test implementation
    }
}
```

### 7.2 Integration Testing

#### Controller Integration Testing
```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class EntityNameControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void shouldReturnAllEntities() throws Exception {
        mockMvc.perform(get("/api/entityname/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
```

## 8. Best Practices

### 8.1 Code Organization
- Keep controllers thin - delegate to services
- Use DTOs for data transfer - avoid exposing entities
- Implement proper error handling at each layer
- Use transactions appropriately

### 8.2 Performance Considerations
- Use lazy loading for entity fields
- Implement pagination for list endpoints
- Use specifications for dynamic queries
- Consider caching for frequently accessed data

### 8.3 Security
- Validate input parameters
- Use parameterized queries (handled by Spring Data JPA)
- Implement proper authorization checks

### 8.4 Maintainability
- Follow consistent naming conventions
- Use meaningful method and variable names
- Document complex business logic
- Keep methods focused and single-purpose

## 9. Quick Reference

### 9.1 Required Dependencies (Gradle)
```kotlin
dependencies {
    // FIS Libraries
    implementation(project(":library:core-cache"))
    implementation(project(":library:core"))
    implementation(project(":library:core-data"))
    implementation(project(":library:core-file"))
    implementation(project(":library:core-logging"))
    implementation(project(":library:core-security"))
    
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    
    // Annotation processors
    annotationProcessor(libs.lombok)
    annotationProcessor(libs.spring.boot.configuration.processor)
    annotationProcessor(libs.mapstruct.processor)
    annotationProcessor(libs.hibernate.jpamodelgen)
    
    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
```

### 9.2 Common Imports
```java
// Entity
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// Service
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kevin.lunaraspa.core.data.service.impl.BaseServiceImpl;
import com.kevin.lunaraspa.core.core.helper.MessageHelper;
import com.kevin.lunaraspa.core.security.util.SecurityUtils;
import com.kevin.lunaraspa.core.common.util.ValidationUtils;

// Controller
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.kevin.lunaraspa.core.core.http.ResponseBuilder;

// Repository
import com.kevin.lunaraspa.core.data.repository.BaseRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

// Common
import java.util.List;
import java.util.Optional;
import jakarta.validation.ValidationException;
```

### 9.3 File Structure Checklist
- [ ] Entity class with proper annotations and table mapping
- [ ] DTO class for data transfer
- [ ] Request model classes for search/filter operations
- [ ] Response model classes (if needed)
- [ ] MapStruct mapper interface for entity-DTO conversion
- [ ] Repository interface extending BaseRepository
- [ ] Specification class for dynamic queries
- [ ] Service interface with CRUD methods
- [ ] Service implementation extending BaseServiceImpl
- [ ] Controller with REST endpoints and Swagger documentation
- [ ] Constants class for status values
- [ ] **Message resources for entity (messages.properties & messages_vi.properties)**
- [ ] **ValidationException usage in service layer**
- [ ] **MessageHelper injection in service implementations**
- [ ] Unit tests for service layer
- [ ] Integration tests for controller

### 9.4 Message Resources Checklist
- [ ] **messages.properties** - English messages for entity
- [ ] **messages_vi.properties** - Vietnamese messages for entity (Unicode encoded)
- [ ] Success messages: create, update, delete
- [ ] Error messages: create, update, delete, get, search
- [ ] Validation messages: required fields, format validation, business rules
- [ ] Entity not found message with parameter support
- [ ] MessageHelper injection in service classes
- [ ] ValidationException usage instead of hardcoded strings

### 9.5 SonarQube Quality Checklist
- [ ] **SonarQube analysis** passes without critical issues
- [ ] **Code coverage** meets minimum threshold (≥80%)
- [ ] **Code duplication** below maximum threshold (≤3%)
- [ ] **Code smells** within acceptable limits (≤100)
- [ ] **Security vulnerabilities** resolved (0 critical)
- [ ] **Technical debt** manageable (≤1h)
- [ ] **Custom Lunara Spa rules** compliance verified

## 10. Migration Guide

When creating new modules or updating existing ones:

1. **Start with Entity** - Define JPA entity with proper annotations
2. **Create DTO** - Define data transfer object for API operations
3. **Create Request Models** - Define filter/search request classes
4. **Create MapStruct Mapper** - Define entity-DTO conversion interface
5. **Implement Repository** - Extend BaseRepository with custom queries
6. **Create Specification** - Implement dynamic query specifications
7. **Build Service** - Extend BaseServiceImpl with business logic
8. **Create Controller** - Add REST endpoints with Swagger documentation
9. **Add Constants** - Define status and other constant values
10. **Add Message Resources** - Create messages.properties and messages_vi.properties
11. **Implement Exception Handling** - Use ValidationException with MessageHelper
12. **Add Tests** - Ensure quality and coverage
13. **Update Documentation** - Document any deviations

### 10.1 Message Resource Migration

#### Step 1: Create Message Files
```bash
# Create message directories if not exists
mkdir -p src/main/resources/messages

# Create English messages
touch src/main/resources/messages/messages.properties

# Create Vietnamese messages  
touch src/main/resources/messages/messages_vi.properties
```

#### Step 2: Add Entity-specific Messages
```properties
# messages.properties
entity.create.success=Entity created successfully
entity.create.error=Error creating entity
entity.validation.field.required=Field is required
entity.validation.field.invalid=Invalid field format
entity.notFound=Entity with ID {0} not found

# messages_vi.properties (Unicode encoded)
entity.create.success=T\u1EA1o th\u00E0nh c\u00F4ng
entity.create.error=L\u1ED7i khi t\u1EA1o
entity.validation.field.required=Tr\u01B0\u1EDDng l\u00E0 b\u1EAFt bu\u1ED9c
entity.notFound=Kh\u00F4ng t\u00ECm th\u1EA5y v\u1EDBi ID {0}
```

#### Step 3: Update Service Implementation
```java
// Before (hardcoded messages)
throw new BusinessException("VAT percentage must be between 0 and 100");
return ResponseBuilder.ok(dto, "Tạo hợp đồng thành công");

// After (message keys)
throw new ValidationException(messageHelper.getMessage("contract.validation.vat.invalid"));
return ResponseBuilder.ok(dto, messageHelper.getMessage("contract.create.success"));
```

## 11. FIS Library Integration

### Key FIS Libraries Used:
- **core**: Core configurations and helpers (MessageHelper, ResponseBuilder)
- **core-data**: Base repository and service abstractions
- **core-common**: Common utilities and models (PageableResponse, SearchRequest)
- **core-security**: Security utilities (SecurityUtils)
- **core-cache**: Caching mechanisms
- **core-logging**: Logging utilities

### Integration Benefits:
- Consistent error handling across services
- Standardized pagination and search patterns
- Built-in security integration
- Performance optimizations through base classes
- Centralized configuration management
- **Internationalization support through MessageHelper**
- **Standardized exception handling with ValidationException**

### 11.1 MessageHelper Integration

#### Configuration
```java
// MessageHelper is auto-configured in core
// No additional configuration needed
```

#### Usage in Services
```java
@Service
@RequiredArgsConstructor
public class EntityServiceImpl {
    
    private final MessageHelper messageHelper; // Auto-injected
    
    public String getLocalizedMessage(String key) {
        return messageHelper.getMessage(key);
    }
    
    public String getLocalizedMessage(String key, Object... params) {
        return messageHelper.getMessage(key, params);
    }
}
```

## 12. Validation & Exception Standards Summary

### 12.1 Exception Hierarchy

```
Exception
├── RuntimeException
│   ├── ValidationException (jakarta.validation) ⭐ PRIMARY
│   ├── EntityNotFoundException (com.kevin.lunaraspa.core.common.exception)
│   ├── InputValidationException (com.kevin.lunaraspa.core.core.exception)
│   └── IllegalStateException (java.lang)
```

### 12.2 When to Use Each Exception

| Exception Type | Use Case | Message Source | Response Code |
|---------------|----------|----------------|---------------|
| `ValidationException` | Business validation errors | MessageHelper + key | 400 Bad Request |
| `EntityNotFoundException` | Entity not found | MessageHelper + key | 404 Not Found |
| `InputValidationException` | Input format errors | Direct message | 400 Bad Request |
| `IllegalStateException` | Business logic violations | MessageHelper + key | 400 Bad Request |

### 12.3 Response Builder Patterns

```java
// Success responses
ResponseBuilder.ok(data, messageHelper.getMessage("success.key"));
ResponseBuilder.ok(data); // Uses default success message

// Error responses
ResponseBuilder.badRequest(null, e.getMessage()); // For ValidationException
ResponseBuilder.badRequest(null, messageHelper.getMessage("error.key")); // For generic errors
ResponseBuilder.notFound(null, e.getMessage()); // For EntityNotFoundException
```

### 12.4 Complete Validation Example

```java
@Service
@RequiredArgsConstructor
public class EntityServiceImpl {
    
    private final MessageHelper messageHelper;
    private final EntityRepository repository;
    private final ModelMapper modelMapper;
    
    @Override
    public Object createEntity(EntityRequest request) {
     
            // Step 1: Input validation
            validateEntityInput(request);
            
            // Step 2: Business validation  
            validateEntityBusiness(request);
            
            // Step 3: Entity creation
            Entity entity = modelMapper.map(request, Entity.class);
            entity = repository.save(entity);
            
            // Step 4: Response mapping
            EntityDto dto = modelMapper.map(entity, EntityDto.class);
            
            return ResponseBuilder.ok(dto, messageHelper.getMessage("entity.create.success"));
      
    }
    
    private void validateEntityInput(EntityRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException(messageHelper.getMessage("entity.validation.name.required"));
        }
        
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new ValidationException(messageHelper.getMessage("entity.validation.code.required"));
        }
    }
    
    private void validateEntityBusiness(EntityRequest request) {
        // Check duplicate code
        if (repository.existsByCodeAndIsDeleted(request.getCode(), "0")) {
            throw new ValidationException(messageHelper.getMessage("entity.validation.duplicate.code", request.getCode()));
        }
        
        // Check parent exists (for hierarchical entities)
        if (request.getParentId() != null) {
            boolean parentExists = repository.existsByIdAndIsDeleted(request.getParentId(), "0");
            if (!parentExists) {
                throw new ValidationException(messageHelper.getMessage("entity.validation.parent.notfound"));
            }
        }
    }
}
```

## 12. Backward Compatibility Rules

### 12.1 Critical Code Modification Guidelines

**🚨 MANDATORY: When Adding New Functionality**

#### **✅ ALWAYS DO:**
- **PRESERVE ALL EXISTING CODE** (methods, fields, endpoints)
- **ADD NEW CODE** at the end of files/classes
- **DO NOT DELETE** or modify existing code unless absolutely necessary

#### **✅ Backend Addition Patterns:**
```java
// ✅ CORRECT: Keep existing methods, add new ones at the end
@Service
public class CustomerServiceImpl {
    
    // ... existing methods (DO NOT CHANGE)
    public CustomerDto createCustomer(CustomerDto dto) { ... }
    public void deleteCustomer(Long id) { ... }
    
    // ✅ ADD new methods at the end
    public CustomerDto createCustomerNew(CustomerCreateRequest request) { ... }
    public void deleteCustomerNew(Long id) { ... }
}
```

#### **✅ Entity Enhancement Pattern:**
```java
// ✅ CORRECT: Add new fields, keep existing ones
@Entity
public class Customer {
    // ... existing fields (DO NOT CHANGE)
    private Long cusTypeId;
    private String code;
    private String name;
    
    // ✅ ADD new fields at the end
    private String typeNew;
    private String taxCodeNew;
    private Boolean isPotential;
}
```

#### **✅ Repository Extension Pattern:**
```java
// ✅ CORRECT: Keep existing methods, add new ones
@Repository
public interface CustomerRepository extends BaseRepository<Customer, Long> {
    
    // ... existing methods (DO NOT CHANGE)
    List<Customer> findByStatusOrderByIdDesc(String status);
    boolean existsByCode(String code);
    
    // ✅ ADD new methods at the end
    List<Customer> findByTypeAndStatusOrderByNameAsc(String type, String status);
    boolean existsByTaxCodeAndStatus(String taxCode, String status);
}
```

#### **✅ Controller Endpoint Pattern:**
```java
// ✅ CORRECT: Keep existing endpoints, add new ones with different names
@RestController
public class CustomerController {
    
    // ... existing endpoints (DO NOT CHANGE)
    @PostMapping("/create")
    public ResponseEntity<Object> createCustomer(...) { ... }
    
    @GetMapping("/search")
    public ResponseEntity<Object> searchCustomers(...) { ... }
    
    // ✅ ADD new endpoints with different names
    @PostMapping("/createNew")
    public ResponseEntity<Object> createCustomerNew(...) { ... }
    
    @GetMapping("/searchNew")
    public ResponseEntity<Object> searchCustomersNew(...) { ... }
}
```

### 12.2 Exception Cases

**ONLY MODIFY EXISTING CODE WHEN:**
- **Critical bug fix** required
- **Security vulnerability** present
- **Performance issue** severe
- **Team lead approval** obtained with comprehensive testing

### 12.3 Migration Strategy

**Phase 1: Safe Addition**
- Add new fields/methods/endpoints
- Maintain 100% existing functionality
- Test new features independently

**Phase 2: Gradual Migration**
- Clients start using new APIs
- Monitor old vs new usage
- Add deprecation warnings for old methods

**Phase 3: Cleanup (After Full Migration)**
- Remove old methods only when **100% of clients** have migrated
- Require team lead approval
- Comprehensive testing required

## 13. SonarQube Configuration & Quality Gates

### 13.1 SonarQube Project Configuration

**File**: `sonar-project.properties` (Root level)

```properties
# SonarQube Project Configuration for Lunara Spa Backend
sonar.projectKey=npc-business-backend
sonar.projectName=Lunara Spa Business Backend
sonar.projectVersion=1.0.0

# Source code
sonar.sources=src/main/java
sonar.exclusions=**/test/**,**/target/**,**/build/**,**/*Test.java,**/*Tests.java

# Test coverage
sonar.java.coveragePlugin=jacoco
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
sonar.junit.reportPaths=target/surefire-reports

# Code quality thresholds
sonar.qualitygate.wait=true

# Custom rules for Lunara Spa standards
sonar.issue.ignore.multicriteria=e1,e2,e3,e4
sonar.issue.ignore.multicriteria.e1.ruleKey=java:S1128
sonar.issue.ignore.multicriteria.e1.resourceKey=**/*.java
sonar.issue.ignore.multicriteria.e2.ruleKey=java:S1481
sonar.issue.ignore.multicriteria.e2.resourceKey=**/*.java
sonar.issue.ignore.multicriteria.e3.ruleKey=java:S1854
sonar.issue.ignore.multicriteria.e3.resourceKey=**/*.java
sonar.issue.ignore.multicriteria.e4.ruleKey=java:S1186
sonar.issue.ignore.multicriteria.e4.resourceKey=**/*.java

# Duplication
sonar.cpd.exclusions=**/*Test.java,**/*Tests.java,**/dto/**,**/model/**

# Security
sonar.security.hotspots.include=**/*.java
```

### 13.2 SonarQube Quality Gates

**Required Quality Gate Configuration:**

```yaml
# Quality Gate: Lunara Spa Backend Standards
name: Lunara Spa Backend Quality Gate

# Coverage Requirements
coverage: >= 80%
line_coverage: >= 80%
branch_coverage: >= 70%

# Duplication Requirements  
duplicated_lines_density: <= 3%
duplicated_blocks: <= 1%

# Maintainability Requirements
code_smells: <= 100
technical_debt: <= 1h

# Reliability Requirements
bugs: <= 10
reliability_rating: A

# Security Requirements
vulnerabilities: <= 5
security_rating: A
security_hotspots: <= 10

# Custom Rules for Lunara Spa Standards
custom_rules:
  - validation_exception_usage
  - message_helper_injection
  - proper_repository_access_pattern
  - fis_library_compliance
```

### 13.3 Gradle Integration for SonarQube

**File**: `build.gradle.kts`

```kotlin
plugins {
    id("org.sonarqube") version "4.4.1.3373"
    id("jacoco")
}

sonar {
    properties {
        property("sonar.projectKey", "npc-business-backend")
        property("sonar.projectName", "Lunara Spa Business Backend")
        property("sonar.host.url", "http://sonar-server:9000")
        property("sonar.token", System.getenv("SONAR_TOKEN"))
        
        // Source and test directories
        property("sonar.sources", "src/main/java")
        property("sonar.tests", "src/test/java")
        
        // Coverage reports
        property("sonar.coverage.jacoco.xmlReportPaths", "build/reports/jacoco/test/jacocoTestReport.xml")
        property("sonar.junit.reportPaths", "build/test-results/test")
        
        // Exclusions
        property("sonar.exclusions", "**/test/**,**/target/**,**/build/**,**/*Test.java,**/*Tests.java")
        property("sonar.cpd.exclusions", "**/*Test.java,**/*Tests.java,**/dto/**,**/model/**")
        
        // Quality gate
        property("sonar.qualitygate.wait", "true")
    }
}

// JaCoCo configuration for test coverage
jacoco {
    toolVersion = "0.8.8"
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.test {
    finalizedBy(tasks.jacocoTestReport)
}

tasks.sonar {
    dependsOn(tasks.jacocoTestReport)
}
```

### 13.4 Pre-Commit Quality Checks

**File**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running Backend Quality Checks..."

# 1. Gradle build check
echo "🔨 Checking Gradle build..."
./gradlew build -x test
if [ $? -ne 0 ]; then
  echo "❌ Gradle build failed"
  exit 1
fi

# 2. Run tests with coverage
echo "🧪 Running tests with coverage..."
./gradlew test jacocoTestReport
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# 3. Check test coverage threshold
echo "📊 Checking test coverage..."
COVERAGE=$(./gradlew jacocoTestReport | grep -o 'Total: [0-9]*%' | grep -o '[0-9]*')
if [ "$COVERAGE" -lt 80 ]; then
  echo "❌ Test coverage below 80%: ${COVERAGE}%"
  exit 1
fi

# 4. SonarQube analysis (if configured)
if [ -f "sonar-project.properties" ]; then
  echo "🔍 Running SonarQube analysis..."
  ./gradlew sonar
  if [ $? -ne 0 ]; then
    echo "❌ SonarQube quality check failed"
    exit 1
  fi
fi

# 5. Check for ValidationException usage
echo "🎯 Checking ValidationException usage..."
if ! grep -r "ValidationException" src/main/java/; then
  echo "⚠️  WARNING: No ValidationException usage found. Consider using ValidationException for business validation."
fi

# 6. Check for MessageHelper injection
echo "📝 Checking MessageHelper injection..."
if ! grep -r "MessageHelper" src/main/java/; then
  echo "⚠️  WARNING: No MessageHelper usage found. Consider using MessageHelper for internationalization."
fi

echo "✅ All quality checks passed!"
```

### 13.5 CI/CD Pipeline Integration

**File**: `.github/workflows/backend-quality.yml`

```yaml
name: Backend Quality Checks

on:
  push:
    branches: [ main, develop ]
    paths: [ 'lunara-spa/**' ]
  pull_request:
    branches: [ main, develop ]
    paths: [ 'lunara-spa/**' ]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Cache Gradle dependencies
      uses: actions/cache@v3
      with:
        path: ~/.gradle/caches
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*') }}
        restore-keys: |
          ${{ runner.os }}-gradle-
    
    - name: Build project
      working-directory: lunara-spa
      run: ./gradlew build -x test
    
    - name: Run tests with coverage
      working-directory: lunara-spa
      run: ./gradlew test jacocoTestReport
    
    - name: Check test coverage
      working-directory: lunara-spa
      run: |
        COVERAGE=$(./gradlew jacocoTestReport | grep -o 'Total: [0-9]*%' | grep -o '[0-9]*')
        if [ "$COVERAGE" -lt 80 ]; then
          echo "❌ Test coverage below 80%: ${COVERAGE}%"
          exit 1
        fi
        echo "✅ Test coverage: ${COVERAGE}%"
    
    - name: SonarQube analysis
      working-directory: lunara-spa
      if: github.event_name == 'pull_request'
      run: |
        ./gradlew sonar
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
    
    - name: Lunara Spa Standards compliance check
      working-directory: lunara-spa
      run: |
        echo "Checking Lunara Spa standards compliance..."
        
        # Check ValidationException usage
        if ! grep -r "ValidationException" src/main/java/; then
          echo "⚠️  WARNING: No ValidationException usage found"
        fi
        
        # Check MessageHelper injection
        if ! grep -r "MessageHelper" src/main/java/; then
          echo "⚠️  WARNING: No MessageHelper usage found"
        fi
        
        # Check repository access pattern
        echo "Checking repository access patterns..."
        if grep -r "Repository.*Repository" src/main/java/; then
          echo "⚠️  WARNING: Potential violation of repository access pattern"
        fi
        
        echo "✅ Lunara Spa standards compliance check completed"
```

### 13.6 Quality Metrics Dashboard

#### **Required Quality Metrics**

```yaml
# Quality Metrics for Lunara Spa Backend
metrics:
  # Code Coverage
  coverage:
    minimum: 80%
    target: 90%
  
  # Code Duplication
  duplication:
    maximum: 3%
    target: 1%
  
  # Code Smells
  code_smells:
    maximum: 100
    target: 50
  
  # Technical Debt
  technical_debt:
    maximum: 1h
    target: 30m
  
  # Security
  security:
    vulnerabilities: 0
    hotspots: 0
  
  # Custom Lunara Spa Standards
  custom_standards:
    validation_exception_usage: 100%
    message_helper_injection: 100%
    repository_access_pattern: 100%
    fis_library_compliance: 100%
```

#### **Quality Gate Enforcement Script**

```bash
#!/bin/bash

echo "🔍 Lunara Spa Backend Quality Gate Check"

# Check Gradle build
echo "🔨 Gradle build..."
./gradlew build -x test
if [ $? -ne 0 ]; then
  echo "❌ FAILED: Gradle build"
  exit 1
fi

# Check test coverage
echo "🧪 Test coverage..."
./gradlew test jacocoTestReport
if [ $? -ne 0 ]; then
  echo "❌ FAILED: Tests"
  exit 1
fi

COVERAGE=$(./gradlew jacocoTestReport | grep -o 'Total: [0-9]*%' | grep -o '[0-9]*')
if [ "$COVERAGE" -lt 80 ]; then
  echo "❌ FAILED: Test coverage below 80%: ${COVERAGE}%"
  exit 1
fi

# Check SonarQube (if configured)
if [ -f "sonar-project.properties" ]; then
  echo "🔍 SonarQube analysis..."
  ./gradlew sonar
  if [ $? -ne 0 ]; then
    echo "❌ FAILED: SonarQube quality gate"
    exit 1
  fi
fi

# Check Lunara Spa standards compliance
echo "🎯 Lunara Spa standards compliance..."
VIOLATIONS=0

# Check ValidationException usage
if ! grep -r "ValidationException" src/main/java/; then
  echo "⚠️  WARNING: No ValidationException usage found"
fi

# Check MessageHelper injection
if ! grep -r "MessageHelper" src/main/java/; then
  echo "⚠️  WARNING: No MessageHelper usage found"
fi

# Check repository access pattern
if grep -r "Repository.*Repository" src/main/java/; then
  echo "❌ VIOLATION: Potential repository access pattern violation"
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ $VIOLATIONS -gt 0 ]; then
  echo "❌ FAILED: Lunara Spa standards compliance ($VIOLATIONS violations)"
  exit 1
fi

echo "✅ PASSED: All quality gates passed"
echo "📊 Test coverage: ${COVERAGE}%"
```

This comprehensive standard ensures consistency across all Lunara Spa backend modules while leveraging the FIS library ecosystem for enhanced functionality, maintainability, proper internationalization support through MessageHelper and ValidationException patterns, **critical backward compatibility** for production stability, and **comprehensive SonarQube quality gates** for continuous code quality assurance. 