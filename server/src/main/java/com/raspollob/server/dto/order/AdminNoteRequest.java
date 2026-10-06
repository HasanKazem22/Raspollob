package com.raspollob.server.dto.order;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminNoteRequest {

    @Size(max = 2000, message = "Note can be at most 2000 characters")
    private String adminNote;
}
