package com.raspollob.server.controller;

import com.raspollob.server.dto.AdminUserRequest;
import com.raspollob.server.dto.CreateRoleRequest;
import com.raspollob.server.dto.RoleAssignmentRequest;
import com.raspollob.server.dto.UserStatusRequest;
import com.raspollob.server.entity.Permission;
import com.raspollob.server.entity.Role;
import com.raspollob.server.entity.User;
import com.raspollob.server.repository.PermissionRepository;
import com.raspollob.server.repository.RoleRepository;
import com.raspollob.server.repository.UserRepository;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.security.PermissionCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.raspollob.server.service.RolePermissionService rolePermissionService;

    // ==================== USER MANAGEMENT ====================

    @PreAuthorize("@perm.hasAny('userRoleSetup.subModules.systemUser.isAccess', 'userRoleSetup.subModules.customerUser.isAccess')")
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.systemUser.actions.create')")
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@jakarta.validation.Valid @RequestBody AdminUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            roles.addAll(roleRepository.findAllById(request.getRoleIds()));
        } else {
            roleRepository.findByName("CUSTOMER").ifPresent(roles::add);
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .mobile(request.getMobile())
                .password(passwordEncoder.encode(request.getPassword() != null && !request.getPassword().isBlank() ? request.getPassword() : "123456"))
                .roles(roles)
                .isActive(true)
                .build();

        return ResponseEntity.ok(userRepository.save(user));
    }

    @PreAuthorize("@perm.canManageUser(#userId, 'update')")
    @PutMapping("/users/{userId}")
    public ResponseEntity<User> updateUser(@org.springframework.security.core.parameters.P("userId") @PathVariable Long userId, @jakarta.validation.Valid @RequestBody AdminUserRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getUsername() != null && !request.getUsername().isBlank()) user.setUsername(request.getUsername());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getMobile() != null) user.setMobile(request.getMobile());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.systemUser.actions.update')")
    @PutMapping("/users/{userId}/roles")
    public ResponseEntity<User> updateUserRoles(@PathVariable Long userId, @RequestBody RoleAssignmentRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        List<Long> roleIds = request.getRoleIds();
        
        Set<Role> roles = new HashSet<>(roleRepository.findAllById(roleIds));
        user.setRoles(roles);
        
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PreAuthorize("@perm.canManageUser(#userId, 'update')")
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<User> toggleUserStatus(@org.springframework.security.core.parameters.P("userId") @PathVariable Long userId, @RequestBody UserStatusRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setIsActive(request.getIsActive());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PreAuthorize("@perm.canManageUser(#userId, 'delete')")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@org.springframework.security.core.parameters.P("userId") @PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new RuntimeException("Cannot delete default Super Admin user.");
        }
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }

    // ==================== ROLE BUILDER ====================

    @PreAuthorize("@perm.hasAny('userRoleSetup.subModules.roleManagement.isAccess', 'userRoleSetup.subModules.systemUser.isAccess', 'userRoleSetup.subModules.rolePermissionSetup.isAccess')")
    @GetMapping("/roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.roleManagement.actions.create')")
    @PostMapping("/roles")
    public ResponseEntity<Role> createRole(@RequestBody CreateRoleRequest request) {
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
        
        return ResponseEntity.ok(roleRepository.save(role));
    }

    @PreAuthorize("@perm.has('userRoleSetup.subModules.roleManagement.actions.update')")
    @PutMapping("/roles/{roleId}")
    public ResponseEntity<Role> updateRole(@PathVariable Long roleId, @RequestBody CreateRoleRequest request) {
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
        return ResponseEntity.ok(roleRepository.save(role));
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
