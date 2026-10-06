package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.dashboard.DashboardPeriod;
import com.raspollob.server.dto.dashboard.DashboardResponse;
import com.raspollob.server.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    /** Business overview for TODAY, WEEK, MONTH or YEAR (period to date, vs the same span before). */
    @PreAuthorize("@perm.has('dashboard.isAccess')")
    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @RequestParam(defaultValue = "MONTH") DashboardPeriod period) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard(period), "Dashboard loaded"));
    }
}
