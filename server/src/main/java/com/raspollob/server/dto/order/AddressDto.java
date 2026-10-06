package com.raspollob.server.dto.order;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {

    /** Bangladeshi mobile number, with or without +88 */
    public static final String BD_PHONE_REGEX = com.raspollob.server.dto.ValidationPatterns.BD_PHONE;

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name is too long")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = BD_PHONE_REGEX, message = com.raspollob.server.dto.ValidationPatterns.BD_PHONE_MESSAGE)
    private String phone;

    @Email(message = "Enter a valid email address")
    @Size(max = 160)
    private String email;

    @NotBlank(message = "Address is required")
    @Size(max = 500, message = "Address is too long")
    private String addressLine;

    @Size(max = 120)
    private String area;

    @NotBlank(message = "City / district is required")
    @Size(max = 80)
    private String city;

    @Size(max = 12)
    private String postalCode;
}
