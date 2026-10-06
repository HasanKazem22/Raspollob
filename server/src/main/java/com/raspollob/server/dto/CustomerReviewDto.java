package com.raspollob.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerReviewDto {
    private String name;
    private Integer rating;
    private String comment;
    private String profileImage;
}
