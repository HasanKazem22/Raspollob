package com.raspollob.server.config;

import com.raspollob.server.entity.User; import com.raspollob.server.entity.Role; import com.raspollob.server.entity.Permission; import com.raspollob.server.entity.RolePermission;
import com.raspollob.server.repository.*;
import lombok.RequiredArgsConstructor;
import com.raspollob.server.entity.StoreConfig;
import com.raspollob.server.repository.StoreConfigRepository;
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
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final StoreConfigRepository storeConfigRepository;
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
        seedCategoriesAndProducts();
        seedStoreConfig();
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

    private void seedCategoriesAndProducts() {
        if (categoryRepository.count() == 0) {
            com.raspollob.server.entity.Category honeyCat = categoryRepository.save(
                    com.raspollob.server.entity.Category.builder()
                            .name("Natural Honey")
                            .slug("natural-honey")
                            .description("100% pure wild and raw organic honey varieties.")
                            .displayOrder(1)
                            .showInNavbar(true)
                            .showInHome(true)
                            .isActive(true)
                            .build()
            );

            com.raspollob.server.entity.Category oilCat = categoryRepository.save(
                    com.raspollob.server.entity.Category.builder()
                            .name("Organic Oils")
                            .slug("organic-oils")
                            .description("Traditional cold-pressed wood churned oils.")
                            .displayOrder(2)
                            .showInNavbar(true)
                            .showInHome(true)
                            .isActive(true)
                            .build()
            );

            com.raspollob.server.entity.Product honey = com.raspollob.server.entity.Product.builder()
                    .name("Premium Raw Sundarban Honey (500g)")
                    .slug("premium-raw-sundarban-honey-500g")
                    .sku("HONEY-500G")
                    .category(honeyCat)
                    .description("Sourced directly from the wild mangroves of Sundarban, unfiltered and unpasteurized.")
                    .details("Rich in natural pollen, active enzymes, and antioxidants with a delicate floral aroma.")
                    .ingredients("100% Pure Raw Sundarban Honey")
                    .buyingPrice(new java.math.BigDecimal("550.00"))
                    .sellingPrice(new java.math.BigDecimal("1050.00"))
                    .offerPrice(new java.math.BigDecimal("850.00"))
                    .stockQuantity(45)
                    .isTrending(true)
                    .isActive(true)
                    .averageRating(5.0)
                    .reviewCount(124)
                    .images(new ArrayList<>())
                    .build();

            honey.addImage(com.raspollob.server.entity.ProductImage.builder()
                    .imageUrl("https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80")
                    .isPrimary(true)
                    .displayOrder(0)
                    .altText("Sundarban Honey Front")
                    .build());
            honey.addImage(com.raspollob.server.entity.ProductImage.builder()
                    .imageUrl("https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=800&q=80")
                    .isPrimary(false)
                    .displayOrder(1)
                    .altText("Sundarban Honey Jar")
                    .build());

            productRepository.save(honey);

            com.raspollob.server.entity.Product oil = com.raspollob.server.entity.Product.builder()
                    .name("Cold Pressed Mustard Oil (1L)")
                    .slug("cold-pressed-mustard-oil-1l")
                    .sku("OIL-MUST-1L")
                    .category(oilCat)
                    .description("Extracted using traditional wooden churns (Kachi Ghani) preserving authentic aroma and pungency.")
                    .details("Pure unrefined mustard oil high in MUFA and natural antioxidants.")
                    .ingredients("100% Selected Grade-A Mustard Seeds")
                    .buyingPrice(new java.math.BigDecimal("220.00"))
                    .sellingPrice(new java.math.BigDecimal("380.00"))
                    .offerPrice(new java.math.BigDecimal("320.00"))
                    .stockQuantity(35)
                    .isTrending(true)
                    .isActive(true)
                    .averageRating(4.8)
                    .reviewCount(89)
                    .images(new ArrayList<>())
                    .build();

            oil.addImage(com.raspollob.server.entity.ProductImage.builder()
                    .imageUrl("https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80")
                    .isPrimary(true)
                    .displayOrder(0)
                    .altText("Mustard Oil Bottle")
                    .build());
            oil.addImage(com.raspollob.server.entity.ProductImage.builder()
                    .imageUrl("https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&q=80")
                    .isPrimary(false)
                    .displayOrder(1)
                    .altText("Mustard Oil Pouring")
                    .build());

            productRepository.save(oil);

            System.out.println("====== Seeded sample categories and trending products with images & stars ======");
        }
    }
    private void seedStoreConfig() {
        if (storeConfigRepository.count() == 0) {
            StoreConfig config = StoreConfig.builder()
                    .heroBannerImages(java.util.List.of("https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"))
                    .promoBannerImage("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80")
                    .categorySectionTitle("Shop by Category")
                    .categorySectionDesc("Explore our wide range of categories")
                    .trendingSectionTitle("Trending Now")
                    .trendingSectionDesc("Our most popular products")
                    .contactUsInfo("Contact us at info@example.com")
                    .shippingDeliveryInfo("We ship worldwide.")
                    .returnsRefundsInfo("30-day return policy.")
                    .faqsInfo("Frequently Asked Questions")
                    .trackOrderInfo("Track your order here.")
                    .needHelpInfo("Need help? Call us at 1-800-123-4567")
                    .build();
            storeConfigRepository.save(config);
            System.out.println("====== Seeded Store Config ======");
        }
    }
}
