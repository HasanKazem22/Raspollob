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
public class ContactMessageRequest {
    @NotBlank
    private String name;
    
    @NotBlank
    @jakarta.validation.constraints.Pattern(regexp = com.raspollob.server.dto.ValidationPatterns.BD_PHONE, message = com.raspollob.server.dto.ValidationPatterns.BD_PHONE_MESSAGE)
    private String phone;
    
    @NotBlank
    private String question;
}
