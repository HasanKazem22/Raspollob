package com.raspollob.server.dto;

import com.raspollob.server.entity.Role;
import com.raspollob.server.security.PermissionCatalog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private Long id;
    private String name;
    private String description;
    /** ADMIN, MANAGER, CUSTOMER, GUEST: can't be renamed or deleted */
    private Boolean builtIn;
    /** Can be picked for a staff account (false for CUSTOMER and GUEST) */
    private Boolean staffAssignable;
    private LocalDateTime createdAt;

    public static RoleResponse of(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .builtIn(PermissionCatalog.SYSTEM_ROLES.contains(role.getName()))
                .staffAssignable(PermissionCatalog.isStaffRole(role.getName()))
                .createdAt(role.getCreatedAt())
                .build();
    }
}
