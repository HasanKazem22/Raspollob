package com.raspollob.server.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Profile details a user may change about themselves. Username and roles are not editable here. */
@Data
public class UpdateAccountRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name can be at most 100 characters")
    private String fullName;

    @Email(message = "Enter a valid email address")
    @Size(max = 150)
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = ValidationPatterns.BD_PHONE, message = ValidationPatterns.BD_PHONE_MESSAGE)
    private String mobile;

    @Size(max = 100, message = "City can be at most 100 characters")
    private String city;

    @Size(max = 500, message = "Address can be at most 500 characters")
    private String address;
}
