package com.kevin.lunaraspa.entity;

import com.kevin.lunaraspa.core.data.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounts", indexes = {
    @Index(columnList = "role_id"),
    @Index(columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class Account extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "google_subject", unique = true, length = 255)
    private String googleSubject;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provisioned_by_account_id")
    private Account provisionedByAccount;

    @Column(name = "last_login_at")
    private java.time.LocalDateTime lastLoginAt;

    @OneToOne(mappedBy = "account", cascade = CascadeType.ALL)
    private CustomerProfile customerProfile;

    @OneToOne(mappedBy = "account", cascade = CascadeType.ALL)
    private StaffProfile staffProfile;
}
