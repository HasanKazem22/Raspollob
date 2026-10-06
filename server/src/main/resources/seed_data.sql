-- =============================================================================
-- UNIFIED PRODUCTION-GRADE DATABASE SEED SCRIPT FOR Raspollob
-- Database: PostgreSQL
-- File: seed_data.sql
-- Table Architecture: Single Official 'role_permissions' JSONB Table
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. SEED SYSTEM PERMISSIONS (permissions table)
-- -----------------------------------------------------------------------------
INSERT INTO permissions (name, description, created_at, updated_at, version)
VALUES 
  ('VIEW_USER_MANAGEMENT', 'View System Users & Customer Accounts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('EDIT_USER', 'Create, Update, or Disable Users', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('CREATE_ROLE', 'Define New Security Roles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('EDIT_ROLE', 'Update Role Definitions & Permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('VIEW_DASHBOARD', 'Access Admin Central Dashboard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('MANAGE_PRODUCTS', 'Manage Product Inventory & POS Sales', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('MANAGE_REAL_ASSETS', 'Manage Real Estate Portfolio & Bookings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('VIEW_MESSAGES', 'View & Reply to Customer Inquiry Messages', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 2. SEED SECURITY ROLES (roles table)
-- -----------------------------------------------------------------------------
INSERT INTO roles (name, description, created_at, updated_at, version)
VALUES 
  ('ROLE_ADMIN', 'Super Administrator with full access rights', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('MANAGER', 'System Manager with operational administrative rights', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('ROLE_CUSTOMER', 'Standard Registered Customer User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 3. SINGLE OFFICIAL ROLE PERMISSION JSON TABLE (role_permissions table)
-- -----------------------------------------------------------------------------
-- ROLE_ADMIN Permission Tree
INSERT INTO role_permissions (role_name, permission_tree, created_at, updated_at, version)
VALUES (
  'ROLE_ADMIN',
  '{
    "home": {
      "isHomePage": true,
      "sections": {
        "hero": { "isHeroSection": true },
        "services": { "isServiceSection": true, "isCreate": true, "isUpdate": true, "isDelete": true },
        "aboutUs": { "isAboutUsSection": true },
        "contactSection": { "isContactSection": true }
      }
    },
    "product": {
      "isProductPage": true,
      "actions": { "isCreateProduct": true, "isUpdateProduct": true, "isDeleteProduct": true, "isManageStock": true, "isRecordSale": true }
    },
    "realAsset": {
      "isRealAssetPage": true,
      "actions": { "isCreateAsset": true, "isUpdateAsset": true, "isDeleteAsset": true, "isManageBookings": true, "isToggleFeatured": true }
    },
    "contactMessage": {
      "isMessagePage": true,
      "actions": { "isViewMessages": true, "isReplyMessage": true, "isDeleteMessage": true }
    },
    "userRoleSetup": {
      "isUserRolePage": true,
      "systemUser": { "isSystemUser": true, "isCreate": true, "isUpdate": true, "isDelete": true },
      "customerUser": { "isCustomerUser": true, "isUpdate": true, "isDelete": true },
      "roleManagement": { "isRoleManagement": true, "isCreate": true, "isUpdate": true, "isDelete": true },
      "rolePermissionSetup": { "isRolePermissionSetup": true, "isUpdate": true }
    }
  }'::jsonb,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
)
ON CONFLICT (role_name) DO UPDATE 
SET permission_tree = EXCLUDED.permission_tree,
    updated_at = CURRENT_TIMESTAMP;

-- MANAGER Permission Tree
INSERT INTO role_permissions (role_name, permission_tree, created_at, updated_at, version)
VALUES (
  'MANAGER',
  '{
    "home": {
      "isHomePage": true,
      "sections": {
        "hero": { "isHeroSection": true },
        "services": { "isServiceSection": true, "isCreate": true, "isUpdate": true, "isDelete": false },
        "aboutUs": { "isAboutUsSection": true },
        "contactSection": { "isContactSection": true }
      }
    },
    "product": {
      "isProductPage": true,
      "actions": { "isCreateProduct": true, "isUpdateProduct": true, "isDeleteProduct": false, "isManageStock": true, "isRecordSale": true }
    },
    "realAsset": {
      "isRealAssetPage": true,
      "actions": { "isCreateAsset": true, "isUpdateAsset": true, "isDeleteAsset": false, "isManageBookings": true, "isToggleFeatured": true }
    },
    "contactMessage": {
      "isMessagePage": true,
      "actions": { "isViewMessages": true, "isReplyMessage": true, "isDeleteMessage": false }
    },
    "userRoleSetup": {
      "isUserRolePage": true,
      "systemUser": { "isSystemUser": true, "isCreate": true, "isUpdate": true, "isDelete": false },
      "customerUser": { "isCustomerUser": true, "isUpdate": true, "isDelete": false },
      "roleManagement": { "isRoleManagement": true, "isCreate": false, "isUpdate": false, "isDelete": false },
      "rolePermissionSetup": { "isRolePermissionSetup": true, "isUpdate": false }
    }
  }'::jsonb,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
)
ON CONFLICT (role_name) DO UPDATE 
SET permission_tree = EXCLUDED.permission_tree,
    updated_at = CURRENT_TIMESTAMP;

-- ROLE_CUSTOMER Permission Tree
INSERT INTO role_permissions (role_name, permission_tree, created_at, updated_at, version)
VALUES (
  'ROLE_CUSTOMER',
  '{
    "home": {
      "isHomePage": true,
      "sections": {
        "hero": { "isHeroSection": true },
        "services": { "isServiceSection": true, "isCreate": false, "isUpdate": false, "isDelete": false },
        "aboutUs": { "isAboutUsSection": true },
        "contactSection": { "isContactSection": false }
      }
    },
    "product": {
      "isProductPage": true,
      "actions": { "isCreateProduct": false, "isUpdateProduct": false, "isDeleteProduct": false, "isManageStock": false, "isRecordSale": false }
    },
    "realAsset": {
      "isRealAssetPage": true,
      "actions": { "isCreateAsset": false, "isUpdateAsset": false, "isDeleteAsset": false, "isManageBookings": false, "isToggleFeatured": false }
    }
  }'::jsonb,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
)
ON CONFLICT (role_name) DO UPDATE 
SET permission_tree = EXCLUDED.permission_tree,
    updated_at = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 4. SEED DEFAULT ADMIN USER (users & user_roles tables)
-- Password: admin123 (BCrypt Encoded)
-- -----------------------------------------------------------------------------
INSERT INTO users (username, full_name, email, mobile, password, is_active, created_at, updated_at, version)
VALUES (
  'admin',
  'System Administrator',
  'admin@raspollob.com',
  '0000000000',
  '$2a$10$e8w.b0n/v2K1a1K2v.2O9.U6g2Xg1O6N3g6m8O4u1N06G9HHgffUD',
  true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
)
ON CONFLICT (username) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = CURRENT_TIMESTAMP;

-- Assign ROLE_ADMIN and MANAGER roles to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name IN ('ROLE_ADMIN', 'MANAGER')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. SEED LANDING PAGE CONTENT (hero_sections, services, about_us)
-- -----------------------------------------------------------------------------
-- Hero Section
INSERT INTO hero_sections (title, description, logo_url, created_at, updated_at, version)
VALUES (
  'Welcome to Raspollob',
  'Welcome to our digital agency where innovation meets aesthetics. We specialize in transforming complex challenges into elegant, robust, and intuitive software solutions.',
  '/BusinessBearLogo.png',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
)
ON CONFLICT DO NOTHING;

-- Services
INSERT INTO services (title, description, icon_name, display_order, is_active, created_at, updated_at, version)
VALUES 
  ('Web Development', 'Building robust, scalable, and responsive web applications using cutting-edge technologies.', 'Code', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('UI/UX Design', 'Crafting intuitive and engaging user experiences with modern aesthetics and user-centered design.', 'Palette', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('Mobile App Development', 'Developing cross-platform mobile applications that provide seamless experiences on all devices.', 'Smartphone', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('Frontend Engineering', 'Creating highly interactive and performant front-end interfaces using React and Next.js.', 'Layout', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('Backend Solutions', 'Designing secure and scalable server-side architectures, APIs, and database structures.', 'Server', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('Digital Marketing', 'Enhancing brand presence and driving growth through data-driven digital marketing strategies.', 'Megaphone', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT DO NOTHING;

-- About Us Profile
INSERT INTO about_us (full_name, designation, bio, avatar_url, email, phone, location, created_at, updated_at, version)
VALUES (
  'Hasibul Hasan',
  'Lead Software Engineer & Designer',
  'With over a decade of experience in software architecture and interactive design, I focus on bridging the gap between engineering and art. My mission is to build digital products that are performant, scalable, and visually breathtaking.',
  '/ProfilePicture.png',
  'hello@raspollob.com',
  '+1 (555) 123-4567',
  '123 Innovation Drive, NY',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. SEED PRODUCTS & REAL ASSETS
-- -----------------------------------------------------------------------------
-- Products
INSERT INTO products (sku, name, category, price, stock_quantity, description, image_url, is_active, created_at, updated_at, version)
VALUES 
  ('PROD-KB01', 'Wireless Ergonomic Mechanical Keyboard', 'Electronics', 149.99, 45, 'Premium mechanical keyboard with customizable RGB lighting and hot-swappable tactile switches.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('PROD-CH02', 'Ergonomic Executive Mesh Chair', 'Furniture', 329.50, 12, 'High-back mesh chair featuring dynamic lumbar support, adjustable 4D armrests, and breathable mesh.', 'https://images.unsplash.com/photo-1580481072645-022f9a6d1294?w=800&q=80', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('PROD-MN03', '34" Curved UltraWide Gaming Monitor', 'Electronics', 699.00, 8, 'Immersive 144Hz curved QHD monitor with HDR400 support and ultra-thin bezels.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (sku) DO UPDATE 
SET name = EXCLUDED.name,
    price = EXCLUDED.price,
    stock_quantity = EXCLUDED.stock_quantity,
    updated_at = CURRENT_TIMESTAMP;

-- Real Estate Property Assets
INSERT INTO real_assets (code, title, location, price, image_url, beds, baths, sqft, status, description, is_featured, created_at, updated_at, version)
VALUES 
  ('PROP-GH01', 'The Glass House', 'Beverly Hills, CA', 12500000.00, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', 4, 3.5, 4500, 'FOR_SALE', 'Luxury modern glass mansion.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('PROP-MV02', 'Modern Minimalist Villa', 'Malibu, CA', 28550000.00, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 6, 5.0, 6200, 'NEW_LISTING', 'Oceanfront minimalist luxury villa.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
  ('PROP-PH03', 'Urban Skyline Penthouse', 'Manhattan, NY', 41000000.00, 'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800&q=80', 3, 3.0, 3100, 'FOR_RENT', 'High-floor penthouse with panoramic city views.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (code) DO UPDATE 
SET title = EXCLUDED.title,
    price = EXCLUDED.price,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
