package com.raspollob.server.controller;

import com.raspollob.server.dto.AuthResponse;
import com.raspollob.server.dto.LoginRequest;
import com.raspollob.server.dto.RefreshTokenRequest;
import com.raspollob.server.dto.SignupRequest;
import com.raspollob.server.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.raspollob.server.security.PermissionChecks permissionChecks;

    /**
     * Effective permissions for whoever is calling: the merged tree of the signed-in user's roles,
     * or the GUEST tree for visitors. The frontend reloads this on start so changes apply without re-login.
     */
    @GetMapping("/permissions")
    public ResponseEntity<com.raspollob.server.dto.ApiResponse<java.util.Map<String, Object>>> getMyPermissions() {
        return ResponseEntity.ok(com.raspollob.server.dto.ApiResponse.success(permissionChecks.currentTree(), "Permissions"));
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return new ResponseEntity<>(authService.signup(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }
}
