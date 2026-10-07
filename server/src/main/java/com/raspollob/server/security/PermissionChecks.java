package com.raspollob.server.security;

import com.raspollob.server.entity.Role;
import com.raspollob.server.entity.User;
import com.raspollob.server.repository.UserRepository;
import com.raspollob.server.service.RolePermissionService;
import com.raspollob.server.service.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Permission checks for {@code @PreAuthorize}, e.g. {@code @PreAuthorize("@perm.has('order.actions.update')")}.
 * Signed-in users get the merged tree of their roles; anonymous visitors get the GUEST tree.
 * ADMIN always passes.
 */
@Component("perm")
@RequiredArgsConstructor
public class PermissionChecks {

    private final RolePermissionService rolePermissionService;
    private final UserRepository userRepository;

    public boolean has(String path) {
        return isAdmin() || PermissionCatalog.resolve(currentTree(), path);
    }

    public boolean hasAny(String... paths) {
        return isAdmin() || Arrays.stream(paths).anyMatch(p -> PermissionCatalog.resolve(currentTree(), p));
    }

    /** Can open at least one admin module (used for shared admin endpoints such as image upload). */
    public boolean isStaff() {
        return isAdmin() || (currentUser() != null && PermissionCatalog.hasAnyAdminAccess(currentTree()));
    }

    /**
     * Staff accounts and customer accounts are managed under different permissions;
     * this picks the right one for the target user.
     */
    public boolean canManageUser(Long userId, String action) {
        boolean isCustomer = userRepository.findById(userId)
                .map(u -> UserAdminService.kindOf(u) == UserAdminService.Kind.CUSTOMER)
                .orElse(false);
        return has("userRoleSetup.subModules." + (isCustomer ? "customerUser" : "systemUser") + ".actions." + action);
    }

    /** Merged tree for the current request's user (GUEST tree when not signed in). */
    public Map<String, Object> currentTree() {
        User user = currentUser();
        return rolePermissionService.getMergedPermissionsForRoles(
                user == null ? List.of(PermissionCatalog.GUEST) : roleNames(user));
    }

    private boolean isAdmin() {
        User user = currentUser();
        return user != null && user.getRoles().stream().anyMatch(r -> PermissionCatalog.ADMIN.equals(r.getName()));
    }

    private static List<String> roleNames(User user) {
        return user.getRoles().stream().map(Role::getName).toList();
    }

    private static User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof User user ? user : null;
    }
}
