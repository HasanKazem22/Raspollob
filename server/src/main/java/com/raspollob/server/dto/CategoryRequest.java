package com.raspollob.server.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    private String slug;

    private String description;

    private String imageUrl;

    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private Boolean showInNavbar = false;

    @Builder.Default
    private Boolean showInHome = true;

    @Builder.Default
    private Boolean isActive = true;
}

