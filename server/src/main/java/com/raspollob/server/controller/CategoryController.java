package com.raspollob.server.controller;

import com.raspollob.server.dto.ApiResponse;
import com.raspollob.server.dto.CategoryResponse;
import com.raspollob.server.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getActiveCategories() {
        List<CategoryResponse> categories = categoryService.getAllActiveCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Active categories retrieved successfully"));
    }

    @GetMapping("/navbar")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getNavbarCategories() {
        List<CategoryResponse> categories = categoryService.getNavbarCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Navbar categories retrieved successfully"));
    }

    @GetMapping("/home")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getHomeCategories() {
        List<CategoryResponse> categories = categoryService.getHomeCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Home categories retrieved successfully"));
    }

    @GetMapping("/{idOrSlug}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategory(@PathVariable String idOrSlug) {
        CategoryResponse category;
        try {
            Long id = Long.parseLong(idOrSlug);
            category = categoryService.getCategoryById(id);
        } catch (NumberFormatException e) {
            category = categoryService.getCategoryBySlug(idOrSlug);
        }
        return ResponseEntity.ok(ApiResponse.success(category, "Category retrieved successfully"));
    }
}

