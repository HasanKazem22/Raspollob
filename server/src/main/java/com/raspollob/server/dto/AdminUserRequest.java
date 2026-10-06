package com.raspollob.server.dto;

import lombok.Data;
import java.util.List;

@Data
public class AdminUserRequest {
    private String fullName;
    private String username;
    private String email;
    @jakarta.validation.constraints.Pattern(regexp = com.raspollob.server.dto.ValidationPatterns.BD_PHONE, message = com.raspollob.server.dto.ValidationPatterns.BD_PHONE_MESSAGE)
    private String mobile;
    private String password;
    private List<Long> roleIds;
}
