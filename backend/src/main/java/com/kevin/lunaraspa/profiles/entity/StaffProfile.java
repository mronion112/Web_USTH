package com.kevin.lunaraspa.profiles.entity;
import com.kevin.lunaraspa.authentication_account.entity.Account;

import com.kevin.lunaraspa.core.data.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "staff_profiles", indexes = {
    @Index(columnList = "is_bookable")
})
@Getter
@Setter
@Builder
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class StaffProfile extends BaseEntity {
    @Id
    @Column(name = "account_id")
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "employee_code", nullable = false, unique = true, length = 50)
    private String employeeCode;

    @Column(name = "job_title", nullable = false, length = 100)
    private String jobTitle;

    @Column(name = "is_bookable", nullable = false)
    @Builder.Default
    private Boolean isBookable = true;
}
