package com.raspollob.server.security;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PermissionCatalogTest {

    @Test
    void defaultsMatchEachBuiltInRole() {
        Map<String, Object> admin = PermissionCatalog.defaultTree("ADMIN");
        Map<String, Object> manager = PermissionCatalog.defaultTree("MANAGER");
        Map<String, Object> guest = PermissionCatalog.defaultTree("GUEST");

        assertThat(PermissionCatalog.resolve(admin, "userRoleSetup.subModules.rolePermissionSetup.actions.update")).isTrue();
        assertThat(PermissionCatalog.resolve(manager, "order.actions.update")).isTrue();
        assertThat(PermissionCatalog.resolve(manager, "userRoleSetup.isAccess")).isFalse();
        assertThat(PermissionCatalog.resolve(guest, "storefront.actions.placeOrder")).isTrue();
        assertThat(PermissionCatalog.hasAnyAdminAccess(guest)).isFalse();
    }

    @Test
    void actionsRequireAccessToEveryModuleAboveThem() {
        Map<String, Object> tree = PermissionCatalog.defaultTree("MANAGER");
        // Switch off promo codes access but leave its "create" action ticked
        Map<String, Object> promo = node(tree, "order", "promoCodes");
        promo.put("isAccess", false);

        assertThat(PermissionCatalog.resolve(tree, "order.subModules.promoCodes.actions.create")).isFalse();
        assertThat(PermissionCatalog.resolve(tree, "order.actions.update")).isTrue();
    }

    @Test
    void unknownPathsAreDenied() {
        Map<String, Object> admin = PermissionCatalog.defaultTree("ADMIN");
        assertThat(PermissionCatalog.resolve(admin, "realAsset.isAccess")).isFalse();
        assertThat(PermissionCatalog.resolve(admin, "order.actions.doesNotExist")).isFalse();
    }

    @Test
    void legacyTreesAreMigratedKeepingChoicesAndDroppingObsoleteModules() {
        Map<String, Object> legacy = new HashMap<>(Map.of(
                "order", Map.of("isAdminConfig", true, "actions", Map.of("isUpdate", false, "isPrintSlip", true)),
                "realAsset", Map.of("isAdminConfig", true)));

        Map<String, Object> migrated = PermissionCatalog.normalize(legacy, "MANAGER");

        assertThat(PermissionCatalog.resolve(migrated, "order.isAccess")).isTrue();
        assertThat(PermissionCatalog.resolve(migrated, "order.actions.update")).isFalse();
        assertThat(PermissionCatalog.resolve(migrated, "order.actions.printSlip")).isTrue();
        assertThat(migrated).doesNotContainKey("realAsset");
        // Missing modules fall back to the role's defaults
        assertThat(PermissionCatalog.resolve(migrated, "dashboard.isAccess")).isTrue();
    }

    @Test
    void adminIsAlwaysNormalizedToFullAccess() {
        Map<String, Object> restricted = PermissionCatalog.defaultTree("GUEST");
        assertThat(PermissionCatalog.resolve(PermissionCatalog.normalize(restricted, "ADMIN"), "product.actions.delete")).isTrue();
    }

    @Test
    void mergingRolesGrantsAnythingEitherRoleGrants() {
        Map<String, Object> customer = PermissionCatalog.defaultTree("CUSTOMER");
        Map<String, Object> support = PermissionCatalog.defaultTree("CUSTOMER");
        ((Map<String, Object>) support.get("contactMessage")).put("isAccess", true);

        Map<String, Object> merged = PermissionCatalog.merge(List.of(customer, support));
        assertThat(PermissionCatalog.resolve(merged, "contactMessage.isAccess")).isTrue();
        assertThat(PermissionCatalog.resolve(merged, "order.isAccess")).isFalse();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> node(Map<String, Object> tree, String module, String sub) {
        Map<String, Object> m = (Map<String, Object>) tree.get(module);
        return (Map<String, Object>) ((Map<String, Object>) m.get("subModules")).get(sub);
    }
}
