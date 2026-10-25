package com.forsneakypea.fspbackend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemRequest {
    @NotBlank(message = "Give it a name.")
    @Size(max = 60, message = "That name is a bit long.")
    private String name;

    private String doodle;

    private String lovedBy;

    @Size(max = 80, message = "That place name is a bit long.")
    private String place;

    @Min(value = 0, message = "That price looks off.")
    @Max(value = 99999, message = "That price looks off.")
    private Integer pricePhp;

    @Size(max = 200, message = "That note is a bit long.")
    private String note;

    /** Create only: the item to insert after; null = last. */
    private UUID afterId;

    /** Update only: the version the client last saw. */
    private Long version;
}
