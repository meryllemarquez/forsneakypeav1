package com.forsneakypea.fspbackend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuReorderRequest {
    @NotNull(message = "ids are required")
    private List<UUID> ids;
}
