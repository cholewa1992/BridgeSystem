package com.bridgesystem.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUser {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(name = "display_name", nullable = false, length = 128)
    private String displayName;

    @Column(name = "user_handle", nullable = false, unique = true)
    private byte[] userHandle;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected AppUser() {
    }

    public AppUser(UUID id, String username, String displayName, byte[] userHandle) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.userHandle = userHandle;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public byte[] getUserHandle() {
        return userHandle;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
