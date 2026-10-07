package com.raspollob.server.service;

import com.raspollob.server.dto.AdminUserRequest;
import com.raspollob.server.dto.AdminUserResponse;
import com.raspollob.server.entity.Role;
import com.raspollob.server.entity.User;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.exception.UserAlreadyExistsException;
import com.raspollob.server.repository.RoleRepository;
import com.raspollob.server.repository.UserRepository;
import com.raspollob.server.security.PermissionCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Staff and customer accounts as managed in the admin panel.
 * Staff accounts are created here with staff roles only; customers come from public sign-up.
 */
@Service
@RequiredArgsConstructor
public class UserAdminService {

    public static final int MIN_PASSWORD_LENGTH = 6;
    /** The built-in owner account can't be deleted or switched off */
    private static final String OWNER_USERNAME = "admin";

    public enum Kind { STAFF, CUSTOMER }

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /** All accounts of one kind (or every account when kind is null), newest first. */
    @Transactional(readOnly = true)
    public List<AdminUserResponse> list(Kind kind) {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream()
                .filter(u -> kind == null || kindOf(u) == kind)
                .map(UserAdminService::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse createStaff(AdminUserRequest request) {
        String username = required(request.getUsername(), "Username");
        String fullName = required(request.getFullName(), "Full name");
        String mobile = OrderService.normalizePhone(required(request.getMobile(), "Mobile number"));
        String email = normalizeEmail(request.getEmail());
        String password = request.getPassword();
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new BadRequestException("Set a password of at least " + MIN_PASSWORD_LENGTH + " characters.");
        }
        assertUnique(null, username, email, mobile);

        User user = User.builder()
                .username(username)
                .fullName(fullName)
                .mobile(mobile)
                .email(email)
                .password(passwordEncoder.encode(password))
                .roles(resolveStaffRoles(request.getRoleIds()))
                .isActive(true)
                .build();
        return toResponse(userRepository.save(user));
    }

    /** Edits any account. Roles can only be changed on staff accounts, and only to staff roles. */
    @Transactional
    public AdminUserResponse update(Long userId, AdminUserRequest request) {
        User user = load(userId);

        String username = StringUtils.hasText(request.getUsername()) ? request.getUsername().trim() : user.getUsername();
        String email = request.getEmail() != null ? normalizeEmail(request.getEmail()) : user.getEmail();
        String mobile = StringUtils.hasText(request.getMobile()) ? OrderService.normalizePhone(request.getMobile()) : user.getMobile();
        assertUnique(user.getId(), username, email, mobile);

        user.setUsername(username);
        user.setEmail(email);
        user.setMobile(mobile);
        if (StringUtils.hasText(request.getFullName())) user.setFullName(request.getFullName().trim());
        if (request.getCity() != null) user.setCity(trimToNull(request.getCity()));
        if (request.getAddress() != null) user.setAddress(trimToNull(request.getAddress()));
        if (StringUtils.hasText(request.getPassword())) {
            if (request.getPassword().length() < MIN_PASSWORD_LENGTH) {
                throw new BadRequestException("The new password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRoleIds() != null) {
            if (kindOf(user) == Kind.CUSTOMER) {
                throw new BadRequestException("Customer accounts always have the Customer role. To give someone staff access, create a staff account.");
            }
            user.setRoles(resolveStaffRoles(request.getRoleIds()));
        }
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse setActive(Long userId, boolean active, Long actingUserId) {
        User user = load(userId);
        if (!active && (isOwner(user) || Objects.equals(user.getId(), actingUserId))) {
            throw new BadRequestException("You can't switch off your own account or the main admin account.");
        }
        user.setIsActive(active);
        return toResponse(user);
    }

    @Transactional
    public void delete(Long userId, Long actingUserId) {
        User user = load(userId);
        if (isOwner(user) || Objects.equals(user.getId(), actingUserId)) {
            throw new BadRequestException("You can't delete your own account or the main admin account.");
        }
        userRepository.delete(user);
    }

    /** Which list an account belongs in. Accounts without any role are treated as customers. */
    public static Kind kindOf(User user) {
        return PermissionCatalog.isStaff(roleNames(user)) ? Kind.STAFF : Kind.CUSTOMER;
    }

    public static AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .mobile(user.getMobile())
                .city(user.getCity())
                .address(user.getAddress())
                .isActive(user.getIsActive())
                .staff(kindOf(user) == Kind.STAFF)
                .roles(user.getRoles().stream()
                        .sorted(Comparator.comparing(Role::getName))
                        .map(r -> new AdminUserResponse.RoleRef(r.getId(), r.getName()))
                        .toList())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** Staff accounts need at least one role, and only staff roles (never Customer or Guest). */
    private Set<Role> resolveStaffRoles(List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) {
            throw new BadRequestException("Choose at least one role for this staff account.");
        }
        List<Role> roles = roleRepository.findAllById(roleIds);
        if (roles.size() != new HashSet<>(roleIds).size()) {
            throw new BadRequestException("One of the chosen roles no longer exists. Refresh the page and try again.");
        }
        roles.stream()
                .filter(r -> !PermissionCatalog.isStaffRole(r.getName()))
                .findFirst()
                .ifPresent(r -> {
                    throw new BadRequestException("The " + r.getName() + " role can't be given to a staff account.");
                });
        return new HashSet<>(roles);
    }

    private void assertUnique(Long selfId, String username, String email, String mobile) {
        userRepository.findByUsername(username).filter(u -> !u.getId().equals(selfId)).ifPresent(u -> {
            throw new UserAlreadyExistsException("The username \"" + username + "\" is already taken.");
        });
        userRepository.findByMobile(mobile).filter(u -> !u.getId().equals(selfId)).ifPresent(u -> {
            throw new UserAlreadyExistsException("This mobile number is already used by another account.");
        });
        if (email != null) {
            userRepository.findByEmail(email).filter(u -> !u.getId().equals(selfId)).ifPresent(u -> {
                throw new UserAlreadyExistsException("This email address is already used by another account.");
            });
        }
    }

    private User load(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }

    private static boolean isOwner(User user) {
        return OWNER_USERNAME.equalsIgnoreCase(user.getUsername());
    }

    private static List<String> roleNames(User user) {
        return user.getRoles().stream().map(Role::getName).toList();
    }

    private static String required(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw new BadRequestException(field + " is required.");
        }
        return value.trim();
    }

    private static String normalizeEmail(String email) {
        return StringUtils.hasText(email) ? email.trim().toLowerCase() : null;
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
