package com.raspollob.server.controller;

import com.raspollob.server.dto.AdminUserRequest;
import com.raspollob.server.dto.AdminUserResponse;
import com.raspollob.server.dto.CreateRoleRequest;
import com.raspollob.server.dto.RoleResponse;
import com.raspollob.server.dto.UserStatusRequest;
import com.raspollob.server.service.UserAdminService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.parameters.P;
import com.raspollob.server.entity.Permission;
import com.raspollob.server.entity.Role;
import com.raspollob.server.entity.User;
import com.raspollob.server.repository.PermissionRepository;
import com.raspollob.server.repository.RoleRepository;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.security.PermissionCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserAdminService userAdminService;
    private final com.raspollob.server.service.RolePermissionService rolePermissionService;

    // ==================== USER MANAGEMENT ====================

    /** ?type=staff or ?type=customer; all accounts when omitted. Never includes passwords. */
    @PreAuthorize("@perm.hasAny('userRoleSetup.subModules.systemUser.isAccess', 'userRoleSetup.subModules.customerUser.isAccess')")
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers(@RequestParam(required = false) String type) {
        UserAdminService.Kind kind = type == null ? null : switch (type.toLowerCase()) {
            case "staff" -> UserAdminService.Kind.STAFF;
            case "customer" -> UserAdminService.Kind.CUSTOMER;
            default -> throw new BadRequestException("Unknown user type: " + type);
        };
        return ResponseEntity.ok(userAdminService.list(kind));
    }

    /** Staff accounts only: customers sign up themselves. */
    @PreAuthorize("@perm.has('userRoleSetup.subModules.systemUser.actions.create')")
    @PostMapping("/users")
    public ResponseEntity<AdminUserResponse> createUser(@Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(userAdminService.createStaff(request));
    }

    @PreAuthorize("@perm.canManageUser(#userId, 'update')")
    @PutMapping("/users/{userId}")
    public ResponseEntity<AdminUserResponse> updateUser(@P("userId") @PathVariable Long userId,
                                                        @Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(userAdminService.update(userId, request));
    }

    @PreAuthorize("@perm.canManageUser(#userId, 'update')")
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<AdminUserResponse> toggleUserStatus(@P("userId") @PathVariable Long userId,
                                                              @RequestBody UserStatusRequest request,
                                                              @AuthenticationPrincipal User actingUser) {
        return ResponseEntity.ok(userAdminService.setActive(userId, Boolean.TRUE.equals(request.getIsActive()), actingUser.getId()));
    }

    @PreAuthorize("@perm.canManageUser(#userId, 'delete')")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@P("userId") @PathVariable Long userId,
                                           @AuthenticationPrincipal User actingUser) {
        userAdminService.delete(userId, actingUser.getId());
        return ResponseEntity.ok().build();
    }

    // ==================== ROLE BUILDER ====================

    @PreAuthorize("@perm.hasAny('userRoleSetup.subModules.roleManagement.isAccess', 'userRoleSetup.subModules.systemUser.isAccess', 'userRoleSetup.subModules.rolePermissionSetup.isAccess')")
    @GetMapping("/roles")
    public ResponseEntity<List<RoleResponse>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll().stream().map(RoleResponse::of).toList());
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.roleManagement.actions.create')")
    @PostMapping("/roles")
    public ResponseEntity<RoleResponse> createRole(@RequestBody CreateRoleRequest request) {
        String name = normalizeRoleName(request.getName());
        if (name.isEmpty()) {
            throw new BadRequestException("Role name is required.");
        }
        if (roleRepository.findByName(name).isPresent()) {
            throw new BadRequestException("A role named \"" + name + "\" already exists.");
        }
        String description = request.getDescription();

        Role role = Role.builder()
                .name(name)
                .description(description)
                .build();
        
        return ResponseEntity.ok(RoleResponse.of(roleRepository.save(role)));
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.roleManagement.actions.update')")
    @PutMapping("/roles/{roleId}")
    public ResponseEntity<RoleResponse> updateRole(@PathVariable Long roleId, @RequestBody CreateRoleRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        if (request.getName() != null && !request.getName().isBlank() && !normalizeRoleName(request.getName()).equals(role.getName())) {
            String newName = normalizeRoleName(request.getName());
            // Built-in role names are referenced by the system (ADMIN bypass, guest checkout, ...)
            if (PermissionCatalog.SYSTEM_ROLES.contains(role.getName())) {
                throw new BadRequestException("Built-in roles can't be renamed.");
            }
            if (roleRepository.findByName(newName).isPresent()) {
                throw new BadRequestException("A role named \"" + newName + "\" already exists.");
            }
            rolePermissionService.renameRole(role.getName(), newName);
            role.setName(newName);
        }
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        return ResponseEntity.ok(RoleResponse.of(roleRepository.save(role)));
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.roleManagement.actions.delete')")
    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        if (PermissionCatalog.SYSTEM_ROLES.contains(role.getName())) {
            throw new BadRequestException("Built-in roles can't be deleted.");
        }
        roleRepository.delete(role);
        rolePermissionService.deleteRole(role.getName());
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.roleManagement.isAccess')")
    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionRepository.findAll());
    }

    /** "Sales staff" → "SALES_STAFF" (same rule for create and rename). */
    private static String normalizeRoleName(String name) {
        return name == null ? "" : name.trim().toUpperCase().replaceAll("\\s+", "_");
    }
}
