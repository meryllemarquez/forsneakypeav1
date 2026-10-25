package com.forsneakypea.fspbackend.dto.request;

import com.forsneakypea.fspbackend.entity.WheelChoice;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WheelRequest {
    @NotBlank(message = "Give the wheel a name.")
    @Size(max = 40, message = "That name is a bit long.")
    private String name;

    // Count, labels, colours and ids are checked in WheelService.
    private List<WheelChoice> choices;

    /** Update only: the version the client last saw. */
    private Long version;
}
