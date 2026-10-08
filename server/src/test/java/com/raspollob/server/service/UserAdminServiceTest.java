package com.raspollob.server.service;

import com.raspollob.server.dto.AdminUserRequest;
import com.raspollob.server.entity.Role;
import com.raspollob.server.entity.User;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.repository.RoleRepository;
import com.raspollob.server.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserAdminServiceTest {

    private final UserRepository users = mock(UserRepository.class);
    private final RoleRepository roles = mock(RoleRepository.class);
    @SuppressWarnings("deprecation")
    private final UserAdminService service = new UserAdminService(users, roles, NoOpPasswordEncoder.getInstance());

    private final Map<Long, Role> roleDb = Map.of(
            1L, role(1, "ADMIN"), 2L, role(2, "MANAGER"), 3L, role(3, "CUSTOMER"), 4L, role(4, "GUEST"), 5L, role(5, "SUPPORT"));

    @BeforeEach
    void setUp() {
        when(roles.findAllById(any())).thenAnswer(inv -> {
            Iterable<Long> ids = inv.getArgument(0);
            List<Role> found = new java.util.ArrayList<>();
            ids.forEach(id -> Optional.ofNullable(roleDb.get(id)).ifPresent(found::add));
            return found;
        });
        when(users.findByUsername(anyString())).thenReturn(Optional.empty());
        when(users.findByMobile(anyString())).thenReturn(Optional.empty());
        when(users.findByEmail(anyString())).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createsStaffWithStaffRolesOnly() {
        var created = service.createStaff(staff(List.of(2L, 5L)));

        assertThat(created.getStaff()).isTrue();
        assertThat(created.getRoles()).extracting(r -> r.name()).containsExactly("MANAGER", "SUPPORT");
    }

    @Test
    void neverGivesCustomerOrGuestToStaff() {
        assertThatThrownBy(() -> service.createStaff(staff(List.of(2L, 3L)))).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("CUSTOMER");
        assertThatThrownBy(() -> service.createStaff(staff(List.of(4L)))).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("GUEST");
    }

    @Test
    void staffNeedARoleAndARealPassword() {
        assertThatThrownBy(() -> service.createStaff(staff(List.of()))).isInstanceOf(BadRequestException.class);

        AdminUserRequest noPassword = staff(List.of(2L));
        noPassword.setPassword("");
        assertThatThrownBy(() -> service.createStaff(noPassword)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void customerRolesCantBeChangedFromTheAdminPanel() {
        User customer = user(10, "bahar_uddin", "CUSTOMER");
        when(users.findById(10L)).thenReturn(Optional.of(customer));

        AdminUserRequest promote = new AdminUserRequest();
        promote.setRoleIds(List.of(1L));
        assertThatThrownBy(() -> service.update(10L, promote)).isInstanceOf(BadRequestException.class);

        AdminUserRequest details = new AdminUserRequest();
        details.setCity(" Dhaka ");
        assertThat(service.update(10L, details).getCity()).isEqualTo("Dhaka");
    }

    @Test
    void accountsWithoutStaffRolesAreCustomers() {
        assertThat(UserAdminService.kindOf(user(1, "a"))).isEqualTo(UserAdminService.Kind.CUSTOMER);
        assertThat(UserAdminService.kindOf(user(2, "b", "CUSTOMER"))).isEqualTo(UserAdminService.Kind.CUSTOMER);
        assertThat(UserAdminService.kindOf(user(3, "c", "SUPPORT"))).isEqualTo(UserAdminService.Kind.STAFF);
        assertThat(UserAdminService.kindOf(user(4, "d", "ADMIN", "CUSTOMER"))).isEqualTo(UserAdminService.Kind.STAFF);
    }

    @Test
    void cantRemoveYourselfOrTheMainAdmin() {
        when(users.findById(1L)).thenReturn(Optional.of(user(1, "admin", "ADMIN")));
        when(users.findById(7L)).thenReturn(Optional.of(user(7, "bahar_uddin", "MANAGER")));

        assertThatThrownBy(() -> service.delete(1L, 7L)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.delete(7L, 7L)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.setActive(7L, false, 7L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void responsesNeverCarryThePassword() {
        assertThat(UserAdminService.toResponse(user(1, "a", "CUSTOMER")).toString()).doesNotContain("secret-hash");
    }

    private static AdminUserRequest staff(List<Long> roleIds) {
        AdminUserRequest r = new AdminUserRequest();
        r.setUsername("bahar_uddin");
        r.setFullName("Md Bahar Uddin");
        r.setMobile("01811111111");
        r.setPassword("strongpass");
        r.setRoleIds(roleIds);
        return r;
    }

    private static Role role(long id, String name) {
        Role r = Role.builder().name(name).build();
        r.setId(id);
        return r;
    }

    private User user(long id, String username, String... roleNames) {
        Set<Role> assigned = new HashSet<>();
        for (String name : roleNames) {
            roleDb.values().stream().filter(r -> r.getName().equals(name)).findFirst().ifPresent(assigned::add);
        }
        User u = User.builder().username(username).fullName(username).mobile("01700000000")
                .password("secret-hash").roles(assigned).build();
        u.setId(id);
        return u;
    }
}
