package com.raspollob.server.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/v1/files/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/home/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/services/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/products/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/categories/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/real-assets/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/contact-messages").permitAll()
                // Storefront checkout (guest checkout allowed)
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/orders", "/api/v1/orders/quote").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/orders/track").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/config/store").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/real-assets/*/booking").permitAll()
                .anyRequest().permitAll() // Temporary open for dev flexibility or authenticated
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
