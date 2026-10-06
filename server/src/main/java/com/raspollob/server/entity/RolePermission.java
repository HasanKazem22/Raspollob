package com.raspollob.server.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "role_permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class RolePermission extends BaseEntity {

    @Column(name = "role_name", nullable = false, unique = true)
    private String roleName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "permission_tree", columnDefinition = "jsonb")
    private Map<String, Object> permissionTree;
}
