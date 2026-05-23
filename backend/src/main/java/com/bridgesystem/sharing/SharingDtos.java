package com.bridgesystem.sharing;

import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;

public final class SharingDtos {

    private SharingDtos() {}

    public record ShareDto(
            String username,
            String displayName,
            String permission,
            OffsetDateTime createdAt
    ) {}

    public record CreateShare(
            @NotBlank String username,
            @NotBlank String permission
    ) {}
}
