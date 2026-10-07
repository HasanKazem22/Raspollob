package com.raspollob.server.security;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

/**
 * The single source of truth for what can be permitted. Everything else derives from it:
 * stored trees are normalized against it, the server checks paths that exist in it, and the
 * admin "Role Permission Setup" screen renders it (GET /api/v1/admin/role-permissions/catalog).
 *
 * <p>Tree shape stored per role (JSON):
 * <pre>{ "order": { "isAccess": true, "actions": { "update": true }, "subModules": { "promoCodes": { "isAccess": true, "actions": {...} } } } }</pre>
 * Paths used in checks: {@code order.isAccess}, {@code order.actions.update},
 * {@code order.subModules.promoCodes.actions.create}. An action only counts when every
 * module above it has access.
 */
public final class PermissionCatalog {

    public enum Group { STOREFRONT, ADMIN }

    public record Action(String key, String label) {
    }

    public record Node(String key, String label, String description, Group group,
                       List<Action> actions, List<Node> subModules) {
    }

    /** Built-in roles; they can't be renamed or deleted. ADMIN always has every permission. */
    public static final String ADMIN = "ADMIN";
    public static final String MANAGER = "MANAGER";
    public static final String CUSTOMER = "CUSTOMER";
    public static final String GUEST = "GUEST";
    public static final Set<String> SYSTEM_ROLES = Set.of(ADMIN, MANAGER, CUSTOMER, GUEST);

    /**
     * Roles that describe shoppers, not staff. CUSTOMER is given only by public sign-up; GUEST is the
     * permission set for visitors who aren't signed in and is never assigned to an account.
     */
    public static final Set<String> NON_STAFF_ROLES = Set.of(CUSTOMER, GUEST);

    /** Whether a role can be given to a staff account (ADMIN, MANAGER and any custom role). */
    public static boolean isStaffRole(String roleName) {
        return roleName != null && !NON_STAFF_ROLES.contains(roleName);
    }

    /** The one rule for "staff vs customer": an account is staff when it holds any staff role. */
    public static boolean isStaff(java.util.Collection<String> roleNames) {
        return roleNames.stream().anyMatch(PermissionCatalog::isStaffRole);
    }

    private static final List<Action> CRUD = List.of(
            new Action("create", "Add new"),
            new Action("update", "Edit"),
            new Action("delete", "Delete"));

    public static final List<Node> MODULES = List.of(
            new Node("storefront", "Online Store", "What visitors and customers can do on the website", Group.STOREFRONT,
                    List.of(new Action("placeOrder", "Place orders (checkout)"),
                            new Action("sendMessage", "Send help-chat messages")),
                    List.of()),
            new Node("dashboard", "Dashboard", "Sales overview, to-do list and business tips", Group.ADMIN,
                    List.of(), List.of()),
            new Node("home", "Home Page Settings", "Banners, reviews, footer info, delivery charges and payment numbers", Group.ADMIN,
                    List.of(new Action("update", "Edit settings")), List.of()),
            new Node("order", "Orders", "View and process customer orders", Group.ADMIN,
                    List.of(new Action("update", "Change status & internal notes"),
                            new Action("updatePayment", "Update payment status"),
                            new Action("printSlip", "Print delivery slips")),
                    List.of(new Node("promoCodes", "Promo Codes", "Discount codes customers use at checkout", Group.ADMIN, CRUD, List.of()))),
            new Node("contactMessage", "Messages", "Questions sent from the website help chat", Group.ADMIN,
                    List.of(new Action("update", "Mark as read")), List.of()),
            new Node("product", "Products", "Product catalog, prices and stock", Group.ADMIN, CRUD,
                    List.of(new Node("category", "Categories", "Product categories and where they appear on the site", Group.ADMIN, CRUD, List.of()))),
            new Node("userRoleSetup", "Users & Roles", "Staff accounts, customers, roles and permissions", Group.ADMIN,
                    List.of(),
                    List.of(new Node("systemUser", "Staff Users", "Accounts that can sign in to the admin panel", Group.ADMIN, CRUD, List.of()),
                            new Node("customerUser", "Customers", "Registered shopper accounts", Group.ADMIN,
                                    List.of(new Action("update", "Edit"), new Action("delete", "Delete")), List.of()),
                            new Node("roleManagement", "Roles", "Create and rename roles", Group.ADMIN, CRUD, List.of()),
                            new Node("rolePermissionSetup", "Role Permissions", "Decide what each role can do", Group.ADMIN,
                                    List.of(new Action("update", "Change permissions")), List.of())))
    );

    private PermissionCatalog() {
    }

    // =========================================================================
    // Defaults
    // =========================================================================

    /** Sensible starting permissions for a role that has none stored yet. */
    public static Map<String, Object> defaultTree(String roleName) {
        Predicate<Node> granted = switch (roleName) {
            case ADMIN -> node -> true;
            // Managers run the shop but don't manage staff accounts or permissions
            case MANAGER -> node -> !node.key().equals("userRoleSetup");
            // Everyone else (customers, guests, new custom roles): shop only
            default -> node -> node.group() == Group.STOREFRONT;
        };
        Map<String, Object> tree = new LinkedHashMap<>();
        for (Node module : MODULES) {
            tree.put(module.key(), buildNode(module, granted.test(module)));
        }
        return tree;
    }

    private static Map<String, Object> buildNode(Node node, boolean value) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("isAccess", value);
        Map<String, Object> actions = new LinkedHashMap<>();
        node.actions().forEach(a -> actions.put(a.key(), value));
        out.put("actions", actions);
        Map<String, Object> subs = new LinkedHashMap<>();
        node.subModules().forEach(s -> subs.put(s.key(), buildNode(s, value)));
        out.put("subModules", subs);
        return out;
    }

    // =========================================================================
    // Normalization (also migrates the legacy format)
    // =========================================================================

    /**
     * Rebuilds a stored tree against the catalog: keeps known values, fills missing ones from the
     * role's defaults, drops anything the catalog no longer has. Understands the old format
     * ({@code isAdminConfig}, {@code isCreate}/{@code isUpdate}/...) so existing settings survive.
     * ADMIN is always normalized to full access.
     */
    public static Map<String, Object> normalize(Map<String, Object> stored, String roleName) {
        Map<String, Object> defaults = defaultTree(roleName);
        if (ADMIN.equals(roleName) || stored == null) {
            return defaults;
        }
        Map<String, Object> tree = new LinkedHashMap<>();
        for (Node module : MODULES) {
            tree.put(module.key(), normalizeNode(module, asMap(stored.get(module.key())), asMap(defaults.get(module.key()))));
        }
        return tree;
    }

    private static Map<String, Object> normalizeNode(Node node, Map<String, Object> stored, Map<String, Object> defaults) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("isAccess", firstBoolean(defaults.get("isAccess"),
                stored.get("isAccess"), stored.get("isAdminConfig")));

        Map<String, Object> storedActions = asMap(stored.get("actions"));
        Map<String, Object> defaultActions = asMap(defaults.get("actions"));
        Map<String, Object> actions = new LinkedHashMap<>();
        for (Action a : node.actions()) {
            actions.put(a.key(), firstBoolean(defaultActions.get(a.key()),
                    storedActions.get(a.key()), storedActions.get(legacyKey(a.key()))));
        }
        out.put("actions", actions);

        Map<String, Object> storedSubs = asMap(stored.get("subModules"));
        Map<String, Object> defaultSubs = asMap(defaults.get("subModules"));
        Map<String, Object> subs = new LinkedHashMap<>();
        for (Node sub : node.subModules()) {
            subs.put(sub.key(), normalizeNode(sub, asMap(storedSubs.get(sub.key())), asMap(defaultSubs.get(sub.key()))));
        }
        out.put("subModules", subs);
        return out;
    }

    /** "update" → "isUpdate" (old action naming). */
    private static String legacyKey(String key) {
        return "is" + Character.toUpperCase(key.charAt(0)) + key.substring(1);
    }

    /** First Boolean among the candidates, else the fallback. */
    private static boolean firstBoolean(Object fallback, Object... candidates) {
        for (Object c : candidates) {
            if (c instanceof Boolean b) return b;
        }
        return Boolean.TRUE.equals(fallback);
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    // =========================================================================
    // Evaluation
    // =========================================================================

    /** OR of several normalized trees (a user with two roles gets both sets of permissions). */
    public static Map<String, Object> merge(List<Map<String, Object>> trees) {
        Map<String, Object> merged = new LinkedHashMap<>();
        for (Node module : MODULES) {
            merged.put(module.key(), mergeNode(module, trees.stream().map(t -> asMap(t.get(module.key()))).toList()));
        }
        return merged;
    }

    private static Map<String, Object> mergeNode(Node node, List<Map<String, Object>> nodes) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("isAccess", nodes.stream().anyMatch(n -> Boolean.TRUE.equals(n.get("isAccess"))));
        Map<String, Object> actions = new LinkedHashMap<>();
        for (Action a : node.actions()) {
            actions.put(a.key(), nodes.stream().anyMatch(n -> Boolean.TRUE.equals(asMap(n.get("actions")).get(a.key()))));
        }
        out.put("actions", actions);
        Map<String, Object> subs = new LinkedHashMap<>();
        for (Node sub : node.subModules()) {
            subs.put(sub.key(), mergeNode(sub, nodes.stream().map(n -> asMap(asMap(n.get("subModules")).get(sub.key()))).toList()));
        }
        out.put("subModules", subs);
        return out;
    }

    /**
     * Resolves a dotted path ("order.subModules.promoCodes.actions.create"). Every module or
     * sub-module passed on the way must have isAccess=true; unknown paths are denied.
     */
    public static boolean resolve(Map<String, Object> tree, String path) {
        String[] parts = path.split("\\.");
        Object current = tree;
        for (int i = 0; i < parts.length; i++) {
            Map<String, Object> node = asMap(current);
            boolean isModuleNode = node.containsKey("isAccess");
            if (isModuleNode && !"isAccess".equals(parts[i]) && !Boolean.TRUE.equals(node.get("isAccess"))) {
                return false;
            }
            current = node.get(parts[i]);
            if (current == null) return false;
        }
        return Boolean.TRUE.equals(current);
    }

    /** True when the tree grants access to at least one admin module. */
    public static boolean hasAnyAdminAccess(Map<String, Object> tree) {
        return MODULES.stream()
                .filter(m -> m.group() == Group.ADMIN)
                .anyMatch(m -> resolve(tree, m.key() + ".isAccess"));
    }
}
