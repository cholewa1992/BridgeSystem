package com.bridgesystem.system;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class BiddingSystemDtos {

    private BiddingSystemDtos() {}

    public record SystemSummary(
            UUID id,
            String name,
            String description,
            String ownerUsername,
            boolean ownedByMe,
            String permission,
            OffsetDateTime updatedAt,
            boolean isPublic,
            long likeCount,
            int forkCount,
            Boolean likedByMe
    ) {}

    public record ForkedFromRef(
            String id,
            String name,
            String ownerUsername
    ) {}

    public record SystemDetail(
            UUID id,
            String name,
            String description,
            String ownerUsername,
            boolean ownedByMe,
            String permission,
            JsonNode tree,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            boolean isPublic,
            long likeCount,
            int forkCount,
            Boolean likedByMe,
            ForkedFromRef forkedFrom
    ) {}

    public record CreateRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 4000) String description
    ) {}

    public record UpdateRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 4000) String description,
            JsonNode tree
    ) {}

    public record VisibilityRequest(boolean isPublic) {}

    public record LikeResponse(long likeCount, boolean likedByMe) {}

    public record UserProfileDto(
            String username,
            String displayName,
            OffsetDateTime createdAt,
            int publicSystemCount
    ) {}
}
