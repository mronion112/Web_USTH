package vn.edu.usth.lunara.spaservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "services")
public class SpaServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "minimum_duration_minutes", nullable = false)
    private Integer minimumDurationMinutes;

    @Column(name = "is_duration_adjustable", nullable = false)
    private boolean durationAdjustable;

    @Column(name = "duration_step_minutes")
    private Integer durationStepMinutes;

    @Column(name = "price_per_duration_step", precision = 12, scale = 2)
    private BigDecimal pricePerDurationStep;

    @Column(name = "preparation_buffer_minutes", nullable = false)
    private Integer preparationBufferMinutes;

    @Column(name = "cleanup_buffer_minutes", nullable = false)
    private Integer cleanupBufferMinutes;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    protected SpaServiceEntity() {
    }

    public SpaServiceEntity(
            String name,
            String category,
            String description,
            BigDecimal basePrice,
            Integer minimumDurationMinutes,
            boolean durationAdjustable,
            Integer durationStepMinutes,
            BigDecimal pricePerDurationStep,
            Integer preparationBufferMinutes,
            Integer cleanupBufferMinutes
    ) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.basePrice = basePrice;
        this.minimumDurationMinutes = minimumDurationMinutes;
        this.durationAdjustable = durationAdjustable;
        this.durationStepMinutes = durationStepMinutes;
        this.pricePerDurationStep = pricePerDurationStep;
        this.preparationBufferMinutes = preparationBufferMinutes;
        this.cleanupBufferMinutes = cleanupBufferMinutes;
        this.displayOrder = 0;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public Integer getMinimumDurationMinutes() {
        return minimumDurationMinutes;
    }

    public boolean isDurationAdjustable() {
        return durationAdjustable;
    }

    public Integer getDurationStepMinutes() {
        return durationStepMinutes;
    }

    public BigDecimal getPricePerDurationStep() {
        return pricePerDurationStep;
    }

    public Integer getPreparationBufferMinutes() {
        return preparationBufferMinutes;
    }

    public Integer getCleanupBufferMinutes() {
        return cleanupBufferMinutes;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
