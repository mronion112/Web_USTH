package com.kevin.lunaraspa.profiles.entity;
import com.kevin.lunaraspa.authentication_account.entity.Account;

import com.kevin.lunaraspa.core.data.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "customer_profiles", indexes = {
    @Index(columnList = "phone")
})
@Getter
@Setter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class CustomerProfile extends BaseEntity {
    @Id
    @Column(name = "account_id")
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(length = 30)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String preferences;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;
}
