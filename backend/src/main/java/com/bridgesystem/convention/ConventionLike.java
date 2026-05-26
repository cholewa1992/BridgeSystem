package com.bridgesystem.convention;

import com.bridgesystem.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "convention_like",
        uniqueConstraints = @UniqueConstraint(columnNames = {"convention_id", "user_id"})
)
public class ConventionLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "convention_id", nullable = false)
    private Convention convention;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected ConventionLike() {
    }

    public ConventionLike(Convention convention, AppUser user) {
        this.convention = convention;
        this.user = user;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Convention getConvention() {
        return convention;
    }

    public AppUser getUser() {
        return user;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
