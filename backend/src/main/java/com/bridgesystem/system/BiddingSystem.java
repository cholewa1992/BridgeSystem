package com.bridgesystem.system;

import com.bridgesystem.user.AppUser;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.Type;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Entity
@Table(name = "bidding_system")
public class BiddingSystem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private AppUser owner;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Type(JsonBinaryType.class)
    @Column(name = "tree_json", nullable = false, columnDefinition = "jsonb")
    private String treeJson;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forked_from_id")
    @Nullable
    private BiddingSystem forkedFrom;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected BiddingSystem() {
    }

    public BiddingSystem(UUID id, AppUser owner, String name, String description, String treeJson) {
        this.id = id;
        this.owner = owner;
        this.name = name;
        this.description = description;
        this.treeJson = treeJson;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    /** Fork constructor — creates a deep copy owned by {@code newOwner}. */
    public BiddingSystem(UUID id, AppUser newOwner, String name, String description, String treeJson,
                         BiddingSystem forkedFrom) {
        this(id, newOwner, name, description, treeJson);
        this.forkedFrom = forkedFrom;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // ── Domain methods ─────────────────────────────────────────────────────

    /**
     * Creates and returns a new BiddingSystem that is a fork of this one,
     * owned by {@code newOwner}.
     */
    public BiddingSystem fork(UUID newId, AppUser newOwner) {
        return new BiddingSystem(newId, newOwner, this.name + " (fork)", this.description, this.treeJson, this);
    }

    /**
     * Updates name, description, and treeJson in one call.
     */
    public void updateContent(String name, String description, String treeJson) {
        this.name = name;
        this.description = description;
        this.treeJson = treeJson;
    }

    /**
     * Throws {@link IllegalStateException} if {@code forkCount > 0}.
     */
    public void ensureDeletable(long forkCount) {
        if (forkCount > 0) {
            throw new IllegalStateException(
                    "Cannot delete a system that has " + forkCount + " active fork(s). Make the system private first."
            );
        }
    }

    /** Sets the system to public. */
    public void publish() {
        this.isPublic = true;
    }

    /** Sets the system to private. */
    public void unpublish() {
        this.isPublic = false;
    }

    public UUID getId() {
        return id;
    }

    public AppUser getOwner() {
        return owner;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTreeJson() {
        return treeJson;
    }

    public void setTreeJson(String treeJson) {
        this.treeJson = treeJson;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public boolean isPublic() {
        return isPublic;
    }

    public void setIsPublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    @Nullable
    public BiddingSystem getForkedFrom() {
        return forkedFrom;
    }
}
