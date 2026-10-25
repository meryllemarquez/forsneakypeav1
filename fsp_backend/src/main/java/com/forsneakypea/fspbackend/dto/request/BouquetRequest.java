package com.forsneakypea.fspbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BouquetRequest {
    @NotBlank(message = "Give the bouquet a name.")
    @Size(max = 40, message = "That name is a bit long.")
    private String title;

    // Shape, allow-lists, limits and size are checked in BouquetService.
    private Map<String, Object> recipe;

    /** Update only: the version the client last saw. */
    private Long version;
}
