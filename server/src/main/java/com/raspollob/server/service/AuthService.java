package com.raspollob.server.service;

import com.raspollob.server.dto.AuthResponse;
import com.raspollob.server.dto.LoginRequest;
import com.raspollob.server.dto.RefreshTokenRequest;
import com.raspollob.server.dto.SignupRequest;
import com.raspollob.server.entity.Role;
import com.raspollob.server.entity.User;
import com.raspollob.server.exception.UserAlreadyExistsException;
import com.raspollob.server.repository.UserRepository;
import com.raspollob.server.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RolePermissionService rolePermissionService;
    private final UserDetailsService userDetailsService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username is already taken");
        }
        if (userRepository.existsByMobile(request.getMobile())) {
            throw new UserAlreadyExistsException("Mobile number is already registered");
        }
        if (request.getEmail() != null && !request.getEmail().isEmpty() && userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email is already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .mobile(request.getMobile())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .build();

        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getIdentifier(),
                        request.getPassword()
                )
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getIdentifier());
        return buildAuthResponse(userDetails);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        String username = jwtService.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtService.isTokenValid(token, userDetails)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }

        return buildAuthResponse(userDetails);
    }

    private AuthResponse buildAuthResponse(UserDetails userDetails) {
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        List<String> roleNames;
        Long userId = 0L;
        String username = userDetails.getUsername();
        String fullName = username;
        String email = "";

        if (userDetails instanceof User user) {
            userId = user.getId();
            fullName = user.getFullName();
            email = user.getEmail();
            roleNames = user.getRoles().stream().map(Role::getName).toList();
        } else {
            roleNames = userDetails.getAuthorities().stream().map(a -> a.getAuthority()).toList();
        }

        Map<String, Object> rolePermissionTree = rolePermissionService.getMergedPermissionsForRoles(roleNames);

        AuthResponse.UserSummary userSummary = AuthResponse.UserSummary.builder()
                .id(userId)
                .username(username)
                .email(email)
                .roles(roleNames)
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTimeSeconds()) // 900 seconds (15 min)
                .user(userSummary)
                .rolePermission(rolePermissionTree)
                .token(accessToken) // Legacy compatibility
                .username(username)
                .fullName(fullName)
                .message("Authentication successful")
                .build();
    }
}
