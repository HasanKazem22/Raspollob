package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.repository.RoleRepository;
import com.raspollob.server.security.PermissionCatalog;
import com.raspollob.server.service.RolePermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/role-permissions")
@RequiredArgsConstructor
public class RolePermissionController {

    private final RolePermissionService rolePermissionService;
    private final RoleRepository roleRepository;

    public record RolePermissionView(String roleName, Map<String, Object> permissionTree, boolean locked) {
    }

    /** Everything that can be permitted — the admin screen renders this, so it never drifts from the server. */
    @GetMapping("/catalog")
    @PreAuthorize("@perm.has('userRoleSetup.subModules.rolePermissionSetup.isAccess')")
    public ResponseEntity<ApiResponse<List<PermissionCatalog.Node>>> getCatalog() {
        return ResponseEntity.ok(ApiResponse.success(PermissionCatalog.MODULES, "Permission catalog"));
    }

    @GetMapping("/{roleName}")
    @PreAuthorize("@perm.has('userRoleSetup.subModules.rolePermissionSetup.isAccess')")
    public ResponseEntity<ApiResponse<RolePermissionView>> getRolePermission(@PathVariable String roleName) {
        requireRole(roleName);
        return ResponseEntity.ok(ApiResponse.success(view(roleName, rolePermissionService.getTree(roleName)), "Role permissions"));
    }

    @PutMapping("/{roleName}")
    @PreAuthorize("@perm.has('userRoleSetup.subModules.rolePermissionSetup.actions.update')")
    public ResponseEntity<ApiResponse<RolePermissionView>> updateRolePermission(
            @PathVariable String roleName,
            @RequestBody Map<String, Object> permissionTree) {
        requireRole(roleName);
        Map<String, Object> saved = rolePermissionService.saveTree(roleName, permissionTree);
        return ResponseEntity.ok(ApiResponse.success(view(roleName, saved), "Permissions saved"));
    }

    private void requireRole(String roleName) {
        if (!PermissionCatalog.GUEST.equals(roleName) && roleRepository.findByName(roleName).isEmpty()) {
            throw new ResourceNotFoundException("Role not found: " + roleName);
        }
    }

    private static RolePermissionView view(String roleName, Map<String, Object> tree) {
        return new RolePermissionView(roleName, tree, PermissionCatalog.ADMIN.equals(roleName));
    }
}
