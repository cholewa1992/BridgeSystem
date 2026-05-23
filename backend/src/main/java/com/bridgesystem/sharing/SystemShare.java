package com.bridgesystem.sharing;

import com.bridgesystem.system.BiddingSystem;
import com.bridgesystem.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
        name = "system_share",
        uniqueConstraints = @UniqueConstraint(columnNames = {"system_id", "shared_with_id"})
)
public class SystemShare {

    public enum Permission { READ, WRITE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "system_id", nullable = false)
    private BiddingSystem system;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_with_id", nullable = false)
    private AppUser sharedWith;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Permission permission;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected SystemShare() {
    }

    public SystemShare(BiddingSystem system, AppUser sharedWith, Permission permission) {
        this.system = system;
        this.sharedWith = sharedWith;
        this.permission = permission;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public BiddingSystem getSystem() {
        return system;
    }

    public AppUser getSharedWith() {
        return sharedWith;
    }

    public Permission getPermission() {
        return permission;
    }

    public void setPermission(Permission permission) {
        this.permission = permission;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
