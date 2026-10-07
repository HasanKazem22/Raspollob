package com.raspollob.server.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** Create a staff account, or edit any account, from the admin panel. Empty fields are left unchanged on edit. */
@Data
public class AdminUserRequest {
    @Size(max = 100)
    private String fullName;
    @Size(max = 50)
    private String username;
    @Email(message = "Enter a valid email address")
    @Size(max = 150)
    private String email;
    @Pattern(regexp = ValidationPatterns.BD_PHONE, message = ValidationPatterns.BD_PHONE_MESSAGE)
    private String mobile;
    @Size(max = 100)
    private String password;
    @Size(max = 100)
    private String city;
    @Size(max = 500)
    private String address;
    /** Staff accounts only; never CUSTOMER or GUEST */
    private List<Long> roleIds;
}
