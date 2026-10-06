package com.raspollob.server.repository;

import com.raspollob.server.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    Optional<RolePermission> findByRoleName(String roleName);
    List<RolePermission> findByRoleNameIn(List<String> roleNames);
}
