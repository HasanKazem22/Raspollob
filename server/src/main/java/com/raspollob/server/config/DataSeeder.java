package com.raspollob.server.config;

import com.raspollob.server.entity.User; import com.raspollob.server.entity.Role; import com.raspollob.server.entity.Permission; import com.raspollob.server.entity.RolePermission;
import com.raspollob.server.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final com.raspollob.server.service.RolePermissionService rolePermissionService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        ensureBaseEntityColumnsExist();
        ensureRolePermissionColumnsExist();
        seedPermissions();
        seedRoles();
        seedRolePermissionTrees();
        seedAdminUser();
    }

    private void ensureBaseEntityColumnsExist() {
        try {
            String[] tables = {
                "users", "customers", "products", "real_assets", "services",
                "hero_sections", "about_us", "contact_messages", "asset_bookings", "product_sales", "roles", "role_permissions"
            };
            for (String table : tables) {
                jdbcTemplate.execute("ALTER TABLE IF EXISTS " + table + " ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE IF EXISTS " + table + " ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;");
                jdbcTemplate.execute("ALTER TABLE IF EXISTS " + table + " ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;");
            }
            System.out.println("====== PostgreSQL DDL migration verified for BaseEntity columns (created_at, updated_at, version) ======");
        } catch (Exception e) {
            System.err.println("BaseEntity DDL check warning: " + e.getMessage());
        }
    }

    private void ensureRolePermissionColumnsExist() {
        try {
            // Check if existing role_permissions table is a legacy join table (lacks permission_tree column)
            try {
                jdbcTemplate.execute("SELECT permission_tree FROM role_permissions LIMIT 1;");
            } catch (Exception ex) {
                // Drop legacy join table if permission_tree column is missing or incompatible
                jdbcTemplate.execute("DROP TABLE IF EXISTS role_permissions CASCADE;");
                System.out.println("====== Legacy role_permissions table dropped to rebuild JSON capability tree table ======");
            }

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS role_permissions (id BIGSERIAL PRIMARY KEY, role_name VARCHAR(255) UNIQUE, permission_tree JSONB, created_at TIMESTAMP, updated_at TIMESTAMP, version BIGINT DEFAULT 0);");
            jdbcTemplate.execute("ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS role_name VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_tree JSONB;");
            jdbcTemplate.execute("ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;");
            jdbcTemplate.execute("UPDATE role_permissions SET version = 0 WHERE version IS NULL;");
            jdbcTemplate.execute("UPDATE role_permissions SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;");
            jdbcTemplate.execute("UPDATE role_permissions SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;");
            System.out.println("====== PostgreSQL DDL migration verified for role_permissions table ======");
        } catch (Exception e) {
            System.err.println("RolePermission DDL check warning: " + e.getMessage());
        }
    }

    private void seedPermissions() {
        List<String> permissionNames = Arrays.asList(
                "VIEW_USER_MANAGEMENT",
                "EDIT_USER",
                "CREATE_ROLE",
                "EDIT_ROLE",
                "VIEW_DASHBOARD",
                "MANAGE_PRODUCTS",
                "MANAGE_REAL_ASSETS",
                "VIEW_MESSAGES"
        );

        for (String name : permissionNames) {
            if (permissionRepository.findByName(name).isEmpty()) {
                permissionRepository.save(Permission.builder()
                        .name(name)
                        .description("Allows: " + name)
                        .build());
            }
        }
    }

    private void seedRoles() {
        if (roleRepository.findByName("GUEST").isEmpty()) {
            Role guestRole = Role.builder()
                    .name("GUEST")
                    .description("Unauthenticated visitor access")
                    .build();
            roleRepository.save(guestRole);
        }

        if (roleRepository.findByName("CUSTOMER").isEmpty()) {
            Role customerRole = Role.builder()
                    .name("CUSTOMER")
                    .description("Standard customer access")
                    .build();
            roleRepository.save(customerRole);
        }

        if (roleRepository.findByName("MANAGER").isEmpty()) {
            Role managerRole = Role.builder()
                    .name("MANAGER")
                    .description("Manager operational access")
                    .build();
            roleRepository.save(managerRole);
        }

        if (roleRepository.findByName("ADMIN").isEmpty()) {
            Role adminRole = Role.builder()
                    .name("ADMIN")
                    .description("Full administrative access")
                    .build();
            roleRepository.save(adminRole);
        }
    }

    /**
     * Normalizes every stored permission tree to the current catalog (keeping admins' choices,
     * migrating the old format) and seeds built-in roles that have none. Never overwrites settings.
     */
    private void seedRolePermissionTrees() {
        rolePermissionService.migrateAndSeed(List.of("ADMIN", "MANAGER", "CUSTOMER", "GUEST"));
    }

    private void seedAdminUser() {
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
            Role managerRole = roleRepository.findByName("MANAGER").orElseThrow();
            
            User admin = User.builder()
                    .fullName("System Administrator")
                    .username("admin")
                    .email("admin@raspollob.com")
                    .mobile("0000000000")
                    .password(passwordEncoder.encode("admin123"))
                    .roles(Set.of(adminRole, managerRole))
                    .build();
            
            userRepository.save(admin);
            System.out.println("====== Admin User Created: admin / admin123 ======");
        }
    }

}
