package com.bridgesystem.convention;

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
import org.springframework.lang.Nullable;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "convention")
public class Convention {

    private static final String EMPTY_PARAMETERS = "[]";
    private static final String EMPTY_ROOT = "{\"id\":\"root\",\"bids\":[],\"meaning\":\"\",\"children\":[]}";

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
    @Column(name = "parameters_json", nullable = false, columnDefinition = "jsonb")
    private String parametersJson;

    @Type(JsonBinaryType.class)
    @Column(name = "root_json", nullable = false, columnDefinition = "jsonb")
    private String rootJson;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forked_from_id")
    @Nullable
    private Convention forkedFrom;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Convention() {
    }

    public Convention(UUID id, AppUser owner, String name, String description) {
        this.id = id;
        this.owner = owner;
        this.name = name;
        this.description = description;
        this.parametersJson = EMPTY_PARAMETERS;
        this.rootJson = EMPTY_ROOT;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    /** Fork constructor — creates a deep copy owned by {@code newOwner}. */
    public Convention(UUID id, AppUser newOwner, String name, String description,
                      String parametersJson, String rootJson, Convention forkedFrom) {
        this.id = id;
        this.owner = newOwner;
        this.name = name;
        this.description = description;
        this.parametersJson = parametersJson;
        this.rootJson = rootJson;
        this.forkedFrom = forkedFrom;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // ── Domain methods ─────────────────────────────────────────────────────

    public void publish() {
        this.isPublic = true;
    }

    public void unpublish() {
        this.isPublic = false;
    }

    public Convention fork(UUID newId, AppUser newOwner) {
        return new Convention(newId, newOwner, this.name + " (fork)", this.description,
                this.parametersJson, this.rootJson, this);
    }

    public void updateContent(String name, String description, String parametersJson, String rootJson) {
        this.name = name;
        this.description = description;
        if (parametersJson != null) {
            this.parametersJson = parametersJson;
        }
        if (rootJson != null) {
            this.rootJson = rootJson;
        }
    }

    // ── Getters / setters ──────────────────────────────────────────────────

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

    public String getParametersJson() {
        return parametersJson;
    }

    public void setParametersJson(String parametersJson) {
        this.parametersJson = parametersJson;
    }

    public String getRootJson() {
        return rootJson;
    }

    public void setRootJson(String rootJson) {
        this.rootJson = rootJson;
    }

    public boolean isPublic() {
        return isPublic;
    }

    public void setIsPublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    @Nullable
    public Convention getForkedFrom() {
        return forkedFrom;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
