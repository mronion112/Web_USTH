package com.kevin.lunaraspa.spa_service.entity;

import com.kevin.lunaraspa.core.data.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "services")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SpaService extends BaseEntity {

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
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
