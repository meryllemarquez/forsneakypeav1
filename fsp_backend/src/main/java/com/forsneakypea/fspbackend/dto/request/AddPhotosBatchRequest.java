package com.forsneakypea.fspbackend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** Several already-uploaded Drive photos to add to one album in a single request. */
@Data
public class AddPhotosBatchRequest {

    public static final int MAX_ITEMS = 20;

    @NotEmpty(message = "Add at least one photo.")
    @Size(max = MAX_ITEMS, message = "You can add up to 20 photos at a time.")
    @Valid
    private List<Item> items;

    @Data
    public static class Item {
        private String driveFileId;
        private String caption;
        private String location;
    }
}
