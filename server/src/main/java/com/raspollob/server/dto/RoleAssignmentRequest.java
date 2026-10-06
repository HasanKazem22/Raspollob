package com.raspollob.server.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoleAssignmentRequest {
    private List<Long> roleIds;
}
