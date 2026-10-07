package com.raspollob.server.service;

import com.raspollob.server.dto.AccountResponse;
import com.raspollob.server.dto.ChangePasswordRequest;
import com.raspollob.server.dto.UpdateAccountRequest;
import com.raspollob.server.entity.Role;
import com.raspollob.server.entity.User;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.ResourceNotFoundException;
import com.raspollob.server.exception.UserAlreadyExistsException;
import com.raspollob.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Everything a signed-in user can do with their own account. */
@Service
@RequiredArgsConstructor
public class AccountService {

    /** Avatars are shown small: no need to keep more than this */
    private static final int AVATAR_SIZE = 400;
    private static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final MediaCleanupService mediaCleanup;

    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long userId) {
        return toResponse(load(userId));
    }

    @Transactional
    public AccountResponse updateAccount(Long userId, UpdateAccountRequest request) {
        User user = load(userId);

        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase() : null;
        if (email != null && !email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("This email address is already used by another account.");
        }

        String mobile = OrderService.normalizePhone(request.getMobile());
        if (!mobile.equals(user.getMobile()) && userRepository.existsByMobile(mobile)) {
            throw new UserAlreadyExistsException("This mobile number is already used by another account.");
        }

        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setMobile(mobile);
        user.setCity(trimToNull(request.getCity()));
        user.setAddress(trimToNull(request.getAddress()));
        return toResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = load(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Your current password is incorrect.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("The new password must be different from the current one.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    }

    /** Stores a new profile photo and removes the previous one from disk. */
    @Transactional
    public AccountResponse updateAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Choose an image to upload.");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new BadRequestException("The photo must be 5 MB or smaller.");
        }
        User user = load(userId);
        String previous = user.getAvatarUrl();
        String stored = fileStorageService.storeFile(file, AVATAR_SIZE, AVATAR_SIZE);
        user.setAvatarUrl("/uploads/" + stored);
        if (previous != null) {
            mediaCleanup.deleteIfUnused(List.of(previous));
        }
        return toResponse(user);
    }

    @Transactional
    public AccountResponse removeAvatar(Long userId) {
        User user = load(userId);
        String previous = user.getAvatarUrl();
        user.setAvatarUrl(null);
        if (previous != null) {
            mediaCleanup.deleteIfUnused(List.of(previous));
        }
        return toResponse(user);
    }

    private User load(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    public static AccountResponse toResponse(User user) {
        return AccountResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .mobile(user.getMobile())
                .city(user.getCity())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream().map(Role::getName).sorted().toList())
                .build();
    }
}
