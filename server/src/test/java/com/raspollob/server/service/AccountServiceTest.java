package com.raspollob.server.service;

import com.raspollob.server.dto.ChangePasswordRequest;
import com.raspollob.server.dto.UpdateAccountRequest;
import com.raspollob.server.entity.User;
import com.raspollob.server.exception.BadRequestException;
import com.raspollob.server.exception.UserAlreadyExistsException;
import com.raspollob.server.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

class AccountServiceTest {

    private final UserRepository users = mock(UserRepository.class);
    private final FileStorageService files = mock(FileStorageService.class);
    private final MediaCleanupService cleanup = mock(MediaCleanupService.class);
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final AccountService service = new AccountService(users, encoder, files, cleanup);

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("rahim")
                .fullName("Rahim")
                .mobile("01712345678")
                .password(encoder.encode("old-secret"))
                .build();
        user.setId(7L);
        when(users.findById(7L)).thenReturn(Optional.of(user));
    }

    @Test
    void changesPasswordOnlyWithTheCorrectCurrentOne() {
        assertThatThrownBy(() -> service.changePassword(7L, password("wrong", "new-secret")))
                .isInstanceOf(BadRequestException.class);

        service.changePassword(7L, password("old-secret", "new-secret"));
        assertThat(encoder.matches("new-secret", user.getPassword())).isTrue();
    }

    @Test
    void rejectsReusingTheSamePassword() {
        assertThatThrownBy(() -> service.changePassword(7L, password("old-secret", "old-secret")))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsAMobileNumberUsedByAnotherAccount() {
        when(users.existsByMobile("01811111111")).thenReturn(true);
        UpdateAccountRequest request = new UpdateAccountRequest();
        request.setFullName("Rahim Uddin");
        request.setMobile("+8801811111111");

        assertThatThrownBy(() -> service.updateAccount(7L, request)).isInstanceOf(UserAlreadyExistsException.class);
    }

    @Test
    void savesProfileWithNormalisedMobile() {
        UpdateAccountRequest request = new UpdateAccountRequest();
        request.setFullName("  Rahim Uddin ");
        request.setMobile("01712345678");
        request.setCity(" Dhaka ");
        request.setAddress("  ");

        var saved = service.updateAccount(7L, request);
        assertThat(saved.getFullName()).isEqualTo("Rahim Uddin");
        assertThat(saved.getCity()).isEqualTo("Dhaka");
        assertThat(saved.getAddress()).isNull();
    }

    @Test
    void replacingThePhotoDeletesTheOldFile() {
        user.setAvatarUrl("/uploads/old.webp");
        when(files.storeFile(any(), anyInt(), anyInt())).thenReturn("new.webp");

        var saved = service.updateAvatar(7L, new MockMultipartFile("file", "me.jpg", "image/jpeg", new byte[]{1, 2, 3}));

        assertThat(saved.getAvatarUrl()).isEqualTo("/uploads/new.webp");
        verify(cleanup).deleteIfUnused(List.of("/uploads/old.webp"));
    }

    @Test
    void removingThePhotoClearsItAndDeletesTheFile() {
        user.setAvatarUrl("/uploads/old.webp");

        var saved = service.removeAvatar(7L);

        assertThat(saved.getAvatarUrl()).isNull();
        verify(cleanup).deleteIfUnused(List.of("/uploads/old.webp"));
    }

    private static ChangePasswordRequest password(String current, String next) {
        ChangePasswordRequest r = new ChangePasswordRequest();
        r.setCurrentPassword(current);
        r.setNewPassword(next);
        return r;
    }
}
