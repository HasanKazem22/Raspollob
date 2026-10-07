package com.raspollob.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** The signed-in user's own profile. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String mobile;
    private String city;
    private String address;
    private String avatarUrl;
    private List<String> roles;
}
