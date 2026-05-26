package com.bridgesystem.convention;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class ConventionDtos {

    private ConventionDtos() {}

    public record ConventionDetail(
            UUID id,
            String name,
            String description,
            JsonNode parameters,
            JsonNode root,
            boolean isPublic,
            String ownerUsername,
            boolean ownedByMe,
            String permission,
            ForkedFromRef forkedFrom,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            long likeCount,
            int forkCount,
            Boolean likedByMe
    ) {}

    public record ConventionSummary(
            UUID id,
            String name,
            String description,
            int paramCount,
            String ownerUsername,
            boolean ownedByMe,
            boolean isPublic,
            OffsetDateTime updatedAt,
            long likeCount,
            int forkCount,
            Boolean likedByMe
    ) {}

    public record ForkedFromRef(String id, String name) {}

    public record CreateRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 4000) String description
    ) {}

    public record UpdateRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 4000) String description,
            JsonNode parameters,
            JsonNode root
    ) {}

    public record VisibilityRequest(boolean isPublic) {}

    public record LikeResponse(long likeCount, boolean likedByMe) {}

    public record ShareDto(String username, String displayName, String permission, OffsetDateTime createdAt) {}

    public record CreateShareRequest(String username, String permission) {}
}
