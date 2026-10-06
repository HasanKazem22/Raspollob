package com.raspollob.server.service;

import com.raspollob.server.entity.RolePermission;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.repository.RolePermissionRepository;
import com.raspollob.server.security.PermissionCatalog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stores and serves per-role permission trees, always normalized against {@link PermissionCatalog}.
 * Trees are cached in memory (they're read on every protected request) and evicted on change.
 * Note: with several server instances, use a shared cache or a short TTL instead.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RolePermissionRepository rolePermissionRepository;
    private final Map<String, Map<String, Object>> cache = new ConcurrentHashMap<>();

    /** Normalized tree for one role; roles without a stored tree get the defaults. */
    @Transactional(readOnly = true)
    public Map<String, Object> getTree(String roleName) {
        return cache.computeIfAbsent(roleName, name -> rolePermissionRepository.findByRoleName(name)
                .map(rp -> PermissionCatalog.normalize(rp.getPermissionTree(), name))
                .orElseGet(() -> PermissionCatalog.defaultTree(name)));
    }

    /** Combined permissions for a user's roles (any role granting it is enough). */
    @Transactional(readOnly = true)
    public Map<String, Object> getMergedPermissionsForRoles(List<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return getTree(PermissionCatalog.GUEST);
        }
        return PermissionCatalog.merge(roleNames.stream().map(this::getTree).toList());
    }

    @Transactional
    public Map<String, Object> saveTree(String roleName, Map<String, Object> permissionTree) {
        if (PermissionCatalog.ADMIN.equals(roleName)) {
            throw new BadRequestException("The ADMIN role always has full access and can't be changed.");
        }
        Map<String, Object> normalized = PermissionCatalog.normalize(permissionTree, roleName);
        RolePermission entity = rolePermissionRepository.findByRoleName(roleName)
                .orElseGet(() -> RolePermission.builder().roleName(roleName).build());
        entity.setPermissionTree(normalized);
        rolePermissionRepository.save(entity);
        cache.remove(roleName);
        return normalized;
    }

    /** Keeps permissions attached when a custom role is renamed. */
    @Transactional
    public void renameRole(String oldName, String newName) {
        rolePermissionRepository.findByRoleName(oldName).ifPresent(rp -> {
            rp.setRoleName(newName);
            rolePermissionRepository.save(rp);
        });
        cache.remove(oldName);
        cache.remove(newName);
    }

    @Transactional
    public void deleteRole(String roleName) {
        rolePermissionRepository.findByRoleName(roleName).ifPresent(rolePermissionRepository::delete);
        cache.remove(roleName);
    }

    /**
     * Startup migration: normalizes every stored tree to the current catalog (keeping existing
     * choices, dropping obsolete modules) and creates defaults for built-in roles that have none.
     */
    @Transactional
    public void migrateAndSeed(List<String> builtInRoles) {
        for (RolePermission rp : rolePermissionRepository.findAll()) {
            rp.setPermissionTree(PermissionCatalog.normalize(rp.getPermissionTree(), rp.getRoleName()));
            rolePermissionRepository.save(rp);
        }
        for (String role : builtInRoles) {
            if (rolePermissionRepository.findByRoleName(role).isEmpty()) {
                rolePermissionRepository.save(RolePermission.builder()
                        .roleName(role)
                        .permissionTree(PermissionCatalog.defaultTree(role))
                        .build());
            }
        }
        cache.clear();
        log.info("Role permission trees migrated to the current catalog");
    }
}
