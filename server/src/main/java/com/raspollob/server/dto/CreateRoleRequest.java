package com.raspollob.server.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateRoleRequest {
    private String name;
    private String description;
    private List<Long> permissionIds;
}
