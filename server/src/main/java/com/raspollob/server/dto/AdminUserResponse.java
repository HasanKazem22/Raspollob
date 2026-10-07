package com.raspollob.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/** An account as shown in the admin panel. Never includes the password. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String mobile;
    private String city;
    private String address;
    private Boolean isActive;
    /** True for staff accounts (any role other than Customer) */
    private Boolean staff;
    private List<RoleRef> roles;
    private LocalDateTime createdAt;

    public record RoleRef(Long id, String name) {
    }
}
