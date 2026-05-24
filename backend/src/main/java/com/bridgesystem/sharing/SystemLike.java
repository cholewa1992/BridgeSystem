package com.bridgesystem.sharing;

import com.bridgesystem.system.BiddingSystem;
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
        name = "system_like",
        uniqueConstraints = @UniqueConstraint(columnNames = {"system_id", "user_id"})
)
public class SystemLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "system_id", nullable = false)
    private BiddingSystem system;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected SystemLike() {
    }

    public SystemLike(BiddingSystem system, AppUser user) {
        this.system = system;
        this.user = user;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public BiddingSystem getSystem() {
        return system;
    }

    public AppUser getUser() {
        return user;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
